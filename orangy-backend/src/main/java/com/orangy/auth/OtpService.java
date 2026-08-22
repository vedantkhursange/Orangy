package com.orangy.auth;

import com.orangy.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

/**
 * OTP generation, storage (Redis), and verification.
 * Redis key format: otp:{PURPOSE}:{email} → "123456"
 * Rate-limit key:  otp_cooldown:{PURPOSE}:{email} → "1" (30-sec TTL)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;

    @Value("${app.otp.expiry-seconds:45}")
    private int otpExpirySeconds;

    @Value("${app.otp.length:6}")
    private int otpLength;

    private static final int COOLDOWN_SECONDS = 30;
    private final SecureRandom random = new SecureRandom();

    /**
     * Generate a new OTP, store it in Redis with TTL, return it.
     */
    public String generateOtp(String email, String purpose) {
        String cooldownKey = "otp_cooldown:" + purpose + ":" + email;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new BadRequestException("Please wait before requesting another OTP");
        }

        String otp = generateRandomOtp();
        String otpKey = "otp:" + purpose + ":" + email;

        redisTemplate.opsForValue().set(otpKey, otp, Duration.ofSeconds(otpExpirySeconds));
        redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(COOLDOWN_SECONDS));

        log.info("OTP generated for {} [{}]: {}", email, purpose, otp);
        return otp;
    }

    /**
     * Verify the OTP. Deletes on success.
     */
    public boolean verifyOtp(String email, String otp, String purpose) {
        String otpKey = "otp:" + purpose + ":" + email;
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        if (storedOtp == null) {
            throw new BadRequestException("OTP expired or not found. Please request a new one.");
        }

        if (!storedOtp.equals(otp)) {
            throw new BadRequestException("Invalid OTP. Please try again.");
        }

        // OTP verified — delete it so it can't be reused
        redisTemplate.delete(otpKey);
        log.info("OTP verified successfully for {} [{}]", email, purpose);
        return true;
    }

    public int getOtpExpirySeconds() {
        return otpExpirySeconds;
    }

    private String generateRandomOtp() {
        int bound = (int) Math.pow(10, otpLength);
        int number = random.nextInt(bound);
        return String.format("%0" + otpLength + "d", number);
    }
}
