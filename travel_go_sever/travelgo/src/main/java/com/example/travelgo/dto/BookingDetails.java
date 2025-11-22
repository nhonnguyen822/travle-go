package com.example.travelgo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetails {
    private Integer adultCount;
    private Integer childCount;
    private Integer babyCount;
    private Integer totalPeople;
    private String notes;
    private String cancelReason;
}
