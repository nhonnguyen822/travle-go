package com.example.travelgo.repository;

import com.example.travelgo.dto.ItineraryDayDTO;
import com.example.travelgo.entity.ItineraryDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IItineraryDayRepository extends JpaRepository<ItineraryDay, Long> {
    @Query("""
        SELECT new com.example.travelgo.dto.ItineraryDayDTO(
            d.id,
            d.dayIndex,
            d.description,
            d.title,
            null
        )
        FROM ItineraryDay d
        WHERE d.tour.id = :tourId
        ORDER BY d.dayIndex ASC
    """)
    List<ItineraryDayDTO> findDaysByTourId(Long tourId);
}
