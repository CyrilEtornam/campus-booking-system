/**
 * Facility Model  –  MVC Architecture
 * ======================================
 * MODEL layer: All facility-related database operations.
 * Supports filtering, CRUD, and joins with booking counts.
 */

const { pool } = require('../config/database');

class FacilityModel {

  /**
   * Get all active facilities.
   * Supports optional query filters: type, search (name/location), min/max capacity.
   * Also returns upcoming_bookings count via LEFT JOIN for dashboard display.
   */
  static async findAll({ type, search, minCapacity, maxCapacity } = {}) {
    const params  = [];
    let   idx     = 1;
    let   where   = 'WHERE f.is_active = true';

    if (type) {
      where += ` AND f.facility_type = $${idx++}`;
      params.push(type);
    }
    if (search) {
      where += ` AND (f.name ILIKE $${idx} OR f.location ILIKE $${idx} OR f.description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (minCapacity) {
      where += ` AND f.capacity >= $${idx++}`;
      params.push(parseInt(minCapacity));
    }
    if (maxCapacity) {
      where += ` AND f.capacity <= $${idx++}`;
      params.push(parseInt(maxCapacity));
    }

    const { rows } = await pool.query(
      `SELECT f.*,
              COUNT(b.id) FILTER (
                WHERE b.status IN ('confirmed','pending') AND b.date >= CURRENT_DATE
              ) AS upcoming_bookings
       FROM   facilities f
       LEFT JOIN bookings b ON b.facility_id = f.id
       ${where}
       GROUP BY f.id
       ORDER BY f.name ASC`,
      params
    );
    return rows;
  }

  /** Get a single facility by ID */
  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM facilities WHERE id = $1 AND is_active = true`,
      [id]
    );
    return rows[0] || null;
  }

  /** Create a new facility (admin only) */
  static async create({ name, location, capacity, description, amenities, facility_type, image_url, requires_approval }) {
    const { rows } = await pool.query(
      `INSERT INTO facilities
         (name, location, capacity, description, amenities, facility_type, image_url, requires_approval)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        name, location, capacity,
        description   || null,
        amenities     || [],
        facility_type || 'room',
        image_url     || null,
        requires_approval || false,
      ]
    );
    return rows[0];
  }

  /** Partial update – only provided fields are changed (COALESCE pattern) */
  static async update(id, { name, location, capacity, description, amenities, facility_type, image_url, requires_approval, is_active }) {
    const { rows } = await pool.query(
      `UPDATE facilities
       SET name              = COALESCE($1,  name),
           location          = COALESCE($2,  location),
           capacity          = COALESCE($3,  capacity),
           description       = COALESCE($4,  description),
           amenities         = COALESCE($5,  amenities),
           facility_type     = COALESCE($6,  facility_type),
           image_url         = COALESCE($7,  image_url),
           requires_approval = COALESCE($8,  requires_approval),
           is_active         = COALESCE($9,  is_active)
       WHERE id = $10
       RETURNING *`,
      [name, location, capacity, description, amenities, facility_type, image_url, requires_approval, is_active, id]
    );
    return rows[0] || null;
  }

  /** Soft-delete: mark is_active = false instead of destroying the row */
  static async delete(id) {
    const { rows } = await pool.query(
      `UPDATE facilities SET is_active = false WHERE id = $1 RETURNING id`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = FacilityModel;
