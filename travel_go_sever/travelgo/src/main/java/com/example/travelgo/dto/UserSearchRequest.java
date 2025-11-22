package com.example.travelgo.dto;

import com.example.travelgo.enums.CustomerType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchRequest {
    private String search;
    private CustomerType customerType;
    private Boolean status;
    private int page = 0;
    private int size = 10;
}
