package com.example.travelgo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface BookingProjection {
    Long getId();
    String getBookingCode();
    LocalDate getBookingDate();
    Integer getNumberOfPeople();
    Integer getAdultCount();
    Integer getChildCount();
    Integer getBabyCount();
    BigDecimal getPaidAmount();
    String getStatus();

    // Từ bảng users (alias trong query)
    String getUserName();
    String getUserEmail();
    String getUserPhone();
    String getUserAvatar();

    // Từ bảng tours (alias trong query)
    String getTourTitle();
    Integer getTourDuration();
    String getTourImage();
    BigDecimal getTourBasePrice();
    String getTourDestination();

    // Từ bảng tour_schedules
    LocalDate getStartDate();
    LocalDate getEndDate();
    BigDecimal getSchedulePrice();
    BigDecimal getChildPrice();
    BigDecimal getBabyPrice();
}
