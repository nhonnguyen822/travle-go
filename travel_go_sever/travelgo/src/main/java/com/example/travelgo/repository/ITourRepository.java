package com.example.travelgo.repository;

import com.example.travelgo.entity.Tour;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ITourRepository extends JpaRepository<Tour, Long> {


    @Query(value = "SELECT * FROM tours WHERE id = :tourId AND deleted = false", nativeQuery = true)
    Optional<Tour> findTourById(@Param("tourId") Long tourId);

    @Query(value = "SELECT * FROM tours WHERE id = :tourId", nativeQuery = true)
    Optional<Tour> findTourByIdIncludingDeleted(@Param("tourId") Long tourId);

    @Query(value = "SELECT * FROM tours WHERE region_id = :regionId AND deleted = false", nativeQuery = true)
    List<Tour> findByRegionId(@Param("regionId") Long regionId);

    @Query(value = "SELECT * FROM tours WHERE deleted = false", nativeQuery = true)
    List<Tour> findAllActiveTours();


    @Query(
            value = """
                    SELECT * FROM tours t
                    WHERE 
                        (:title IS NULL OR :title = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%')))
                        AND (:destination IS NULL OR :destination = '' OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :destination, '%')))
                        AND (:status IS NULL OR :status = '' OR t.status = :status)
                        AND (:minPrice IS NULL OR t.base_price >= :minPrice)
                        AND (:maxPrice IS NULL OR t.base_price <= :maxPrice)
                        AND t.deleted = false
                    ORDER BY t.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(*) FROM tours t
                    WHERE 
                        (:title IS NULL OR :title = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%')))
                        AND (:destination IS NULL OR :destination = '' OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :destination, '%')))
                        AND (:status IS NULL OR :status = '' OR t.status = :status)
                        AND (:minPrice IS NULL OR t.base_price >= :minPrice)
                        AND (:maxPrice IS NULL OR t.base_price <= :maxPrice)
                        AND t.deleted = false
                    """,
            nativeQuery = true
    )
    Page<Tour> filterTours(
            @Param("title") String title,
            @Param("destination") String destination,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("status") String status,
            Pageable pageable
    );

    // Filter tours kể cả đã bị xóa (cho admin)
    @Query(
            value = """
                    SELECT * FROM tours t
                    WHERE 
                        (:title IS NULL OR :title = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%')))
                        AND (:destination IS NULL OR :destination = '' OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :destination, '%')))
                        AND (:status IS NULL OR :status = '' OR t.status = :status)
                        AND (:minPrice IS NULL OR t.base_price >= :minPrice)
                        AND (:maxPrice IS NULL OR t.base_price <= :maxPrice)
                        AND (:includeDeleted IS NULL OR :includeDeleted = false OR t.deleted = :includeDeleted)
                    ORDER BY t.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(*) FROM tours t
                    WHERE 
                        (:title IS NULL OR :title = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%')))
                        AND (:destination IS NULL OR :destination = '' OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :destination, '%')))
                        AND (:status IS NULL OR :status = '' OR t.status = :status)
                        AND (:minPrice IS NULL OR t.base_price >= :minPrice)
                        AND (:maxPrice IS NULL OR t.base_price <= :maxPrice)
                        AND (:includeDeleted IS NULL OR :includeDeleted = false OR t.deleted = :includeDeleted)
                    """,
            nativeQuery = true
    )
    Page<Tour> filterToursAdmin(
            @Param("title") String title,
            @Param("destination") String destination,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("status") String status,
            @Param("includeDeleted") Boolean includeDeleted,
            Pageable pageable
    );

    // Lấy tour phổ biến (chỉ tour chưa bị xóa)
    @Query(value = """
            SELECT t.*
            FROM tours t 
            JOIN tour_schedules ts ON t.id = ts.tour_id
            JOIN bookings b ON ts.id = b.tour_schedule_id
            WHERE b.status != 'CANCELLED' 
            AND t.deleted = false
            GROUP BY t.id
            ORDER BY COUNT(b.id) DESC
            LIMIT 3
            """, nativeQuery = true)
    List<Tour> getMostPopularTour();

    // Xóa mềm tour
    @Modifying
    @Transactional
    @Query("UPDATE Tour t SET t.deleted = true WHERE t.id = :id")
    int softDelete(@Param("id") Long id);


    // Khôi phục tour
    @Modifying
    @Transactional
    @Query("UPDATE Tour t SET t.deleted = false WHERE t.id = :id")
    int restore(@Param("id") Long id);


    default Optional<Tour> softDeleteAndReturn(Long id) {
        int updatedRows = softDelete(id);
        if (updatedRows > 0) {
            return findTourByIdIncludingDeleted(id);
        }
        return Optional.empty();
    }

//    default Optional<Tour> restoreAndReturn(Long id) {
//        int updatedRows = restore(id);
//        if (updatedRows > 0) {
//            return findById(id); // Query lại để lấy entity đã cập nhật
//        }
//        return Optional.empty();
//    }

    @Query(value = "SELECT COUNT(*) \n" +
            "FROM tours t \n" +
            "JOIN tour_schedules ts ON t.id = ts.tour_id \n" +
            "WHERE t.id = :tourId \n" +
            "  AND ts.status = 'ACTIVE'", nativeQuery = true)
    int countActiveTourSchedules(@Param("tourId") Long tourId);


    @Query(value = """
    SELECT t.* FROM tours t 
    WHERE t.deleted = 0 
    AND t.status = 'ACTIVE' 
    AND EXISTS (
        SELECT 1 FROM tour_schedules ts 
        WHERE ts.tour_id = t.id 
        AND ts.status IN ('UPCOMING', 'ONGOING')
        AND ts.start_date > CURDATE()
    )
    """, nativeQuery = true)
    List<Tour> findByStatusNotDeletedAndActiveWithFutureSchedules();

}