package com.example.travelgo.repository;


import com.example.travelgo.dto.ServiceDTO;
import com.example.travelgo.entity.TourServices;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ITourServiceRepository extends JpaRepository<TourServices,Long> {
    @Query("""
                SELECT new com.example.travelgo.dto.ServiceDTO(
                    s.id, s.name, s.type
                )
                FROM TourServices ts
                JOIN ts.serviceItem s
                WHERE ts.tour.id = :tourId
            """)
    List<ServiceDTO> findServicesByTourId(Long tourId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TourServices ts WHERE ts.tour.id = :tourId")
    void deleteAllByTourId(@Param("tourId") Long tourId);

}
