package com.example.travelgo.dto;

import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Data
public class ContactRequest {

    @NotBlank(message = "Họ tên là bắt buộc")
    @Size(min = 2, max = 50, message = "Họ tên phải từ 2 đến 50 ký tự")
    private String name;


    @NotBlank(message = "Email là bắt buộc")
    @Email
    private String email;

    @NotBlank(message = "Số điện thoại là bắt buộc")
    private String phone;

    @NotBlank(message = "Nội dung là bắt buộc")
    @Size(min = 10, max = 1000)
    private String message;

    private String tourInterest;
    private String preferredContact = "email";

}