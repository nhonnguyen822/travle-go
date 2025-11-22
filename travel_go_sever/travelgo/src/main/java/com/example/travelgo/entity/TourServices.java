package com.example.travelgo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tour_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourServices {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tour_id", nullable = false)
    @JsonBackReference("tour-services")
    private Tour tour;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceItem serviceItem;
}
