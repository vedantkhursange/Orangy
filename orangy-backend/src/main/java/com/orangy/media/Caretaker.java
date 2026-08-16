package com.orangy.media;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "caretakers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Caretaker {

    @Id
    private String id;

    private String name;
    private String role;
    private String bio;
    private String photoUrl;
    private int yearsOfExperience;
    private int sortOrder;
}
