package com.orangy.catalog;

import com.orangy.catalog.dto.*;
import com.orangy.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    public Page<ProductSummaryResponse> listProducts(String category, BigDecimal minPrice,
                                                      BigDecimal maxPrice, Pageable pageable) {
        return productRepository.findFiltered(category, minPrice, maxPrice, pageable)
                .map(this::toSummary);
    }

    public ProductResponse getProduct(UUID id) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toFullResponse(product);
    }

    public List<VariantResponse> getVariants(UUID productId) {
        productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        return variantRepository.findByProductId(productId).stream()
                .map(this::toVariantResponse)
                .collect(Collectors.toList());
    }

    // ---- Admin operations ----

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .organicCertified(request.isOrganicCertified())
                .farmSource(request.getFarmSource())
                .isActive(true)
                .build();
        product = productRepository.save(product);
        return toFullResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, ProductCreateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setOrganicCertified(request.isOrganicCertified());
        product.setFarmSource(request.getFarmSource());
        product = productRepository.save(product);
        return toFullResponse(product);
    }

    @Transactional
    public void softDeleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public VariantResponse addVariant(UUID productId, VariantCreateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .label(request.getLabel())
                .quantityValue(request.getQuantityValue())
                .unit(request.getUnit())
                .price(request.getPrice())
                .stockCount(request.getStockCount())
                .thumbnailImageUrl(request.getThumbnailImageUrl())
                .build();
        variant = variantRepository.save(variant);
        return toVariantResponse(variant);
    }

    @Transactional
    public VariantResponse updateVariant(UUID variantId, VariantCreateRequest request) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + variantId));
        variant.setLabel(request.getLabel());
        variant.setQuantityValue(request.getQuantityValue());
        variant.setUnit(request.getUnit());
        variant.setPrice(request.getPrice());
        variant.setStockCount(request.getStockCount());
        variant.setThumbnailImageUrl(request.getThumbnailImageUrl());
        variant = variantRepository.save(variant);
        return toVariantResponse(variant);
    }

    @Transactional
    public void deleteVariant(UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + variantId));
        variantRepository.delete(variant);
    }

    // ---- Mapping helpers ----

    private ProductSummaryResponse toSummary(Product product) {
        BigDecimal startingPrice = product.getVariants().stream()
                .map(ProductVariant::getPrice)
                .min(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);

        String thumbnail = product.getVariants().stream()
                .filter(v -> v.getThumbnailImageUrl() != null)
                .map(ProductVariant::getThumbnailImageUrl)
                .findFirst()
                .orElse(null);

        return ProductSummaryResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .category(product.getCategory())
                .startingPrice(startingPrice)
                .thumbnailUrl(thumbnail)
                .build();
    }

    public ProductResponse toFullResponse(Product product) {
        List<VariantResponse> variants = product.getVariants().stream()
                .map(this::toVariantResponse)
                .collect(Collectors.toList());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .category(product.getCategory())
                .organicCertified(product.isOrganicCertified())
                .farmSource(product.getFarmSource())
                .active(product.isActive())
                .variants(variants)
                .build();
    }

    public VariantResponse toVariantResponse(ProductVariant variant) {
        return VariantResponse.builder()
                .id(variant.getId())
                .label(variant.getLabel())
                .quantityValue(variant.getQuantityValue())
                .unit(variant.getUnit().name())
                .price(variant.getPrice())
                .stockCount(variant.getStockCount())
                .thumbnailImageUrl(variant.getThumbnailImageUrl())
                .build();
    }
}
