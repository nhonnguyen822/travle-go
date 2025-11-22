package com.example.travelgo.service.impl;

import com.example.travelgo.dto.CustomerResponse;
import com.example.travelgo.dto.CustomerStats;
import com.example.travelgo.dto.UserDTO;
import com.example.travelgo.dto.UserSearchRequest;
import com.example.travelgo.entity.User;
import com.example.travelgo.entity.UserToken;
import com.example.travelgo.enums.CustomerType;
import com.example.travelgo.enums.TokenType;
import com.example.travelgo.repository.IUserRepository;
import com.example.travelgo.service.IMailService;
import com.example.travelgo.service.IUserService;
import com.example.travelgo.util.CloudinaryService;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserTokenService userTokenService;
    private final IMailService emailService;
    private final CloudinaryService cloudinaryService;

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            if (user.getId() == null) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        }
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void register(User user) {
        try {
            if (user.getCustomerCode() == null || user.getCustomerCode().isEmpty()) {
                String customerCode = user.generateCustomerCode();
                user.setCustomerCode(customerCode);
            }
            user.setCustomerType(CustomerType.NEW);
            User savedUser = save(user);
            String token = userTokenService.generateToken(savedUser, TokenType.EMAIL_VERIFICATION);
            emailService.sendUserVerificationEmail(savedUser.getEmail(), savedUser.getName(), token);
        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }
    }


    @Override
    public void resendEmailVerification(User user) {
        UserToken userToken = userTokenService.findByUserAndType(user, TokenType.EMAIL_VERIFICATION)
                .get();

        LocalDateTime now = LocalDateTime.now();

        if (userToken.getExpiresAt().isAfter(now.plusMinutes(10))) {
            return;
        }
        try {
            String newToken = userTokenService.generateToken(user, TokenType.EMAIL_VERIFICATION);
            emailService.sendUserVerificationEmail(user.getEmail(), user.getName(), newToken);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email", e);
        }
    }

    @Override
    public String updateAvatar(Long userId, String newAvatar) throws Exception {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return null;
        }

        User user = userOptional.get();
        if (user.getAvatar() != null) {
            cloudinaryService.deleteImageByUrl(user.getAvatar());
        }
        String uploadedAvatar = cloudinaryService.uploadImageFromUrl(newAvatar);
        user.setAvatar(uploadedAvatar);
        userRepository.save(user);
        return uploadedAvatar;
    }

    @Override
    public Page<UserDTO> getUsers(UserSearchRequest request, Pageable pageable) {
        return null;
    }

    @Override
    public Page<CustomerResponse> getAllCustomers(Pageable pageable, String search, CustomerType customerType, Boolean status) {
        try {
            String searchTerm = (search != null && !search.trim().isEmpty())
                    ? search.trim()
                    : "";
            String type = (customerType != null)
                    ? customerType.name()
                    : null;

            Integer statusValue;

            Page<User> customersPage;
            if (status == null) {
                statusValue = null;
            } else {
                statusValue = status ? 1 : 0;
            }
            if (type == null && statusValue == null) {
                customersPage = userRepository.findBySearchCustomerTypeByNullAndStatusByNull(searchTerm, pageable);
            } else if (statusValue == null && type != null) {
                customersPage = userRepository.findBySearchStatusByNull(searchTerm, type, pageable);
            } else if (type == null && statusValue != null) {
                customersPage = userRepository.findBySearchCustomerTypeByNull(searchTerm, statusValue, pageable);
            } else {
                customersPage = userRepository.findBySearchCriteria(searchTerm, type, statusValue, pageable);
            }

            System.out.println(customersPage);
            return customersPage.map(this::mapToCustomerResponse);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tải danh sách khách hàng");
        }
    }

    @Override
    public CustomerResponse getCustomerById(Long id) {
        User customer = userRepository.findById(id)
                .orElseThrow(() -> {
                    return new RuntimeException("Không tìm thấy khách hàng với ID: " + id);
                });

        return mapToCustomerResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomerStatus(Long id, Boolean status) {
        User customer = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với ID: " + id));
        Long activeBookingCount = userRepository.countBookingActivesByUserId(customer.getId());

        if (activeBookingCount > 0) {
            throw new RuntimeException(
                    String.format(
                            "Không thể thay đổi loại khách hàng cho %s. Hiện có %d booking đang hoạt động. ",
                            customer.getName(), activeBookingCount
                    )
            );
        }

        customer.setStatus(status);
        customer.setUpdatedAt(LocalDateTime.now());
        User savedCustomer = userRepository.save(customer);

        return mapToCustomerResponse(savedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomerType(Long id, CustomerType customerType) {
        User customer = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với ID: " + id));


        customer.setCustomerType(customerType);
        customer.setUpdatedAt(LocalDateTime.now());

        User savedCustomer = userRepository.save(customer);

        return mapToCustomerResponse(savedCustomer);
    }

    @Override
    public CustomerStats getCustomerStats() {
        try {
            long totalCustomers = userRepository.count();
            long activeCustomers = userRepository.countByStatus(true);
            long regularCustomers = userRepository.countByCustomerType(CustomerType.REGULAR);
            long vipCustomers = userRepository.countByCustomerType(CustomerType.VIP);

            CustomerStats stats = CustomerStats.builder()
                    .totalCustomers(totalCustomers)
                    .activeCustomers(activeCustomers)
                    .inactiveCustomers(totalCustomers - activeCustomers)
                    .regularCustomers(regularCustomers)
                    .vipCustomers(vipCustomers)
                    .build();
            return stats;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tải thống kê khách hàng");
        }
    }

    @Override
    public Optional<CustomerResponse> getCustomerByEmail(String email) {
        return userRepository.findByEmailAndRoleName(email, "USER")
                .map(this::mapToCustomerResponse);
    }



    private CustomerResponse mapToCustomerResponse(User user) {
        Long totalBookings = userRepository.countBookingsByUserId(user.getId());
        return CustomerResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .customerCode(user.getCustomerCode())
                .dateOfBirth(user.getDateOfBirth())
                .identityNumber(user.getIdentityNumber())
                .address(user.getAddress())
                .customerType(user.getCustomerType())
                .status(user.getStatus())
                .gender(user.getGender())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalBookings(totalBookings != null ? totalBookings : 0L)
                .build();
    }

}
