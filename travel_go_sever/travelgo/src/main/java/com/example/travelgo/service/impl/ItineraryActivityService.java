package com.example.travelgo.service.impl;

import com.example.travelgo.repository.IItineraryActivityRepository;
import com.example.travelgo.service.IItineraryActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ItineraryActivityService implements IItineraryActivityService {
      private final IItineraryActivityRepository tourItineraryRepository;

}