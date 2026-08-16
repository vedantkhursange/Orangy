package com.orangy.cart;

import com.orangy.cart.dto.CartResponse;
import com.orangy.catalog.ProductVariant;
import com.orangy.catalog.ProductVariantRepository;
import com.orangy.common.exception.BadRequestException;
import com.orangy.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final long CART_TTL_DAYS = 30;

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductVariantRepository variantRepository;

    public CartResponse getCart(UUID userId) {
        Cart cart = loadCart(userId);
        return buildCartResponse(cart);
    }

    public CartResponse addItem(UUID userId, String variantIdStr, int quantity) {
        UUID variantId = UUID.fromString(variantIdStr);
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + variantIdStr));

        Cart cart = loadCart(userId);

        // Check if variant already in cart
        Optional<CartItem> existing = cart.getItems().stream()
                .filter(item -> item.getVariantId().equals(variantIdStr))
                .findFirst();

        int totalQuantity = quantity;
        if (existing.isPresent()) {
            totalQuantity += existing.get().getQuantity();
        }

        // Validate stock
        if (totalQuantity > variant.getStockCount()) {
            throw new BadRequestException(
                    "Insufficient stock. Available: " + variant.getStockCount() +
                    ", Requested: " + totalQuantity);
        }

        if (existing.isPresent()) {
            existing.get().setQuantity(totalQuantity);
        } else {
            CartItem item = CartItem.builder()
                    .variantId(variantIdStr)
                    .productName(variant.getProduct().getName())
                    .variantLabel(variant.getLabel())
                    .unitPrice(variant.getPrice())
                    .quantity(quantity)
                    .thumbnailUrl(variant.getThumbnailImageUrl())
                    .build();
            cart.getItems().add(item);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(userId, cart);
        return buildCartResponse(cart);
    }

    public CartResponse updateItemQuantity(UUID userId, String variantId, int quantity) {
        Cart cart = loadCart(userId);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getVariantId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not in cart: " + variantId));

        // Validate stock
        UUID vId = UUID.fromString(variantId);
        ProductVariant variant = variantRepository.findById(vId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + variantId));

        if (quantity > variant.getStockCount()) {
            throw new BadRequestException(
                    "Insufficient stock. Available: " + variant.getStockCount() +
                    ", Requested: " + quantity);
        }

        item.setQuantity(quantity);
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(userId, cart);
        return buildCartResponse(cart);
    }

    public CartResponse removeItem(UUID userId, String variantId) {
        Cart cart = loadCart(userId);
        boolean removed = cart.getItems().removeIf(i -> i.getVariantId().equals(variantId));
        if (!removed) {
            throw new ResourceNotFoundException("Item not in cart: " + variantId);
        }
        cart.setUpdatedAt(LocalDateTime.now());
        saveCart(userId, cart);
        return buildCartResponse(cart);
    }

    public void clearCart(UUID userId) {
        String key = CART_KEY_PREFIX + userId.toString();
        redisTemplate.delete(key);
    }

    /**
     * Get the raw Cart object (used by OrderService during checkout).
     */
    public Cart loadCart(UUID userId) {
        String key = CART_KEY_PREFIX + userId.toString();
        Object data = redisTemplate.opsForValue().get(key);
        if (data instanceof Cart cart) {
            return cart;
        }
        return Cart.builder()
                .userId(userId.toString())
                .items(new ArrayList<>())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private void saveCart(UUID userId, Cart cart) {
        String key = CART_KEY_PREFIX + userId.toString();
        redisTemplate.opsForValue().set(key, cart, CART_TTL_DAYS, TimeUnit.DAYS);
    }

    /**
     * Build response with live prices from the catalog.
     */
    private CartResponse buildCartResponse(Cart cart) {
        BigDecimal subtotal = BigDecimal.ZERO;

        // Refresh prices from live catalog data
        for (CartItem item : cart.getItems()) {
            try {
                UUID vId = UUID.fromString(item.getVariantId());
                ProductVariant variant = variantRepository.findById(vId).orElse(null);
                if (variant != null) {
                    item.setUnitPrice(variant.getPrice());
                    item.setProductName(variant.getProduct().getName());
                    item.setVariantLabel(variant.getLabel());
                    item.setThumbnailUrl(variant.getThumbnailImageUrl());
                }
            } catch (Exception ignored) {
                // If variant lookup fails, use cached data
            }
            subtotal = subtotal.add(
                    item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        return CartResponse.builder()
                .items(cart.getItems())
                .subtotal(subtotal)
                .itemCount(cart.getItems().stream().mapToInt(CartItem::getQuantity).sum())
                .build();
    }
}
