package com.example.travelgo.repository;

import com.example.travelgo.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IPolicyRepository extends JpaRepository<Policy,Long> {
}
