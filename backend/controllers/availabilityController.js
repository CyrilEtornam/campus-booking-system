/**
 * Availability Controller  –  MVC Architecture
 * ===============================================
 * CONTROLLER layer: Returns a 30-minute slot grid for a facility + date,
 * marking each slot as 'available', 'booked', or 'pending'.
 *
 * GET /api/availability
 * Query params: facility_id (required), date (required),
 *               start_time (optional, default 08:00),
 *               end_time   (optional, default 22:00)
 */

const BookingModel  = require('../models/Booking');
const FacilityModel = require('../models/Facility');

// ── Helper: generate 30-minute slot grid ────────────────────────────────────
/**
 * Builds an array of time slots between two HH:MM strings.
 * Each slot: { start: 'HH:MM', end: 'HH:MM', status: 'available' }
 */
function generateSlots(startHHMM = '08:00', endHHMM = '22:00') {
  const slots = [];
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);

  let cursor = sh * 60 + sm;           // minutes since midnight
  const last = eh * 60 + em;

  while (cursor + 30 <= last) {
    const s = `${String(Math.floor(cursor / 60)).padStart(2,'0')}:${String(cursor % 60).padStart(2,'0')}`;
    cursor += 30;
    const e = `${String(Math.floor(cursor / 60)).padStart(2,'0')}:${String(cursor % 60).padStart(2,'0')}`;
    slots.push({ start: s, end: e, status: 'available', booking: null });
  }
  return slots;
}

/**
 * Convert 'HH:MM:SS' (PostgreSQL TIME) to total minutes.
 */
const toMin = t => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// ── Controller ────────────────────────────────────────────────────────────────
const checkAvailability = async (req, res) => {
  try {
    const { facility_id, date, start_time = '08:00', end_time = '22:00' } = req.query;

    // Validate required params
    if (!facility_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'facility_id and date query parameters are required.',
      });
    }

    // Verify facility exists
    const facility = await FacilityModel.findById(facility_id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    // Get booked slots from the database
    const bookedSlots = await BookingModel.getBookedSlots(facility_id, date);

    // Build the slot grid and mark overlaps
    const slots = generateSlots(start_time, end_time);

    slots.forEach(slot => {
      const slotStart = toMin(slot.start);
      const slotEnd   = toMin(slot.end);

      for (const booked of bookedSlots) {
        const bStart = toMin(booked.start_time);
        const bEnd   = toMin(booked.end_time);

        // Any overlap → mark this slot
        if (bStart < slotEnd && bEnd > slotStart) {
          slot.status  = booked.status;   // 'confirmed' or 'pending'
          slot.booking = { booked_by: booked.booked_by };
        }
      }
    });

    const available = slots.filter(s => s.status === 'available').length;
    const booked    = slots.filter(s => s.status !== 'available').length;

    res.json({
      success: true,
      data: {
        facility: {
          id:       facility.id,
          name:     facility.name,
          location: facility.location,
          capacity: facility.capacity,
        },
        date,
        slots,
        summary: { total: slots.length, available, booked },
      },
    });
  } catch (err) {
    console.error('checkAvailability error:', err);
    res.status(500).json({ success: false, message: 'Failed to check availability.' });
  }
};

/**
 * GET /api/availability/week
 * Returns availability summary for each day in a 7-day window.
 * Query: facility_id, start_date (YYYY-MM-DD)
 */
const getWeeklyAvailability = async (req, res) => {
  try {
    const { facility_id, start_date } = req.query;
    if (!facility_id || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'facility_id and start_date are required.',
      });
    }

    const facility = await FacilityModel.findById(facility_id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    const days = [];
    const base = new Date(start_date);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);

      const booked = await BookingModel.getBookedSlots(facility_id, dateStr);
      const slots  = generateSlots('08:00', '22:00');

      let bookedCount = 0;
      slots.forEach(slot => {
        const ss = toMin(slot.start);
        const se = toMin(slot.end);
        for (const b of booked) {
          if (toMin(b.start_time) < se && toMin(b.end_time) > ss) {
            bookedCount++;
            break;
          }
        }
      });

      days.push({
        date:      dateStr,
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total:     slots.length,
        available: slots.length - bookedCount,
        booked:    bookedCount,
      });
    }

    res.json({ success: true, data: { facility, week: days } });
  } catch (err) {
    console.error('getWeeklyAvailability error:', err);
    res.status(500).json({ success: false, message: 'Failed to get weekly availability.' });
  }
};

module.exports = { checkAvailability, getWeeklyAvailability };
