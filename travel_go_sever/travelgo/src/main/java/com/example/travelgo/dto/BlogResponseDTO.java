package com.example.travelgo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BlogResponseDTO {
    private Long id;
    private String title;
    private String subtitle;
    private String content;
    private String thumbnail;
    private String author;
    private LocalDate createdAt;
    private List<String> tags;
    private List<String> gallery;
    private List<BlogCommentDTO> comments;
    private List<RelatedTourDTO> relatedTours;
}
