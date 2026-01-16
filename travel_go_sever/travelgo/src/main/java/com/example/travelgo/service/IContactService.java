package com.example.travelgo.service;

import com.example.travelgo.dto.ContactRequest;
import com.example.travelgo.entity.Contact;
import com.example.travelgo.entity.ContactNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IContactService {
    Contact createContact(ContactRequest contactRequest);

    Page<Contact> searchContacts(String status, String keyword, Pageable pageable);

    Contact getContactById(Long id);

    Contact markAsResponded(Long id, String note);

    void deleteContact(Long id);

    ContactNote addNote(Long id, String note);
    ContactNote getContactNoteByContact(Long id);
    ContactNote getLatestContactNote(Long contactId);
}
