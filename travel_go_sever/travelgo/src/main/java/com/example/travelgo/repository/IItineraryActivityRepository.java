package com.example.travelgo.repository;

import com.example.travelgo.dto.ActivityDTO;
import com.example.travelgo.entity.ItineraryActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IItineraryActivityRepository extends JpaRepository<ItineraryActivity, Long> {
    @Query("""
                SELECT new com.example.travelgo.dto.ActivityDTO(
                a.id,
                    a.time,
                    a.title,
                    a.details,
                    a.imageUrl,
                    a.position
                )
                FROM ItineraryActivity a
                WHERE a.itineraryDay.id = :dayId
                ORDER BY a.position ASC, a.time ASC
            """)
    List<ActivityDTO> findActivitiesByDayId(Long dayId);
}