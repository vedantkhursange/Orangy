package com.orangy.order;

import com.orangy.auth.AuthenticatedUser;
import com.orangy.common.dto.ApiResponse;
import com.orangy.order.dto.OrderCreateRequest;
import com.orangy.order.dto.OrderResponse;
import com.orangy.order.dto.PaymentFailureRequest;
import com.orangy.order.dto.PaymentVerificationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order and checkout operations")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create a new order (Checkout)")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody OrderCreateRequest request) {
        OrderResponse response = orderService.createOrder(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/verify-payment")
    @Operation(summary = "Verify Razorpay payment signature")
    public ResponseEntity<ApiResponse<OrderResponse>> verifyPayment(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody PaymentVerificationRequest request) {
        OrderResponse response = orderService.verifyPayment(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/payment-failed")
    @Operation(summary = "Record a failed/abandoned Razorpay payment attempt")
    public ResponseEntity<ApiResponse<OrderResponse>> markPaymentFailed(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody PaymentFailureRequest request) {
        OrderResponse response = orderService.markPaymentFailed(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Get current user's orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getUserOrders(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderResponse> orders = orderService.getUserOrders(
                principal.getUserId(), PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order details")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String orderId) {
        OrderResponse response = orderService.getOrderById(principal.getUserId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
