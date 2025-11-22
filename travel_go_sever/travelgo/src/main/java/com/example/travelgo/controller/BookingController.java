package com.example.travelgo.controller;

import com.example.travelgo.dto.*;
import com.example.travelgo.entity.Booking;
import com.example.travelgo.service.IBookingService;
import com.example.travelgo.service.ITourService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final IBookingService bookingService;
    private final ITourService tourService;

    @GetMapping("")
    public ResponseEntity<?> getAllBookings() {
        List<Booking> bookings = bookingService.findAll();
        if (bookings.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @PostMapping
    public Booking createBooking(@RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }

    @PostMapping("/admin")
    public ResponseEntity<?> createBookingByAdmin(
            @Valid @RequestBody AdminBookingRequest bookingRequest) {
        try {
            AdminBookingResponse booking = bookingService.createBookingByAdmin(bookingRequest);
            System.out.println(booking);
            return ResponseEntity.ok(booking);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("❌ Lỗi tạo booking: " + e.getMessage());
        }
    }

    @GetMapping("{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        Optional<Booking> booking = bookingService.findById(id);
        if (booking.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(booking, HttpStatus.OK);
    }

    @GetMapping("/verify/{bookingId}")
    public ResponseEntity<String> verifyBooking(@PathVariable Long bookingId) {
        Optional<Booking> booking = bookingService.findById(bookingId);
        if (booking.isPresent()) {
            return ResponseEntity.ok("✅ Vé hợp lệ - " + booking.get().getUser().getName());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("❌ Vé không hợp lệ");
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<BookingResponse>> getBookingsWithFilters(
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String bookingCode,
            @RequestParam(required = false) String tourTitle,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookingDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));
        Page<BookingResponse> bookings = bookingService.findAllWithFilters(
                userName, bookingCode, tourTitle, status, pageable);
        return ResponseEntity.ok(bookings);
    }


    @GetMapping("/search")
    public ResponseEntity<Page<BookingResponse>> searchBookings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookingDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

        Page<BookingResponse> bookings = bookingService.globalSearch(
                search, status, pageable);

        return ResponseEntity.ok(bookings);
    }

    @PatchMapping("/{bookingId}/details")
    public ResponseEntity<?> updateBookingDetails(
            @PathVariable Long bookingId,
            @Valid @RequestBody AdminBookingRequest updateRequest) {
        try {
            AdminBookingResponse bookingResponse = bookingService.updateBookingDetails(bookingId, updateRequest);
            return ResponseEntity.ok(bookingResponse);

        } catch (RuntimeException e) {
            System.err.println("❌ Error updating booking: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body("❌ Lỗi cập nhật booking: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Lỗi hệ thống: " + e.getMessage());
        }
    }

    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingDeleteRequest statusUpdateRequest) {
        try {
            BookingResponse bookingResponse = bookingService.updateBookingStatus(
                    bookingId,
                    statusUpdateRequest.getStatus(),
                    statusUpdateRequest.getReason()
            );
            return ResponseEntity.ok(bookingResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Lỗi hệ thống: " + e.getMessage());
        }
    }


    @GetMapping("/statuses")
    public List<StatusOption> getAllStatuses() {
        return bookingService.getAllStatuses();
    }


    @GetMapping("/cancelled")
    public ResponseEntity<Page<BookingResponse>> getCancelledBookings(
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String bookingCode,
            @RequestParam(required = false) String tourTitle,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("bookingDate").descending());
        Page<BookingResponse> cancelledBookings = bookingService.getCancelledBookings(userName, bookingCode, tourTitle, pageable);

        return ResponseEntity.ok(cancelledBookings);
    }

    @GetMapping("/cancelled/search")
    public ResponseEntity<Page<BookingResponse>> searchCancelledBookings(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("bookingDate").descending());
        Page<BookingResponse> cancelledBookings = bookingService.searchCancelledBookings(search, pageable);
        return ResponseEntity.ok(cancelledBookings);
    }

    @PatchMapping("/{bookingId}/payment")
    public ResponseEntity<?> updateBookingPayment(
            @PathVariable Long bookingId,
            @Valid @RequestBody AdminPaymentRequest paymentRequest) {
        try {
            BookingResponse updatedBooking = bookingService.updateBookingPayment(bookingId, paymentRequest);
            return ResponseEntity.ok(updatedBooking);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body("❌ Lỗi cập nhật thanh toán: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Lỗi hệ thống: " + e.getMessage());
        }
    }
}
