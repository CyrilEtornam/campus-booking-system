/**
 * Auth Routes  –  MVC Architecture
 * ===================================
 * ROUTES layer: Maps HTTP verbs + paths to Auth Controller functions.
 * Applies validation middleware before the controller runs.
 */

const express = require('express');
const router  = express.Router();

const { register, login, getProfile, updateProfile, getAllUsers } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateRegister, validateLogin }                         = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);

// Protected routes (require valid JWT)
router.get('/me',      protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin only
router.get('/users', protect, restrictTo('admin'), getAllUsers);

module.exports = router;
