package com.example.travelgo.controller;

import com.example.travelgo.service.ChatService;
import com.example.travelgo.service.IAdminChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/chat")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
public class AdminChatController {

    private final IAdminChatService adminChatService;
    private final ChatService chatService;

    @GetMapping("/rooms")
    public ResponseEntity<?> getAllChatRooms() {
        try {
            var rooms = adminChatService.getAllChatRooms();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("rooms", rooms);
            response.put("total", rooms.size());
            response.put("active", adminChatService.getActiveRoomCount());
            response.put("closed", adminChatService.getTotalRoomCount() - adminChatService.getActiveRoomCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error getting chat rooms: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Lỗi khi tải danh sách phòng chat")
            );
        }
    }

    @GetMapping("/rooms/active")
    public ResponseEntity<?> getActiveChatRooms() {
        try {
            var rooms = adminChatService.getActiveChatRooms();

            return ResponseEntity.ok(
                    Map.of("success", true, "rooms", rooms, "total", rooms.size())
            );

        } catch (Exception e) {
            log.error("❌ Error getting active chat rooms: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Lỗi khi tải danh sách phòng đang hoạt động")
            );
        }
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> getRoomMessages(@PathVariable String roomId) {
        try {
            var messages = chatService.getRoomMessages(Long.valueOf(roomId));
            var room = adminChatService.getRoomById(roomId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("messages", messages);
            response.put("room", room.orElse(null));
            response.put("total", messages.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error getting room messages: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Lỗi khi tải tin nhắn của phòng")
            );
        }
    }

    @PostMapping("/rooms/{roomId}/close")
    public ResponseEntity<?> closeChatRoom(@PathVariable String roomId) {
        try {
            boolean success = adminChatService.closeChatRoom(roomId);

            if (success) {
                return ResponseEntity.ok(
                        Map.of("success", true, "message", "Đã đóng phòng chat thành công")
                );
            } else {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "Không thể đóng phòng chat")
                );
            }

        } catch (Exception e) {
            log.error("❌ Error closing chat room: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Lỗi khi đóng phòng chat")
            );
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<?> saveAdminMessage(@RequestBody Map<String, Object> messageRequest) {
        try {
            // Implementation for saving admin messages
            // Similar to ChatController but with admin-specific logic

            return ResponseEntity.ok(
                    Map.of("success", true, "message", "Tin nhắn admin đã được lưu")
            );

        } catch (Exception e) {
            log.error("❌ Error saving admin message: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Lỗi khi lưu tin nhắn admin")
            );
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getChatStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRooms", adminChatService.getTotalRoomCount());
            stats.put("activeRooms", adminChatService.getActiveRoomCount());
            stats.put("closedRooms", adminChatService.getTotalRoomCount() - adminChatService.getActiveRoomCount());

            return ResponseEntity.ok(
                    Map.of("success", true, "stats", stats)
            );

        } catch (Exception e) {
            log.error("❌ Error getting chat stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Lỗi khi tải thống kê")
            );
        }
    }
}