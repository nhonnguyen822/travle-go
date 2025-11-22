package com.example.travelgo.dto;

import lombok.*;

import java.math.BigDecimal;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourResponse {
    private String title;
    private Integer duration;
    private String image;
    private BigDecimal basePrice;
    private String destination;
}
