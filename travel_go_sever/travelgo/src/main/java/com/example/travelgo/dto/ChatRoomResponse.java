package com.example.travelgo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {
    private Long id;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerAvatar;

    // Admin info (nullable)
    private Long adminId;
    private String adminName;
    private String adminAvatar;

    // Room status
    private String lastMessage;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastMessageTime;

    private Integer customerUnread;
    private Integer adminUnread;
    private Boolean isActive;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime assignedAt;

    // Additional useful fields
    private Boolean hasUnreadForCustomer;
    private Boolean hasUnreadForAdmin;
    private String roomStatus; // "unassigned", "assigned", "closed"

    // Computed methods (optional - can be calculated in service)
    public Boolean getHasUnreadForCustomer() {
        return customerUnread != null && customerUnread > 0;
    }

    public Boolean getHasUnreadForAdmin() {
        return adminUnread != null && adminUnread > 0;
    }

    public String getRoomStatus() {
        if (!isActive) return "closed";
        if (adminId == null) return "unassigned";
        return "assigned";
    }
}