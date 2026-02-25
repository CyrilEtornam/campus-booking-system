package com.campus.booking.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class FacilityRequest {

    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @NotBlank
    @Size(min = 2, max = 200)
    private String location;

    @NotNull
    @Min(1)
    private Integer capacity;

    private String description;

    private List<String> amenities;

    /** lab | auditorium | study_room | room | sports | gym | other */
    private String facilityType;

    private String imageUrl;

    private boolean requiresApproval;
}
