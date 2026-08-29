package com.orangy.catalog;

import com.orangy.catalog.dto.ProductResponse;
import com.orangy.catalog.dto.ProductSummaryResponse;
import com.orangy.catalog.dto.VariantResponse;
import com.orangy.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products (Public)", description = "Public product catalog — no auth required")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List products with optional filters and pagination")
    public ResponseEntity<ApiResponse<Page<ProductSummaryResponse>>> listProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductSummaryResponse> result = productService.listProducts(category, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/featured")
    @Operation(summary = "List admin-picked products for the homepage featured section")
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> listFeatured(
            @RequestParam(defaultValue = "4") int limit) {
        return ResponseEntity.ok(ApiResponse.success(productService.listFeatured(limit)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full product details with all variants")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable UUID id) {
        ProductResponse response = productService.getProduct(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/variants")
    @Operation(summary = "List variants for a product")
    public ResponseEntity<ApiResponse<List<VariantResponse>>> getVariants(@PathVariable UUID id) {
        List<VariantResponse> variants = productService.getVariants(id);
        return ResponseEntity.ok(ApiResponse.success(variants));
    }
}
