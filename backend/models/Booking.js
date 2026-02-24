/**
 * Booking Model  –  MVC Architecture
 * =====================================
 * MODEL layer: Core business logic for bookings.
 *
 * Key responsibility: double-booking prevention via checkConflicts().
 * All time-range overlap detection is centralised here so no controller
 * can accidentally bypass it.
 *
 * Overlap logic (Allen's interval algebra – overlapping cases):
 *   A starts during B  →  B.start <= A.start < B.end
 *   A ends   during B  →  B.start < A.end   <= B.end
 *   A contains      B  →  A.start <= B.start AND A.end >= B.end
 *   Combined into one WHERE clause below.
 */

const { pool } = require('../config/database');

class BookingModel {

  // ── Conflict Detection ────────────────────────────────────────────────────

  /**
   * Returns all active (pending/confirmed) bookings that overlap with the
   * requested [start_time, end_time) window on a given facility + date.
   *
   * @param {number}  facility_id
   * @param {string}  date           'YYYY-MM-DD'
   * @param {string}  start_time     'HH:MM'
   * @param {string}  end_time       'HH:MM'
   * @param {number}  [exclude_id]   Exclude this booking ID (used during updates)
   * @returns {Array} conflicting booking rows (empty → safe to book)
   */
  static async checkConflicts(facility_id, date, start_time, end_time, exclude_id = null) {
    const params = [facility_id, date, start_time, end_time];
    let exclusion = '';
    if (exclude_id) {
      exclusion = ` AND b.id != $5`;
      params.push(exclude_id);
    }

    const { rows } = await pool.query(
      `SELECT b.*, u.name AS user_name, u.email AS user_email
       FROM   bookings b
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.facility_id = $1
         AND  b.date        = $2
         AND  b.status      IN ('confirmed','pending')
         AND  (
           b.start_time < $4   -- existing starts before requested end
           AND
           b.end_time   > $3   -- existing ends after requested start
         )
       ${exclusion}`,
      params
    );
    return rows;
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /**
   * Get bookings with rich joined data.
   * Supports optional filters: user_id, facility_id, status, exact date,
   * or date range (startDate / endDate).
   */
  static async findAll({ user_id, facility_id, status, date, startDate, endDate } = {}) {
    const params = [];
    let   idx    = 1;
    let   where  = 'WHERE 1=1';

    if (user_id) {
      where += ` AND b.user_id = $${idx++}`;
      params.push(user_id);
    }
    if (facility_id) {
      where += ` AND b.facility_id = $${idx++}`;
      params.push(facility_id);
    }
    if (status) {
      where += ` AND b.status = $${idx++}`;
      params.push(status);
    }
    if (date) {
      where += ` AND b.date = $${idx++}`;
      params.push(date);
    }
    if (startDate) {
      where += ` AND b.date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      where += ` AND b.date <= $${idx++}`;
      params.push(endDate);
    }

    const { rows } = await pool.query(
      `SELECT b.*,
              f.name     AS facility_name,
              f.location AS facility_location,
              f.capacity AS facility_capacity,
              u.name     AS user_name,
              u.email    AS user_email,
              u.student_id AS user_student_id
       FROM   bookings   b
       JOIN   facilities f ON f.id = b.facility_id
       JOIN   users      u ON u.id = b.user_id
       ${where}
       ORDER BY b.date ASC, b.start_time ASC`,
      params
    );
    return rows;
  }

  /** Get single booking with joined facility & user data */
  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT b.*,
              f.name             AS facility_name,
              f.location         AS facility_location,
              f.capacity         AS facility_capacity,
              f.requires_approval,
              u.name             AS user_name,
              u.email            AS user_email
       FROM   bookings   b
       JOIN   facilities f ON f.id = b.facility_id
       JOIN   users      u ON u.id = b.user_id
       WHERE  b.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Return all booked time slots for a facility on a date.
   * Used by the availability endpoint to generate the slot grid.
   */
  static async getBookedSlots(facility_id, date) {
    const { rows } = await pool.query(
      `SELECT b.start_time, b.end_time, b.status, u.name AS booked_by
       FROM   bookings b
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.facility_id = $1
         AND  b.date        = $2
         AND  b.status      IN ('confirmed','pending')
       ORDER BY b.start_time ASC`,
      [facility_id, date]
    );
    return rows;
  }

  /** Aggregate stats – optionally scoped to a user */
  static async getStats(user_id = null) {
    const params = [];
    const where  = user_id ? 'WHERE user_id = $1' : '';
    if (user_id) params.push(user_id);

    const { rows } = await pool.query(
      `SELECT COUNT(*)                                                        AS total,
              COUNT(*) FILTER (WHERE status = 'confirmed')                    AS confirmed,
              COUNT(*) FILTER (WHERE status = 'pending')                      AS pending,
              COUNT(*) FILTER (WHERE status = 'cancelled')                    AS cancelled,
              COUNT(*) FILTER (WHERE status IN ('confirmed','pending')
                                 AND date >= CURRENT_DATE)                    AS upcoming
       FROM bookings ${where}`,
      params
    );
    return rows[0];
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Insert a new booking row */
  static async create({ facility_id, user_id, date, start_time, end_time, purpose, attendees, status }) {
    const { rows } = await pool.query(
      `INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, purpose, attendees, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [facility_id, user_id, date, start_time, end_time,
       purpose || null, attendees || 1, status || 'pending']
    );
    return rows[0];
  }

  /** Partial update using COALESCE – only supplied fields change */
  static async update(id, { date, start_time, end_time, purpose, attendees, status, admin_notes }) {
    const { rows } = await pool.query(
      `UPDATE bookings
       SET date        = COALESCE($1, date),
           start_time  = COALESCE($2, start_time),
           end_time    = COALESCE($3, end_time),
           purpose     = COALESCE($4, purpose),
           attendees   = COALESCE($5, attendees),
           status      = COALESCE($6, status),
           admin_notes = COALESCE($7, admin_notes)
       WHERE id = $8
       RETURNING *`,
      [date, start_time, end_time, purpose, attendees, status, admin_notes, id]
    );
    return rows[0] || null;
  }

  /** Soft-cancel: sets status = 'cancelled' (preserves history) */
  static async cancel(id) {
    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = BookingModel;
