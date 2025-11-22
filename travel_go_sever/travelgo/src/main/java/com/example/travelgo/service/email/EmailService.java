package com.example.travelgo.service.email;

import com.example.travelgo.entity.Booking;
import com.example.travelgo.entity.Tour;
import com.example.travelgo.entity.TourSchedule;
import com.example.travelgo.repository.IBookingRepository;
import com.example.travelgo.service.IMailService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService implements IMailService {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:TravelGo}")
    private String appName;

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final IBookingRepository bookingRepository;

    // Phương thức helper để set từ với tên hệ thống
    private void setSystemFromAddress(MimeMessageHelper helper) throws MessagingException {
        try {
            helper.setFrom(fromEmail, appName);
        } catch (UnsupportedEncodingException e) {
            helper.setFrom(fromEmail);
        }
    }

    @Override
    public void sendUserVerificationEmail(String to, String name, String token) throws MessagingException {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("verificationUrl", frontendUrl + "/verification?token=" + token);

            String htmlContent = templateEngine.process("verification-email", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            setSystemFromAddress(helper);
            helper.setTo(to);
            helper.setSubject("Yêu cầu xác nhận đăng ký tài khoản");
            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new MessagingException("Lỗi encoding khi gửi email", e);
        }
    }

    @Override
    public void sendBookingConfirmation(Booking booking, String txnRef) throws Exception {
        Tour tour = booking.getTourSchedule().getTour();

        // 1️⃣ Tạo QR
        String qrDataUrl = generateQrDataUrl(frontendUrl + "/booking/" + booking.getId());

        // 2️⃣ Build HTML ticket
        Context ctx = new Context();
        ctx.setVariable("booking", booking);
        ctx.setVariable("tour", tour);
        ctx.setVariable("schedule", booking.getTourSchedule());
        ctx.setVariable("txnRef", txnRef);
        ctx.setVariable("qrDataUrl", qrDataUrl);
        ctx.setVariable("itineraryDays", buildItineraryDays(booking));

        String htmlContent = templateEngine.process("ticket", ctx);

        // 3️⃣ Convert HTML → PDF
        byte[] pdfBytes = convertHtmlToPdf(htmlContent);

        // 4️⃣ Gửi email
        sendBookingPdfEmailAsync(booking.getUser().getEmail(), pdfBytes, "Ve_Tour_" + booking.getId() + ".pdf");
    }

    @Async
    @Override
    public void sendBookingWithTwoPdfsAsync(
            String email,
            byte[] ticketBytes, String ticketFilename,
            byte[] detailBytes, String detailFilename,
            Long bookingId,
            String subject,
            String messageBody
    ) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(email);
            setSystemFromAddress(helper);

            // Lấy thông tin booking từ database
            Booking booking = null;
            Tour tour = null;
            TourSchedule schedule = null;
            String customerName = "Quý khách";
            String tourName = "tour";

            if (bookingId != null) {
                booking = bookingRepository.findById(bookingId).orElse(null);
                if (booking != null) {
                    tour = booking.getTourSchedule().getTour();
                    schedule = booking.getTourSchedule();
                    customerName = booking.getUser().getName();
                    tourName = tour.getTitle();
                }
            }

            // Chuẩn bị subject và message - ưu tiên dữ liệu từ client
            String finalSubject = subject != null ? subject : "Xác nhận đặt tour - " + tourName;

            // Sử dụng messageBody từ client, nếu không có thì dùng mặc định
            String finalMessage = messageBody != null ? messageBody :
                    "Chào " + customerName + ",\\n\\nCảm ơn bạn đã đặt tour tại " + appName + ". Vui lòng xem chi tiết trong file đính kèm.";

            helper.setSubject(finalSubject);

            // Chuẩn bị dữ liệu cho template
            Context context = new Context();
            context.setVariable("appName", appName);
            context.setVariable("frontendUrl", frontendUrl);

            // Xử lý messageBody từ client - thay thế \n thành <br> cho HTML
            String formattedMessage = finalMessage.replace("\\n", "<br>");
            context.setVariable("messageBody", formattedMessage);

            // Thêm thông tin booking nếu có
            if (booking != null) {
                context.setVariable("booking", booking);
                context.setVariable("tour", tour);
                context.setVariable("schedule", schedule);
                context.setVariable("customerName", customerName);
                context.setVariable("tourName", tourName);

                // Format thông tin giá
                if (booking.getPaidAmount() != null) {
                    context.setVariable("totalPrice", formatCurrency(booking.getPaidAmount()));
                }
                if (schedule != null) {
                    if (schedule.getPrice() != null) {
                        context.setVariable("adultPrice", formatCurrency(schedule.getPrice()));
                    }
                    if (schedule.getChildPrice() != null) {
                        context.setVariable("childPrice", formatCurrency(schedule.getChildPrice()));
                    }
                    if (schedule.getBabyPrice() != null) {
                        context.setVariable("babyPrice", formatCurrency(schedule.getBabyPrice()));
                    }
                }
            }

            // Sử dụng template chuyên nghiệp
            String htmlContent = templateEngine.process("booking_confirmation", context);
            helper.setText(htmlContent, true);

            // Đính kèm files với tên chuyên nghiệp
            String ticketFile = ticketFilename != null ? ticketFilename : "Ve_Tour.pdf";
            String detailFile = detailFilename != null ? detailFilename : "Chi_tiet_Booking.pdf";

            helper.addAttachment(ticketFile, new ByteArrayResource(ticketBytes));
            helper.addAttachment(detailFile, new ByteArrayResource(detailBytes));

            mailSender.send(mimeMessage);

            System.out.println("✅ Email xác nhận đã gửi thành công tới " + email);

        } catch (Exception e) {
            System.err.println("❌ Gửi email thất bại: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendBookingPdfEmailAsync(String to, byte[] pdfBytes, String pdfName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setTo(to);
            setSystemFromAddress(helper);
            helper.setSubject("Vé Tour của bạn");
            helper.setText("Xin chào, vé tour của bạn được đính kèm bên dưới.", true);
            helper.addAttachment(pdfName, new ByteArrayResource(pdfBytes));

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Các phương thức hỗ trợ
    private byte[] convertHtmlToPdf(String html) throws Exception {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.useFont(() -> getClass().getResourceAsStream("/fonts/DejaVuSans.ttf"), "DejaVu Sans");
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        }
    }

    private String generateQrDataUrl(String text) {
        try {
            int size = 200;
            BitMatrix matrix = new MultiFormatWriter().encode(text, BarcodeFormat.QR_CODE, size, size);
            ByteArrayOutputStream pngOutput = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", pngOutput);
            String base64 = Base64.getEncoder().encodeToString(pngOutput.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    private List<Map<String, Object>> buildItineraryDays(Booking booking) {
        try {
            var tour = booking.getTourSchedule().getTour();
            var days = tour.getItineraryDays();

            if (days != null && !days.isEmpty()) {
                return days.stream().map(day -> Map.<String, Object>of(
                        "dayIndex", day.getDayIndex(),
                        "title", day.getTitle(),
                        "description", day.getDescription(),
                        "activities", day.getActivities().stream().map(act -> Map.of(
                                "title", act.getTitle(),
                                "details", act.getDetails(),
                                "time", act.getTime(),
                                "imageUrl", act.getImageUrl()
                        )).toList()
                )).toList();
            }
        } catch (Exception ignored) {
        }

        // fallback demo
        return List.of(
                Map.of("dayIndex", 1, "title", "Khởi hành & Tham quan", "description", "Đón khách và bắt đầu hành trình"),
                Map.of("dayIndex", 2, "title", "Khám phá điểm đến", "description", "Tham quan và trải nghiệm văn hóa địa phương")
        );
    }

    private String formatCurrency(Number amount) {
        if (amount == null) return "0 ₫";
        try {
            // Format số tiền theo định dạng Việt Nam
            NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
            return formatter.format(amount.longValue()) + " ₫";
        } catch (Exception e) {
            return String.format("%,d ₫", amount.longValue());
        }
    }
}