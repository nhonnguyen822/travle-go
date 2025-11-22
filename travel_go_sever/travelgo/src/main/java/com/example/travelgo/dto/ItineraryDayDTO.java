package com.example.travelgo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItineraryDayDTO {
    private Long id;

    @NotNull(message = "Thứ tự ngày không được để trống")
    private Integer dayIndex;

    @NotBlank(message = "Tiêu đề ngày không được để trống")
    @Size(min = 5, max = 200, message = "Tiêu đề ngày phải từ 5 đến 200 ký tự")
    private String title;

    @NotBlank(message = "Mô tả ngày không được để trống")
    @Size(min = 15, max = 1000, message = "Mô tả ngày phải từ 15 đến 1000 ký tự")
    private String description;

    @Valid
    @NotNull(message = "Danh sách hoạt động không được để trống")
    @Size(min = 1, max = 10, message = "Mỗi ngày phải có từ 1 đến 10 hoạt động")
    private List<ActivityDTO> activities;
}