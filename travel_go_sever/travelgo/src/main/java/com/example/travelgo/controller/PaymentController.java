package com.example.travelgo.controller;

import com.example.travelgo.dto.PaymentRequest;
import com.example.travelgo.entity.Booking;
import com.example.travelgo.service.IBookingService;
import com.example.travelgo.service.IMailService;
import com.example.travelgo.service.impl.PaymentService;
import com.example.travelgo.util.VNPayUtil;
import com.example.travelgo.vnpay.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;



@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;
    private final IBookingService bookingService;
    private final SimpMessagingTemplate messagingTemplate;

    private final IMailService mailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;


    @PostMapping("/create")
    public Map<String, String> createPayment(@RequestBody PaymentRequest payload,
                                             HttpServletRequest request) {
        Long bookingId = payload.getBookingId();
        long amount = payload.getTotalAmount();
        String orderInfo = payload.getOrderInfo() == null
                ? "Booking|" + bookingId
                : payload.getOrderInfo();

        String paymentUrl = vnPayService.createPaymentUrl(request, bookingId, amount, orderInfo);

        return Map.of("paymentUrl", paymentUrl);
    }

    /**
     * VNPay callback trả về kết quả thanh toán
     */
    @GetMapping("/vn-pay-callback")
    public void paymentCallback(@RequestParam Map<String, String> allParams,
                                HttpServletResponse response) throws IOException {

        // --- Kiểm tra tham số bắt buộc ---
        if (allParams.get("vnp_Amount") == null || allParams.get("vnp_TxnRef") == null || allParams.get("vnp_OrderInfo") == null) {
            response.sendRedirect(frontendUrl + "/payment-result?success=false&message=Missing+parameters");
            return;
        }

        // --- Xác minh chữ ký hash ---
        String vnp_SecureHash = allParams.remove("vnp_SecureHash");
        String data = VNPayUtil.buildQueryString(new TreeMap<>(allParams));
        String expectedHash = VNPayUtil.hmacSHA512(vnPayService.getConfig().getVnpHashSecret(), data);

        assert expectedHash != null;
        boolean validSignature = expectedHash.equals(vnp_SecureHash);
        String responseCode = allParams.get("vnp_ResponseCode");
        boolean success = validSignature && "00".equals(responseCode);
        String errorMessage = VNPAY_ERROR_CODES.getOrDefault(responseCode, "Lỗi không xác định");
        String message;

        if (success) {
            message = "Thanh toán thành công!";
        } else if (validSignature) {
            message = "Giao dịch không thành công. " + errorMessage;
        } else {
            message = "Xác minh chữ ký thất bại!";
        }

        long amount = Long.parseLong(allParams.get("vnp_Amount")) / 100;
        String[] parts = allParams.get("vnp_OrderInfo").split("\\|");
        String txnRef = allParams.get("vnp_TxnRef");

        String service = parts[0];
        Long bookingId = Long.valueOf(parts[1]);

        String status = success ? "success" : "failed";
        paymentService.handlePaymentResult(txnRef, amount, service, bookingId, status);

        Optional<Booking> bookingOpt = bookingService.findById(bookingId);


        // --- Redirect về frontend ---
        String redirectUrl;
        if (success && bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            redirectUrl = String.format(
                    "%s/payment-result?success=true&message=%s&bookingId=%d&txnRef=%s&tourId=%d",
                    frontendUrl,
                    URLEncoder.encode("Thanh toán thành công cho booking #" + booking.getId(), StandardCharsets.UTF_8),
                    booking.getId(),
                    txnRef,
                    booking.getTourSchedule().getTour().getId()         // thêm tourId
            );
        } else {
            redirectUrl = String.format(
                    "%s/payment-result?success=false&message=%s&service=%s",
                    frontendUrl,
                    URLEncoder.encode(message, StandardCharsets.UTF_8),
                    URLEncoder.encode(service, StandardCharsets.UTF_8)
            );
        }

        response.sendRedirect(redirectUrl);
    }

    private static final Map<String, String> VNPAY_ERROR_CODES = Map.ofEntries(
            Map.entry("00", "Giao dịch thành công"),
            Map.entry("07", "Trừ tiền thành công. Giao dịch bị nghi ngờ"),
            Map.entry("09", "Thẻ/Tài khoản chưa đăng ký InternetBanking"),
            Map.entry("10", "Khách hàng xác thực thất bại"),
            Map.entry("11", "Hết hạn chờ thanh toán"),
            Map.entry("12", "Thẻ/Tài khoản bị khóa"),
            Map.entry("13", "Nhập sai OTP quá số lần"),
            Map.entry("24", "Khách hàng hủy giao dịch"),
            Map.entry("51", "Tài khoản không đủ số dư"),
            Map.entry("65", "Vượt quá hạn mức giao dịch"),
            Map.entry("75", "Ngân hàng đang bảo trì"),
            Map.entry("79", "Nhập sai OTP"),
            Map.entry("99", "Lỗi không xác định")
    );

}
