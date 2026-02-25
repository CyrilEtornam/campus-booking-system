package com.campus.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SlotDto {
    private String start;
    private String end;
    /** available | confirmed | pending */
    private String status;
    private Long bookingId;
}
