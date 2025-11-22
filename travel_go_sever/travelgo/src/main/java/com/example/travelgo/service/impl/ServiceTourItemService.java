package com.example.travelgo.service.impl;

import com.example.travelgo.entity.ServiceItem;
import com.example.travelgo.repository.IServiceItemRepository;
import com.example.travelgo.service.IServiceTourItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceTourItemService implements IServiceTourItemService {
    private final IServiceItemRepository serviceItemRepository;

    @Override
    public List<ServiceItem> getServicesTourItems() {
        return serviceItemRepository.findAll();
    }
}
