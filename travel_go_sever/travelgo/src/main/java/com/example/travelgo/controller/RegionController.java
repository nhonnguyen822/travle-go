package com.example.travelgo.controller;

import com.example.travelgo.entity.Region;
import com.example.travelgo.service.IRegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {
    private final IRegionService regionService;

    @GetMapping
    public ResponseEntity<?> getAllRegions() {
        List<Region> regionList = regionService.getAllRegions();
        if (regionList.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(regionList, HttpStatus.OK);

    }
}
