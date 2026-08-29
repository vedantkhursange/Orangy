package com.orangy.config;

import com.orangy.user.Role;
import com.orangy.user.User;
import com.orangy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

/**
 * Seeds the initial admin account.
 *
 * <p>This previously hardcoded {@code admin@orangy.com} / {@code admin123} and
 * created that account on every boot, ignoring the configured values entirely.
 * Since this repository is public, that made the admin console of any deployed
 * environment openly accessible.
 *
 * <p>It now reads both values from configuration and will <strong>not</strong>
 * seed at all unless a password is explicitly supplied — an unconfigured
 * environment ends up with no admin rather than a publicly known one.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    /** Deliberately has no default: absent config means "do not seed". */
    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedAdminUser();
    }

    private void seedAdminUser() {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("Admin seeding skipped: app.admin.email and app.admin.password are not both set. "
                    + "Set ADMIN_EMAIL and ADMIN_DEFAULT_PASSWORD to create the initial admin.");
            return;
        }

        if (adminPassword.length() < MIN_PASSWORD_LENGTH) {
            log.error("Admin seeding skipped: app.admin.password is shorter than {} characters.",
                    MIN_PASSWORD_LENGTH);
            return;
        }

        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists. Skipping seeding.");
            return;
        }

        log.info("Seeding initial admin user: {}", adminEmail);
        userRepository.save(User.builder()
                .name("Admin User")
                .email(adminEmail)
                .phone("9999999999")
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                // Lombok's builder ignores the field's own `= false` initializer
                // without @Builder.Default, so this must be set explicitly.
                // Without it, a freshly-seeded admin can't log in at all — login
                // requires email_verified, and there's no signup/OTP step for an
                // account created this way to ever set it.
                .emailVerified(true)
                .build());
    }
}
