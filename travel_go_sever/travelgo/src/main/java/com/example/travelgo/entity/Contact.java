package com.example.travelgo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String tourInterest;
    private String preferredContact;

    @Enumerated(EnumType.STRING)
    private ContactStatus status = ContactStatus.NEW;

    private LocalDateTime respondedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum ContactStatus {
        NEW, RESPONDED
    }
}