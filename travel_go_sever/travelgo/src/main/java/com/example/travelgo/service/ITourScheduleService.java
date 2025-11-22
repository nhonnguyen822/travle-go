package com.example.travelgo.service;

import com.example.travelgo.dto.TourScheduleRequestDTO;
import com.example.travelgo.entity.TourSchedule;

import java.util.List;
import java.util.Optional;

public interface ITourScheduleService {
    List<TourSchedule> getSchedulesByTour(Long tourId);

    TourSchedule createSchedule(Long tourId, TourScheduleRequestDTO dto);

    TourSchedule updateSchedule(Long scheduleId, TourScheduleRequestDTO tourScheduleRequestDTO);

    TourSchedule deleteSchedule(Long scheduleId);

    Optional<TourSchedule> findById(Long scheduleId);
    int countBookingsActiveByTourSchedule(Long id);

    List<TourSchedule> getFutureSchedulesByTour(Long tourId);

    TourSchedule getScheduleByBookingId(Long bookingId);

    void updateScheduleStatusAutomatically();

}

