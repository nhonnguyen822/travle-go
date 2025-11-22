package com.example.travelgo.service.impl;

import com.example.travelgo.entity.Policy;
import com.example.travelgo.repository.IPolicyRepository;
import com.example.travelgo.service.IPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PolicyService implements IPolicyService {
    private final IPolicyRepository policyRepository;

    @Override
    public List<Policy> getAll() {
        return policyRepository.findAll();
    }
}
