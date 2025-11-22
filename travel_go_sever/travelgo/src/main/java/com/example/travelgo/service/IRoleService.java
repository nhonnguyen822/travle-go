package com.example.travelgo.service;

import com.example.travelgo.entity.Role;

import java.util.List;
import java.util.Optional;

public interface IRoleService {
    List<Role> findAll();
    

    Optional<Role> findById(Long id);

    void remove(Long id);
    Optional<Role> findByName(String name);

    Role save(Role role);
}
