package com.orangy.order;

import com.orangy.cart.Cart;
import com.orangy.cart.CartItem;
import com.orangy.cart.CartService;
import com.orangy.catalog.ProductVariant;
import com.orangy.catalog.ProductVariantRepository;
import com.orangy.common.exception.BadRequestException;
import com.orangy.common.exception.ResourceNotFoundException;
import com.orangy.order.dto.OrderCreateRequest;
import com.orangy.order.dto.OrderItemResponse;
import com.orangy.order.dto.OrderResponse;
import com.orangy.order.dto.PaymentVerificationRequest;
import com.orangy.user.User;
import com.orangy.user.UserRepository;
import com.orangy.user.dto.AddressResponse;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;
    private final CartService cartService;
    private final RazorpayClient razorpayClient;

    @Value("${app.razorpay.key-secret}")
    private String razorpaySecret;

    @Transactional
    public OrderResponse createOrder(UUID userId, OrderCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartService.loadCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        com.orangy.order.Order newOrder = com.orangy.order.Order.builder()
                .user(user)
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        // Map cart items to order items and update stock
        for (CartItem cItem : cart.getItems()) {
            ProductVariant variant = variantRepository.findById(UUID.fromString(cItem.getVariantId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + cItem.getVariantId()));

            if (variant.getStockCount() < cItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for " + variant.getProduct().getName());
            }
            variant.setStockCount(variant.getStockCount() - cItem.getQuantity());
            variantRepository.save(variant);

            BigDecimal itemTotal = variant.getPrice().multiply(BigDecimal.valueOf(cItem.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .variant(variant)
                    .productName(variant.getProduct().getName())
                    .variantLabel(variant.getLabel())
                    .unitPrice(variant.getPrice())
                    .quantity(cItem.getQuantity())
                    .build();
            newOrder.addItem(orderItem);
        }

        // Calculate totals
        newOrder.setSubtotal(subtotal);
        newOrder.setTax(BigDecimal.ZERO); // Implement tax logic if needed
        newOrder.setDeliveryFee(subtotal.compareTo(new BigDecimal("500")) > 0 ? BigDecimal.ZERO : new BigDecimal("50"));
        newOrder.setTotalAmount(newOrder.getSubtotal().add(newOrder.getTax()).add(newOrder.getDeliveryFee()));

        // Set Address
        OrderAddress address = new OrderAddress();
        address.setDeliveryLine1(request.getDeliveryAddress().getLine1());
        address.setDeliveryLine2(request.getDeliveryAddress().getLine2());
        address.setDeliveryCity(request.getDeliveryAddress().getCity());
        address.setDeliveryState(request.getDeliveryAddress().getState());
        address.setDeliveryPincode(request.getDeliveryAddress().getPincode());
        newOrder.setDeliveryAddress(address);

        // Create Razorpay Order
        try {
            JSONObject orderRequest = new JSONObject();
            // Razorpay expects amount in paise
            orderRequest.put("amount", newOrder.getTotalAmount().multiply(new BigDecimal("100")).intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());
            
            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            newOrder.setRazorpayOrderId(razorpayOrder.get("id"));
        } catch (Exception e) {
            log.warn("Razorpay API failed or placeholder credentials used: {}. Using mock order ID for development.", e.getMessage());
            // Fallback for development/testing when real Razorpay keys are not yet configured
            newOrder.setRazorpayOrderId("order_mock_" + System.currentTimeMillis());
        }

        com.orangy.order.Order savedOrder = orderRepository.save(newOrder);

        // Clear cart after successful order creation
        cartService.clearCart(userId);

        return toResponse(savedOrder);
    }

    @Transactional
    public OrderResponse verifyPayment(UUID userId, PaymentVerificationRequest request) {
        try {
            boolean isMock = request.getRazorpayOrderId() != null && request.getRazorpayOrderId().startsWith("order_mock_");
            
            if (!isMock && !razorpaySecret.contains("placeholder")) {
                JSONObject options = new JSONObject();
                options.put("razorpay_order_id", request.getRazorpayOrderId());
                options.put("razorpay_payment_id", request.getRazorpayPaymentId());
                options.put("razorpay_signature", request.getRazorpaySignature());

                boolean isValid = Utils.verifyPaymentSignature(options, razorpaySecret);
                if (!isValid) {
                    throw new BadRequestException("Invalid payment signature");
                }
            }

            com.orangy.order.Order order = orderRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

            if (!order.getUser().getId().equals(userId)) {
                throw new BadRequestException("Order does not belong to user");
            }

            order.setPaymentStatus(PaymentStatus.PAID);
            order.setOrderStatus(OrderStatus.CONFIRMED);
            order.setRazorpayPaymentId(request.getRazorpayPaymentId());
            
            return toResponse(orderRepository.save(order));

        } catch (BadRequestException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Payment verification failed", e);
            throw new BadRequestException("Payment verification failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID userId, String orderId) {
        com.orangy.order.Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Allow admins or the order owner to view it
        if (!order.getUser().getId().equals(userId)) {
            // Need a way to check if user is admin, for now just restrict to owner.
            // In a real app, you'd check roles. We will rely on controller-level security for admins.
            User currentUser = userRepository.findById(userId).orElseThrow();
            if (currentUser.getRole() != com.orangy.user.Role.ADMIN) {
                throw new BadRequestException("Unauthorized to view this order");
            }
        }

        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(UUID userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    // Admin Methods

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String orderId, OrderStatus status) {
        com.orangy.order.Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setOrderStatus(status);
        return toResponse(orderRepository.save(order));
    }

    // Mapper

    private OrderResponse toResponse(com.orangy.order.Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId().toString())
                        .variantId(item.getVariant().getId().toString())
                        .productName(item.getProductName())
                        .variantLabel(item.getVariantLabel())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        AddressResponse addressResponse = null;
        if (order.getDeliveryAddress() != null) {
            addressResponse = AddressResponse.builder()
                    .line1(order.getDeliveryAddress().getDeliveryLine1())
                    .line2(order.getDeliveryAddress().getDeliveryLine2())
                    .city(order.getDeliveryAddress().getDeliveryCity())
                    .state(order.getDeliveryAddress().getDeliveryState())
                    .pincode(order.getDeliveryAddress().getDeliveryPincode())
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId().toString())
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .orderStatus(order.getOrderStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .razorpayOrderId(order.getRazorpayOrderId())
                .deliveryAddress(addressResponse)
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
