package com.campus.booking.service;

import com.campus.booking.dto.request.LoginRequest;
import com.campus.booking.dto.request.RegisterRequest;
import com.campus.booking.dto.request.UpdateProfileRequest;
import com.campus.booking.dto.response.AuthResponse;
import com.campus.booking.dto.response.UserResponse;
import com.campus.booking.entity.User;
import com.campus.booking.entity.User.Role;
import com.campus.booking.exception.BadRequestException;
import com.campus.booking.exception.ConflictException;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.repository.UserRepository;
import com.campus.booking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.admin.secret}")
    private String adminSecret;

    @Transactional
    public AuthResponse register(RegisterRequest req, String adminSecretHeader) {
        // Duplicate email check
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        // Determine role
        Role role = Role.STUDENT;
        if (StringUtils.hasText(req.getRole())) {
            try {
                role = Role.valueOf(req.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + req.getRole());
            }
        }

        // Admin role gate
        if (role == Role.ADMIN) {
            if (!adminSecret.equals(adminSecretHeader)) {
                throw new BadRequestException("Invalid admin secret");
            }
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .studentId(req.getStudentId())
                .department(req.getDepartment())
                .isActive(true)
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole().name());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailAndIsActiveTrue(req.getEmail().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account deactivated");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole().name());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (StringUtils.hasText(req.getName()))       user.setName(req.getName());
        if (req.getStudentId() != null)                user.setStudentId(req.getStudentId());
        if (StringUtils.hasText(req.getDepartment()))  user.setDepartment(req.getDepartment());

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }
}
