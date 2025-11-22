package com.example.travelgo.controller;

import com.example.travelgo.dto.TourScheduleRequestDTO;
import com.example.travelgo.entity.TourSchedule;
import com.example.travelgo.service.ITourScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ITourScheduleService scheduleService;

    @GetMapping("tours/{tourId}")
    public ResponseEntity<?> getSchedulesByTour(@PathVariable Long tourId) {
        List<TourSchedule> schedules = scheduleService.getSchedulesByTour(tourId);
        if (schedules.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(schedules, HttpStatus.OK);
    }

    @GetMapping("/tour/{tourId}/future")
    public ResponseEntity<?> getFutureSchedulesByTour(@PathVariable Long tourId) {
        List<TourSchedule> futureSchedules = scheduleService.getFutureSchedulesByTour(tourId);
        if (futureSchedules.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(futureSchedules, HttpStatus.OK);
    }


    @PostMapping("/{tourId}")
    public ResponseEntity<?> createSchedule(
            @PathVariable Long tourId,
            @RequestBody TourScheduleRequestDTO tourScheduleRequestDTO
    ) {
        try {
            System.out.println(tourScheduleRequestDTO);
            TourSchedule created = scheduleService.createSchedule(tourId, tourScheduleRequestDTO);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PatchMapping("{scheduleId}")
    public ResponseEntity<?> updateSchedule(
            @PathVariable Long scheduleId,
            @RequestBody TourScheduleRequestDTO schedule
    ) {
        try {
            TourSchedule updated = scheduleService.updateSchedule(scheduleId, schedule);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }


    @PatchMapping("/delete/{scheduleId}")
    public ResponseEntity<?> cancelSchedule(
            @PathVariable Long scheduleId
    ) {
        try {
            Optional<TourSchedule> tourSchedule = scheduleService.findById(scheduleId);
            if (tourSchedule.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            int countBookingsActive = scheduleService.countBookingsActiveByTourSchedule(scheduleId);
            if (countBookingsActive > 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Không thể hủy lịch trình đã có " + countBookingsActive + " booking đã được đặt"));
            }

            TourSchedule cancelledSchedule = scheduleService.deleteSchedule(scheduleId);
            return ResponseEntity.ok(Map.of(
                    "message", "Hủy lịch trình thành công",
                    "schedule", cancelledSchedule
            ));
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }


    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getScheduleByBookingId(@PathVariable Long bookingId) {
        try {
            TourSchedule schedule = scheduleService.getScheduleByBookingId(bookingId);
            if (schedule == null) {
                return new ResponseEntity<>("Không tìm thấy lịch trình cho booking ID: " + bookingId, HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(schedule, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}