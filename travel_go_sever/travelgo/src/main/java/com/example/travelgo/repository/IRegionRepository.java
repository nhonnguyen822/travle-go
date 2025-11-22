package com.example.travelgo.repository;

import com.example.travelgo.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IRegionRepository extends JpaRepository<Region, Long> { 
    // methods here
}