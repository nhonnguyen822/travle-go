package com.example.travelgo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityDTO {
    private Long id;

    @NotNull(message = "Thời gian không được để trống")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime time;

    @NotBlank(message = "Tiêu đề hoạt động không được để trống")
    @Size(min = 5, max = 100, message = "Tiêu đề hoạt động phải từ 5 đến 100 ký tự")
    private String title;

    @NotBlank(message = "Chi tiết không được để trống")
    @Size(min = 15, max = 1000, message = "Chi tiết hoạt động phải từ 15 đến 1000 ký tự")
    private String details;

    private String imageUrl;
    private Integer position;
}