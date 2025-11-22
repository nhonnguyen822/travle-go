package com.example.travelgo.repository;

import com.example.travelgo.dto.TourScheduleDTO;
import com.example.travelgo.entity.TourSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ITourScheduleRepository extends JpaRepository<TourSchedule, Long> {
    @Query("SELECT new com.example.travelgo.dto.TourScheduleDTO(" +
            "s.id, s.startDate, s.endDate, s.status, s.price, s.childPrice, s.babyPrice) " +
            "FROM TourSchedule s " +
            "WHERE s.tour.id = :tourId " +
            "AND s.status IN (com.example.travelgo.enums.ScheduleStatus.UPCOMING)" +
            "ORDER BY s.startDate ASC")
    List<TourScheduleDTO> findSchedulesByTourId(Long tourId);

    List<TourSchedule> findByTourId(Long tourId);

    @Query(value = "SELECT COUNT(*) " +
            "FROM tour_schedules ts " +
            "JOIN bookings b ON ts.id = b.tour_schedule_id " +
            "WHERE ts.id = :id " +
            "AND b.status IN ('DEPOSIT_PAID', 'PAID')",
            nativeQuery = true)
    int countBookingsActiveByTourSchedule(@Param("id") Long id);

    @Query(value = "SELECT * FROM tour_schedules WHERE tour_id = :tourId AND start_date = :startDate",
            nativeQuery = true)
    Optional<TourSchedule> findByTourIdAndStartDate(@Param("tourId") Long tourId,
                                                    @Param("startDate") LocalDate startDate);

    @Query(value = "SELECT * FROM tour_schedules WHERE tour_id = :tourId AND start_date >= CURDATE() AND status = 'UPCOMING'",
            nativeQuery = true)
    List<TourSchedule> findByTourIdAndStartDateAfterAndStatus(@Param("tourId") Long tourId);
}
