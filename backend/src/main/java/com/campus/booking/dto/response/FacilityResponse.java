package com.campus.booking.dto.response;

import com.campus.booking.entity.Facility;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data @Builder
public class FacilityResponse {
    private Long id;
    private String name;
    private String location;
    private int capacity;
    private String description;
    private List<String> amenities;
    private String facilityType;
    private String imageUrl;
    private boolean requiresApproval;
    @JsonProperty("is_active")
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FacilityResponse from(Facility f) {
        return FacilityResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .location(f.getLocation())
                .capacity(f.getCapacity())
                .description(f.getDescription())
                .amenities(f.getAmenities() != null ? new ArrayList<>(f.getAmenities()) : new ArrayList<>())
                .facilityType(f.getFacilityType())
                .imageUrl(f.getImageUrl())
                .requiresApproval(f.isRequiresApproval())
                .isActive(f.isActive())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}
