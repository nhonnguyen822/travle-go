package com.example.travelgo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourImageDTO {
    private Long id;
    @NotBlank(message = "URL ảnh không được để trống")
    private String imageUrl;
}
