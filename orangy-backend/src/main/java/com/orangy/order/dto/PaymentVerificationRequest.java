package com.orangy.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationRequest {
    @NotBlank
    private String razorpayOrderId;
    
    @NotBlank
    private String razorpayPaymentId;
    
    @NotBlank
    private String razorpaySignature;
}
