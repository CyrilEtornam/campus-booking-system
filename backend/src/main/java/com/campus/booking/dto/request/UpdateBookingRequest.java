package com.campus.booking.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateBookingRequest {

    private LocalDate date;

    @Pattern(regexp = "^([0-1]\\d|2[0-3]):[0-5]\\d$", message = "startTime must be HH:mm")
    private String startTime;

    @Pattern(regexp = "^([0-1]\\d|2[0-3]):[0-5]\\d$", message = "endTime must be HH:mm")
    private String endTime;

    private Integer attendees;

    @Size(max = 500)
    private String purpose;

    /** Admin-only: confirmed | pending | cancelled | rejected */
    private String status;

    /** Admin-only notes */
    private String adminNotes;
}
