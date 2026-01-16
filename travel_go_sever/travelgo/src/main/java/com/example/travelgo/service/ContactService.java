package com.example.travelgo.service;

import com.example.travelgo.dto.ContactRequest;
import com.example.travelgo.entity.Contact;
import com.example.travelgo.entity.ContactNote;
import com.example.travelgo.repository.IContactNoteRepository;
import com.example.travelgo.repository.IContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContactService implements IContactService {

    private final IContactRepository contactRepository;
    private final IContactNoteRepository contactNoteRepository;

    @Override
    public Contact createContact(ContactRequest contactRequest) {
        Contact contact = new Contact();
        contact.setName(contactRequest.getName());
        contact.setEmail(contactRequest.getEmail());
        contact.setPhone(contactRequest.getPhone());
        contact.setMessage(contactRequest.getMessage());
        contact.setTourInterest(contactRequest.getTourInterest());
        contact.setPreferredContact(contactRequest.getPreferredContact());
        Contact savedContact = contactRepository.save(contact);
        log.info("✅ Created new contact from: {} ({})", contactRequest.getName(), contactRequest.getEmail());
        return savedContact;
    }

    @Override
    public Page<Contact> searchContacts(String status, String keyword, Pageable pageable) {
        String kw = "%" + (keyword == null ? "" : keyword.toLowerCase()) + "%";

        if (status != null) {
            return contactRepository.searchWithStatus(
                    Contact.ContactStatus.valueOf(status),
                    kw,
                    pageable
            );
        }

        return contactRepository.search(kw, pageable);
    }

    @Override
    public Contact getContactById(Long id) {
        return contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy liên hệ!"));
    }

    @Override
    public Contact markAsResponded(Long id, String note) {
        Contact c = getContactById(id);

        c.setStatus(Contact.ContactStatus.RESPONDED);
        c.setRespondedAt(LocalDateTime.now());

        contactRepository.save(c);

        if (note != null && !note.isBlank()) {
            ContactNote n = new ContactNote();
            n.setContact(c);
            n.setContent(note);
            contactNoteRepository.save(n);
        }

        return c;
    }

    @Override
    public ContactNote getContactNoteByContact(Long id) {
        return  contactNoteRepository.getContactNoteByContact_Id(id);
    }

    @Override
    public ContactNote getLatestContactNote(Long contactId) {
        return contactNoteRepository.findTopByContactIdOrderByCreatedAtDesc(contactId)
                .orElse(null);
    }

    @Override
    public void deleteContact(Long id) {
        contactRepository.deleteById(id);
        ContactNote contactNote = contactNoteRepository.getContactNoteByContact_Id(id);
    }

    @Override
    public ContactNote addNote(Long id, String note) {
        Contact c = getContactById(id);

        ContactNote n = new ContactNote();
        n.setContact(c);
        n.setContent(note);

        return contactNoteRepository.save(n);
    }

}