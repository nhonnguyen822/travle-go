package com.example.travelgo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;  // Lưu User object

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;  // Lưu User object (có thể null)

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    @Column(name = "last_message_time")
    private LocalDateTime lastMessageTime;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "customer_unread")
    private Integer customerUnread = 0;

    @Column(name = "admin_unread")
    private Integer adminUnread = 0;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (lastMessageTime == null) {
            lastMessageTime = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (customerUnread == null) {
            customerUnread = 0;
        }
        if (adminUnread == null) {
            adminUnread = 0;
        }
    }

    // Helper methods
    public Long getCustomerId() {
        return customer != null ? customer.getId() : null;
    }

    public Long getAdminId() {
        return admin != null ? admin.getId() : null;
    }

    public String getCustomerName() {
        return customer != null ? customer.getName() : null;
    }

    public String getAdminName() {
        return admin != null ? admin.getName() : null;
    }

    public String getCustomerAvatar() {
        return customer != null ? customer.getAvatar() : null;
    }

    public String getAdminAvatar() {
        return admin != null ? admin.getAvatar() : null;
    }
}