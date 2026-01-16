package com.example.travelgo.service;

import com.example.travelgo.dto.ChatMessageResponse;
import com.example.travelgo.dto.ChatRoomResponse;
import com.example.travelgo.entity.ChatMessage;
import com.example.travelgo.entity.ChatRoom;
import com.example.travelgo.entity.User;

import java.util.List;
import java.util.Map;

public interface IChatService {
    ChatRoom createCustomerRoom(User customer);
    ChatMessage sendMessage(Long roomId, User sender, String content);
    ChatRoomResponse getCustomerRoom(Long id);
    List<ChatMessageResponse> getCustomerMessages(Long roomId, Long id);
    List<ChatRoomResponse> getMyRooms(Long id);
    ChatRoomResponse assignRoomToAdmin(Long roomId, Long id);
    List<ChatMessageResponse> getAdminMessages(Long roomId, Long id);
    void markAsRead(Long roomId, Long id);
    void handleTypingIndicator(Long roomId, Long id, Map<String, Object> typingData);
    void markAsReadAndNotify(Long roomId, Long id);
    List<ChatRoomResponse> getAllRooms();
    List<ChatMessageResponse> getRoomMessages(Long roomId);

    ChatRoom getCurrentUserRoom(User user);
    ChatMessageResponse convertToMessageResponse(ChatMessage message);

    // NEW: Lấy messages từ room hiện tại của user
    List<ChatMessageResponse> getCurrentUserMessages(User user);

    // NEW: Gửi tin nhắn từ user hiện tại (không cần roomId)
    ChatMessage sendMessageFromCurrentUser(User user, String content);
    ChatRoomResponse convertToRoomResponse(ChatRoom room);
}
