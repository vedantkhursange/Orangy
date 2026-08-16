package com.orangy.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    private String id;
    private String productId;
    private String userId;
    private String userName;
    private int rating;
    private String comment;
    private boolean isApproved;
    private LocalDateTime createdAt;
}
