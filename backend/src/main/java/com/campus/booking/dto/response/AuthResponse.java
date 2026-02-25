package com.campus.booking.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AuthResponse {
    private String token;
    private String type;
    private UserResponse user;

    public static AuthResponse of(String token, UserResponse user) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(user)
                .build();
    }
}
