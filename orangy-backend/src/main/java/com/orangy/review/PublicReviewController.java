package com.orangy.review;

import com.orangy.common.dto.ApiResponse;
import com.orangy.review.dto.GuestReviewRequest;
import com.orangy.review.dto.ReviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/reviews")
@RequiredArgsConstructor
@Tag(name = "Guest reviews", description = "Reviews without login (gift card QR)")
public class PublicReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Submit a review without an account")
    public ResponseEntity<ApiResponse<ReviewResponse>> submit(@Valid @RequestBody GuestReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(reviewService.addGuestReview(request)));
    }
}
