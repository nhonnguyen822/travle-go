package com.example.travelgo.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
public class CreateBlogDTO {
    private String title;
    private String subtitle;
    private String content;
    private String thumbnail;
    private String author;
    private List<String> tags;
}
