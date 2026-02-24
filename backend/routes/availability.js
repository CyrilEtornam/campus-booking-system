/**
 * Availability Routes  –  MVC Architecture
 * ==========================================
 * ROUTES layer: Availability endpoints (read-only, public access).
 */

const express = require('express');
const router  = express.Router();

const { checkAvailability, getWeeklyAvailability } = require('../controllers/availabilityController');

// Public availability endpoints – no auth required
router.get('/',      checkAvailability);       // GET /api/availability?facility_id=1&date=2024-03-15
router.get('/week',  getWeeklyAvailability);   // GET /api/availability/week?facility_id=1&start_date=2024-03-11

module.exports = router;
