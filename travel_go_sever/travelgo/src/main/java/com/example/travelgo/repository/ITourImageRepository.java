package com.example.travelgo.repository;

import com.example.travelgo.dto.TourImageDTO;
import com.example.travelgo.entity.TourImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ITourImageRepository extends JpaRepository<TourImage, Long> {
    @Query("SELECT new com.example.travelgo.dto.TourImageDTO(t.id,t.imageUrl) " +
            "FROM TourImage t " +
            "WHERE t.tour.id = :tourId " +
            "ORDER BY t.id ASC")
    List<TourImageDTO> findImagesByTourId(Long tourId);
}