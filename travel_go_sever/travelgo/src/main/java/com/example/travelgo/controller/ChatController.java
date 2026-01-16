package com.example.travelgo.controller;

import com.example.travelgo.dto.ChatMessageRequest;
import com.example.travelgo.dto.ChatMessageResponse;
import com.example.travelgo.dto.ChatRoomResponse;
import com.example.travelgo.entity.ChatMessage;
import com.example.travelgo.entity.ChatRoom;
import com.example.travelgo.entity.User;
import com.example.travelgo.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    // ========== CUSTOMER ENDPOINTS ==========

    @PostMapping("/start-or-get")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> startOrGetChat(Authentication auth) {
        User userDetails = (User) auth.getPrincipal();

        try {
            ChatRoom room = chatService.getCurrentUserRoom(userDetails);
            ChatRoomResponse roomResponse = chatService.convertToRoomResponse(room);
            List<ChatMessageResponse> messages = chatService.getRoomMessages(room.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("room", roomResponse);
            response.put("messages", messages);
            response.put("totalMessages", messages.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    @GetMapping("/customer/messages/{roomId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ChatMessageResponse>> getCustomerMessages(
            @PathVariable Long roomId,
            Authentication auth) {
        User userDetails = (User) auth.getPrincipal();
        List<ChatMessageResponse> messages = chatService.getCustomerMessages(roomId, userDetails.getId());
        return ResponseEntity.ok(messages);
    }

    // ========== ADMIN ENDPOINTS ==========

    @GetMapping("/admin/rooms")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<List<ChatRoomResponse>> getAllRooms() {
        List<ChatRoomResponse> rooms = chatService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/admin/my-rooms")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<List<ChatRoomResponse>> getMyRooms(Authentication auth) {
        User userDetails = (User) auth.getPrincipal();
        List<ChatRoomResponse> rooms = chatService.getMyRooms(userDetails.getId());
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/admin/messages/{roomId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<List<ChatMessageResponse>> getAdminMessages(
            @PathVariable Long roomId,
            Authentication auth) {
        User userDetails = (User) auth.getPrincipal();
        List<ChatMessageResponse> messages = chatService.getAdminMessages(roomId, userDetails.getId());
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/admin/rooms/{roomId}/assign")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<ChatRoomResponse> assignToMe(
            @PathVariable Long roomId,
            Authentication auth) {
        User userDetails = (User) auth.getPrincipal();
        ChatRoomResponse room = chatService.assignRoomToAdmin(roomId, userDetails.getId());
        return ResponseEntity.ok(room);
    }

    // ========== COMMON ENDPOINTS ==========

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessageFromUser(
            @RequestBody Map<String, String> request,
            Authentication auth) {

        User userDetails = (User) auth.getPrincipal();
        String content = request.get("content");

        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Message content is required"));
        }

        try {
            ChatMessage message = chatService.sendMessageFromCurrentUser(userDetails, content);
            ChatMessageResponse response = chatService.convertToMessageResponse(message);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Message sent",
                    "messageData", response
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    @PostMapping("/{roomId}/read")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long roomId,
            Authentication auth) {
        User userDetails = (User) auth.getPrincipal();
        chatService.markAsRead(roomId, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    // ========== WEBSOCKET HANDLERS ==========

    @MessageMapping("/chat.send.{roomId}")
    public void sendMessageToRoom(
            @DestinationVariable Long roomId,
            @Payload ChatMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        System.out.println("📨 WebSocket message received for room: " + roomId);

        Authentication auth = (Authentication) headerAccessor.getUser();
        if (auth == null) {
            System.out.println("❌ No authentication in WebSocket");
            return;
        }

        User userDetails = (User) auth.getPrincipal();
        chatService.sendMessage(roomId, userDetails, request.getContent());
    }

    @MessageMapping("/chat.typing.{roomId}")
    public void typingIndicator(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> typingData,
            SimpMessageHeaderAccessor headerAccessor) {

        Authentication auth = (Authentication) headerAccessor.getUser();
        if (auth == null) return;

        User userDetails = (User) auth.getPrincipal();
        chatService.handleTypingIndicator(roomId, userDetails.getId(), typingData);
    }
}