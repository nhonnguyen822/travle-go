package com.example.travelgo.entity;

import com.example.travelgo.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings")
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, updatable = false)
    private String bookingCode;

    private LocalDateTime bookingDate;
    private int numberOfPeople;
    private int adultCount;
    private int childCount;
    private int babyCount;
    private BigDecimal paidAmount;

    private String notes;
    private String cancelReason;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "tour_schedule_id")
    private TourSchedule tourSchedule;

    @PrePersist
    public void generateBookingCode() {
        if (this.bookingCode == null) {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String random = String.valueOf((int) (Math.random() * 1000));
            this.bookingCode = "BK" + timestamp.substring(timestamp.length() - 8) + random;
        }
        if (this.bookingDate == null) {
            this.bookingDate = LocalDateTime.now();
        }
    }
}
