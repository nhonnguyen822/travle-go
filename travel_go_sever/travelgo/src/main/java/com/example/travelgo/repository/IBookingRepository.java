package com.example.travelgo.repository;

import com.example.travelgo.dto.BookingProjection;
import com.example.travelgo.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface IBookingRepository extends JpaRepository<Booking, Long> {
    @Query(value = """
        SELECT 
            b.id,
            b.booking_code as bookingCode,
            b.booking_date as bookingDate,
            b.number_of_people as numberOfPeople,
            b.adult_count as adultCount,
            b.child_count as childCount,
            b.baby_count as babyCount,
            b.paid_amount as paidAmount,
            b.status,
            u.name as userName,
            u.email as userEmail,
            u.phone as userPhone,
            u.avatar as userAvatar,
            t.title as tourTitle,
            t.duration as tourDuration,
            t.image as tourImage,
            t.base_price as tourBasePrice,
            t.destination as tourDestination,
            ts.start_date as startDate,
            ts.end_date as endDate,
            ts.price as schedulePrice,
            ts.child_price as childPrice,
            ts.baby_price as babyPrice
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        LEFT JOIN tours t ON ts.tour_id = t.id
        WHERE 
            (:userName IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :userName, '%')))
          AND (:bookingCode IS NULL OR LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :bookingCode, '%')))
          AND (:tourTitle IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :tourTitle, '%')))
          AND (:status IS NULL OR b.status = :status)
          -- 🚫 LOẠI BỎ BOOKING ĐÃ HỦY
          AND b.status <> 'CANCELLED'
        ORDER BY b.booking_date DESC
        """,
            countQuery = """
                SELECT COUNT(*) 
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
                LEFT JOIN tours t ON ts.tour_id = t.id
                WHERE 
                    (:userName IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :userName, '%')))
                  AND (:bookingCode IS NULL OR LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :bookingCode, '%')))
                  AND (:tourTitle IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :tourTitle, '%')))
                  AND (:status IS NULL OR b.status = :status)
                  -- 🚫 LOẠI BỎ BOOKING ĐÃ HỦY
                  AND b.status <> 'CANCELLED'
                """,
            nativeQuery = true)
    Page<BookingProjection> findAllWithFiltersProjection(
            @Param("userName") String userName,
            @Param("bookingCode") String bookingCode,
            @Param("tourTitle") String tourTitle,
            @Param("status") String status,
            Pageable pageable
    );

    @Query(value = """
        SELECT 
            b.id,
            b.booking_code as bookingCode,
            b.booking_date as bookingDate,
            b.number_of_people as numberOfPeople,
            b.adult_count as adultCount,
            b.child_count as childCount,
            b.baby_count as babyCount,
            b.total_price as totalPrice,
            b.status,
            u.name as userName,
            u.email as userEmail,
            u.phone as userPhone,
            u.avatar as userAvatar,
            t.title as tourTitle,
            t.duration as tourDuration,
            t.image as tourImage,
            t.base_price as tourBasePrice,
            t.destination as tourDestination,
            ts.start_date as startDate,
            ts.end_date as endDate,
            ts.price as schedulePrice,
            ts.child_price as childPrice,
            ts.baby_price as babyPrice
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        LEFT JOIN tours t ON ts.tour_id = t.id
        WHERE 
            -- 🔍 TÌM KIẾM TOÀN CỤC
            (:search IS NULL OR 
             LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
             LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR 
             LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR 
             LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :search, '%')) OR 
             LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
             LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(b.status) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR b.status = :status)
          -- 🚫 LOẠI BỎ TRẠNG THÁI CANCELLED
          AND b.status <> 'CANCELLED'
        ORDER BY b.booking_date DESC
        """,
            countQuery = """
                SELECT COUNT(*) 
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
                LEFT JOIN tours t ON ts.tour_id = t.id
                WHERE 
                    (:search IS NULL OR 
                     LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                     LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                     LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                     LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                     LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                     LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR
                     LOWER(b.status) LIKE LOWER(CONCAT('%', :search, '%')))
                  AND (:status IS NULL OR b.status = :status)
                  -- 🚫 LOẠI BỎ TRẠNG THÁI CANCELLED
                  AND b.status <> 'CANCELLED'
                """,
            nativeQuery = true)
    Page<BookingProjection> findByGlobalSearch(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable
    );

    @Query(value = """
        SELECT 
            b.id,
            b.booking_code as bookingCode,
            b.booking_date as bookingDate,
            b.number_of_people as numberOfPeople,
            b.adult_count as adultCount,
            b.child_count as childCount,
            b.baby_count as babyCount,
            b.paid_amount as paidAmount,
            b.status,
            u.name as userName,
            u.email as userEmail,
            u.phone as userPhone,
            u.avatar as userAvatar,
            t.title as tourTitle,
            t.duration as tourDuration,
            t.image as tourImage,
            t.base_price as tourBasePrice,
            t.destination as tourDestination,
            ts.start_date as startDate,
            ts.end_date as endDate,
            ts.price as schedulePrice,
            ts.child_price as childPrice,
            ts.baby_price as babyPrice
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        LEFT JOIN tours t ON ts.tour_id = t.id
        WHERE 
            b.status = 'CANCELLED'
            AND (:userName IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :userName, '%')))
            AND (:bookingCode IS NULL OR LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :bookingCode, '%')))
            AND (:tourTitle IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :tourTitle, '%')))
        ORDER BY b.booking_date DESC
        """,
            countQuery = """
        SELECT COUNT(*) 
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        LEFT JOIN tours t ON ts.tour_id = t.id
        WHERE 
            b.status = 'CANCELLED'
            AND (:userName IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :userName, '%')))
            AND (:bookingCode IS NULL OR LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :bookingCode, '%')))
            AND (:tourTitle IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :tourTitle, '%')))
        """,
            nativeQuery = true)
    Page<BookingProjection> findAllCancelledBookings(
            @Param("userName") String userName,
            @Param("bookingCode") String bookingCode,
            @Param("tourTitle") String tourTitle,
            Pageable pageable
    );

    @Query(value = """
        SELECT COALESCE(SUM(
            CASE 
                WHEN ts.status = 'COMPLETED' THEN 
                    (b.adult_count * ts.price) + 
                    (b.child_count * ts.child_price) + 
                    (b.baby_count * ts.baby_price)
                ELSE b.paid_amount
            END
        ), 0) as total_spent
        FROM bookings b
        JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        WHERE b.user_id = :userId 
        AND b.status IN ('PAID', 'DEPOSIT_PAID')
        AND ts.status IN ('COMPLETED', 'ONGOING', 'UPCOMING')
        """, nativeQuery = true)
    BigDecimal getTotalSpentByUser(@Param("userId") Long userId);


    @Query(value = """
        SELECT 
            b.id,
            b.booking_code as bookingCode,
            b.booking_date as bookingDate,
            b.number_of_people as numberOfPeople,
            b.adult_count as adultCount,
            b.child_count as childCount,
            b.baby_count as babyCount,
            b.paid_amount as paidAmount,
            b.status,
            u.name as userName,
            u.email as userEmail,
            u.phone as userPhone,
            u.avatar as userAvatar,
            t.title as tourTitle,
            t.duration as tourDuration,
            t.image as tourImage,
            t.base_price as tourBasePrice,
            t.destination as tourDestination,
            ts.start_date as startDate,
            ts.end_date as endDate,
            ts.price as schedulePrice,
            ts.child_price as childPrice,
            ts.baby_price as babyPrice
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        LEFT JOIN tours t ON ts.tour_id = t.id
        WHERE 
            b.status = 'CANCELLED'
            AND (:search IS NULL OR 
                 LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY b.booking_date DESC
        """,
            countQuery = """
        SELECT COUNT(*) 
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN tour_schedules ts ON b.tour_schedule_id = ts.id
        LEFT JOIN tours t ON ts.tour_id = t.id
        WHERE 
            b.status = 'CANCELLED'
            AND (:search IS NULL OR 
                 LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(b.booking_code) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
                 LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')))
        """,
            nativeQuery = true)
    Page<BookingProjection> findCancelledBookingsByGlobalSearch(
            @Param("search") String search,
            Pageable pageable
    );
}


