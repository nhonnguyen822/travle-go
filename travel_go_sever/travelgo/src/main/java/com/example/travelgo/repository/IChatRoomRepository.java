package com.example.travelgo.repository;

import com.example.travelgo.entity.ChatRoom;
import com.example.travelgo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByCustomerAndIsActive(User customer, Boolean isActive);

    List<ChatRoom> findByCustomer(User customer);

    List<ChatRoom> findAllByOrderByLastMessageTimeDesc();

    List<ChatRoom> findByIsActiveTrueOrderByLastMessageTimeDesc();

    List<ChatRoom> findByAdmin(User admin);

    @Query("SELECT cr FROM ChatRoom cr WHERE cr.isActive = true AND cr.admin IS NULL ORDER BY cr.lastMessageTime DESC")
    List<ChatRoom> findUnassignedActiveRooms();

    @Query("SELECT cr FROM ChatRoom cr WHERE cr.customer = :customer AND cr.isActive = true")
    Optional<ChatRoom> findActiveRoomByCustomer(@Param("customer") User customer);

    // Lấy chat rooms với user information
    @Query("SELECT cr FROM ChatRoom cr JOIN FETCH cr.customer WHERE cr.isActive = true ORDER BY cr.lastMessageTime DESC")
    List<ChatRoom> findActiveRoomsWithCustomer();

    @Query("SELECT cr FROM ChatRoom cr JOIN FETCH cr.customer LEFT JOIN FETCH cr.admin WHERE cr.id = :roomId")
    Optional<ChatRoom> findByIdWithUsers(@Param("roomId") Long roomId);
}
