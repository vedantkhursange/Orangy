package com.orangy.media;

import com.orangy.common.dto.ApiResponse;
import com.orangy.common.exception.ResourceNotFoundException;
import com.orangy.media.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Farm & Media", description = "Admin media and caretaker management")
public class AdminMediaController {

    private final MediaAssetRepository mediaAssetRepository;
    private final CaretakerRepository caretakerRepository;

    // ---- Media Assets ----

    @PostMapping("/media")
    @Operation(summary = "Create a media asset (URL-based, no file upload)")
    public ResponseEntity<ApiResponse<MediaAssetResponse>> createMedia(
            @Valid @RequestBody MediaAssetCreateRequest request) {
        MediaAsset asset = MediaAsset.builder()
                .refType(request.getRefType())
                .refId(request.getRefId())
                .url(request.getUrl())
                .type(request.getType())
                .altText(request.getAltText())
                .sortOrder(request.getSortOrder())
                .build();
        asset = mediaAssetRepository.save(asset);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(MediaMapper.toResponse(asset)));
    }

    @PutMapping("/media/{id}")
    @Operation(summary = "Update a media asset")
    public ResponseEntity<ApiResponse<MediaAssetResponse>> updateMedia(
            @PathVariable String id,
            @Valid @RequestBody MediaAssetCreateRequest request) {
        MediaAsset asset = mediaAssetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + id));
        asset.setRefType(request.getRefType());
        asset.setRefId(request.getRefId());
        asset.setUrl(request.getUrl());
        asset.setType(request.getType());
        asset.setAltText(request.getAltText());
        asset.setSortOrder(request.getSortOrder());
        asset = mediaAssetRepository.save(asset);
        return ResponseEntity.ok(ApiResponse.success(MediaMapper.toResponse(asset)));
    }

    @DeleteMapping("/media/{id}")
    @Operation(summary = "Delete a media asset")
    public ResponseEntity<ApiResponse<Void>> deleteMedia(@PathVariable String id) {
        if (!mediaAssetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Media asset not found: " + id);
        }
        mediaAssetRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ---- Caretakers ----

    @PostMapping("/caretakers")
    @Operation(summary = "Create a caretaker profile")
    public ResponseEntity<ApiResponse<CaretakerResponse>> createCaretaker(
            @Valid @RequestBody CaretakerCreateRequest request) {
        Caretaker caretaker = Caretaker.builder()
                .name(request.getName())
                .role(request.getRole())
                .bio(request.getBio())
                .photoUrl(request.getPhotoUrl())
                .yearsOfExperience(request.getYearsOfExperience())
                .sortOrder(request.getSortOrder())
                .build();
        caretaker = caretakerRepository.save(caretaker);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(MediaMapper.toResponse(caretaker)));
    }

    @PutMapping("/caretakers/{id}")
    @Operation(summary = "Update a caretaker profile")
    public ResponseEntity<ApiResponse<CaretakerResponse>> updateCaretaker(
            @PathVariable String id,
            @Valid @RequestBody CaretakerCreateRequest request) {
        Caretaker caretaker = caretakerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caretaker not found: " + id));
        caretaker.setName(request.getName());
        caretaker.setRole(request.getRole());
        caretaker.setBio(request.getBio());
        caretaker.setPhotoUrl(request.getPhotoUrl());
        caretaker.setYearsOfExperience(request.getYearsOfExperience());
        caretaker.setSortOrder(request.getSortOrder());
        caretaker = caretakerRepository.save(caretaker);
        return ResponseEntity.ok(ApiResponse.success(MediaMapper.toResponse(caretaker)));
    }

    @DeleteMapping("/caretakers/{id}")
    @Operation(summary = "Delete a caretaker profile")
    public ResponseEntity<ApiResponse<Void>> deleteCaretaker(@PathVariable String id) {
        if (!caretakerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Caretaker not found: " + id);
        }
        caretakerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
