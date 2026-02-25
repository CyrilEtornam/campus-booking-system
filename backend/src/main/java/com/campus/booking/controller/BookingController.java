package com.campus.booking.controller;

import com.campus.booking.dto.request.BookingRequest;
import com.campus.booking.dto.request.UpdateBookingRequest;
import com.campus.booking.dto.response.BookingResponse;
import com.campus.booking.entity.User;
import com.campus.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getAll(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody BookingRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(req, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingResponse> update(
            @PathVariable Long id,
            @RequestBody UpdateBookingRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.update(id, req, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        bookingService.cancel(id, user);
        return ResponseEntity.noContent().build();
    }
}
