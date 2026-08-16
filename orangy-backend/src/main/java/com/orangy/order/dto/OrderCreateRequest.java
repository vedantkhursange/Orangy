package com.orangy.order.dto;

import com.orangy.user.dto.AddressRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {

    @NotNull(message = "Delivery address is required")
    @Valid
    private AddressRequest deliveryAddress;
}
