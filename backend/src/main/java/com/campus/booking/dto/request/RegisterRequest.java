package com.campus.booking.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
    private String password;

    /** student | faculty | admin */
    private String role;

    private String studentId;

    private String department;
}
