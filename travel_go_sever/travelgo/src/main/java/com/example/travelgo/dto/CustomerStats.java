package com.example.travelgo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerStats {
    private Long totalCustomers;
    private Long activeCustomers;
    private Long inactiveCustomers;
    private Long regularCustomers;
    private Long vipCustomers;
}
