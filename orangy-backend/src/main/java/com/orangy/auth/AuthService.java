package com.orangy.auth;

import com.orangy.auth.dto.AuthResponse;
import com.orangy.auth.dto.LoginRequest;
import com.orangy.auth.dto.OtpResponse;
import com.orangy.auth.dto.OtpVerifyRequest;
import com.orangy.auth.dto.SignupRequest;
import com.orangy.auth.dto.UserProfileResponse;
import com.orangy.common.exception.BadRequestException;
import com.orangy.common.exception.DuplicateResourceException;
import com.orangy.common.exception.ResourceNotFoundException;
import com.orangy.common.exception.UnauthorizedException;
import com.orangy.user.Role;
import com.orangy.user.User;
import com.orangy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * Initiate signup – create unverified user and send OTP.
     */
    public OtpResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }
        // Create user with emailVerified = false
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();
        userRepository.save(user);
        // Generate OTP and email it
        String otp = otpService.generateOtp(request.getEmail(), "SIGNUP");
        emailService.sendOtpEmail(request.getEmail(), otp, "SIGNUP");
        return OtpResponse.builder()
                .message("OTP sent to email for verification")
                .email(request.getEmail())
                .otpExpirySeconds(otpService.getOtpExpirySeconds())
                .build();
    }

    /**
     * Initiate login – verify password, then send OTP.
     */
    public OtpResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email before logging in");
        }
        String otp = otpService.generateOtp(request.getEmail(), "LOGIN");
        emailService.sendOtpEmail(request.getEmail(), otp, "LOGIN");
        return OtpResponse.builder()
                .message("OTP sent to email for login")
                .email(request.getEmail())
                .otpExpirySeconds(otpService.getOtpExpirySeconds())
                .build();
    }

    /**
     * Verify OTP for either SIGNUP or LOGIN. On success, return JWTs.
     */
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        // Validate OTP
        otpService.verifyOtp(request.getEmail(), request.getOtp(), request.getPurpose());
        // If signup, mark email verified
        if ("SIGNUP".equalsIgnoreCase(request.getPurpose())) {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setEmailVerified(true);
            userRepository.save(user);
        }
        // Fetch user for JWT creation
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildAuthResponse(user);
    }

    /**
     * Refresh access token using a valid refresh token.
     */
    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        if (!"refresh".equals(jwtService.extractTokenType(refreshToken))) {
            throw new UnauthorizedException("Provided token is not a refresh token");
        }
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildAuthResponse(user);
    }

    /**
     * Return the profile of the currently authenticated user.
     */
    public UserProfileResponse getCurrentUser(AuthenticatedUser principal) {
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .build();
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
}

