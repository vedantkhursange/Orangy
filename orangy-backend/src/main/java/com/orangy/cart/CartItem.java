package com.orangy.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem implements Serializable {

    private String variantId;
    private String productName;
    private String variantLabel;
    private BigDecimal unitPrice;
    private int quantity;
    private String thumbnailUrl;
}
