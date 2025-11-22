package com.example.travelgo.service.impl;

import com.example.travelgo.entity.Booking;
import com.example.travelgo.entity.Payment;
import com.example.travelgo.entity.TourSchedule;
import com.example.travelgo.entity.User;
import com.example.travelgo.enums.BookingStatus;
import com.example.travelgo.enums.CustomerType;
import com.example.travelgo.enums.NotificationType;
import com.example.travelgo.enums.PaymentStatus;
import com.example.travelgo.repository.IBookingRepository;
import com.example.travelgo.repository.IPaymentRepository;
import com.example.travelgo.repository.ITourScheduleRepository;
import com.example.travelgo.repository.IUserRepository;
import com.example.travelgo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final IBookingRepository bookingRepository;
    private final IPaymentRepository paymentRepository;
    private final ITourScheduleRepository scheduleRepository;
    private final IUserRepository userRepository;
    private final NotificationService notificationService;

    public void handlePaymentResult(String txnRef, long amount, String service, Long bookingId, String status) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking #" + bookingId));

            Payment payment = paymentRepository.findByTransactionCode(txnRef)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch #" + txnRef));

            TourSchedule tourSchedule = booking.getTourSchedule();
            BigDecimal totalAmount = booking.getPaidAmount(); // ✅ Sửa: totalPrice thay vì paidAmount
            BigDecimal paidAmount = BigDecimal.valueOf(amount);

            boolean success = "success".equalsIgnoreCase(status) || "00".equals(status);

            if (success) {
                BookingStatus bookingStatus;

                // ✅ THÔNG BÁO THANH TOÁN THÀNH CÔNG CHO ADMIN
                notificationService.createPaymentNotification(
                        booking.getUser().getId(),
                        booking.getUser().getEmail(),
                        booking.getTourSchedule().getTour().getTitle(),
                        paidAmount.doubleValue(),
                        booking.getId(),
                        true
                );

                if (paidAmount.compareTo(totalAmount) >= 0) {
                    bookingStatus = BookingStatus.PAID;
                    log.info("[VNPay] ✅ HOÀN THÀNH | Booking #{} | Đã thanh toán toàn bộ: {:,} VND | Tổng giá trị: {:,} VND",
                            bookingId, paidAmount.doubleValue(), totalAmount.doubleValue());

                    // ✅ THÔNG BÁO BOOKING CONFIRMED CHO USER
                    notificationService.createBookingNotification(
                            booking.getUser().getId(),
                            booking.getUser().getEmail(),
                            booking.getTourSchedule().getTour().getTitle(),
                            booking.getId(),
                            NotificationType.BOOKING_CONFIRMED
                    );

                    // Update customer type
                    BigDecimal totalAmountSpent = bookingRepository.getTotalSpentByUser(booking.getUser().getId());
                    long totalSpentValue = totalAmountSpent != null ? totalAmountSpent.longValue() : 0L;
                    CustomerType newCustomerType = determineCustomerType(totalSpentValue);

                    Optional<User> user = userRepository.findById(booking.getUser().getId());
                    if (user.isPresent()) {
                        user.get().setCustomerType(newCustomerType);
                        userRepository.save(user.get());
                        log.info("Updated customer type to: {} for user: {}", newCustomerType, user.get().getEmail());
                    }

                } else {
                    bookingStatus = BookingStatus.DEPOSIT_PAID;
                    double percentage = paidAmount.divide(totalAmount, 4, BigDecimal.ROUND_HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue();
                    log.info("[VNPay] ✅ ĐẶT CỌC | Booking #{} | Đã thanh toán: {:,} VND ({:.1f}%) | Tổng giá trị: {:,} VND",
                            bookingId, paidAmount.doubleValue(), percentage, totalAmount.doubleValue());

                    // ✅ THÔNG BÁO BOOKING CREATED CHO USER (đặt cọc)
                    notificationService.createBookingNotification(
                            booking.getUser().getId(),
                            booking.getUser().getEmail(),
                            booking.getTourSchedule().getTour().getTitle(),
                            booking.getId(),
                            NotificationType.BOOKING_CREATED
                    );
                }

                scheduleRepository.save(tourSchedule);
                booking.setStatus(bookingStatus);
                booking.setPaidAmount(paidAmount);

            } else {
                booking.setStatus(BookingStatus.PENDING);
                log.info("[VNPay] ❌ THẤT BẠI | Booking #{} | Số tiền: {:,} VND | Tổng giá trị: {:,} VND",
                        bookingId, amount, totalAmount.doubleValue());

                // ✅ THÔNG BÁO THANH TOÁN THẤT BẠI CHO ADMIN
                notificationService.createPaymentNotification(
                        booking.getUser().getId(),
                        booking.getUser().getEmail(),
                        booking.getTourSchedule().getTour().getTitle(),
                        paidAmount.doubleValue(),
                        booking.getId(),
                        false
                );
            }

            payment.setStatus(success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
            payment.setAmount(paidAmount);
            paymentRepository.save(payment);
            bookingRepository.save(booking);

        } catch (Exception e) {
            log.error("❌ Error handling payment result for booking #{}, txnRef: {}", bookingId, txnRef, e);
            throw new RuntimeException("Failed to handle payment result", e);
        }
    }
    private int getSpendingLevel(long totalAmountSpent) {
        if (totalAmountSpent >= CustomerType.DIAMOND.getMinTotalSpent()) return 7;
        if (totalAmountSpent >= CustomerType.PLATINUM.getMinTotalSpent()) return 6;
        if (totalAmountSpent >= CustomerType.VIP.getMinTotalSpent()) return 5;
        if (totalAmountSpent >= CustomerType.GOLD.getMinTotalSpent()) return 4;
        if (totalAmountSpent >= CustomerType.SILVER.getMinTotalSpent()) return 3;
        if (totalAmountSpent >= CustomerType.REGULAR.getMinTotalSpent()) return 2;
        return 1;
    }

    private CustomerType determineCustomerType(long totalAmountSpent) {
        return switch (getSpendingLevel(totalAmountSpent)) {
            case 7 -> CustomerType.DIAMOND;
            case 6 -> CustomerType.PLATINUM;
            case 5 -> CustomerType.VIP;
            case 4 -> CustomerType.GOLD;
            case 3 -> CustomerType.SILVER;
            case 2 -> CustomerType.REGULAR;
            case 1 -> CustomerType.NEW;
            default -> CustomerType.NEW;
        };
    }
}