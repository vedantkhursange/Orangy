package com.orangy.catalog.dto;

import com.orangy.catalog.Unit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VariantCreateRequest {

    @NotBlank(message = "Variant label is required")
    private String label;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantityValue;

    @NotNull(message = "Unit is required")
    private Unit unit;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @Min(value = 0, message = "Stock count cannot be negative")
    private int stockCount;

    private String thumbnailImageUrl;
}
