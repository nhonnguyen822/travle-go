package com.example.travelgo.repository;

import com.example.travelgo.entity.Notification;
import com.example.travelgo.enums.NotificationType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface INotificationRepository  extends JpaRepository<Notification, Long> {
    // ✅ Lấy tất cả notifications của user, sắp xếp mới nhất trước
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // ✅ Lấy notifications của user với phân trang
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // ✅ Lấy notifications chưa đọc của user
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // ✅ Đếm số notifications chưa đọc của user
    long countByUserIdAndIsReadFalse(Long userId);

    // ✅ Lấy notifications theo type
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);

    // ✅ Lấy notifications theo bookingId
    List<Notification> findByBookingId(Long bookingId);

    // ✅ Lấy notifications có chứa tourName
    List<Notification> findByTourNameContainingIgnoreCase(String tourName);

    // ✅ Lấy notifications trong khoảng thời gian
    List<Notification> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // ✅ Lấy notifications theo userEmail (cho admin)
    List<Notification> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    // ✅ Tìm notification mới nhất của user
    Optional<Notification> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    // ✅ Đánh dấu tất cả notifications của user là đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    // ✅ Xóa notifications cũ (cleanup job)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteByCreatedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ✅ Lấy notifications với amount lớn hơn (cho payment tracking)
    List<Notification> findByAmountGreaterThan(Double amount);
}
