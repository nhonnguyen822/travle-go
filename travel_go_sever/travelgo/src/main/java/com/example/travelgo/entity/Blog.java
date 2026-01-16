//package com.example.travelgo.entity;
//
//import jakarta.persistence.*;
//import lombok.Getter;
//import lombok.Setter;
//
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.ArrayList;
//import java.util.HashSet;
//import java.util.List;
//import java.util.Set;
//
//@Entity
//@Table(name = "blogs")
//@Getter
//@Setter
//public class Blog {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private String title;
//    private String subtitle;
//
//    @Column(columnDefinition = "TEXT")
//    private String content;
//
//    private String thumbnail; // URL Cloudinary
//    private String author;
//
//    private LocalDate createdAt;
//
//    @ElementCollection
//    @CollectionTable(name = "blog_tags")
//    private List<String> tags = new ArrayList<>();
//
//    @ElementCollection
//    @CollectionTable(name = "blog_gallery")
//    private List<String> gallery = new ArrayList<>();
//
//    @OneToMany(mappedBy = "blog", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<BlogComment> comments = new ArrayList<>();
//
//    @OneToMany(mappedBy = "blog", cascade = CascadeType.ALL)
//    private List<RelatedTour> relatedTours = new ArrayList<>();
//}
