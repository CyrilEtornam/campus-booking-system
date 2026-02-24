/**
 * Auth Controller  –  MVC Architecture
 * =======================================
 * CONTROLLER layer: Handles HTTP requests/responses for authentication.
 * Delegates data operations to UserModel (MODEL layer).
 * Returns structured JSON; never touches the database directly.
 */

const jwt              = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserModel        = require('../models/User');

// ── Helper ────────────────────────────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'change_this_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new user account and return a JWT.
 */
const register = async (req, res) => {
  try {
    // 1. Validate inputs (rules defined in routes/auth.js)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, student_id, department } = req.body;

    // 2. Guard: prevent duplicate email
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }

    // 3. Optional: protect admin registration behind a shared secret
    if (role === 'admin') {
      const secret = req.headers['x-admin-secret'];
      if (secret !== (process.env.ADMIN_SECRET || 'admin_secret')) {
        return res.status(403).json({ success: false, message: 'Invalid admin secret.' });
      }
    }

    // 4. Create user (MODEL hashes the password)
    const user  = await UserModel.create({ name, email, password, role, student_id, department });
    const token = signToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user, token },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate and return a JWT.
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    // Use the same generic message for both "not found" and "wrong password"
    // to prevent user-enumeration attacks
    if (!user || !(await UserModel.verifyPassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = signToken(user.id, user.role);
    const { password: _pw, ...safe } = user; // strip hash from response

    res.json({ success: true, message: 'Login successful.', data: { user: safe, token } });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

/**
 * GET /api/auth/me
 * Return the authenticated user's profile.
 * Requires the `protect` middleware (adds req.user).
 */
const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch profile.' });
  }
};

/**
 * PUT /api/auth/profile
 * Update mutable profile fields.
 */
const updateProfile = async (req, res) => {
  try {
    const { name, department, student_id } = req.body;
    const user = await UserModel.update(req.user.id, { name, department, student_id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

/**
 * GET /api/auth/users  (admin only)
 * List all users.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch users.' });
  }
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers };
