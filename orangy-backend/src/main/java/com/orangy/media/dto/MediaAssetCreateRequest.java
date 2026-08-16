package com.orangy.media.dto;

import com.orangy.media.MediaType;
import com.orangy.media.RefType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MediaAssetCreateRequest {

    @NotNull(message = "Reference type is required")
    private RefType refType;

    /** Nullable — required only when refType=PRODUCT */
    private String refId;

    @NotBlank(message = "URL is required")
    private String url;

    @NotNull(message = "Media type is required")
    private MediaType type;

    private String altText;
    private int sortOrder;
}
