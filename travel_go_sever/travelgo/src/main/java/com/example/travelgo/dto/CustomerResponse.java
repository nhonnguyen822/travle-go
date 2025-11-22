package com.example.travelgo.dto;

import com.example.travelgo.enums.CustomerType;
import com.example.travelgo.enums.Gender;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String avatar;
    private String customerCode;
    private LocalDate dateOfBirth;
    private String identityNumber;
    private String address;
    private Gender gender;
    private CustomerType customerType;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long totalBookings;
}
