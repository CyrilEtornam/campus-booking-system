/**
 * Facility Controller  –  MVC Architecture
 * ==========================================
 * CONTROLLER layer: HTTP request handling for /api/facilities
 * Data access is delegated to FacilityModel.
 */

const { validationResult } = require('express-validator');
const FacilityModel = require('../models/Facility');

/**
 * GET /api/facilities
 * Returns all active facilities. Supports query params:
 *   type, search, minCapacity, maxCapacity
 */
const getAllFacilities = async (req, res) => {
  try {
    const { type, search, minCapacity, maxCapacity } = req.query;
    const facilities = await FacilityModel.findAll({ type, search, minCapacity, maxCapacity });

    res.json({ success: true, count: facilities.length, data: facilities });
  } catch (err) {
    console.error('getAllFacilities error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch facilities.' });
  }
};

/**
 * GET /api/facilities/:id
 * Returns a single facility.
 */
const getFacilityById = async (req, res) => {
  try {
    const facility = await FacilityModel.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }
    res.json({ success: true, data: facility });
  } catch (err) {
    console.error('getFacilityById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch facility.' });
  }
};

/**
 * POST /api/facilities  (admin only)
 * Create a new facility.
 */
const createFacility = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const facility = await FacilityModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Facility created successfully.',
      data: facility,
    });
  } catch (err) {
    console.error('createFacility error:', err);
    res.status(500).json({ success: false, message: 'Failed to create facility.' });
  }
};

/**
 * PUT /api/facilities/:id  (admin only)
 * Update facility fields. Only provided fields are changed.
 */
const updateFacility = async (req, res) => {
  try {
    const existing = await FacilityModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    const updated = await FacilityModel.update(req.params.id, req.body);
    res.json({ success: true, message: 'Facility updated.', data: updated });
  } catch (err) {
    console.error('updateFacility error:', err);
    res.status(500).json({ success: false, message: 'Failed to update facility.' });
  }
};

/**
 * DELETE /api/facilities/:id  (admin only)
 * Soft-deletes a facility (sets is_active = false).
 * Existing bookings are preserved in the database.
 */
const deleteFacility = async (req, res) => {
  try {
    const existing = await FacilityModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    await FacilityModel.delete(req.params.id);
    res.json({ success: true, message: 'Facility deactivated successfully.' });
  } catch (err) {
    console.error('deleteFacility error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete facility.' });
  }
};

module.exports = {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
};
