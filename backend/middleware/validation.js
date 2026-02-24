/**
 * Validation Rules  –  MVC Architecture
 * ========================================
 * Centralised express-validator rule sets used in the Routes layer.
 * Controllers call `validationResult(req)` and only proceed if empty.
 */

const { body, query } = require('express-validator');

// ── Auth validation ───────────────────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2–100 characters.'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required.'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),

  body('role')
    .optional()
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be student, faculty, or admin.'),

  body('student_id')
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ── Facility validation ───────────────────────────────────────────────────────

const validateFacility = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Facility name must be 2–200 characters.'),

  body('location')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be 2–200 characters.'),

  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer.'),

  body('facility_type')
    .optional()
    .isIn(['room', 'lab', 'gym', 'auditorium', 'sports', 'study_room'])
    .withMessage('Invalid facility type.'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array.'),
];

// ── Booking validation ────────────────────────────────────────────────────────

const validateBooking = [
  body('facility_id')
    .isInt({ min: 1 })
    .withMessage('Valid facility_id is required.'),

  body('date')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Date must be YYYY-MM-DD format.')
    .custom(val => {
      if (new Date(val) < new Date(new Date().toDateString())) {
        throw new Error('Booking date cannot be in the past.');
      }
      return true;
    }),

  body('start_time')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('start_time must be HH:MM format.'),

  body('end_time')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('end_time must be HH:MM format.')
    .custom((val, { req }) => {
      if (val <= req.body.start_time) {
        throw new Error('end_time must be after start_time.');
      }
      // Enforce max 8-hour booking
      const [sh, sm] = req.body.start_time.split(':').map(Number);
      const [eh, em] = val.split(':').map(Number);
      if ((eh * 60 + em) - (sh * 60 + sm) > 480) {
        throw new Error('Maximum booking duration is 8 hours.');
      }
      return true;
    }),

  body('attendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Attendees must be a positive integer.'),

  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Purpose must be at most 500 characters.'),
];

// ── Availability query validation ─────────────────────────────────────────────

const validateAvailabilityQuery = [
  query('facility_id').isInt({ min: 1 }).withMessage('Valid facility_id is required.'),
  query('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('Valid date (YYYY-MM-DD) is required.'),
  query('start_time').optional().matches(/^\d{2}:\d{2}$/),
  query('end_time').optional().matches(/^\d{2}:\d{2}$/),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateFacility,
  validateBooking,
  validateAvailabilityQuery,
};
