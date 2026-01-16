//package com.example.travelgo.util;
//
//import com.example.travelgo.dto.BlogCommentDTO;
//import com.example.travelgo.dto.BlogDetailDTO;
//import com.example.travelgo.dto.BlogListDTO;
//import com.example.travelgo.entity.Blog;
//import com.example.travelgo.entity.BlogComment;
//import com.example.travelgo.entity.BlogTag;
//
//import java.util.Comparator;
//
//public class BlogMapper {
//    public static BlogListDTO toListDTO(Blog blog) {
//        return new BlogListDTO(
//                blog.getId(),
//                blog.getTitle(),
//                blog.getSubtitle(),
//                blog.getThumbnail(),
//                blog.getAuthor(),
//                blog.getCreatedAt()
//        );
//    }
//    public static BlogDetailDTO toDetailDTO(Blog blog) {
//        BlogDetailDTO dto = new BlogDetailDTO();
//
//        dto.setId(blog.getId());
//        dto.setTitle(blog.getTitle());
//        dto.setSubtitle(blog.getSubtitle());
//        dto.setContent(blog.getContent());
//        dto.setThumbnail(blog.getThumbnail());
//        dto.setAuthor(blog.getAuthor());
//        dto.setCreatedAt(blog.getCreatedAt());
//
//        dto.setTags(
//                blog.getTags()
//                        .stream()
//                        .map(BlogTag::getName)
//                        .toList()
//        );
//
//        dto.setComments(
//                blog.getComments()
//                        .stream()
//                        .sorted(Comparator.comparing(BlogComment::getCreatedAt).reversed())
//                        .map(c -> new BlogCommentDTO(
//                                c.getId(),
//                                c.getUserName(),
//                                c.getContent(),
//                                c.getCreatedAt()
//                        ))
//                        .toList()
//        );
//
//        return dto;
//    }
//}
