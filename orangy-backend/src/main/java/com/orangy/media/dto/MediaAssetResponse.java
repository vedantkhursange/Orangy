package com.orangy.media.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaAssetResponse {
    private String id;
    private String refType;
    private String refId;
    private String url;
    private String type;
    private String altText;
    private int sortOrder;
}
