package com.orangy.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    Page<Review> findByProductIdAndIsApprovedTrue(UUID productId, Pageable pageable);
    Page<Review> findByUserId(UUID userId, Pageable pageable);
    boolean existsByUserIdAndProductId(UUID userId, UUID productId);
}
