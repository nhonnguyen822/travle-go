package com.example.travelgo.service.impl;

import com.example.travelgo.dto.TourScheduleRequestDTO;
import com.example.travelgo.entity.Booking;
import com.example.travelgo.entity.Tour;
import com.example.travelgo.entity.TourSchedule;
import com.example.travelgo.enums.ScheduleStatus;
import com.example.travelgo.repository.IBookingRepository;
import com.example.travelgo.repository.ITourRepository;
import com.example.travelgo.repository.ITourScheduleRepository;
import com.example.travelgo.service.ITourScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TourScheduleService implements ITourScheduleService {
    private final ITourScheduleRepository scheduleRepository;
    private final ITourRepository tourRepository;
    private final IBookingRepository bookingRepository;

    @Override
    public List<TourSchedule> getSchedulesByTour(Long tourId) {
        return scheduleRepository.findByTourId(tourId);
    }

    public TourSchedule createSchedule(Long tourId, TourScheduleRequestDTO dto) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("❌ Không tìm thấy tour ID = " + tourId));
        TourSchedule schedule = new TourSchedule();
        schedule.setTour(tour);
        schedule.setStartDate(dto.getStartDate());
        schedule.setEndDate(dto.getEndDate());
        schedule.setPrice(dto.getPrice());
        schedule.setChildPrice(dto.getChildPrice());
        schedule.setBabyPrice(dto.getBabyPrice());
        schedule.setStatus(ScheduleStatus.UPCOMING);
        return scheduleRepository.save(schedule);
    }

    @Override
    public TourSchedule updateSchedule(Long scheduleId, TourScheduleRequestDTO tourScheduleRequestDTO) {
        TourSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStartDate(tourScheduleRequestDTO.getStartDate());
        schedule.setEndDate(tourScheduleRequestDTO.getEndDate());
        schedule.setPrice(tourScheduleRequestDTO.getPrice());
        schedule.setChildPrice(tourScheduleRequestDTO.getChildPrice());
        schedule.setBabyPrice(tourScheduleRequestDTO.getBabyPrice());
        return scheduleRepository.save(schedule);
    }

    @Override
    public TourSchedule deleteSchedule(Long scheduleId) {
        TourSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus(ScheduleStatus.CANCELLED);
        return scheduleRepository.save(schedule);
    }

    @Override
    public Optional<TourSchedule> findById(Long scheduleId) {
        return scheduleRepository.findById(scheduleId);
    }

    @Override
    public int countBookingsActiveByTourSchedule(Long id) {
        return scheduleRepository.countBookingsActiveByTourSchedule(id);
    }

    @Override
    public List<TourSchedule> getFutureSchedulesByTour(Long tourId) {
        return scheduleRepository.findByTourIdAndStartDateAfterAndStatus(tourId);
    }

    @Override
    public TourSchedule getScheduleByBookingId(Long bookingId) {
        Optional<Booking> booking = bookingRepository.findById(bookingId);

        if (booking.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking với ID: " + bookingId);
        }

        TourSchedule tourSchedule = booking.get().getTourSchedule();

        if (tourSchedule == null) {
            throw new RuntimeException("Booking không có lịch trình liên kết");
        }
        return tourSchedule;
    }

    @Override
    public void updateScheduleStatusAutomatically() {
        LocalDate today = LocalDate.now();
        List<TourSchedule> allSchedules = scheduleRepository.findAll();
        int updatedCount = 0;
        for (TourSchedule schedule : allSchedules) {
            ScheduleStatus newStatus = calculateScheduleStatus(schedule, today);

            if (schedule.getStatus() != newStatus) {
                schedule.setStatus(newStatus);
                scheduleRepository.save(schedule);
                updatedCount++;

            }

        }
    }

    private ScheduleStatus calculateScheduleStatus(TourSchedule schedule, LocalDate today) {
        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            return ScheduleStatus.CANCELLED;
        }
        if (today.isBefore(schedule.getStartDate())) {
            return ScheduleStatus.UPCOMING;
        } else if (today.isAfter(schedule.getEndDate())) {
            return ScheduleStatus.COMPLETED;
        } else {
            return ScheduleStatus.ONGOING;
        }
    }
}
