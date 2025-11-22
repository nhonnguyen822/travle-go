package com.example.travelgo.service.impl;

import com.example.travelgo.repository.ITourImageRepository;
import com.example.travelgo.service.ITourImageService;
import org.springframework.stereotype.Service;

@Service
public class TourImageService implements ITourImageService {
      private final ITourImageRepository tourImageRepository;
      public TourImageService (ITourImageRepository tourImageRepository){
        this.tourImageRepository = tourImageRepository;
      }
    // implementation here
}