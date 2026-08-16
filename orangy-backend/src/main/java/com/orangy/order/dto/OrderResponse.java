package com.orangy.order.dto;

import com.orangy.user.dto.AddressResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private String id;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private String orderStatus;
    private String paymentStatus;
    private String razorpayOrderId;
    private AddressResponse deliveryAddress;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
}
