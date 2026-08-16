package com.orangy.cart;

import com.orangy.auth.AuthenticatedUser;
import com.orangy.cart.dto.AddToCartRequest;
import com.orangy.cart.dto.CartResponse;
import com.orangy.cart.dto.UpdateCartItemRequest;
import com.orangy.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management (Redis-backed)")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        CartResponse response = cartService.getCart(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody AddToCartRequest request) {
        CartResponse response = cartService.addItem(
                principal.getUserId(), request.getVariantId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/items/{variantId}")
    @Operation(summary = "Update item quantity in cart")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String variantId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse response = cartService.updateItemQuantity(
                principal.getUserId(), variantId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/items/{variantId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String variantId) {
        CartResponse response = cartService.removeItem(principal.getUserId(), variantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping
    @Operation(summary = "Clear entire cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        cartService.clearCart(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
