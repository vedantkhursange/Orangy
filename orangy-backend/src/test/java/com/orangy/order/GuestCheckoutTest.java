package com.orangy.order;

import com.orangy.cart.CartService;
import com.orangy.catalog.Product;
import com.orangy.catalog.ProductVariant;
import com.orangy.catalog.ProductVariantRepository;
import com.orangy.common.exception.BadRequestException;
import com.orangy.common.exception.ResourceNotFoundException;
import com.orangy.order.dto.GuestOrderRequest;
import com.orangy.order.dto.OrderResponse;
import com.orangy.order.dto.PaymentVerificationRequest;
import com.orangy.user.User;
import com.orangy.user.UserRepository;
import com.orangy.user.dto.AddressRequest;
import com.razorpay.RazorpayClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GuestCheckoutTest {

    OrderRepository orders = mock(OrderRepository.class);
    ProductVariantRepository variants = mock(ProductVariantRepository.class);
    OrderService service;
    ProductVariant variant;
    UUID variantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new OrderService(orders, mock(UserRepository.class), variants, mock(CartService.class), mock(RazorpayClient.class));
        ReflectionTestUtils.setField(service, "razorpaySecret", "placeholder");
        ReflectionTestUtils.setField(service, "razorpayKeyId", "rzp_test");
        Product product = new Product();
        product.setName("Nagpur Oranges");
        variant = new ProductVariant();
        variant.setId(variantId);
        variant.setProduct(product);
        variant.setLabel("1 kg");
        variant.setPrice(new BigDecimal("120"));
        variant.setStockCount(10);
        when(variants.findById(variantId)).thenReturn(Optional.of(variant));
        when(orders.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId(UUID.randomUUID());
            o.getItems().forEach(i -> { if (i.getId() == null) i.setId(UUID.randomUUID()); });
            return o;
        });
    }

    private GuestOrderRequest request(int... qtys) {
        AddressRequest addr = new AddressRequest("12 Grove Rd", null, "Nagpur", "Maharashtra", "440001", false);
        List<GuestOrderRequest.Line> lines = java.util.Arrays.stream(qtys)
                .mapToObj(q -> new GuestOrderRequest.Line(variantId.toString(), q)).toList();
        return new GuestOrderRequest(lines, "Asha", "9876543210", "", addr);
    }

    @Test
    void guestOrderUsesDatabasePricesMergesLinesAndReservesStock() {
        OrderResponse res = service.createGuestOrder(request(2, 3));

        assertThat(res.isGuest()).isTrue();
        assertThat(res.getCustomerName()).isEqualTo("Asha");
        assertThat(res.getCustomerPhone()).isEqualTo("9876543210");
        assertThat(res.getCustomerEmail()).isNull();
        assertThat(res.getItems()).hasSize(1);
        assertThat(res.getItems().get(0).getQuantity()).isEqualTo(5);
        assertThat(res.getSubtotal()).isEqualByComparingTo("600");
        assertThat(res.getDeliveryFee()).isEqualByComparingTo("0");
        assertThat(res.getRazorpayOrderId()).startsWith("order_mock_");
        assertThat(variant.getStockCount()).isEqualTo(5);
    }

    @Test
    void guestOrderRejectsMoreThanStock() {
        assertThatThrownBy(() -> service.createGuestOrder(request(11)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void guestCannotPayForAnAccountOrder() {
        Order owned = Order.builder().user(User.builder().id(UUID.randomUUID()).build()).build();
        when(orders.findByRazorpayOrderId("order_mock_1")).thenReturn(Optional.of(owned));
        PaymentVerificationRequest pv = new PaymentVerificationRequest();
        pv.setRazorpayOrderId("order_mock_1");
        assertThatThrownBy(() -> service.verifyPayment(null, pv)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void guestLookupNeedsMatchingPhone() {
        OrderResponse placed = service.createGuestOrder(request(1));
        Order saved = Order.builder().id(UUID.fromString(placed.getId())).guestPhone("9876543210").build();
        when(orders.findById(saved.getId())).thenReturn(Optional.of(saved));

        assertThatThrownBy(() -> service.getGuestOrder(placed.getId(), "9000000000"))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.getGuestOrder("not-a-uuid", "9876543210"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(orders, atLeastOnce()).findById(saved.getId());
    }
}
