package com.example.travelgo.dto;

import com.example.travelgo.enums.CustomerType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String avatar;
    private String role;
    private Boolean status;
    private LocalDateTime createdAt;

    private String customerCode;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private CustomerType customerType;
}

