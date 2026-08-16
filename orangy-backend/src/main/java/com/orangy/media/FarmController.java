package com.orangy.media;

import com.orangy.common.dto.ApiResponse;
import com.orangy.media.dto.CaretakerResponse;
import com.orangy.media.dto.MediaAssetResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
@Tag(name = "Farm & Media", description = "Public farm gallery, hero video, and caretaker profiles")
public class FarmController {

    private final MediaAssetRepository mediaAssetRepository;
    private final CaretakerRepository caretakerRepository;

    @GetMapping("/gallery")
    @Operation(summary = "Get farm gallery images")
    public ResponseEntity<ApiResponse<List<MediaAssetResponse>>> getGallery() {
        List<MediaAssetResponse> gallery = mediaAssetRepository
                .findByRefTypeOrderBySortOrderAsc(RefType.FARM_GALLERY)
                .stream()
                .map(MediaMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(gallery));
    }

    @GetMapping("/hero-video")
    @Operation(summary = "Get the hero video for the farm landing page")
    public ResponseEntity<ApiResponse<MediaAssetResponse>> getHeroVideo() {
        MediaAsset heroVideo = mediaAssetRepository.findFirstByRefType(RefType.HERO_VIDEO);
        if (heroVideo == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(MediaMapper.toResponse(heroVideo)));
    }

    @GetMapping("/caretakers")
    @Operation(summary = "Get farm caretaker profiles")
    public ResponseEntity<ApiResponse<List<CaretakerResponse>>> getCaretakers() {
        List<CaretakerResponse> caretakers = caretakerRepository
                .findAllByOrderBySortOrderAsc()
                .stream()
                .map(MediaMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(caretakers));
    }
}
