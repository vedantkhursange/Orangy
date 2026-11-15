package com.orangy.order;

import com.orangy.common.dto.ApiResponse;
import com.orangy.order.dto.GuestOrderRequest;
import com.orangy.order.dto.OrderResponse;
import com.orangy.order.dto.PaymentFailureRequest;
import com.orangy.order.dto.PaymentVerificationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Guest checkout: place, pay for and track an order without an account. */
@RestController
@RequestMapping("/api/public/orders")
@RequiredArgsConstructor
@Tag(name = "Guest checkout", description = "Orders without login")
public class PublicOrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place a guest order")
    public ResponseEntity<ApiResponse<OrderResponse>> create(@Valid @RequestBody GuestOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(orderService.createGuestOrder(request)));
    }

    @PostMapping("/verify-payment")
    @Operation(summary = "Verify Razorpay payment for a guest order")
    public ResponseEntity<ApiResponse<OrderResponse>> verify(@Valid @RequestBody PaymentVerificationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.verifyPayment(null, request)));
    }

    @PostMapping("/payment-failed")
    @Operation(summary = "Record a failed payment for a guest order")
    public ResponseEntity<ApiResponse<OrderResponse>> failed(@Valid @RequestBody PaymentFailureRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.markPaymentFailed(null, request)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Track a guest order (order id + phone)")
    public ResponseEntity<ApiResponse<OrderResponse>> get(@PathVariable String orderId, @RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getGuestOrder(orderId, phone)));
    }
}
