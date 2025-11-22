package com.example.travelgo.service;

import com.example.travelgo.entity.Notification;

import java.util.List;

public interface INotificationService {
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Long countByUserIdAndIsReadFalse(Long userId);
}
