package com.example.travelgo.dto;

import com.example.travelgo.enums.NotificationType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationCreateRequest {
    private String title;
    private String message;
    private NotificationType type;
    private Long userId;
    private String userEmail;
    private String tourName;
    private Double amount;
    private Long relatedEntityId;
    private String relatedEntityType;
}
