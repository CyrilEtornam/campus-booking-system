package com.campus.booking.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100)
    private String name;

    private String studentId;

    @Size(max = 100)
    private String department;
}
