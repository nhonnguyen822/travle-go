package com.example.travelgo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "itinerary_activities",
        indexes = {@Index(name = "idx_activity_day_time", columnList = "itinerary_day_id, time")})
public class ItineraryActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalTime time;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    private Integer position;

    @ManyToOne
    @JoinColumn(name = "itinerary_day_id")
    @JsonBackReference
    private ItineraryDay itineraryDay;
}