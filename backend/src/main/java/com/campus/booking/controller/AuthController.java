package com.campus.booking.controller;

import com.campus.booking.dto.request.LoginRequest;
import com.campus.booking.dto.request.RegisterRequest;
import com.campus.booking.dto.request.UpdateProfileRequest;
import com.campus.booking.dto.response.AuthResponse;
import com.campus.booking.dto.response.UserResponse;
import com.campus.booking.entity.User;
import com.campus.booking.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest req,
            @RequestHeader(value = "x-admin-secret", required = false) String adminSecret) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", authService.register(req, adminSecret)));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(Map.of("data", authService.login(req)));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("data", authService.getProfile(user.getId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(Map.of("data", authService.updateProfile(user.getId(), req)));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }
}
