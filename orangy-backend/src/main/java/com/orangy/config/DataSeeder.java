package com.orangy.config;

import com.orangy.user.Role;
import com.orangy.user.User;
import com.orangy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@orangy.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("Seeding initial admin user: {}", adminEmail);
            User admin = User.builder()
                    .name("Admin User")
                    .email(adminEmail)
                    .phone("9999999999")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
        } else {
            log.info("Admin user already exists. Skipping seeding.");
        }
    }
}
