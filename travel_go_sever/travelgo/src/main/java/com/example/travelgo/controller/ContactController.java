package com.example.travelgo.controller;


import com.cloudinary.api.ApiResponse;
import com.example.travelgo.dto.ContactRequest;
import com.example.travelgo.entity.Contact;

import com.example.travelgo.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody ContactRequest request) {
        Contact saved = contactService.createContact(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
