package com.example.travelgo.service;

import com.example.travelgo.entity.Booking;
import com.example.travelgo.entity.Notification;
import com.example.travelgo.enums.NotificationType;
import com.example.travelgo.repository.INotificationRepository;
import com.example.travelgo.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final INotificationRepository notificationRepository;
    private final IUserRepository userRepository;

    public void sendRealTimeNotification(Notification notification, Long userId) {
        try {
            // Lưu vào database
            Notification savedNotification = notificationRepository.save(notification);

            // Gửi real-time notification qua WebSocket
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    savedNotification
            );
            log.info("✅ Real-time notification sent to user {}: {}", userId, notification.getTitle());
        } catch (Exception e) {
            log.error("❌ Failed to send real-time notification", e);
        }
    }

    public void notifyPaymentSuccess(Booking booking) {
        try {
            // ✅ SỬ DỤNG PHƯƠNG THỨC createPaymentNotification THAY VÌ TỰ TẠO
            createPaymentNotification(
                    booking.getUser().getId(),
                    booking.getUser().getEmail(),
                    booking.getTourSchedule().getTour().getTitle(),
                    booking.getPaidAmount().doubleValue(),
                    booking.getId(),
                    true
            );

            log.info("📢 Payment success notification sent for booking #{}", booking.getId());
        } catch (Exception e) {
            log.error("❌ Failed to send payment success notification", e);
        }
    }

    public List<Notification> getUserNotifications(Long userId) {
        log.info("Fetching notifications for user: {}", userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        log.info("Unread notifications count for user {}: {}", userId, count);
        return count;
    }


    public Notification createPaymentNotification(Long userId, String userEmail, String tourName,
                                                  Double amount, Long bookingId, boolean isSuccess) {
        String title = isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại";
        String message = isSuccess ?
                String.format("Đơn thanh toán cho tour '%s' đã thành công. Số tiền: %,.0f VND", tourName, amount) :
                String.format("Đơn thanh toán cho tour '%s' thất bại. Vui lòng thử lại.", tourName);

        NotificationType type = isSuccess ? NotificationType.PAYMENT_SUCCESS : NotificationType.PAYMENT_FAILED;

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .userId(1L)
                .userEmail(userEmail)
                .tourName(tourName)
                .amount(amount)
                .bookingId(bookingId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

//        log.info("Creating payment notification for user: {}, amount: {}", userId, amount);
        Notification savedNotification = notificationRepository.save(notification);

        // ✅ GỬI REAL-TIME NOTIFICATION
        String destination = "/topic/admin/notifications";
        messagingTemplate.convertAndSend(destination, savedNotification);

        return savedNotification;
    }



    public Notification createBookingNotification(Long userId, String userEmail, String tourName,
                                                  Long bookingId, NotificationType type) {

        String title;
        String message;

        switch (type) {
            case BOOKING_CREATED:
                title = "Đặt tour thành công";
                message = String.format(
                        "Bạn đã đặt tour '%s' thành công. Mã booking: #%d",
                        tourName, bookingId
                );
                break;

            case BOOKING_CONFIRMED:
                title = "Tour đã được xác nhận";
                message = String.format(
                        "Tour '%s' đã được xác nhận. Chúc bạn có chuyến đi vui vẻ!",
                        tourName
                );
                break;

            case BOOKING_CANCELLED:
                title = "Tour đã bị hủy";
                message = String.format(
                        "Tour '%s' đã bị hủy. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
                        tourName
                );
                break;

            default:
                title = "Thông báo booking";
                message = String.format(
                        "Có thông báo mới về booking #%d của bạn.",
                        bookingId
                );
        }

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .userId(userId)
                .userEmail(userEmail)
                .tourName(tourName)
                .bookingId(bookingId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();


        Notification savedNotification = notificationRepository.save(notification);

        sendRealTimeNotification(savedNotification, userId);

        return savedNotification;
    }


    public Notification markAsRead(Long notificationId) {
        log.info("Marking notification as read: {}", notificationId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
            log.info("Notification {} marked as read", notificationId);
        }

        return notification;
    }

    public int markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        int updatedCount = notificationRepository.markAllAsReadForUser(userId, LocalDateTime.now());
        log.info("Marked {} notifications as read for user: {}", updatedCount, userId);
        return updatedCount;
    }

    // ✅ THÊM PHƯƠNG THỨC LẤY NOTIFICATIONS GẦN ĐÂY
    public List<Notification> getRecentNotifications(Long userId, int limit) {
        log.info("Fetching recent {} notifications for user: {}", limit, userId);
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}