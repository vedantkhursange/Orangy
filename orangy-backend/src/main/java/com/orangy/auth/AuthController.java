package com.orangy.auth;

import com.orangy.auth.dto.AuthResponse;
import com.orangy.auth.dto.LoginRequest;
import com.orangy.auth.dto.OtpResponse;
import com.orangy.auth.dto.ResendOtpRequest;
import com.orangy.auth.dto.OtpVerifyRequest;
import com.orangy.auth.dto.RefreshTokenRequest;
import com.orangy.auth.dto.SignupRequest;
import com.orangy.auth.dto.UserProfileResponse;
import com.orangy.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication — signup, login, OTP verification, token refresh")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @Operation(summary = "Register a new customer account — sends OTP to email")
    public ResponseEntity<ApiResponse<OtpResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        OtpResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password — sends OTP to email")
    public ResponseEntity<ApiResponse<OtpResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        OtpResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP for signup or login — returns JWT tokens on success")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP for signup or login")
    public ResponseEntity<ApiResponse<OtpResponse>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request) {
        OtpResponse response = authService.resendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Get a new access token using a refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current logged-in user's profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        UserProfileResponse profile = authService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
