package com.example.travelgo.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBookingRequest {
    @NotBlank(message = "👤 Tên khách hàng là bắt buộc")
    @Size(min = 2, max = 50, message = "👤 Tên phải từ 2-50 ký tự")
    private String customerName;

    @NotBlank(message = "📞 Số điện thoại là bắt buộc")
    @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "📞 Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank(message = "📧 Email là bắt buộc")
    @Email(message = "📧 Email không hợp lệ")
    @Size(max = 100, message = "📧 Email không được vượt quá 100 ký tự")
    private String customerEmail;

    @NotNull(message = "🎯 ID tour là bắt buộc")
    @Positive(message = "🎯 ID tour phải là số dương")
    private Long tourId;

    @NotBlank(message = "📅 Ngày khởi hành là bắt buộc")
    private String startDate;

    @NotNull(message = "👨‍👩‍👧‍👦 Số người lớn là bắt buộc")
    @Min(value = 1, message = "👨‍👩‍👧‍👦 Số người lớn phải lớn hơn 0")
    private Integer adults;

    @NotNull(message = "👦 Số trẻ em là bắt buộc")
    @Min(value = 0, message = "👦 Số trẻ em không được âm")
    private Integer children;

    @NotNull(message = "👶 Số em bé là bắt buộc")
    @Min(value = 0, message = "👶 Số em bé không được âm")
    private Integer babies;

    @Size(max = 500, message = "📝 Ghi chú không được vượt quá 500 ký tự")
    private String notes;

    // Helper method để tính tổng số người
    public Integer getTotalPeople() {
        return (adults != null ? adults : 0) +
                (children != null ? children : 0) +
                (babies != null ? babies : 0);
    }
}