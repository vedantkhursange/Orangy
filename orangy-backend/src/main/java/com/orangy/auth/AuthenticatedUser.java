package com.orangy.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

/**
 * Lightweight principal stored in SecurityContext after JWT validation.
 * Avoids a database lookup on every request.
 */
@Getter
@AllArgsConstructor
public class AuthenticatedUser {
    private final UUID userId;
    private final String email;
    private final String role;
}
