package com.orangy.order.dto;

import com.orangy.user.dto.AddressRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Checkout without an account: the browser sends its local basket plus contact details. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestOrderRequest {

    @NotEmpty(message = "Your basket is empty")
    @Size(max = 20, message = "Too many different items in one order")
    @Valid
    private List<Line> items;

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number")
    private String phone;

    @Email(message = "Enter a valid email")
    @Size(max = 150)
    private String email;

    @NotNull(message = "Delivery address is required")
    @Valid
    private AddressRequest deliveryAddress;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Line {
        @NotBlank
        private String variantId;

        @Min(1)
        @Max(50)
        private int quantity;
    }
}
