package com.example.travelgo.repository;

import com.example.travelgo.entity.User;
import com.example.travelgo.enums.CustomerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query(value = "SELECT COUNT(*) FROM bookings b WHERE b.user_id = :userId", nativeQuery = true)
    Long countBookingsByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM bookings b WHERE b.user_id = :userId AND b.status IN ('PAID', 'DEPOSIT_PAID')", nativeQuery = true)
    Long countBookingActivesByUserId(@Param("userId") Long userId);


    @Query(value = "SELECT u.* FROM users u\n" +
            "JOIN roles r ON u.role_id = r.id \n" +
            "WHERE r.name = 'USER' \n" +
            "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
            " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
            " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
            " OR u.customer_code LIKE CONCAT('%', :search, '%')) \n" +
            " AND  u.customer_type LIKE CONCAT('%', :customerType, '%')\n" +
            " AND  u.status =:status\n" +
            " ORDER BY u.created_at DESC",
            countQuery = "SELECT count(*) FROM users u\n" +
                    "JOIN roles r ON u.role_id = r.id \n" +
                    "WHERE r.name = 'USER' \n" +
                    "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
                    " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
                    " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
                    " OR u.customer_code LIKE CONCAT('%', :search, '%')) \n" +
                    " AND  u.customer_type LIKE CONCAT('%', :customerType, '%')\n" +
                    " AND  u.status =:status\n",
            nativeQuery = true)
    Page<User> findBySearchCriteria(
            @Param("search") String search,
            @Param("customerType") String customerType,
            @Param("status") Integer status,
            Pageable pageable);


    @Query(value = "SELECT u.* FROM users u\n" +
            "JOIN roles r ON u.role_id = r.id \n" +
            "WHERE r.name = 'USER' \n" +
            "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
            " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
            " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
            " OR u.customer_code LIKE CONCAT('%', :search, '%')) \n" +
            " AND  u.status =:status\n" +
            " ORDER BY u.created_at DESC",
            countQuery = "SELECT count(*) FROM users u\n" +
                    "JOIN roles r ON u.role_id = r.id \n" +
                    "WHERE r.name = 'USER' \n" +
                    "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
                    " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
                    " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
                    " OR u.customer_code LIKE CONCAT('%', :search, '%')) \n" +
                    " AND  u.status =:status\n",
            nativeQuery = true)
    Page<User> findBySearchCustomerTypeByNull(
            @Param("search") String search,
            @Param("status") Integer status,
            Pageable pageable);

    @Query(value = "SELECT u.* FROM users u\n" +
            "JOIN roles r ON u.role_id = r.id \n" +
            "WHERE r.name = 'USER' \n" +
            "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
            " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
            " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
            " OR u.customer_code LIKE CONCAT('%', :search, '%')) \n" +
            " AND  u.customer_type LIKE CONCAT('%', :customerType, '%')\n" +
            " ORDER BY u.created_at DESC",
            countQuery = "SELECT count(*) FROM users u\n" +
                    "JOIN roles r ON u.role_id = r.id \n" +
                    "WHERE r.name = 'USER' \n" +
                    "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
                    " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
                    " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
                    " OR u.customer_code LIKE CONCAT('%', :search, '%')) \n" +
                    " AND  u.customer_type LIKE CONCAT('%', :customerType, '%')\n",
            nativeQuery = true)
    Page<User> findBySearchStatusByNull(
            @Param("search") String search,
            @Param("customerType") String customerType,
            Pageable pageable);

    @Query(value = "SELECT u.* FROM users u\n" +
            "JOIN roles r ON u.role_id = r.id \n" +
            "WHERE r.name = 'USER' \n" +
            "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
            " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
            " OR u.phone LIKE CONCAT('%',:search, '%')\n" +
            " OR u.customer_code LIKE CONCAT('%',:search, '%')) \n" +
            " ORDER BY u.created_at DESC",
            countQuery = "SELECT count(*) FROM users u\n" +
                    "JOIN roles r ON u.role_id = r.id \n" +
                    "WHERE r.name = 'USER' \n" +
                    "AND (LOWER(u.name) LIKE LOWER(CONCAT('%',:search, '%'))\n" +
                    " OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search, '%')) \n" +
                    " OR u.phone LIKE CONCAT('%', :search, '%')\n" +
                    " OR u.customer_code LIKE CONCAT('%',:search, '%')) \n",
            nativeQuery = true)
    Page<User> findBySearchCustomerTypeByNullAndStatusByNull(
            @Param("search") String search,
            Pageable pageable);

    long countByStatus(Boolean status);

    long countByCustomerType(CustomerType customerType);

    @Query(value = "SELECT u.* FROM users u " +
            "INNER JOIN roles r ON u.role_id = r.id " +
            "WHERE u.email = :email AND r.name = :roleName",
            nativeQuery = true)
    Optional<User> findByEmailAndRoleName(@Param("email") String email,
                                          @Param("roleName") String roleName);


    List<User> findByRole_Name(String roleName);
}
