package com.orangy.review;

import com.orangy.catalog.Product;
import com.orangy.catalog.ProductRepository;
import com.orangy.common.exception.BadRequestException;
import com.orangy.common.exception.ResourceNotFoundException;
import com.orangy.review.dto.ReviewCreateRequest;
import com.orangy.review.dto.ReviewResponse;
import com.orangy.user.User;
import com.orangy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse addReview(UUID userId, ReviewCreateRequest request) {
        UUID productId = UUID.fromString(request.getProductId());

        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new BadRequestException("You have already reviewed this product");
        }
        // Additional check: Ensure user actually purchased the product before reviewing.
        // For now, we skip that strict check to allow simple testing, but in a real app
        // you would verify against OrderRepository.

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .isApproved(false) // Needs moderation
                .build();

        return toResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getApprovedReviewsForProduct(String productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrue(UUID.fromString(productId), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getUserReviews(UUID userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    // Admin Methods

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public ReviewResponse updateReviewStatus(String reviewId, boolean isApproved) {
        Review review = reviewRepository.findById(UUID.fromString(reviewId))
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setApproved(isApproved);
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(String reviewId) {
        if (!reviewRepository.existsById(UUID.fromString(reviewId))) {
            throw new ResourceNotFoundException("Review not found");
        }
        reviewRepository.deleteById(UUID.fromString(reviewId));
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId().toString())
                .productId(review.getProduct().getId().toString())
                .userName(review.getUser().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .isApproved(review.isApproved())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
