package com.example.travelgo.service.impl;

import com.example.travelgo.dto.*;
import com.example.travelgo.entity.*;
import com.example.travelgo.enums.*;
import com.example.travelgo.repository.*;
import com.example.travelgo.service.IBookingService;
import com.example.travelgo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.example.travelgo.util.ConvertImageUrl.convertImageUrlToBase64;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService implements IBookingService {
    private final IBookingRepository bookingRepository;
    private final ITourScheduleRepository tourScheduleRepository;
    private final IUserRepository userRepository;
    private final IRoleRepository roleRepository;
    private final IPaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Override
    public Booking createBooking(BookingRequest request) {
        TourSchedule tourSchedule = tourScheduleRepository.findById(request.getTourScheduleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy TourSchedule với ID: " + request.getTourScheduleId()));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với email: " + email));
        Booking booking = Booking.builder()
                .bookingDate(request.getBookingDate() != null ? request.getBookingDate() : LocalDateTime.now())
                .numberOfPeople(request.getNumberOfPeople())
                .adultCount(request.getAdultCount())
                .childCount(request.getChildCount())
                .babyCount(request.getBabyCount())
                .paidAmount(BigDecimal.ZERO)
                .status(request.getStatus() != null ? BookingStatus.valueOf(request.getStatus()) : BookingStatus.PENDING)
                .tourSchedule(tourSchedule)
                .user(user)
                .build();

//        notificationService.notifyNewBooking(booking);
        return bookingRepository.save(booking);
    }

    @Override
    public Optional<Booking> findById(Long id) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        optionalBooking.ifPresent(booking -> {
            Tour tour = booking.getTourSchedule().getTour();
            tour.setImage(convertImageUrlToBase64(tour.getImage()));

            // Chuyển tất cả ảnh activities
            if (tour.getItineraryDays() != null) {
                tour.getItineraryDays().forEach(day -> {
                    if (day.getActivities() != null) {
                        day.getActivities().forEach(act -> {
                            act.setImageUrl(convertImageUrlToBase64(act.getImageUrl()));
                        });
                    }
                });
            }
        });

        return optionalBooking;
    }

    @Override
    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    @Override
    public Page<BookingResponse> findAllWithFilters(String userName, String bookingCode, String tourTitle, String status, Pageable pageable) {
        Page<BookingProjection> projections = bookingRepository.findAllWithFiltersProjection(
                userName, bookingCode, tourTitle, status, pageable
        );

        return projections.map(this::mapProjectionToResponse);
    }

    @Override
    public Page<BookingResponse> globalSearch(String search, String status, Pageable pageable) {
        Page<BookingProjection> projections = bookingRepository.findByGlobalSearch(
                search, status, pageable
        );

        return projections.map(this::mapProjectionToResponse);
    }


    @Override
    public AdminBookingResponse createBookingByAdmin(AdminBookingRequest request) {
        try {
            Integer totalPeople = request.getTotalPeople();
            if (totalPeople == null || totalPeople <= 0) {
                throw new RuntimeException("❌ Tổng số người phải lớn hơn 0");
            }
            LocalDate startDate = LocalDate.now();
            try {
                startDate = LocalDate.parse(request.getStartDate());

                if (startDate.isBefore(LocalDate.now())) {
                    throw new RuntimeException("❌ Ngày khởi hành phải là ngày trong tương lai hoặc hôm nay");
                }
            } catch (Exception e) {
                throw new RuntimeException("❌ Định dạng ngày không hợp lệ: " + request.getStartDate());
            }

            User customer;
            Optional<User> existingUser = userRepository.findByEmail(request.getCustomerEmail());

            if (existingUser.isPresent()) {
                User user = existingUser.get();
                boolean needsUpdate = false;

                if (!request.getCustomerName().equals(user.getName())) {
                    user.setName(request.getCustomerName());
                    needsUpdate = true;
                }

                if (!request.getPhone().equals(user.getPhone())) {
                    user.setPhone(request.getPhone());
                    needsUpdate = true;
                }

                customer = needsUpdate ? userRepository.save(user) : user;
            } else {
                Role customerRole = roleRepository.findByName("USER")
                        .orElseGet(() -> roleRepository.save(new Role(null, "USER")));

                customer = User.builder()
                        .email(request.getCustomerEmail())
                        .name(request.getCustomerName())
                        .phone(request.getPhone())
                        .password(UUID.randomUUID().toString().substring(0, 12))
                        .role(customerRole)
                        .status(true)
                        .emailVerification(true)
                        .build();

                customer = userRepository.save(customer);
            }
            TourSchedule tourSchedule = tourScheduleRepository.findByTourIdAndStartDate(request.getTourId(), startDate)
                    .orElseThrow(() -> new RuntimeException("❌ Không tìm thấy lịch trình tour với ID: " + request.getTourId() + " và ngày khởi hành: " + request.getStartDate()));
            BigDecimal adultPrice = tourSchedule.getPrice().multiply(BigDecimal.valueOf(request.getAdults()));
            BigDecimal childPrice = tourSchedule.getChildPrice().multiply(BigDecimal.valueOf(request.getChildren()));
            BigDecimal babyPrice = tourSchedule.getBabyPrice().multiply(BigDecimal.valueOf(request.getBabies()));
            BigDecimal totalPrice = adultPrice.add(childPrice).add(babyPrice);

            Booking booking = Booking.builder()
                    .user(customer)
                    .tourSchedule(tourSchedule)
                    .adultCount(request.getAdults())
                    .childCount(request.getChildren())
                    .babyCount(request.getBabies())
                    .numberOfPeople(totalPeople)
                    .paidAmount(BigDecimal.valueOf(0))
                    .bookingDate(LocalDateTime.now())
                    .status(BookingStatus.PENDING)
                    .notes(request.getNotes())
                    .build();
//            notificationService.notifyNewBooking(booking);
            Booking savedBooking = bookingRepository.save(booking);

            tourScheduleRepository.save(tourSchedule);
            UserResponse customerInfo = UserResponse.builder()
                    .name(customer.getName())
                    .email(customer.getEmail())
                    .phone(customer.getPhone())
                    .avatar(customer.getAvatar())
                    .build();

            TourInfo tourInfo = TourInfo.builder()
                    .id(tourSchedule.getTour().getId())
                    .title(tourSchedule.getTour().getTitle())
                    .destination(tourSchedule.getTour().getDestination())
                    .durationDays(Integer.valueOf(tourSchedule.getTour().getDuration()))
                    .imageUrl(
                            tourSchedule.getTour().getImages().isEmpty()
                                    ? null
                                    : tourSchedule.getTour().getImages().get(0).getImageUrl()
                    )
                    .startDate(tourSchedule.getStartDate().atStartOfDay())
                    .endDate(tourSchedule.getEndDate().atStartOfDay())
                    .price(tourSchedule.getPrice().doubleValue())
                    .childPrice(tourSchedule.getChildPrice().doubleValue())
                    .babyPrice(tourSchedule.getBabyPrice().doubleValue())
                    .build();

            BookingDetails bookingDetails = BookingDetails.builder()
                    .adultCount(savedBooking.getAdultCount())
                    .childCount(savedBooking.getChildCount())
                    .babyCount(savedBooking.getBabyCount())
                    .totalPeople(savedBooking.getNumberOfPeople())
                    .notes(savedBooking.getNotes())
                    .cancelReason(savedBooking.getCancelReason())
                    .build();

            PaymentInfo paymentInfo = PaymentInfo.builder()
                    .basePrice(tourSchedule.getPrice().doubleValue())
                    .adultPrice(adultPrice.doubleValue())
                    .childPrice(childPrice.doubleValue())
                    .babyPrice(babyPrice.doubleValue())
                    .totalPrice(totalPrice.doubleValue())
                    .paymentMethod(String.valueOf(PaymentMethod.CASH))
                    .paymentStatus(String.valueOf(PaymentStatus.SUCCESS))
                    .paidAt(LocalDateTime.now())
                    .build();

            AdminBookingResponse adminBookingResponse = AdminBookingResponse.builder()
                    .id(savedBooking.getId())
                    .bookingCode(savedBooking.getBookingCode())
                    .customer(customerInfo)
                    .tour(tourInfo)
                    .details(bookingDetails)
                    .payment(paymentInfo)
                    .status(savedBooking.getStatus().name())
                    .bookingDate(savedBooking.getBookingDate())
                    .createdAt(booking.getBookingDate())
                    .build();
            System.out.println(adminBookingResponse);
            return adminBookingResponse;
        } catch (Exception e) {
            throw new RuntimeException("❌ Lỗi tạo booking: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, String status, String cancelReason) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));
            TourSchedule tourSchedule = booking.getTourSchedule();
            if (tourSchedule == null) {
                throw new RuntimeException("Không tìm thấy lịch trình tour cho booking này");
            }

            LocalDate today = LocalDate.now();

            if (tourSchedule.getStartDate().isBefore(today)) {
                throw new RuntimeException("Không thể thay đổi trạng thái booking cho tour đã khởi hành");
            }

            BookingStatus newStatus;
            try {
                newStatus = BookingStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Trạng thái không hợp lệ: " + status +
                        ". Trạng thái hợp lệ: " + Arrays.toString(BookingStatus.values()));
            }

            BookingStatus oldStatus = booking.getStatus();
            if (oldStatus == BookingStatus.CANCELLED && newStatus != BookingStatus.CANCELLED) {
                return handleRestoreCancelledBooking(booking, newStatus);
            }
            if (newStatus == BookingStatus.CANCELLED) {
                if (cancelReason != null && !cancelReason.trim().isEmpty()) {
                    booking.setCancelReason(cancelReason.trim());
                }
            }
            booking.setStatus(newStatus);
            Booking updatedBooking = bookingRepository.save(booking);
            return convertToBookingResponse(updatedBooking);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi hệ thống khi cập nhật trạng thái booking: " + e.getMessage());
        }
    }

    private BookingResponse handleRestoreCancelledBooking(Booking booking, BookingStatus newStatus) {
        TourSchedule tourSchedule = booking.getTourSchedule();
        LocalDate today = LocalDate.now();

        if (tourSchedule == null) {
            throw new RuntimeException("Không tìm thấy lịch trình tour cho booking này");
        }

        if (tourSchedule.getStatus() == ScheduleStatus.CANCELLED) {
            throw new RuntimeException("Không thể khôi phục booking vì lịch trình tour đã bị hủy");
        }

        if (tourSchedule.getStatus() == ScheduleStatus.COMPLETED) {
            throw new RuntimeException("Không thể khôi phục booking vì lịch trình tour đã hoàn thành");
        }

        if (tourSchedule.getStatus() != ScheduleStatus.UPCOMING) {
            throw new RuntimeException("Không thể khôi phục booking vì lịch trình tour không ở trạng thái sắp diễn ra");
        }

        if (tourSchedule.getStartDate().isBefore(today)) {
            throw new RuntimeException("Không thể khôi phục booking cho tour đã khởi hành");
        }

        if (tourSchedule.getTour().getStatus() != TourStatus.ACTIVE) {
            throw new RuntimeException("Không thể khôi phục booking vì tour đã ngừng hoạt động");
        }

        booking.setStatus(newStatus);
        booking.setCancelReason(null);
        Booking updatedBooking = bookingRepository.save(booking);
        return convertToBookingResponse(updatedBooking);
    }

    private BookingResponse convertToBookingResponse(Booking booking) {
        TourSchedule tourSchedule = booking.getTourSchedule();
        Tour tour = tourSchedule.getTour();
        BigDecimal totalPrice = calculateTotalPrice(
                booking.getAdultCount(),
                booking.getChildCount(),
                booking.getBabyCount(),
                tourSchedule.getPrice(),
                tourSchedule.getChildPrice(),
                tourSchedule.getBabyPrice()
        );

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(LocalDate.from(booking.getBookingDate()))
                .numberOfPeople(booking.getNumberOfPeople())
                .adultCount(booking.getAdultCount())
                .childCount(booking.getChildCount())
                .babyCount(booking.getBabyCount())
                .paidAmount(booking.getPaidAmount())
                .totalPrice(totalPrice)
                .status(booking.getStatus().name())
                .user(UserResponse.builder()
                        .name(booking.getUser().getName())
                        .email(booking.getUser().getEmail())
                        .phone(booking.getUser().getPhone())
                        .avatar(booking.getUser().getAvatar())
                        .build())
                .tourSchedule(TourScheduleResponse.builder()
                        .startDate(tourSchedule.getStartDate())
                        .endDate(tourSchedule.getEndDate())
                        .price(tourSchedule.getPrice())
                        .childPrice(tourSchedule.getChildPrice())
                        .babyPrice(tourSchedule.getBabyPrice())
                        .tour(TourResponse.builder()
                                .title(tour.getTitle())
                                .duration(Integer.valueOf(tour.getDuration()))
                                .image(convertImageUrlToBase64(tour.getImage())) // Convert image nếu cần
                                .basePrice(tour.getBasePrice())
                                .destination(tour.getDestination())
                                .build())
                        .build())
                .build();
    }

    @Override
    @Transactional
    public AdminBookingResponse updateBookingDetails(Long bookingId, AdminBookingRequest request) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (bookingOpt.isEmpty()) {
                throw new RuntimeException("❌ Không tìm thấy booking với ID: " + bookingId);
            }

            Booking booking = bookingOpt.get();

            Integer totalPeople = request.getTotalPeople();
            if (totalPeople == null || totalPeople <= 0) {
                throw new RuntimeException("❌ Tổng số người phải lớn hơn 0");
            }

            User customer;
            Optional<User> existingUser = userRepository.findByEmail(request.getCustomerEmail());

            if (existingUser.isPresent()) {
                User user = existingUser.get();
                boolean needsUpdate = false;

                if (!request.getCustomerName().equals(user.getName())) {
                    user.setName(request.getCustomerName());
                    needsUpdate = true;
                }

                if (!request.getPhone().equals(user.getPhone())) {
                    user.setPhone(request.getPhone());
                    needsUpdate = true;
                }

                customer = needsUpdate ? userRepository.save(user) : user;
            } else {
                Role customerRole = roleRepository.findByName("USER")
                        .orElseGet(() -> roleRepository.save(new Role(null, "USER")));

                customer = User.builder()
                        .email(request.getCustomerEmail())
                        .name(request.getCustomerName())
                        .phone(request.getPhone())
                        .password(UUID.randomUUID().toString().substring(0, 12))
                        .role(customerRole)
                        .status(true)
                        .emailVerification(true)
                        .build();

                customer = userRepository.save(customer);
            }

            TourSchedule tourSchedule = booking.getTourSchedule();
            BigDecimal adultPrice = tourSchedule.getPrice().multiply(BigDecimal.valueOf(request.getAdults()));
            BigDecimal childPrice = tourSchedule.getChildPrice().multiply(BigDecimal.valueOf(request.getChildren()));
            BigDecimal babyPrice = tourSchedule.getBabyPrice().multiply(BigDecimal.valueOf(request.getBabies()));
            BigDecimal totalPrice = adultPrice.add(childPrice).add(babyPrice);

            booking.setUser(customer);
            booking.setAdultCount(request.getAdults());
            booking.setChildCount(request.getChildren());
            booking.setBabyCount(request.getBabies());
            booking.setNumberOfPeople(totalPeople);
            booking.setPaidAmount(totalPrice);
            booking.setNotes(request.getNotes());

            Booking savedBooking = bookingRepository.save(booking);


            UserResponse customerInfo = UserResponse.builder()
                    .name(customer.getName())
                    .email(customer.getEmail())
                    .phone(customer.getPhone())
                    .avatar(customer.getAvatar())
                    .build();

            TourInfo tourInfo = TourInfo.builder()
                    .id(tourSchedule.getTour().getId())
                    .title(tourSchedule.getTour().getTitle())
                    .destination(tourSchedule.getTour().getDestination())
                    .durationDays(Integer.valueOf(tourSchedule.getTour().getDuration()))
                    .imageUrl(
                            tourSchedule.getTour().getImages().isEmpty()
                                    ? null
                                    : tourSchedule.getTour().getImages().get(0).getImageUrl()
                    )
                    .startDate(tourSchedule.getStartDate().atStartOfDay())
                    .endDate(tourSchedule.getEndDate().atStartOfDay())
                    .price(tourSchedule.getPrice().doubleValue())
                    .childPrice(tourSchedule.getChildPrice().doubleValue())
                    .babyPrice(tourSchedule.getBabyPrice().doubleValue())
                    .build();

            BookingDetails bookingDetails = BookingDetails.builder()
                    .adultCount(savedBooking.getAdultCount())
                    .childCount(savedBooking.getChildCount())
                    .babyCount(savedBooking.getBabyCount())
                    .totalPeople(savedBooking.getNumberOfPeople())
                    .notes(savedBooking.getNotes())
                    .cancelReason(savedBooking.getCancelReason())
                    .build();

            PaymentInfo paymentInfo = PaymentInfo.builder()
                    .basePrice(tourSchedule.getPrice().doubleValue())
                    .adultPrice(adultPrice.doubleValue())
                    .childPrice(childPrice.doubleValue())
                    .babyPrice(babyPrice.doubleValue())
                    .totalPrice(totalPrice.doubleValue())
                    .paymentMethod("ADMIN_UPDATED")
                    .paymentStatus("COMPLETED")
                    .paidAt(LocalDateTime.now())
                    .build();

            return AdminBookingResponse.builder()
                    .id(savedBooking.getId())
                    .bookingCode(savedBooking.getBookingCode())
                    .customer(customerInfo)
                    .tour(tourInfo)
                    .details(bookingDetails)
                    .payment(paymentInfo)
                    .status(savedBooking.getStatus().name())
                    .bookingDate(savedBooking.getBookingDate())
//                    .createdAt(savedBooking.getBookingDate())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("❌ Lỗi cập nhật booking: " + e.getMessage());
        }
    }

    @Override
    public List<StatusOption> getAllStatuses() {
        return Arrays.stream(BookingStatus.values())
                .map(status -> new StatusOption(status.name(),
                        switch (status) {
                            case PENDING -> "Chờ xác nhận";
                            case DEPOSIT_PAID -> "Đã đặt cọc";
                            case PAID -> "Đã thanh toán";
                            case CANCELLED -> "Đã hủy";
                        }))
                .collect(Collectors.toList());
    }

    @Override
    public Page<BookingResponse> getCancelledBookings(String userName, String bookingCode, String tourTitle, Pageable pageable) {
        Page<BookingProjection> projections = bookingRepository.findAllCancelledBookings(
                userName, bookingCode, tourTitle, pageable
        );

        return projections.map(this::mapProjectionToResponse);
    }

    @Override
    public Page<BookingResponse> searchCancelledBookings(String searchTerm, Pageable pageable) {
        Page<BookingProjection> projections = bookingRepository.findCancelledBookingsByGlobalSearch(
                searchTerm, pageable
        );

        return projections.map(this::mapProjectionToResponse);
    }

    @Override
    public long getCancelledBookingsCount() {
        return 0;
    }

    @Override
    public BookingResponse updateBookingPayment(Long bookingId, AdminPaymentRequest paymentRequest) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));

        TourSchedule tourSchedule = booking.getTourSchedule();
        BigDecimal totalPrice = tourSchedule.getPrice()
                .multiply(BigDecimal.valueOf(booking.getAdultCount()))
                .add(tourSchedule.getChildPrice().multiply(BigDecimal.valueOf(booking.getChildCount())))
                .add(tourSchedule.getBabyPrice().multiply(BigDecimal.valueOf(booking.getBabyCount())));


        BigDecimal oldPaidAmount = booking.getPaidAmount() != null
                ? booking.getPaidAmount()
                : BigDecimal.ZERO;

        BigDecimal newPaidAmount = oldPaidAmount.add(paymentRequest.getAmount());
        booking.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(BigDecimal.ZERO) == 0) {
            booking.setStatus(BookingStatus.PENDING);
        } else if (newPaidAmount.compareTo(totalPrice) < 0) {
            booking.setStatus(BookingStatus.DEPOSIT_PAID);
        } else {
            booking.setStatus(BookingStatus.PAID);
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(Payment.builder()
                        .booking(booking)
                        .paymentMethod(PaymentMethod.CASH)
                        .status(PaymentStatus.PENDING)
                        .amount(BigDecimal.ZERO)
                        .build()
                );

        BigDecimal oldPaymentAmount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        BigDecimal newPaymentAmount = oldPaymentAmount.add(paymentRequest.getAmount());
        payment.setAmount(newPaymentAmount);
        payment.setCreatedAt(paymentRequest.getPaymentDate().atStartOfDay());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setUpdatedAt(LocalDateTime.now());
        payment.setTransactionCode("TXN" + System.currentTimeMillis());
        paymentRepository.save(payment);
        bookingRepository.save(booking);

        Optional<User> user = userRepository.findById(booking.getUser().getId());
        if (user.isPresent()) {
            BigDecimal totalAmountSpent = bookingRepository.getTotalSpentByUser(booking.getUser().getId());
            long totalSpentValue = totalAmountSpent != null ? totalAmountSpent.longValue() : 0L;
            CustomerType newCustomerType = determineCustomerType(totalSpentValue);
            user.get().setCustomerType(newCustomerType);
            userRepository.save(user.get());
        }
        return convertToBookingResponse(booking);
    }

    private String getVietnameseLabel(BookingStatus status) {
        return switch (status) {
            case PENDING -> "Chờ xác nhận";
            case DEPOSIT_PAID -> "Đã đặt cọc";
            case PAID -> "Đã thanh toán";
            case CANCELLED -> "Đã hủy";
        };
    }

    private BookingResponse mapProjectionToResponse(BookingProjection projection) {
        BigDecimal totalPrice = calculateTotalPrice(
                projection.getAdultCount(),
                projection.getChildCount(),
                projection.getBabyCount(),
                projection.getSchedulePrice(),
                projection.getChildPrice(),
                projection.getBabyPrice()
        );

        return BookingResponse.builder()
                .id(projection.getId())
                .bookingCode(projection.getBookingCode())
                .bookingDate(projection.getBookingDate())
                .numberOfPeople(projection.getNumberOfPeople())
                .adultCount(projection.getAdultCount())
                .childCount(projection.getChildCount())
                .babyCount(projection.getBabyCount())
                .paidAmount(projection.getPaidAmount())
                .totalPrice(totalPrice)
                .status(projection.getStatus())
                .user(UserResponse.builder()
                        .name(projection.getUserName())
                        .email(projection.getUserEmail())
                        .phone(projection.getUserPhone())
                        .avatar(projection.getUserAvatar())
                        .build())
                .tourSchedule(TourScheduleResponse.builder()
                        .startDate(projection.getStartDate())
                        .endDate(projection.getEndDate())
                        .price(projection.getSchedulePrice())
                        .childPrice(projection.getChildPrice())
                        .babyPrice(projection.getBabyPrice())
                        .tour(TourResponse.builder()
                                .title(projection.getTourTitle())
                                .duration(projection.getTourDuration())
                                .image(projection.getTourImage())
                                .basePrice(projection.getTourBasePrice())
                                .destination(projection.getTourDestination())
                                .build())
                        .build())
                .build();
    }

    private BigDecimal calculateTotalPrice(int adultCount, int childCount, int babyCount,
                                           BigDecimal adultPrice, BigDecimal childPrice, BigDecimal babyPrice) {
        BigDecimal adultTotal = adultPrice.multiply(BigDecimal.valueOf(adultCount));
        BigDecimal childTotal = childPrice.multiply(BigDecimal.valueOf(childCount));
        BigDecimal babyTotal = babyPrice.multiply(BigDecimal.valueOf(babyCount));

        return adultTotal.add(childTotal).add(babyTotal);
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