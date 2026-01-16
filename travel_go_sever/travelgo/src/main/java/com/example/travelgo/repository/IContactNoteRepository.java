package com.example.travelgo.repository;

import com.example.travelgo.entity.ContactNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IContactNoteRepository extends JpaRepository<ContactNote, Long> {
    List<ContactNote> findContactNotesByContact_Id(Long contactId);

    ContactNote getContactNoteByContact_Id(Long contactId);
    Optional<ContactNote> findTopByContactIdOrderByCreatedAtDesc(Long contactId);
}
