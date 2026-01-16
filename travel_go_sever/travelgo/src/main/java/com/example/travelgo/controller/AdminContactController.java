package com.example.travelgo.controller;

import com.example.travelgo.dto.AdminContactResponse;
import com.example.travelgo.dto.ApiResponse;
import com.example.travelgo.dto.NoteRequest;
import com.example.travelgo.dto.RespondRequest;
import com.example.travelgo.entity.Contact;
import com.example.travelgo.entity.ContactNote;

import com.example.travelgo.service.IContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contacts")
@RequiredArgsConstructor
public class AdminContactController {

    private final IContactService adminService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminContactResponse>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Contact> result = adminService.searchContacts(status, keyword, pageable);

        Page<AdminContactResponse> response = result.map(c ->
                new AdminContactResponse(
                        c.getId(),
                        c.getName(),
                        c.getEmail(),
                        c.getPhone(),
                        c.getMessage(),
                        c.getTourInterest(),
                        c.getPreferredContact(),
                        c.getStatus().name(),
                        c.getCreatedAt(),
                        c.getRespondedAt()
                )
        );

        return ResponseEntity.ok(new ApiResponse<>(true, "Danh sách liên hệ", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Contact>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Chi tiết liên hệ", adminService.getContactById(id)));
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponse<Contact>> respond(
            @PathVariable Long id,
            @RequestBody RespondRequest req
    ) {
        Contact updated = adminService.markAsResponded(id, req.getNote());
        return ResponseEntity.ok(new ApiResponse<>(true, "Đã phản hồi", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminService.deleteContact(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Xóa thành công", null));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<ContactNote>> addNote(
            @PathVariable Long id,
            @RequestBody NoteRequest req
    ) {
        ContactNote n = adminService.addNote(id, req.getContent());
        return ResponseEntity.ok(new ApiResponse<>(true, "Thêm ghi chú thành công", n));
    }

    @GetMapping("/{id}/note")
    public ResponseEntity<ApiResponse<ContactNote>> getLatestNote(
            @PathVariable Long id
    ) {
        ContactNote note = adminService.getLatestContactNote(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy ghi chú thành công", note));
    }
}
