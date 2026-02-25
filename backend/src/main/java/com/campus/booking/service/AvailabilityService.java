package com.campus.booking.service;

import com.campus.booking.dto.response.SlotDto;
import com.campus.booking.entity.Booking;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.repository.BookingRepository;
import com.campus.booking.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final FacilityRepository facilityRepository;
    private final BookingRepository  bookingRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final LocalTime DEFAULT_START = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_END   = LocalTime.of(22, 0);

    // ── Daily slot grid ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getSlots(Long facilityId, LocalDate date,
                                         String startStr, String endStr) {
        facilityRepository.findByIdAndIsActiveTrue(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + facilityId));

        LocalTime rangeStart = startStr != null
                ? LocalTime.parse(startStr, TIME_FMT) : DEFAULT_START;
        LocalTime rangeEnd   = endStr != null
                ? LocalTime.parse(endStr,   TIME_FMT) : DEFAULT_END;

        List<SlotDto> slots = generateSlots(rangeStart, rangeEnd);

        // Overlay booked slots
        List<Booking> booked = bookingRepository.findBookedSlots(facilityId, date);
        for (Booking b : booked) {
            for (SlotDto slot : slots) {
                LocalTime sStart = LocalTime.parse(slot.getStart(), TIME_FMT);
                LocalTime sEnd   = LocalTime.parse(slot.getEnd(),   TIME_FMT);
                // Slot overlaps booking?
                if (sStart.isBefore(b.getEndTime()) && sEnd.isAfter(b.getStartTime())) {
                    slot.setStatus(b.getStatus().name().toLowerCase());
                    slot.setBookingId(b.getId());
                }
            }
        }

        long total     = slots.size();
        long available = slots.stream().filter(s -> "available".equals(s.getStatus())).count();
        long bookedCnt = total - available;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("facilityId", facilityId);
        result.put("date", date.toString());
        result.put("slots", slots);
        result.put("summary", Map.of(
                "total", total,
                "available", available,
                "booked", bookedCnt
        ));
        return result;
    }

    // ── Weekly summary ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getWeekly(Long facilityId, LocalDate startDate) {
        facilityRepository.findByIdAndIsActiveTrue(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + facilityId));

        List<Map<String, Object>> days = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate day = startDate.plusDays(i);

            List<SlotDto> slots = generateSlots(DEFAULT_START, DEFAULT_END);
            List<Booking> booked = bookingRepository.findBookedSlots(facilityId, day);

            for (Booking b : booked) {
                for (SlotDto slot : slots) {
                    LocalTime sStart = LocalTime.parse(slot.getStart(), TIME_FMT);
                    LocalTime sEnd   = LocalTime.parse(slot.getEnd(),   TIME_FMT);
                    if (sStart.isBefore(b.getEndTime()) && sEnd.isAfter(b.getStartTime())) {
                        slot.setStatus(b.getStatus().name().toLowerCase());
                    }
                }
            }

            long total     = slots.size();
            long available = slots.stream().filter(s -> "available".equals(s.getStatus())).count();

            Map<String, Object> dayData = new LinkedHashMap<>();
            dayData.put("date",       day.toString());
            dayData.put("dayOfWeek",  day.getDayOfWeek().name());
            dayData.put("total",      total);
            dayData.put("available",  available);
            dayData.put("booked",     total - available);
            days.add(dayData);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("facilityId", facilityId);
        result.put("startDate",  startDate.toString());
        result.put("days", days);
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private List<SlotDto> generateSlots(LocalTime start, LocalTime end) {
        List<SlotDto> slots = new ArrayList<>();
        LocalTime cursor = start;
        while (cursor.plusMinutes(30).compareTo(end) <= 0) {
            slots.add(SlotDto.builder()
                    .start(cursor.format(TIME_FMT))
                    .end(cursor.plusMinutes(30).format(TIME_FMT))
                    .status("available")
                    .bookingId(null)
                    .build());
            cursor = cursor.plusMinutes(30);
        }
        return slots;
    }
}
