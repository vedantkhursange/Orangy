package com.orangy.media.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaretakerCreateRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String role;
    private String bio;
    private String photoUrl;
    private int yearsOfExperience;
    private int sortOrder;
}
