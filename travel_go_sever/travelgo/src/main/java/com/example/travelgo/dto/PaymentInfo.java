package com.example.travelgo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInfo {
    private Double basePrice;
    private Double adultPrice;
    private Double childPrice;
    private Double babyPrice;
    private Double totalPrice;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime paidAt;
}
