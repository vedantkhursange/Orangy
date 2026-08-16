package com.orangy.media.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaretakerResponse {
    private String id;
    private String name;
    private String role;
    private String bio;
    private String photoUrl;
    private int yearsOfExperience;
    private int sortOrder;
}
