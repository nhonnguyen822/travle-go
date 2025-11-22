package com.example.travelgo.vnpay;

import com.example.travelgo.config.VNPayConfig;
import com.example.travelgo.entity.Booking;
import com.example.travelgo.entity.Payment;
import com.example.travelgo.enums.PaymentMethod;
import com.example.travelgo.enums.PaymentStatus;
import com.example.travelgo.repository.IBookingRepository;
import com.example.travelgo.repository.IPaymentRepository;
import com.example.travelgo.repository.IUserRepository;
import com.example.travelgo.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayService {
    private final VNPayConfig vnPayConfig;
    private final IUserRepository userRepository;
    private final IPaymentRepository paymentRepository;
    private final IBookingRepository bookingRepository;

    public String createPaymentUrl(HttpServletRequest request, long bookingId, long amount, String orderInfo) {
        String vnp_TxnRef = UUID.randomUUID().toString();
        String vnp_IpAddr = request.getRemoteAddr();
        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.getVnpVersion());
        vnp_Params.put("vnp_Command", vnPayConfig.getVnpCommand());
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", vnPayConfig.getVnpOrderType());
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnpReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        //tham số vnpay yêu cầu


        //  Sort lại VNPay bắt buộc sort theo thứ tự A–Z trước khi tạo chuỗi ký (hashData).
        SortedMap<String, String> sortedParams = new TreeMap<>(vnp_Params);

        //  Tạo chuỗi hashData KHÔNG encode
        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (!hashData.isEmpty()) {
                hashData.append('&');
            }
            hashData.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII))
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
        } // Xoá dấu & cuối cùng

        //  Tạo chữ ký HMAC
        String secureHash = VNPayUtil.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData.toString());

        // Build query URL (có encode)
        String queryUrl = VNPayUtil.buildQueryString(sortedParams);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking có ID: " + bookingId));

        Payment payment = Payment.builder()
                .transactionCode(vnp_TxnRef)
                .amount(java.math.BigDecimal.valueOf(amount))
                .paymentMethod(PaymentMethod.VN_PAY)
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .booking(booking)
                .build();

        paymentRepository.save(payment);

        //  Trả lại URL thanh toán
        return vnPayConfig.getVnpUrl() + "?" + queryUrl + "&vnp_SecureHash=" + secureHash;
    }

    public VNPayConfig getConfig() {
        return vnPayConfig;
    }

}
