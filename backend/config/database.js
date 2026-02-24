/**
 * Database Configuration & Initialisation
 * =========================================
 * MVC – Data Layer foundation.
 * Uses the 'pg' library's Pool for efficient PostgreSQL connection management.
 * All Models import `pool` from here to execute queries.
 */

const { Pool } = require('pg');

// ── Connection Pool ───────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'campus_booking',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,                          // max connections in pool
  idleTimeoutMillis: 30_000,        // release idle connections after 30 s
  connectionTimeoutMillis: 5_000,   // fail fast if DB unreachable
  // Render/Railway use SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('📦 PostgreSQL pool connection established');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

// ── Schema Initialisation ────────────────────────────────────────────────────
/**
 * Creates all required tables and indexes if they don't already exist.
 * Called once on server startup before the HTTP server begins listening.
 */
const initializeDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Users table ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(100)  NOT NULL,
        email        VARCHAR(255)  UNIQUE NOT NULL,
        password     VARCHAR(255)  NOT NULL,
        role         VARCHAR(20)   NOT NULL DEFAULT 'student'
                     CHECK (role IN ('student', 'faculty', 'admin')),
        student_id   VARCHAR(50),
        department   VARCHAR(100),
        is_active    BOOLEAN       NOT NULL DEFAULT true,
        created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // ── Facilities table ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id                SERIAL PRIMARY KEY,
        name              VARCHAR(200)  NOT NULL,
        location          VARCHAR(200)  NOT NULL,
        capacity          INTEGER       NOT NULL CHECK (capacity > 0),
        description       TEXT,
        amenities         TEXT[]        NOT NULL DEFAULT '{}',
        facility_type     VARCHAR(50)   NOT NULL DEFAULT 'room'
                          CHECK (facility_type IN ('room','lab','gym','auditorium','sports','study_room')),
        image_url         VARCHAR(500),
        is_active         BOOLEAN       NOT NULL DEFAULT true,
        requires_approval BOOLEAN       NOT NULL DEFAULT false,
        created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // ── Bookings table ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id          SERIAL PRIMARY KEY,
        facility_id INTEGER       NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
        user_id     INTEGER       NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
        date        DATE          NOT NULL,
        start_time  TIME          NOT NULL,
        end_time    TIME          NOT NULL,
        purpose     VARCHAR(500),
        attendees   INTEGER       NOT NULL DEFAULT 1 CHECK (attendees > 0),
        status      VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','cancelled','rejected','completed')),
        admin_notes TEXT,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_time_range CHECK (end_time > start_time)
      )
    `);

    // ── Indexes for fast conflict-checking queries ────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_facility_date
        ON bookings(facility_id, date, status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user
        ON bookings(user_id)
    `);

    // ── auto-update updated_at trigger ───────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    for (const tbl of ['users', 'facilities', 'bookings']) {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_${tbl}_updated_at ON ${tbl};
        CREATE TRIGGER trg_${tbl}_updated_at
          BEFORE UPDATE ON ${tbl}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
    }

    await client.query('COMMIT');
    console.log('✅ Database schema ready');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database init error:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initializeDatabase };
