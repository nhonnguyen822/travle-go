package com.example.travelgo.service;

import com.example.travelgo.dto.CustomerResponse;
import com.example.travelgo.dto.CustomerStats;
import com.example.travelgo.dto.UserDTO;
import com.example.travelgo.dto.UserSearchRequest;
import com.example.travelgo.entity.User;
import com.example.travelgo.enums.CustomerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface IUserService {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User save(User user);

    @Transactional
    void register(User user);

    void resendEmailVerification(User user);

    String updateAvatar(Long userId, String newAvatar) throws Exception;

    Page<UserDTO> getUsers(UserSearchRequest request, Pageable pageable);

    Page<CustomerResponse> getAllCustomers(Pageable pageable,
                                           String search,
                                           CustomerType customerType,
                                           Boolean status);

    CustomerResponse getCustomerById(Long id);

    CustomerResponse updateCustomerStatus(Long id, Boolean status);

    CustomerResponse updateCustomerType(Long id, CustomerType customerType);

    CustomerStats getCustomerStats();

    Optional<CustomerResponse> getCustomerByEmail(String email);

}
