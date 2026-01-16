package com.example.travelgo.repository;

import com.example.travelgo.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
@Repository
public interface IContactRepository extends JpaRepository<Contact,Long> {
    @Query("""
           SELECT c FROM Contact c 
           WHERE LOWER(c.name) LIKE :keyword 
           OR LOWER(c.email) LIKE :keyword
           OR LOWER(c.phone) LIKE :keyword
           """)
    Page<Contact> search(@Param("keyword") String keyword, Pageable pageable);


    @Query("""
           SELECT c FROM Contact c 
           WHERE c.status = :status 
           AND (LOWER(c.name) LIKE :keyword 
               OR LOWER(c.email) LIKE :keyword
               OR LOWER(c.phone) LIKE :keyword)
           """)
    Page<Contact> searchWithStatus(@Param("status") Contact.ContactStatus status,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);

    long countByStatus(Contact.ContactStatus status);
}
