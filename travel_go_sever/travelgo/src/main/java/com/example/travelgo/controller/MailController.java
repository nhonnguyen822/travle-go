package com.example.travelgo.controller;


import com.example.travelgo.entity.Booking;
import com.example.travelgo.service.IBookingService;
import com.example.travelgo.service.IMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/mail")
public class MailController {
    private final IMailService emailService;

    @Autowired
    public MailController(IMailService emailService, IBookingService bookingService) {
        this.emailService = emailService;
        this.bookingService = bookingService;
    }

    private final IBookingService bookingService;

    @PostMapping("/send-booking")
    public ResponseEntity<String> sendBookingEmail(
            @RequestParam("email") String email,
            @RequestParam("ticketPdf") MultipartFile ticketPdf,
            @RequestParam("detailPdf") MultipartFile detailPdf,
            @RequestParam("bookingId") Long bookingId,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "message", required = false) String message
    ) {
        try {
            byte[] ticketBytes = ticketPdf.getBytes();
            byte[] detailBytes = detailPdf.getBytes();

            Optional<Booking> booking = bookingService.findById(bookingId);
            if (booking.isEmpty()) {
                return ResponseEntity.status(404).body("Booking không tồn tại");
            }

            String finalSubject = subject != null ? subject :
                    "Xác nhận đặt tour - " + booking.get().getTourSchedule().getTour().getTitle();

            String finalMessage = message != null ? message :
                    "Chào " + booking.get().getUser().getName() + ",\n\nCảm ơn bạn đã đặt tour \"" +
                            booking.get().getTourSchedule().getTour().getTitle() + "\". Vui lòng xem chi tiết trong file đính kèm.";

            emailService.sendBookingWithTwoPdfsAsync(
                    email,
                    ticketBytes,
                    "Ve_Tour_" + booking.get().getId() + ".pdf", // Đặt tên file có bookingId
                    detailBytes,
                    "Chi_tiet_Booking_" + booking.get().getId() + ".pdf",
                    bookingId, // ✅ Truyền bookingId xuống service
                    finalSubject,
                    finalMessage
            );

            return ResponseEntity.ok("Mail đang được gửi, bạn sẽ nhận được trong vài phút.");
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Gửi mail thất bại: " + e.getMessage());
        }
    }
}
