package com.example.travelgo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourDetailResponse {
    private Long id;
    private String name;
    private Integer durationDays;
    private String description;
    private String destination;
    private BigDecimal basePrice;
    private Long regionId;
    private String image;
    private Double latitude;
    private Double longitude;
    private String highLight;
    private List<TourImageDTO> images;
    private List<ItineraryDayDTO> itineraryDays;
    private List<TourScheduleDTO> schedules;
    private List<PolicyDTO> policies;
    private List<ServiceDTO> services;
}
