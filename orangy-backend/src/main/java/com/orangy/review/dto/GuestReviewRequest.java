package com.orangy.review.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Review posted without an account (QR code on the gift card). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestReviewRequest {

    @NotBlank
    private String productId;

    @Min(1)
    @Max(5)
    private int rating;

    @Size(max = 1000)
    private String comment;

    @NotBlank(message = "Name is required")
    @Size(max = 80)
    private String name;

    @NotBlank(message = "City is required")
    @Size(max = 80)
    private String city;

    /** Only images hosted on our Cloudinary account are accepted. */
    @Size(max = 1000)
    @Pattern(regexp = "^$|^https://res\\.cloudinary\\.com/[\\w-]+/image/upload/.+$", message = "Invalid photo")
    private String photoUrl;
}
