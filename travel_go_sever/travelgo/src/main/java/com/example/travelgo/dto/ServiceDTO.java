package com.example.travelgo.dto;

import com.example.travelgo.enums.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDTO {
    private Long id;
    @NotBlank(message = "Tên dịch vụ không được để trống")
    @Size(min = 3, max = 100, message = "Tên dịch vụ phải từ 3 đến 100 ký tự")
    private String name;

    @NotNull(message = "Loại dịch vụ không được để trống")
    private ServiceType type;
}
