package com.example.travelgo.repository;

import com.example.travelgo.dto.PolicyDTO;
import com.example.travelgo.entity.TourPolicy;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ITourPolicyRepository extends JpaRepository<TourPolicy,Long> {
    @Query("""
        SELECT new com.example.travelgo.dto.PolicyDTO(
            p.id, p.name, p.type
        )
        FROM TourPolicy tp
        JOIN tp.policy p
        WHERE tp.tour.id = :tourId
    """)
    List<PolicyDTO> findPoliciesByTourId(Long tourId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TourPolicy tp WHERE tp.tour.id = :tourId")
    void deleteAllByTourId(@Param("tourId") Long tourId);
}
