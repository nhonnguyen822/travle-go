package com.example.travelgo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPaymentNotification {
    private Long bookingId;
    private String userEmail;
    private String userName;
    private Long amount;
    private String transactionRef;
    private String message;
    private String tourName;
    private String customerType;
}
