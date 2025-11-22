package com.example.travelgo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourRequest {

    @NotBlank(message = "Tiêu đề tour không được để trống")
    @Size(min = 5, max = 100, message = "Tiêu đề phải từ 5 đến 100 ký tự")
    private String title;

    @NotBlank(message = "Điểm đến không được để trống")
    @Size(min = 3, max = 50, message = "Điểm đến phải từ 3 đến 50 ký tự")
    private String destination;

    @NotNull(message = "Thời lượng không được để trống")
    @Min(value = 1, message = "Thời lượng tối thiểu là 1 ngày")
    @Max(value = 60, message = "Thời lượng không được vượt quá 60 ngày")
    private Integer duration;

    @NotNull(message = "Giá cơ bản không được để trống")
    @DecimalMin(value = "0.01", message = "Giá phải lớn hơn 0")
    @DecimalMax(value = "100000000", message = "Giá không được vượt quá 100 triệu")
    private Double basePrice;

    @NotNull(message = "Vui lòng chọn khu vực")
    private Long regionId;

    // Step 2 fields
    @NotBlank(message = "Mô tả không được để trống")
    @Size(min = 20, max = 2000, message = "Mô tả phải từ 20 đến 2000 ký tự")
    private String description;

    @NotBlank(message = "Điểm nổi bật không được để trống")
    @Size(min = 10, max = 1000, message = "Điểm nổi bật phải từ 10 đến 1000 ký tự")
    private String highLight;

    @NotBlank(message = "Vui lòng chọn ảnh cover cho tour")
    private String image;

    @Valid
    @NotNull(message = "Danh sách ảnh phụ không được để trống")
    @Size(min = 1, max = 5, message = "Vui lòng chọn từ 1 đến 5 ảnh phụ")
    private List<TourImageDTO> images;

    // Step 3 fields
    @Valid
    @NotNull(message = "Lịch trình không được để trống")
    @Size(min = 1, max = 60, message = "Phải có ít nhất 1 ngày và tối đa 60 ngày trong lịch trình")
    private List<ItineraryDayDTO> itineraryDays;

    // Step 4 fields
    @Valid
    @NotNull(message = "Dịch vụ không được để trống")
    @Size(min = 1, max = 20, message = "Phải có ít nhất 1 dịch vụ và tối đa 20 dịch vụ")
    private List<ServiceDTO> services;

    private String status;
}