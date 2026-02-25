package com.campus.booking.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequest {

    @NotNull
    private Long facilityId;

    @NotNull
    @FutureOrPresent(message = "Booking date cannot be in the past")
    private LocalDate date;

    @NotBlank
    @Pattern(regexp = "^([0-1]\\d|2[0-3]):[0-5]\\d$", message = "startTime must be HH:mm")
    private String startTime;

    @NotBlank
    @Pattern(regexp = "^([0-1]\\d|2[0-3]):[0-5]\\d$", message = "endTime must be HH:mm")
    private String endTime;

    @Min(1)
    private Integer attendees;

    @Size(max = 500)
    private String purpose;
}
