package com.example.travelgo.dto;

import lombok.*;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourInfo {
    private Long id;
    private String title;
    private String destination;
    private Integer durationDays;
    private String imageUrl;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Double price;
    private Double childPrice;
    private Double babyPrice;
}
