package com.example.travelgo.dto;

import lombok.Data;

import java.util.List;
@Data
public class CreateBlogRequest {
    private String title;
    private String subtitle;
    private String content;
    private String author;

    private String thumbnailUrl;
    private List<String> galleryUrls;

    private List<String> tags;
    private List<RelatedTourDTO> relatedTours;
}
