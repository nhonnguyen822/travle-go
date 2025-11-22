package com.example.travelgo.repository;

import com.example.travelgo.entity.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IServiceItemRepository extends JpaRepository<ServiceItem,Long> {
}
