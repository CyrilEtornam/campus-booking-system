/**
 * Booking Routes  –  MVC Architecture
 * ======================================
 * ROUTES layer: Maps HTTP verbs + paths to Booking Controller functions.
 * All booking routes require authentication.
 */

const express = require('express');
const router  = express.Router();

const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');

const { protect }          = require('../middleware/auth');
const { validateBooking }  = require('../middleware/validation');

// All booking routes require a valid JWT
router.use(protect);

router.get('/',     getAllBookings);
router.get('/:id',  getBookingById);
router.post('/',    validateBooking, createBooking);
router.put('/:id',  updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router;
