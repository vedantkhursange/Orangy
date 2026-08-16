package com.orangy.catalog;

import com.orangy.catalog.dto.ProductCreateRequest;
import com.orangy.catalog.dto.ProductResponse;
import com.orangy.catalog.dto.VariantCreateRequest;
import com.orangy.catalog.dto.VariantResponse;
import com.orangy.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@Tag(name = "Products (Admin)", description = "Admin product management — requires ADMIN role")
public class AdminProductController {

    private final ProductService productService;

    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete a product (set inactive)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        productService.softDeleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/variants")
    @Operation(summary = "Add a variant to a product")
    public ResponseEntity<ApiResponse<VariantResponse>> addVariant(
            @PathVariable UUID id,
            @Valid @RequestBody VariantCreateRequest request) {
        VariantResponse response = productService.addVariant(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PutMapping("/variants/{variantId}")
    @Operation(summary = "Update a product variant")
    public ResponseEntity<ApiResponse<VariantResponse>> updateVariant(
            @PathVariable UUID variantId,
            @Valid @RequestBody VariantCreateRequest request) {
        VariantResponse response = productService.updateVariant(variantId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/variants/{variantId}")
    @Operation(summary = "Delete a product variant")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable UUID variantId) {
        productService.deleteVariant(variantId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
