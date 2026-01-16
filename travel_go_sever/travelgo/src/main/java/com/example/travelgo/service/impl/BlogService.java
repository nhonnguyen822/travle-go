//package com.example.travelgo.service.impl;
//
//import com.example.travelgo.dto.*;
//import com.example.travelgo.entity.Blog;
//import com.example.travelgo.entity.BlogComment;
//import com.example.travelgo.entity.RelatedTour;
//import com.example.travelgo.repository.IBlogRepository;
//import com.example.travelgo.service.IBlogService;
//import com.example.travelgo.util.CloudinaryService;
//import jakarta.transaction.Transactional;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDate;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//@Transactional
//public class BlogService implements IBlogService {
//    private final IBlogRepository blogRepository;
//    private final CloudinaryService cloudinaryService;
//
//
//    @Override
//    public Blog createBlog(CreateBlogRequest request) throws Exception {
//        Blog blog = new Blog();
//        blog.setTitle(request.getTitle());
//        blog.setSubtitle(request.getSubtitle());
//        blog.setContent(request.getContent());
//        blog.setAuthor(request.getAuthor());
//        blog.setCreatedAt(LocalDate.now());
//        blog.setTags(request.getTags());
//
//        // Upload thumbnail
//        if (request.getThumbnailUrl() != null && !request.getThumbnailUrl().isBlank()) {
//            String cloudUrl =
//                    cloudinaryService.uploadImageFromUrl(request.getThumbnailUrl());
//            blog.setThumbnail(cloudUrl);
//        }
//
//        // Upload gallery
//        if (request.getGalleryUrls() != null && !request.getGalleryUrls().isEmpty()) {
//            for (String url : request.getGalleryUrls()) {
//                blog.getGallery().add(
//                        cloudinaryService.uploadImageFromUrl(url)
//                );
//            }
//        }
//
//        // Related tours
//        if (request.getRelatedTours() != null && !request.getRelatedTours().isEmpty()) {
//            for (RelatedTourDTO dto : request.getRelatedTours()) {
//                RelatedTour tour = new RelatedTour();
//                tour.setName(dto.getName());
//                tour.setPrice(dto.getPrice());
//                tour.setImg(
//                        cloudinaryService.uploadImageFromUrl(dto.getImg())
//                );
//                tour.setBlog(blog);
//                blog.getRelatedTours().add(tour);
//            }
//        }
//
//        return blogRepository.save(blog);
//    }
//
//    @Override
//    public List<BlogResponseDTO> getAllBlogs() {
//        return blogRepository.findAll()
//                .stream()
//                .map(this::mapToDTO)
//                .toList();
//    }
//
//    @Override
//    public BlogResponseDTO getBlogDetail(Long id) {
//        Blog blog = blogRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Blog not found"));
//        return mapToDTO(blog);
//    }
//
//
//    @Override
//    public void addComment(Long blogId, CreateCommentDTO request) {
//        Blog blog = blogRepository.findById(blogId)
//                .orElseThrow(() -> new RuntimeException("Blog not found"));
//
//        BlogComment comment = new BlogComment();
//        comment.setName("Bạn");
//        comment.setContent(request.getContent());
//        comment.setDate(LocalDate.now());
//        comment.setBlog(blog);
//
//        blog.getComments().add(comment);
//        blogRepository.save(blog);
//    }
//
//    @Override
//    public void updateBlog(Long id, CreateBlogRequest request) throws Exception {
//        Blog blog = blogRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Blog not found"));
//
//        blog.setTitle(request.getTitle());
//        blog.setSubtitle(request.getSubtitle());
//        blog.setContent(request.getContent());
//        blog.setAuthor(request.getAuthor());
//        blog.setTags(request.getTags());
//
//        // thumbnail
//        if (request.getThumbnailUrl() != null && !request.getThumbnailUrl().isBlank()) {
//            blog.setThumbnail(
//                    cloudinaryService.uploadImageFromUrl(request.getThumbnailUrl())
//            );
//        }
//
//        blog.getGallery().clear();
//        if (request.getGalleryUrls() != null) {
//            for (String url : request.getGalleryUrls()) {
//                blog.getGallery().add(
//                        cloudinaryService.uploadImageFromUrl(url)
//                );
//            }
//        }
//
//        blog.getRelatedTours().clear();
//        if (request.getRelatedTours() != null) {
//            for (RelatedTourDTO dto : request.getRelatedTours()) {
//                RelatedTour tour = new RelatedTour();
//                tour.setName(dto.getName());
//                tour.setPrice(dto.getPrice());
//                tour.setImg(
//                        cloudinaryService.uploadImageFromUrl(dto.getImg())
//                );
//                tour.setBlog(blog);
//                blog.getRelatedTours().add(tour);
//            }
//        }
//
//        blogRepository.save(blog);
//    }
//
//    @Override
//    public void deleteBlog(Long id) {
//        Blog blog = blogRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Blog not found"));
//        blogRepository.delete(blog);
//    }
//
//
//    private BlogResponseDTO mapToDTO(Blog blog) {
//        BlogResponseDTO dto = new BlogResponseDTO();
//        dto.setId(blog.getId());
//        dto.setTitle(blog.getTitle());
//        dto.setSubtitle(blog.getSubtitle());
//        dto.setContent(blog.getContent());
//        dto.setThumbnail(blog.getThumbnail());
//        dto.setAuthor(blog.getAuthor());
//        dto.setCreatedAt(blog.getCreatedAt());
//        dto.setTags(blog.getTags());
//        dto.setGallery(blog.getGallery());
//
//        dto.setComments(
//                blog.getComments().stream().map(c -> {
//                    BlogCommentDTO cd = new BlogCommentDTO();
//                    cd.setName(c.getName());
//                    cd.setContent(c.getContent());
//                    cd.setDate(c.getDate());
//                    return cd;
//                }).toList()
//        );
//
//        dto.setRelatedTours(
//                blog.getRelatedTours().stream().map(t -> {
//                    RelatedTourDTO td = new RelatedTourDTO();
//                    td.setId(t.getId());
//                    td.setName(t.getName());
//                    td.setPrice(t.getPrice());
//                    td.setImg(t.getImg());
//                    return td;
//                }).toList()
//        );
//
//        return dto;
//    }
//
//}
