package com.example.travelgo.controller;

import com.example.travelgo.entity.Notification;
import com.example.travelgo.entity.User;
import com.example.travelgo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ✅ **QUAN TRỌNG**: Lấy tất cả notifications của user
    @GetMapping
    public ResponseEntity<?> getUserNotifications(@AuthenticationPrincipal User user) {
        try {
            List<Notification> notifications = notificationService.getUserNotifications(user.getId());
            long unreadCount = notificationService.getUnreadCount(user.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "notifications", notifications,
                    "unreadCount", unreadCount
            ));

        } catch (Exception e) {
            log.error("Error getting notifications: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Lỗi khi tải thông báo"));
        }
    }

    // ✅ **QUAN TRỌNG**: Lấy số lượng notifications chưa đọc (cho badge)
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal User user) {
        try {
            long unreadCount = notificationService.getUnreadCount(user.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "unreadCount", unreadCount
            ));

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "unreadCount", 0));
        }
    }

    // ✅ **QUAN TRỌNG**: Đánh dấu notification là đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Notification notification = notificationService.markAsRead(id);
            // Security check: notification phải thuộc về user
            if (!notification.getUserId().equals(user.getId())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Không có quyền truy cập"));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã đánh dấu đã đọc"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Lỗi khi đánh dấu đã đọc"));
        }
    }

    // ✅ **QUAN TRỌNG**: Đánh dấu TẤT CẢ là đã đọc
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal User user) {
        try {
            int updatedCount = notificationService.markAllAsRead(user.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã đánh dấu tất cả thông báo là đã đọc",
                    "updatedCount", updatedCount
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Lỗi khi đánh dấu tất cả đã đọc"));
        }
    }
}