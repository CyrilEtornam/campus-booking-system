/**
 * Database Seeder
 * ================
 * Run: node scripts/seed.js
 *
 * Populates the database with:
 *  - 1 admin user (admin@campus.edu / Admin1234)
 *  - 3 faculty users
 *  - 4 student users
 *  - 8 diverse facilities
 *  - Sample bookings across multiple facilities
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool, initializeDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

// ── Seed data ─────────────────────────────────────────────────────────────────

const USERS = [
  { name: 'System Admin',       email: 'admin@campus.edu',    password: 'Admin1234',   role: 'admin',   department: 'IT' },
  { name: 'Dr. Alice Johnson',  email: 'alice@campus.edu',    password: 'Faculty123',  role: 'faculty', department: 'Computer Science' },
  { name: 'Dr. Bob Williams',   email: 'bob@campus.edu',      password: 'Faculty123',  role: 'faculty', department: 'Electrical Engineering' },
  { name: 'Prof. Carol Davis',  email: 'carol@campus.edu',    password: 'Faculty123',  role: 'faculty', department: 'Mathematics' },
  { name: 'Dave Student',       email: 'dave@student.edu',    password: 'Student123',  role: 'student', student_id: 'STU001', department: 'Computer Science' },
  { name: 'Eve Student',        email: 'eve@student.edu',     password: 'Student123',  role: 'student', student_id: 'STU002', department: 'Electrical Engineering' },
  { name: 'Frank Student',      email: 'frank@student.edu',   password: 'Student123',  role: 'student', student_id: 'STU003', department: 'Mathematics' },
  { name: 'Grace Student',      email: 'grace@student.edu',   password: 'Student123',  role: 'student', student_id: 'STU004', department: 'Physics' },
];

const FACILITIES = [
  {
    name: 'Engineering Lab A',
    location: 'Engineering Building, Room 101',
    capacity: 30,
    description: 'Fully equipped computer lab with 30 workstations, high-speed internet, and dual monitors. Ideal for programming labs and technical workshops.',
    amenities: ['Computers', 'Projector', 'Whiteboard', 'Air Conditioning', 'High-speed WiFi'],
    facility_type: 'lab',
    requires_approval: false,
  },
  {
    name: 'Main Auditorium',
    location: 'Student Union Building',
    capacity: 500,
    description: 'Large auditorium with stadium seating, state-of-the-art sound system, and stage lighting. Perfect for conferences, graduations, and large events.',
    amenities: ['Stage', 'PA System', 'Lighting Rig', 'Projector Screen', 'Microphones', 'Recording Equipment'],
    facility_type: 'auditorium',
    requires_approval: true,
  },
  {
    name: 'Study Room 1',
    location: 'Library, 2nd Floor',
    capacity: 8,
    description: 'Quiet study room with whiteboard and collaborative workspace. Bookable in 1-hour slots.',
    amenities: ['Whiteboard', 'TV Screen', 'HDMI Cable', 'Air Conditioning'],
    facility_type: 'study_room',
    requires_approval: false,
  },
  {
    name: 'Study Room 2',
    location: 'Library, 2nd Floor',
    capacity: 6,
    description: 'Small collaborative study room. Great for group projects and tutoring sessions.',
    amenities: ['Whiteboard', 'TV Screen', 'HDMI Cable'],
    facility_type: 'study_room',
    requires_approval: false,
  },
  {
    name: 'Sports Hall',
    location: 'Recreation Centre',
    capacity: 100,
    description: 'Multi-purpose sports hall suitable for basketball, volleyball, badminton, and indoor events. Hardwood flooring with full court markings.',
    amenities: ['Basketball Hoops', 'Volleyball Net', 'Badminton Nets', 'Changing Rooms', 'Scoreboard'],
    facility_type: 'sports',
    requires_approval: true,
  },
  {
    name: 'Seminar Room B',
    location: 'Science Block, Room 204',
    capacity: 40,
    description: 'Modern seminar room with tiered seating and full AV equipment. Suitable for lectures, seminars, and presentations.',
    amenities: ['Projector', 'Smartboard', 'Microphone', 'Video Conferencing', 'Air Conditioning'],
    facility_type: 'room',
    requires_approval: false,
  },
  {
    name: 'Research Lab 3',
    location: 'Science Block, Room 305',
    capacity: 20,
    description: 'Specialised research lab with scientific equipment. Requires safety induction before first booking.',
    amenities: ['Lab Equipment', 'Fume Hoods', 'Safety Showers', 'First Aid Kit', 'Internet'],
    facility_type: 'lab',
    requires_approval: true,
  },
  {
    name: 'Fitness Centre',
    location: 'Recreation Centre, Lower Ground',
    capacity: 50,
    description: 'Fully equipped fitness centre with cardio machines, free weights, and resistance equipment.',
    amenities: ['Treadmills', 'Bikes', 'Free Weights', 'Resistance Machines', 'Changing Rooms', 'Lockers'],
    facility_type: 'gym',
    requires_approval: false,
  },
];

// ── Seeder logic ──────────────────────────────────────────────────────────────

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');
    await initializeDatabase();

    await client.query('BEGIN');

    // Clear existing data (in reverse FK order)
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM facilities');
    await client.query('DELETE FROM users');

    // Reset sequences
    await client.query(`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
    await client.query(`ALTER SEQUENCE facilities_id_seq RESTART WITH 1`);
    await client.query(`ALTER SEQUENCE bookings_id_seq RESTART WITH 1`);

    // ── Insert users ─────────────────────────────────────────────────────────
    const userIds = [];
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 12);
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password, role, student_id, department)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [u.name, u.email, hash, u.role, u.student_id || null, u.department || null]
      );
      userIds.push(rows[0].id);
      console.log(`  👤 Created user: ${u.name} (${u.email})`);
    }

    // ── Insert facilities ─────────────────────────────────────────────────────
    const facilityIds = [];
    for (const f of FACILITIES) {
      const { rows } = await client.query(
        `INSERT INTO facilities (name, location, capacity, description, amenities, facility_type, requires_approval)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [f.name, f.location, f.capacity, f.description, f.amenities, f.facility_type, f.requires_approval]
      );
      facilityIds.push(rows[0].id);
      console.log(`  🏢 Created facility: ${f.name}`);
    }

    // ── Insert sample bookings ────────────────────────────────────────────────
    // Build relative dates so they're always in the future
    const today = new Date();
    const fmtDate = (d) => d.toISOString().slice(0, 10);

    const tomorrow   = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const in2days    = new Date(today); in2days.setDate(today.getDate() + 2);
    const in3days    = new Date(today); in3days.setDate(today.getDate() + 3);
    const in5days    = new Date(today); in5days.setDate(today.getDate() + 5);
    const in7days    = new Date(today); in7days.setDate(today.getDate() + 7);
    const yesterday  = new Date(today); yesterday.setDate(today.getDate() - 1);

    const BOOKINGS = [
      // Engineering Lab A
      { fIdx: 0, uIdx: 1, date: fmtDate(tomorrow),  start: '09:00', end: '11:00', purpose: 'CPEN 412 Lab Session',     attendees: 25, status: 'confirmed' },
      { fIdx: 0, uIdx: 4, date: fmtDate(tomorrow),  start: '13:00', end: '15:00', purpose: 'Group Project Work',        attendees: 5,  status: 'confirmed' },
      { fIdx: 0, uIdx: 5, date: fmtDate(in2days),   start: '10:00', end: '12:00', purpose: 'Algorithm Study Session',   attendees: 3,  status: 'pending' },
      // Main Auditorium
      { fIdx: 1, uIdx: 0, date: fmtDate(in5days),   start: '14:00', end: '17:00', purpose: 'Tech Talk: AI in Industry', attendees: 300, status: 'confirmed' },
      { fIdx: 1, uIdx: 2, date: fmtDate(in7days),   start: '09:00', end: '12:00', purpose: 'Department Symposium',      attendees: 200, status: 'pending' },
      // Study Rooms
      { fIdx: 2, uIdx: 4, date: fmtDate(tomorrow),  start: '14:00', end: '16:00', purpose: 'Midterm Revision',          attendees: 6,  status: 'confirmed' },
      { fIdx: 2, uIdx: 6, date: fmtDate(in2days),   start: '09:00', end: '10:30', purpose: 'Project Planning',          attendees: 4,  status: 'confirmed' },
      { fIdx: 3, uIdx: 7, date: fmtDate(in3days),   start: '15:00', end: '17:00', purpose: 'Thesis Discussion',         attendees: 4,  status: 'confirmed' },
      // Sports Hall
      { fIdx: 4, uIdx: 5, date: fmtDate(in2days),   start: '18:00', end: '20:00', purpose: 'Basketball Club Practice',  attendees: 20, status: 'confirmed' },
      // Seminar Room
      { fIdx: 5, uIdx: 3, date: fmtDate(in3days),   start: '11:00', end: '13:00', purpose: 'Linear Algebra Lecture',    attendees: 35, status: 'confirmed' },
      { fIdx: 5, uIdx: 1, date: fmtDate(in5days),   start: '09:00', end: '10:30', purpose: 'Research Presentation',     attendees: 20, status: 'confirmed' },
      // Past booking (cancelled)
      { fIdx: 0, uIdx: 4, date: fmtDate(yesterday), start: '10:00', end: '12:00', purpose: 'Cancelled Session',         attendees: 5,  status: 'cancelled' },
    ];

    for (const b of BOOKINGS) {
      await client.query(
        `INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, purpose, attendees, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [facilityIds[b.fIdx], userIds[b.uIdx], b.date, b.start, b.end, b.purpose, b.attendees, b.status]
      );
    }
    console.log(`  📅 Created ${BOOKINGS.length} sample bookings`);

    await client.query('COMMIT');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('── Login Credentials ───────────────────────────');
    console.log('  Admin   : admin@campus.edu   / Admin1234');
    console.log('  Faculty : alice@campus.edu   / Faculty123');
    console.log('  Student : dave@student.edu   / Student123');
    console.log('────────────────────────────────────────────────\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
