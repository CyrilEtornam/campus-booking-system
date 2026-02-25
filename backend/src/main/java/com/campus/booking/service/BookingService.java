package com.campus.booking.service;

import com.campus.booking.dto.request.BookingRequest;
import com.campus.booking.dto.request.UpdateBookingRequest;
import com.campus.booking.dto.response.BookingResponse;
import com.campus.booking.entity.Booking;
import com.campus.booking.entity.Booking.Status;
import com.campus.booking.entity.Facility;
import com.campus.booking.entity.User;
import com.campus.booking.entity.User.Role;
import com.campus.booking.exception.BadRequestException;
import com.campus.booking.exception.ConflictException;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.repository.BookingRepository;
import com.campus.booking.repository.FacilityRepository;
import com.campus.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── List / Get ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getAll(User currentUser) {
        List<Booking> bookings = currentUser.getRole() == Role.ADMIN
                ? bookingRepository.findAllByOrderByCreatedAtDesc()
                : bookingRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId());

        List<BookingResponse> list = bookings.stream().map(BookingResponse::from).toList();

        Long uid = currentUser.getRole() == Role.ADMIN ? null : currentUser.getId();
        List<Object[]> statsList = bookingRepository.getStats(uid, LocalDate.now());
        Object[] stats = statsList.isEmpty() ? new Object[]{0L, 0L, 0L, 0L, 0L} : statsList.get(0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", list);
        result.put("stats", buildStats(stats));
        return result;
    }

    @Transactional(readOnly = true)
    public BookingResponse getById(Long id, User currentUser) {
        Booking b = findBooking(id);
        enforceOwnerOrAdmin(b, currentUser);
        return BookingResponse.from(b);
    }

    // ── Create ────────────────────────────────────────────────────────

    @Transactional
    public BookingResponse create(BookingRequest req, User currentUser) {
        Facility facility = facilityRepository.findByIdAndIsActiveTrue(req.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Facility not found: " + req.getFacilityId()));

        LocalTime start = LocalTime.parse(req.getStartTime(), TIME_FMT);
        LocalTime end   = LocalTime.parse(req.getEndTime(),   TIME_FMT);

        // Time validation
        if (!end.isAfter(start)) {
            throw new BadRequestException("End time must be after start time");
        }
        long durationHours = ChronoUnit.HOURS.between(start, end);
        if (durationHours > 8) {
            throw new BadRequestException("Booking duration cannot exceed 8 hours");
        }

        // Past date guard (entity annotation handles future/present on date field,
        // but let's keep an explicit check for safety)
        if (req.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Booking date cannot be in the past");
        }

        // Capacity check
        if (req.getAttendees() != null && req.getAttendees() > facility.getCapacity()) {
            throw new BadRequestException(
                    "Attendees (" + req.getAttendees() + ") exceed facility capacity ("
                    + facility.getCapacity() + ")");
        }

        // Conflict check
        List<Booking> conflicts = bookingRepository.findConflicts(
                facility.getId(), req.getDate(), start, end, null);
        if (!conflicts.isEmpty()) {
            throw new ConflictException(
                    "This facility is already booked during the requested time");
        }

        Status status = facility.isRequiresApproval() ? Status.PENDING : Status.CONFIRMED;

        Booking booking = Booking.builder()
                .user(currentUser)
                .facility(facility)
                .date(req.getDate())
                .startTime(start)
                .endTime(end)
                .status(status)
                .purpose(req.getPurpose())
                .attendees(req.getAttendees())
                .build();

        booking = bookingRepository.save(booking);

        // Fire-and-forget email
        final Booking saved = booking;
        emailService.sendBookingConfirmation(saved);

        return BookingResponse.from(booking);
    }

    // ── Update ────────────────────────────────────────────────────────

    @Transactional
    public BookingResponse update(Long id, UpdateBookingRequest req, User currentUser) {
        Booking booking = findBooking(id);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        // Non-admins can only edit their own pending bookings
        if (!isAdmin) {
            if (!booking.getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied");
            }
            if (booking.getStatus() != Status.PENDING) {
                throw new BadRequestException("Only pending bookings can be modified");
            }
        }

        // Time change → re-run conflict check
        if (req.getStartTime() != null || req.getEndTime() != null) {
            LocalTime newStart = req.getStartTime() != null
                    ? LocalTime.parse(req.getStartTime(), TIME_FMT) : booking.getStartTime();
            LocalTime newEnd   = req.getEndTime() != null
                    ? LocalTime.parse(req.getEndTime(), TIME_FMT)   : booking.getEndTime();

            if (!newEnd.isAfter(newStart))
                throw new BadRequestException("End time must be after start time");

            LocalDate newDate = req.getDate() != null ? req.getDate() : booking.getDate();

            List<Booking> conflicts = bookingRepository.findConflicts(
                    booking.getFacility().getId(), newDate, newStart, newEnd, booking.getId());
            if (!conflicts.isEmpty())
                throw new ConflictException("Facility already booked during the requested time");

            booking.setStartTime(newStart);
            booking.setEndTime(newEnd);
            if (req.getDate() != null) booking.setDate(req.getDate());
        } else if (req.getDate() != null) {
            booking.setDate(req.getDate());
        }

        if (req.getPurpose()   != null) booking.setPurpose(req.getPurpose());
        if (req.getAttendees() != null) booking.setAttendees(req.getAttendees());

        // Admin extras
        if (isAdmin) {
            if (StringUtils.hasText(req.getAdminNotes())) booking.setAdminNotes(req.getAdminNotes());
            if (StringUtils.hasText(req.getStatus())) {
                try {
                    booking.setStatus(Status.valueOf(req.getStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid status: " + req.getStatus());
                }
            }
        }

        booking = bookingRepository.save(booking);

        // Status-update email (admin changed status)
        if (isAdmin && StringUtils.hasText(req.getStatus())) {
            emailService.sendStatusUpdate(booking);
        }

        return BookingResponse.from(booking);
    }

    // ── Cancel ────────────────────────────────────────────────────────

    @Transactional
    public void cancel(Long id, User currentUser) {
        Booking booking = findBooking(id);
        enforceOwnerOrAdmin(booking, currentUser);

        booking.setStatus(Status.CANCELLED);
        bookingRepository.save(booking);

        emailService.sendCancellationNotice(booking);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private Booking findBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
    }

    private void enforceOwnerOrAdmin(Booking b, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN
                && !b.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private Map<String, Object> buildStats(Object[] row) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total",     row[0] != null ? ((Number) row[0]).longValue() : 0L);
        stats.put("confirmed", row[1] != null ? ((Number) row[1]).longValue() : 0L);
        stats.put("pending",   row[2] != null ? ((Number) row[2]).longValue() : 0L);
        stats.put("cancelled", row[3] != null ? ((Number) row[3]).longValue() : 0L);
        stats.put("upcoming",  row[4] != null ? ((Number) row[4]).longValue() : 0L);
        return stats;
    }
}
