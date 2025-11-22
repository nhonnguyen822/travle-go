package com.example.travelgo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long id;
    private String bookingCode;
    private LocalDate bookingDate;
    private Integer numberOfPeople;
    private BigDecimal paidAmount;
    private Integer adultCount;
    private Integer childCount;
    private Integer babyCount;
    private BigDecimal totalPrice;
    private String status;
    private UserResponse user;
    private TourScheduleResponse tourSchedule;
}
