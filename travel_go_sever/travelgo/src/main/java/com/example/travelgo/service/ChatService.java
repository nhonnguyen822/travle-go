package com.example.travelgo.service;

import com.example.travelgo.dto.ChatMessageResponse;
import com.example.travelgo.dto.ChatRoomResponse;
import com.example.travelgo.entity.ChatMessage;
import com.example.travelgo.entity.ChatRoom;
import com.example.travelgo.entity.User;
import com.example.travelgo.repository.IChatMessageRepository;
import com.example.travelgo.repository.IChatRoomRepository;
import com.example.travelgo.repository.IUserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatService implements IChatService {

    @Autowired
    private IChatRoomRepository chatRoomRepository;

    @Autowired
    private IChatMessageRepository chatMessageRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Tạo room mới cho customer
    @Override
    public ChatRoom createCustomerRoom(User customer) {
        Optional<ChatRoom> existingRoom = chatRoomRepository.findByCustomerAndIsActive(customer, true);
        if (existingRoom.isPresent()) {
            return existingRoom.get();
        }

        ChatRoom room = new ChatRoom();
        room.setCustomer(customer);
        room.setAdmin(null);
        room.setIsActive(true);

        return chatRoomRepository.save(room);
    }

    // Gửi tin nhắn
    @Override
    public ChatMessage sendMessage(Long roomId, User sender, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Kiểm tra người gửi có trong room không
        if (!isUserInRoom(sender, room)) {
            throw new RuntimeException("User not in this chat room");
        }

        ChatMessage message = new ChatMessage();
        message.setRoomId(roomId);
        message.setSender(sender);  // Lưu cả User object
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now());

        ChatMessage savedMessage = chatMessageRepository.save(message);

        // Cập nhật last message của room
        room.setLastMessage(content);
        room.setLastMessageTime(LocalDateTime.now());

        // Cập nhật unread count
        if (sender.getRole().getName().equals("USER")) {
            room.setAdminUnread(room.getAdminUnread() + 1);
        } else {
            room.setCustomerUnread(room.getCustomerUnread() + 1);
        }

        chatRoomRepository.save(room);

        // Convert to response và gửi qua WebSocket
        ChatMessageResponse response = convertToResponse(savedMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);

        return savedMessage;
    }

    private boolean isUserInRoom(User user, ChatRoom room) {
        return user.getId().equals(room.getCustomer().getId()) ||
                (room.getAdmin() != null && user.getId().equals(room.getAdmin().getId()));
    }

    private ChatMessageResponse convertToResponse(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setRoomId(message.getRoomId());
        response.setSenderId(message.getSender().getId());
        response.setSenderName(message.getSender().getName());
        response.setSenderAvatar(message.getSender().getAvatar());
        response.setSenderRole(message.getSender().getRole().getName());
        response.setContent(message.getContent());
        response.setIsRead(message.isRead());
        response.setTimestamp(message.getCreatedAt());
        return response;
    }

    @Override
    public ChatRoomResponse getCustomerRoom(Long id) {
        User customer = getUser(id);
        ChatRoom room = chatRoomRepository.findByCustomerAndIsActive(customer, true)
                .orElseThrow(() -> new RuntimeException("No active chat room found for customer"));
        return convertToRoomResponse(room);
    }

    @Override
    public List<ChatMessageResponse> getCustomerMessages(Long roomId, Long id) {
        ChatRoom room = getChatRoom(roomId);
        if (!room.getCustomer().getId().equals(id)) {
            throw new RuntimeException("Access denied: Customer does not own this room");
        }

        return getRoomMessages(roomId);
    }

    @Override
    public List<ChatRoomResponse> getMyRooms(Long id) {
        User admin = getUser(id);
        List<ChatRoom> rooms = chatRoomRepository.findByAdmin(admin);
        return rooms.stream()
                .map(this::convertToRoomResponse)
                .collect(Collectors.toList());

    }

    @Override
    public ChatRoomResponse assignRoomToAdmin(Long roomId, Long id) {
        User admin = getUser(id);
        ChatRoom room = getChatRoom(roomId);

        // Check if room is already assigned to another admin
        if (room.getAdmin() != null && !room.getAdmin().getId().equals(id)) {
            throw new RuntimeException("Room is already assigned to another admin");
        }

        room.setAdmin(admin);
        room.setLastMessageTime(LocalDateTime.now());

        ChatRoom updatedRoom = chatRoomRepository.save(room);
        return convertToRoomResponse(updatedRoom);
    }

    @Override
    public List<ChatMessageResponse> getAdminMessages(Long roomId, Long id) {
        ChatRoom room = getChatRoom(roomId);
        if (room.getAdmin() == null || !room.getAdmin().getId().equals(id)) {
            throw new RuntimeException("Access denied: Admin is not assigned to this room");
        }

        return getRoomMessages(roomId);
    }

    @Override
    public void markAsRead(Long roomId, Long id) {
        User user = getUser(id);
        ChatRoom room = getChatRoom(roomId);

        if (!isUserInRoom(user, room)) {
            throw new RuntimeException("User not in this chat room");
        }

        chatMessageRepository.markMessagesAsRead(roomId, id);

        if ("USER".equals(user.getRole().getName())) {
            room.setCustomerUnread(0);
        } else {
            room.setAdminUnread(0);
        }

        chatRoomRepository.save(room);
    }

    @Override
    public void handleTypingIndicator(Long roomId, Long id, Map<String, Object> typingData) {
        User user = getUser(id);
        ChatRoom room = getChatRoom(roomId);

        if (!isUserInRoom(user, room)) {
            return;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("roomId", roomId);
        response.put("userId", id);
        response.put("username", user.getUsername());
        response.put("name", user.getName());
        response.put("isTyping", typingData.get("isTyping"));
        response.put("timestamp", LocalDateTime.now());

        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/typing", response);
    }

    @Override
    public void markAsReadAndNotify(Long roomId, Long id) {
        markAsRead(roomId, id);

        // Gửi notification qua WebSocket
        Map<String, Object> response = new HashMap<>();
        response.put("roomId", roomId);
        response.put("userId", id);
        response.put("timestamp", LocalDateTime.now());

        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/read", response);
    }

    @Override
    public List<ChatRoomResponse> getAllRooms() {
        List<ChatRoom> rooms = chatRoomRepository.findAllByOrderByLastMessageTimeDesc();
        return rooms.stream()
                .map(this::convertToRoomResponse)
                .collect(Collectors.toList());
    }

    public ChatRoomResponse convertToRoomResponse(ChatRoom room) {
        ChatRoomResponse response = new ChatRoomResponse();
        response.setId(room.getId());
        response.setCustomerId(room.getCustomer().getId());
        response.setCustomerName(room.getCustomer().getName());
        response.setCustomerAvatar(room.getCustomer().getAvatar());

        if (room.getAdmin() != null) {
            response.setAdminId(room.getAdmin().getId());
            response.setAdminName(room.getAdmin().getName());
            response.setAdminAvatar(room.getAdmin().getAvatar());
        }

        response.setLastMessage(room.getLastMessage());
        response.setLastMessageTime(room.getLastMessageTime());
        response.setCustomerUnread(room.getCustomerUnread());
        response.setAdminUnread(room.getAdminUnread());
        response.setIsActive(room.getIsActive());
        response.setCreatedAt(room.getCreatedAt());
        response.setAssignedAt(LocalDateTime.now());

        return response;
    }

    public ChatMessageResponse convertToMessageResponse(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setRoomId(message.getRoomId());
        response.setSenderId(message.getSender().getId());
        response.setSenderName(message.getSender().getName());
        response.setSenderAvatar(message.getSender().getAvatar());
        response.setSenderRole(message.getSender().getRole().getName());
        response.setContent(message.getContent());
        response.setIsRead(message.isRead());
        response.setTimestamp(message.getCreatedAt());
        return response;
    }

    @Override
    public List<ChatMessageResponse> getRoomMessages(Long roomId) {
        List<ChatMessage> messages = chatMessageRepository.findByRoomIdWithSender(roomId);
        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ChatRoom getCurrentUserRoom(User user) {
        if ("USER".equals(user.getRole().getName())) {
            return chatRoomRepository.findByCustomerAndIsActive(user, true)
                    .orElseGet(() -> createCustomerRoom(user));
        }
        // Admin: chọn room đầu tiên assigned, hoặc null
        else {
            List<ChatRoom> myRooms = chatRoomRepository.findByAdmin(user);
            if (!myRooms.isEmpty()) {
                return myRooms.get(0); // Trả về room đầu tiên
            }
            return null; // Admin chưa có room assigned
        }
    }

    @Override
    public List<ChatMessageResponse> getCurrentUserMessages(User user) {
        ChatRoom room = getCurrentUserRoom(user);
        if (room == null) {
            return List.of(); // Trả về empty list nếu không có room
        }

        // Kiểm tra quyền truy cập
        if (!isUserInRoom(user, room)) {
            throw new RuntimeException("Access denied");
        }

        return getRoomMessages(room.getId());
    }

    @Override
    public ChatMessage sendMessageFromCurrentUser(User user, String content) {
        ChatRoom room = getCurrentUserRoom(user);
        if (room == null) {
            throw new RuntimeException("No active chat room found");
        }

        return sendMessage(room.getId(), user, content);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    private ChatRoom getChatRoom(Long roomId) {
        return chatRoomRepository.findByIdWithUsers(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + roomId));
    }
}