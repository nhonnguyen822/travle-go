package com.example.travelgo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentNotification {
    private Long bookingId;
    private Long userId;
    private Long amount;
    private String transactionRef;
    private String message;
    private String status;
    private String userEmail;
    private String tourName;
}
