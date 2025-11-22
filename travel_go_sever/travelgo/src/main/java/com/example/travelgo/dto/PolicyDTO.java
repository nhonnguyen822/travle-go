package com.example.travelgo.dto;

import com.example.travelgo.enums.PolicyType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyDTO {
    private Long id;
    private String name;
    private PolicyType type;
}
