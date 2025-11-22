package com.example.travelgo.service.impl;

import com.example.travelgo.entity.Region;
import com.example.travelgo.repository.IRegionRepository;
import com.example.travelgo.repository.ITourRepository;
import com.example.travelgo.service.IRegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RegionService implements IRegionService {
    private final IRegionRepository regionRepository;
    private final ITourRepository tourRepository;


    @Override
    public List<Region> getAllRegions() {
        return regionRepository.findAll();

    }

    @Override
    public Optional<Region> findById(Long id) {
        return regionRepository.findById(id);
    }
}