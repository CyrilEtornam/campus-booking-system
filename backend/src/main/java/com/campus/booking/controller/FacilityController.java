package com.campus.booking.controller;

import com.campus.booking.dto.request.FacilityRequest;
import com.campus.booking.dto.response.FacilityResponse;
import com.campus.booking.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer maxCapacity) {
        return ResponseEntity.ok(Map.of("data", facilityService.getAll(type, search, minCapacity, maxCapacity)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("data", facilityService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityResponse> create(@Valid @RequestBody FacilityRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilityService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody FacilityRequest req) {
        return ResponseEntity.ok(facilityService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
