package com.example.travelgo.vnpay;

import com.example.travelgo.entity.Role;

import java.util.Optional;

public interface IRoleService {
    Optional<Role> findByName(String name);
    Role save(Role role);
}
