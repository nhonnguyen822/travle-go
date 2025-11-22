package com.example.travelgo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourScheduleRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal price;
    private BigDecimal childPrice;
    private BigDecimal babyPrice;
}
