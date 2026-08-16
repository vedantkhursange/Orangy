package com.orangy.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:category IS NULL OR p.category = :category) " +
           "AND (:minPrice IS NULL OR EXISTS (SELECT v FROM ProductVariant v WHERE v.product = p AND v.price >= :minPrice)) " +
           "AND (:maxPrice IS NULL OR EXISTS (SELECT v FROM ProductVariant v WHERE v.product = p AND v.price <= :maxPrice))")
    Page<Product> findFiltered(
            @Param("category") String category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    Optional<Product> findByIdAndIsActiveTrue(UUID id);
}
