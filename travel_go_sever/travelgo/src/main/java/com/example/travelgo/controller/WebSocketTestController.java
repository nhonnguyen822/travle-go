package com.example.travelgo.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/websocket-test")
public class WebSocketTestController {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketTestController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return Map.of(
                "status", "running",
                "timestamp", new Date(),
                "message", "WebSocket server is active"
        );
    }

    @PostMapping("/send-admin")
    public Map<String, String> sendToAdmin(@RequestBody Map<String, String> payload) {
        try {
            String message = payload.get("message");

            Map<String, Object> notification = new HashMap<>();
            notification.put("id", System.currentTimeMillis());
            notification.put("type", "INFO");
            notification.put("title", "Test Admin Notification");
            notification.put("message", message);
            notification.put("createdAt", new Date());
            notification.put("isRead", false);

            // ✅ Gửi đến tất cả admin
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);

            System.out.println("✅ Đã gửi test notification đến admin: " + message);

            return Map.of("status", "success", "message", "Sent to admin");

        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi đến admin: " + e.getMessage());
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @PostMapping("/send-user")
    public Map<String, String> sendToUser(@RequestBody Map<String, Object> payload) {
        try {
            String message = (String) payload.get("message");
            String userId = payload.get("userId").toString();

            Map<String, Object> notification = new HashMap<>();
            notification.put("id", System.currentTimeMillis());
            notification.put("type", "INFO");
            notification.put("title", "Test User Notification");
            notification.put("message", message);
            notification.put("createdAt", new Date());
            notification.put("isRead", false);

            // ✅ Gửi đến user cụ thể
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);

            System.out.println("✅ Đã gửi test notification đến user " + userId + ": " + message);

            return Map.of("status", "success", "message", "Sent to user " + userId);

        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi đến user: " + e.getMessage());
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
}