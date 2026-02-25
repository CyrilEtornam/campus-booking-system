package com.campus.booking.dto.response;

import com.campus.booking.entity.Booking;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data @Builder
public class BookingResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long facilityId;
    private String facilityName;
    private String facilityLocation;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String purpose;
    private Integer attendees;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse from(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .userId(b.getUser().getId())
                .userName(b.getUser().getName())
                .userEmail(b.getUser().getEmail())
                .facilityId(b.getFacility().getId())
                .facilityName(b.getFacility().getName())
                .facilityLocation(b.getFacility().getLocation())
                .date(b.getDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .status(b.getStatus().name().toLowerCase())
                .purpose(b.getPurpose())
                .attendees(b.getAttendees())
                .adminNotes(b.getAdminNotes())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
