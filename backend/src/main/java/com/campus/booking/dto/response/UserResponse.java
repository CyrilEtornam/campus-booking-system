package com.campus.booking.dto.response;

import com.campus.booking.entity.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String studentId;
    private String department;
    @JsonProperty("is_active")
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserResponse from(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole().name().toLowerCase())
                .studentId(u.getStudentId())
                .department(u.getDepartment())
                .isActive(u.isActive())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
