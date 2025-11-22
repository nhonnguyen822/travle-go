package com.example.travelgo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDeleteRequest {
    @NotNull(message = "Status is required")
    @NotBlank(message = "Status cannot be blank")
    private String status;
    private String reason = "";
}
