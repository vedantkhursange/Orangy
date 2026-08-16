package com.orangy.order;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderAddress {
    private String deliveryLine1;
    private String deliveryLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPincode;
}
