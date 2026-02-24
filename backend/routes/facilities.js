/**
 * Facility Routes  –  MVC Architecture
 * =======================================
 * ROUTES layer: Maps HTTP verbs + paths to Facility Controller functions.
 */

const express = require('express');
const router  = express.Router();

const {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
} = require('../controllers/facilityController');

const { protect, restrictTo } = require('../middleware/auth');
const { validateFacility }    = require('../middleware/validation');

// Public – anyone can browse facilities
router.get('/',    getAllFacilities);
router.get('/:id', getFacilityById);

// Admin only – facility management
router.post('/',    protect, restrictTo('admin'), validateFacility, createFacility);
router.put('/:id',  protect, restrictTo('admin'), updateFacility);
router.delete('/:id', protect, restrictTo('admin'), deleteFacility);

module.exports = router;
