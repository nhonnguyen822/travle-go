package com.example.travelgo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminContactResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String message;
    private String tourInterest;
    private String preferredContact;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}
