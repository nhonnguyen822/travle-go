//package com.example.travelgo.controller;
//
//import com.example.travelgo.dto.BlogResponseDTO;
//import com.example.travelgo.dto.CreateBlogRequest;
//import com.example.travelgo.dto.CreateCommentDTO;
//import com.example.travelgo.entity.Blog;
//import com.example.travelgo.service.IBlogService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/blogs")
//@RequiredArgsConstructor
//public class BlogController {
//
//    private final IBlogService blogService;
//
////    // ================= CREATE BLOG =================
////    @PostMapping
////    public ResponseEntity<?> createBlog(@RequestBody CreateBlogRequest request) {
////        try {
////            Blog blog = blogService.createBlog(request);
////            return ResponseEntity
////                    .status(HttpStatus.CREATED)
////                    .body(blog.getId());
////        } catch (Exception e) {
////            return ResponseEntity
////                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
////                    .body(e.getMessage());
////        }
////    }
//
//    // ================= GET ALL BLOGS =================
//    @GetMapping
//    public ResponseEntity<List<BlogResponseDTO>> getAllBlogs() {
//        return ResponseEntity.ok(blogService.getAllBlogs());
//    }
//
//    // ================= GET BLOG DETAIL =================
//    @GetMapping("/{id}")
//    public ResponseEntity<BlogResponseDTO> getBlogDetail(@PathVariable Long id) {
//        return ResponseEntity.ok(blogService.getBlogDetail(id));
//    }
//
//    // ================= ADD COMMENT =================
//    @PostMapping("/{id}/comments")
//    public ResponseEntity<Void> addComment(
//            @PathVariable Long id,
//            @RequestBody CreateCommentDTO request
//    ) {
//        blogService.addComment(id, request);
//        return ResponseEntity
//                .status(HttpStatus.CREATED)
//                .build();
//    }
//}
