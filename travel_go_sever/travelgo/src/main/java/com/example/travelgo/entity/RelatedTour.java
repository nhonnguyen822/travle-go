//package com.example.travelgo.entity;
//
//import jakarta.persistence.*;
//import lombok.Getter;
//import lombok.Setter;
//
//@Entity
//@Table(name = "related_tours")
//@Getter
//@Setter
//public class RelatedTour {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private String name;
//    private String price;
//    private String img; // URL Cloudinary
//
//    @ManyToOne
//    @JoinColumn(name = "blog_id")
//    private Blog blog;
//}
