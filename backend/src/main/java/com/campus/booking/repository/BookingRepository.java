package com.campus.booking.repository;

import com.campus.booking.entity.Booking;
import com.campus.booking.entity.Booking.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long>,
        JpaSpecificationExecutor<Booking> {

    /**
     * Allen's interval overlap: bStart < reqEnd AND bEnd > reqStart
     * Scoped to facility + date, ignoring CANCELLED / REJECTED.
     * Optionally excludes a booking id (for updates).
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.facility.id = :facilityId
          AND b.date = :date
          AND b.status IN ('confirmed', 'pending')
          AND b.startTime < :endTime
          AND b.endTime > :startTime
          AND (:excludeId IS NULL OR b.id <> :excludeId)
        """)
    List<Booking> findConflicts(
            @Param("facilityId") Long facilityId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);

    /**
     * Returns booked slots (start + end + status) for an availability grid.
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.facility.id = :facilityId
          AND b.date = :date
          AND b.status IN ('confirmed', 'pending')
        ORDER BY b.startTime
        """)
    List<Booking> findBookedSlots(
            @Param("facilityId") Long facilityId,
            @Param("date") LocalDate date);

    /**
     * Stats aggregation per user (or all users if userId is null).
     * Returns Object[] {total, confirmed, pending, cancelled, upcoming}
     */
    @Query("""
        SELECT
            COUNT(b),
            SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END),
            SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END),
            SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END),
            SUM(CASE WHEN b.status = 'confirmed' AND b.date >= :today THEN 1 ELSE 0 END)
        FROM Booking b
        WHERE (:userId IS NULL OR b.user.id = :userId)
        """)
    List<Object[]> getStats(@Param("userId") Long userId, @Param("today") LocalDate today);

    List<Booking> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByFacility_IdAndDateAndStatusIn(Long facilityId, LocalDate date, List<Status> statuses);
}
