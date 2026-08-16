package com.orangy.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantResponse {
    private UUID id;
    private String label;
    private int quantityValue;
    private String unit;
    private BigDecimal price;
    private int stockCount;
    private String thumbnailImageUrl;
}
