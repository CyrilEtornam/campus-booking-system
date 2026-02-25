package com.campus.booking.controller;

import com.campus.booking.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    /**
     * GET /api/availability?facility_id=1&date=2026-03-01&start_time=09:00&end_time=18:00
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSlots(
            @RequestParam("facility_id") Long facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "start_time", required = false) String startTime,
            @RequestParam(value = "end_time",   required = false) String endTime) {
        return ResponseEntity.ok(Map.of("data", availabilityService.getSlots(facilityId, date, startTime, endTime)));
    }

    /**
     * GET /api/availability/week?facility_id=1&start_date=2026-03-01
     */
    @GetMapping("/week")
    public ResponseEntity<Map<String, Object>> getWeekly(
            @RequestParam("facility_id") Long facilityId,
            @RequestParam("start_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate) {
        return ResponseEntity.ok(Map.of("data", availabilityService.getWeekly(facilityId, startDate)));
    }
}
