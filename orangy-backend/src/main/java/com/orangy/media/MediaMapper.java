package com.orangy.media;

import com.orangy.media.dto.MediaAssetResponse;

/**
 * Mapping helper for media entities.
 */
public final class MediaMapper {

    private MediaMapper() {}

    public static MediaAssetResponse toResponse(MediaAsset asset) {
        return MediaAssetResponse.builder()
                .id(asset.getId())
                .refType(asset.getRefType().name())
                .refId(asset.getRefId())
                .url(asset.getUrl())
                .type(asset.getType().name())
                .altText(asset.getAltText())
                .sortOrder(asset.getSortOrder())
                .build();
    }

    public static com.orangy.media.dto.CaretakerResponse toResponse(Caretaker caretaker) {
        return com.orangy.media.dto.CaretakerResponse.builder()
                .id(caretaker.getId())
                .name(caretaker.getName())
                .role(caretaker.getRole())
                .bio(caretaker.getBio())
                .photoUrl(caretaker.getPhotoUrl())
                .yearsOfExperience(caretaker.getYearsOfExperience())
                .sortOrder(caretaker.getSortOrder())
                .build();
    }
}
