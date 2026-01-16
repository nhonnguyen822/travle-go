package com.example.travelgo.repository;

import com.example.travelgo.entity.ChatMessage;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.roomId = :roomId AND m.sender.id != :userId AND m.isRead = false")
    Long countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.roomId = :roomId AND m.sender.id != :userId")
    void markMessagesAsRead(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Query("SELECT m FROM ChatMessage m WHERE m.roomId = :roomId AND m.sender.id != :userId AND m.isRead = false ORDER BY m.createdAt ASC")
    List<ChatMessage> findUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Query("SELECT m FROM ChatMessage m WHERE m.roomId = :roomId ORDER BY m.createdAt DESC")
    List<ChatMessage> findLatestMessages(@Param("roomId") Long roomId);

    // Lấy tin nhắn với user information (JOIN FETCH để tránh N+1 query)
    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.sender WHERE m.roomId = :roomId ORDER BY m.createdAt ASC")
    List<ChatMessage> findByRoomIdWithSender(@Param("roomId") Long roomId);
}
