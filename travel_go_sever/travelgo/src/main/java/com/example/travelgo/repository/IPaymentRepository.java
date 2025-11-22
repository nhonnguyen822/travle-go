package com.example.travelgo.repository;

import com.example.travelgo.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface IPaymentRepository extends JpaRepository<Payment, Long> {
    @Query(value = "SELECT * FROM payments p WHERE p.transaction_code = :txnCode", nativeQuery = true)
    Optional<Payment> findByTransactionCode(@Param("txnCode") String txnCode);

    @Query(value = "SELECT * FROM payments WHERE booking_id = :bookingId LIMIT 1", nativeQuery = true)
    Optional<Payment> findByBookingId(Long bookingId);
}