package com.example.travelgo.controller;

import com.example.travelgo.dto.CustomerResponse;
import com.example.travelgo.dto.CustomerStats;
import com.example.travelgo.entity.User;
import com.example.travelgo.enums.CustomerType;
import com.example.travelgo.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final IUserService  userService;

    @GetMapping
    public ResponseEntity<?> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerType customerType,
            @RequestParam(required = false) Boolean status) {

        try {
            Sort sort = Sort.by(Sort.Direction.DESC, "created_at");
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<CustomerResponse> customers = userService.getAllCustomers(
                    pageable, search, customerType, status);
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lỗi khi tải danh sách khách hàng: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable Long id) {
        try {
            CustomerResponse customer = userService.getCustomerById(id);
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }




    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateCustomerStatus(
            @PathVariable Long id,
            @RequestParam Boolean status) {
        try {
            CustomerResponse customer = userService.updateCustomerStatus(id, status);
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PatchMapping("/{id}/type")
    public ResponseEntity<?> updateCustomerType(
            @PathVariable Long id,
            @RequestParam CustomerType customerType) {
        try {
            CustomerResponse customer = userService.updateCustomerType(id, customerType);
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getCustomerStats() {
        try {
            CustomerStats stats = userService.getCustomerStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lỗi khi tải thống kê: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
