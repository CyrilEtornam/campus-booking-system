/**
 * Booking Controller  –  MVC Architecture
 * ==========================================
 * CONTROLLER layer: Handles /api/bookings endpoints.
 *
 * Key responsibilities:
 *  1. Input validation (express-validator)
 *  2. Authorisation checks (ownership, role)
 *  3. Double-booking prevention via BookingModel.checkConflicts()
 *  4. Booking approval workflow (pending → confirmed/rejected)
 *  5. Email notifications via emailService
 */

const { validationResult } = require('express-validator');
const BookingModel  = require('../models/Booking');
const FacilityModel = require('../models/Facility');
const emailService  = require('../utils/emailService');

// ── GET /api/bookings ─────────────────────────────────────────────────────────
/**
 * Returns bookings filtered by query params.
 * - Regular users only see their own bookings.
 * - Admins can see all bookings (or filter by any user).
 */
const getAllBookings = async (req, res) => {
  try {
    const { facility_id, status, date, startDate, endDate } = req.query;

    // Non-admins are automatically scoped to their own bookings
    const user_id = req.user.role === 'admin'
      ? (req.query.user_id || undefined)
      : req.user.id;

    const bookings = await BookingModel.findAll({
      user_id, facility_id, status, date, startDate, endDate,
    });

    // Also return aggregate stats alongside the list
    const stats = await BookingModel.getStats(req.user.role !== 'admin' ? req.user.id : undefined);

    res.json({ success: true, count: bookings.length, stats, data: bookings });
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only the owner or an admin may view a booking
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    console.error('getBookingById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
};

// ── POST /api/bookings ────────────────────────────────────────────────────────
/**
 * Create a new booking.
 * Steps:
 *   1. Validate request body
 *   2. Verify facility exists
 *   3. Check capacity
 *   4. Check for time-slot conflicts → 409 if overlap found
 *   5. Auto-confirm if facility doesn't require approval
 *   6. Persist booking
 *   7. Send email notification
 */
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { facility_id, date, start_time, end_time, purpose, attendees } = req.body;
    const user_id = req.user.id;

    // 1. Verify facility
    const facility = await FacilityModel.findById(facility_id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    // 2. Validate booking is not in the past
    const bookingDateTime = new Date(`${date}T${start_time}`);
    if (bookingDateTime < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book a time slot in the past.' });
    }

    // 3. Capacity check
    if (attendees && attendees > facility.capacity) {
      return res.status(400).json({
        success: false,
        message: `Attendees (${attendees}) exceed facility capacity (${facility.capacity}).`,
      });
    }

    // 4. Conflict detection – the core double-booking guard
    const conflicts = await BookingModel.checkConflicts(facility_id, date, start_time, end_time);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot overlaps with an existing booking.',
        conflicts: conflicts.map(c => ({
          id: c.id,
          start_time: c.start_time,
          end_time:   c.end_time,
          booked_by:  c.user_name,
          status:     c.status,
        })),
      });
    }

    // 5. Determine initial status
    const status = facility.requires_approval ? 'pending' : 'confirmed';

    // 6. Create booking
    const booking = await BookingModel.create({
      facility_id, user_id, date, start_time, end_time, purpose, attendees, status,
    });

    // 7. Send confirmation email (non-blocking – don't let email failure break the response)
    emailService.sendBookingConfirmation({
      to:          req.user.email,
      userName:    req.user.name,
      facilityName: facility.name,
      date, start_time, end_time, status, bookingId: booking.id,
    }).catch(e => console.warn('Email send failed:', e.message));

    res.status(201).json({
      success: true,
      message: status === 'confirmed'
        ? 'Booking confirmed!'
        : 'Booking submitted and awaiting admin approval.',
      data: { ...booking, facility_name: facility.name, facility_location: facility.location },
    });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────────────────────
/**
 * Update a booking.
 * - Regular users: may update their own pending bookings (date/time/purpose).
 * - Admins:        may update status (approve / reject / complete) + admin_notes.
 */
const updateBooking = async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isOwner = booking.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    // Regular users can only change their own pending bookings
    if (!isAdmin && booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be modified.',
      });
    }

    const { date, start_time, end_time, purpose, attendees, status, admin_notes } = req.body;

    // If changing time → re-check conflicts
    const newDate  = date       || booking.date;
    const newStart = start_time || booking.start_time;
    const newEnd   = end_time   || booking.end_time;

    if (date || start_time || end_time) {
      const conflicts = await BookingModel.checkConflicts(
        booking.facility_id, newDate, newStart, newEnd, booking.id
      );
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Updated time slot conflicts with an existing booking.',
          conflicts,
        });
      }
    }

    // Admins may change status; regular users cannot
    const newStatus = isAdmin ? status : undefined;

    const updated = await BookingModel.update(req.params.id, {
      date, start_time, end_time, purpose, attendees,
      status: newStatus, admin_notes: isAdmin ? admin_notes : undefined,
    });

    // Notify user if admin changed status
    if (isAdmin && status && status !== booking.status) {
      emailService.sendStatusUpdate({
        to:          booking.user_email,
        userName:    booking.user_name,
        facilityName: booking.facility_name,
        status,
        admin_notes,
        bookingId:   booking.id,
      }).catch(e => console.warn('Status email failed:', e.message));
    }

    res.json({ success: true, message: 'Booking updated.', data: updated });
  } catch (err) {
    console.error('updateBooking error:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking.' });
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
/**
 * Cancel a booking (sets status = 'cancelled').
 * Only the booking owner or an admin may cancel.
 */
const deleteBooking = async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    const cancelled = await BookingModel.cancel(req.params.id);

    emailService.sendCancellationNotice({
      to:          booking.user_email,
      userName:    booking.user_name,
      facilityName: booking.facility_name,
      date:        booking.date,
      start_time:  booking.start_time,
      bookingId:   booking.id,
    }).catch(e => console.warn('Cancel email failed:', e.message));

    res.json({ success: true, message: 'Booking cancelled.', data: cancelled });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
};
