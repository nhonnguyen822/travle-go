package com.example.travelgo.entity;

import com.example.travelgo.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // ✅ NÊN CÓ
    private LocalDateTime readAt;
    private Long bookingId;

    // ✅ TUỲ CHỌN (chỉ thêm nếu cần)
    private String userEmail;    // Cho admin
    private String tourName;     // Cho tour-related notifications
    private Double amount;

}
