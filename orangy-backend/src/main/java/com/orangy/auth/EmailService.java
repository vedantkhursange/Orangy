package com.orangy.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email service for sending OTPs and admin credential notifications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.otp.expiry-seconds:45}")
    private int otpExpirySeconds;

    /**
     * Send OTP email (async to not block the request thread).
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        String subject = "Orangy - Your OTP: " + otp;
        String purposeText = "SIGNUP".equals(purpose) ? "sign up" : "login";

        String htmlBody = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff8f0; border-radius: 16px; border: 1px solid #ffe0b2;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #e65100; font-size: 28px; margin: 0;">🍊 Orangy</h1>
                        <p style="color: #bf360c; font-size: 14px; margin: 4px 0 0 0;">Fresh from farm to your door</p>
                    </div>
                    <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                        <p style="color: #555; font-size: 15px; margin: 0 0 16px 0;">Your OTP for <strong>%s</strong> is:</p>
                        <div style="background: linear-gradient(135deg, #ff9800, #e65100); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 32px; border-radius: 10px; display: inline-block;">
                            %s
                        </div>
                        <p style="color: #999; font-size: 13px; margin: 16px 0 0 0;">Valid for <strong>%d seconds</strong> only</p>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                </div>
                """.formatted(purposeText, otp, otpExpirySeconds);

        sendHtmlEmail(toEmail, subject, htmlBody);
    }

    /**
     * Send admin credentials email after seeding.
     */
    @Async
    public void sendAdminCredentialsEmail(String notificationEmail, String adminEmail, String adminPassword) {
        String subject = "Orangy - Admin Account Created";

        String htmlBody = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff8f0; border-radius: 16px; border: 1px solid #ffe0b2;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #e65100; font-size: 28px; margin: 0;">🍊 Orangy Admin</h1>
                    </div>
                    <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                        <p style="color: #555; font-size: 15px; margin: 0 0 16px 0;">An admin account has been created for the Orangy platform:</p>
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Email:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #333; font-size: 14px;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Password:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #e65100; font-size: 14px;">%s</td>
                            </tr>
                        </table>
                        <p style="color: #d32f2f; font-size: 13px; margin: 16px 0 0 0; padding: 12px; background: #ffebee; border-radius: 8px;">
                            ⚠️ Please change this password immediately after first login.
                        </p>
                    </div>
                </div>
                """.formatted(adminEmail, adminPassword);

        sendHtmlEmail(notificationEmail, subject, htmlBody);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent successfully to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
