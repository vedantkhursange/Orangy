package com.orangy.media;

import com.orangy.common.dto.ApiResponse;
import com.orangy.media.dto.MediaAssetResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@Tag(name = "Farm & Media", description = "Public media endpoints")
public class MediaController {

    private final MediaAssetRepository mediaAssetRepository;

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get all media assets for a product")
    public ResponseEntity<ApiResponse<List<MediaAssetResponse>>> getProductMedia(
            @PathVariable String productId) {
        List<MediaAssetResponse> media = mediaAssetRepository
                .findByRefTypeAndRefIdOrderBySortOrderAsc(RefType.PRODUCT, productId)
                .stream()
                .map(MediaMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(media));
    }
}
