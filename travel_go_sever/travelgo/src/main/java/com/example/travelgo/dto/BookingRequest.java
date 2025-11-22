package com.example.travelgo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class BookingRequest {
    private LocalDateTime bookingDate;
    private int numberOfPeople;
    private int adultCount;
    private int childCount;
    private int babyCount;
    private BigDecimal totalPrice;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private Long tourScheduleId;
    private Long userId;
}
