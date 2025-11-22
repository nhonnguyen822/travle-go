package com.example.travelgo.config;

import com.example.travelgo.entity.Role;
import com.example.travelgo.entity.User;
import com.example.travelgo.repository.IRoleRepository;
import com.example.travelgo.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
    private final IRoleRepository roleRepository;
    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) throws Exception {
        if(roleRepository.findByName("ADMIN").isEmpty()) {
            roleRepository.save(new Role(null, "ADMIN"));
        }
        if(roleRepository.findByName("USER").isEmpty()) {
            roleRepository.save(new Role(null, "USER"));
        }

        // 2️⃣ Tạo admin mặc định nếu chưa có
        if(userRepository.findByEmail("admin@gmail.com").isEmpty()) {
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail("admin@gmail.com");
            admin.setPassword(passwordEncoder.encode("admin123"));

            Role adminRole = roleRepository.findByName("ADMIN").get();
            admin.setRole(adminRole);
            admin.setStatus(true);

            userRepository.save(admin);
            System.out.println("Admin account created: admin@example.com / admin123");
        }
    }
}
