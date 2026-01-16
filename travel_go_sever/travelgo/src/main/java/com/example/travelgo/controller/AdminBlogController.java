//package com.example.travelgo.controller;
//
//import com.example.travelgo.dto.BlogResponseDTO;
//import com.example.travelgo.dto.CreateBlogRequest;
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
//@RequestMapping("/api/admin/blogs")
//@RequiredArgsConstructor
//public class AdminBlogController {
//    private final IBlogService blogService;
//
//    // ========== CREATE BLOG ==========
//    @PostMapping
//    public ResponseEntity<Long> createBlog(
//            @RequestBody CreateBlogRequest request
//    ) throws Exception {
//        Blog blog = blogService.createBlog(request);
//        return ResponseEntity
//                .status(HttpStatus.CREATED)
//                .body(blog.getId());
//    }
//
//    // ========== UPDATE BLOG ==========
//    @PutMapping("/{id}")
//    public ResponseEntity<Void> updateBlog(
//            @PathVariable Long id,
//            @RequestBody CreateBlogRequest request
//    ) throws Exception {
//        blogService.updateBlog(id, request);
//        return ResponseEntity.ok().build();
//    }
//
//    // ========== DELETE BLOG ==========
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> deleteBlog(@PathVariable Long id) {
//        blogService.deleteBlog(id);
//        return ResponseEntity.noContent().build();
//    }
//
//    // ========== ADMIN VIEW (LIST FULL) ==========
//    @GetMapping
//    public ResponseEntity<List<BlogResponseDTO>> getAllForAdmin() {
//        return ResponseEntity.ok(blogService.getAllBlogs());
//    }
//
//    @GetMapping("/{id}")
//    public ResponseEntity<BlogResponseDTO> getBlogById(@PathVariable Long id) {
//        try {
//            BlogResponseDTO blog = blogService.getBlogDetail(id);
//            return ResponseEntity.ok(blog);
//        } catch (RuntimeException e) {
//            return ResponseEntity.notFound().build();
//        }
//    }
//}
