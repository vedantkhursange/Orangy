package com.orangy.media;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "media_assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaAsset {

    @Id
    private String id;

    private RefType refType;

    /** Nullable — links to product id if refType=PRODUCT */
    private String refId;

    private String url;

    private MediaType type;

    private String altText;

    private int sortOrder;
}
