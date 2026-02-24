/**
 * User Model  –  MVC Architecture
 * =================================
 * MODEL layer: All user-related database operations live here.
 * Controllers call static methods on this class; they never write raw SQL.
 */

const { pool } = require('../config/database');
const bcrypt   = require('bcryptjs');

class UserModel {

  // ── Queries ────────────────────────────────────────────────────────────────

  /** Find user by email (includes password hash for auth checks) */
  static async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  }

  /** Find user by ID – excludes password from returned object */
  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, student_id, department, is_active, created_at
       FROM users
       WHERE id = $1 AND is_active = true`,
      [id]
    );
    return rows[0] || null;
  }

  /** Get all users (admin use) */
  static async findAll() {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, student_id, department, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return rows;
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Create a new user.
   * Password is hashed here in the model (single source of truth for hashing).
   */
  static async create({ name, email, password, role = 'student', student_id, department }) {
    const hashed = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, student_id, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, student_id, department, created_at`,
      [name, email.toLowerCase().trim(), hashed, role, student_id || null, department || null]
    );
    return rows[0];
  }

  /** Update user profile fields */
  static async update(id, { name, department, student_id }) {
    const { rows } = await pool.query(
      `UPDATE users
       SET name       = COALESCE($1, name),
           department = COALESCE($2, department),
           student_id = COALESCE($3, student_id)
       WHERE id = $4
       RETURNING id, name, email, role, student_id, department`,
      [name, department, student_id, id]
    );
    return rows[0] || null;
  }

  /** Toggle user active status (admin use) */
  static async setActive(id, isActive) {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active`,
      [isActive, id]
    );
    return rows[0] || null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Verify a plain-text password against the stored hash */
  static verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
}

module.exports = UserModel;
