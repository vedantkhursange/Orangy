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
public class ProductSummaryResponse {
    private UUID id;
    private String name;
    private String description;
    private String category;
    private BigDecimal startingPrice;
    private String thumbnailUrl;
    private boolean featured;
}
