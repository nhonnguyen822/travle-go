package com.example.travelgo.service;

import com.example.travelgo.entity.Region;

import java.util.List;
import java.util.Optional;

public interface IRegionService {

    List<Region> getAllRegions();

    Optional<Region> findById(Long id);

}