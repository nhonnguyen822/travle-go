//package com.example.travelgo.entity;
//
//import jakarta.persistence.*;
//import lombok.Getter;
//import lombok.Setter;
//
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "blog_comments")
//@Getter
//@Setter
//public class BlogComment {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private String name;
//
//    @Column(columnDefinition = "TEXT")
//    private String content;
//
//    private LocalDate date;
//
//    @ManyToOne
//    @JoinColumn(name = "blog_id")
//    private Blog blog;
//}
