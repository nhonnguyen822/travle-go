package com.example.travelgo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPaymentRequest {
    private BigDecimal amount;
    private LocalDate paymentDate;
    private Integer paymentPercentage;
}
