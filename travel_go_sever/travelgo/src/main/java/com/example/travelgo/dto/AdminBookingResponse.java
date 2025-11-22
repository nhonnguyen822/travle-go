package com.example.travelgo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBookingResponse {
    private Long id;
    private String bookingCode;
    private UserResponse customer;
    private TourInfo tour;
    private BookingDetails details;
    private PaymentInfo payment;
    private String status;
    private LocalDateTime bookingDate;
    private LocalDateTime createdAt;
}




