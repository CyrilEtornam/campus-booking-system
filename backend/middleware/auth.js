/**
 * Authentication Middleware  –  MVC Architecture
 * =================================================
 * Sits between the Route layer and the Controller layer.
 * Verifies the JWT bearer token and attaches `req.user` so
 * controllers can trust the identity without repeating auth logic.
 */

const jwt       = require('jsonwebtoken');
const UserModel = require('../models/User');

/**
 * `protect` – requires a valid JWT.
 * Attach decoded user to req.user before forwarding to the controller.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    } catch (jwtErr) {
      const message = jwtErr.name === 'TokenExpiredError'
        ? 'Token has expired. Please log in again.'
        : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message });
    }

    // Fetch fresh user data (catches deactivated accounts after token issue)
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    req.user = { ...user, role: decoded.role }; // role from token (already validated above)
    next();
  } catch (err) {
    console.error('protect middleware error:', err);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * `restrictTo(...roles)` – role-based authorisation guard.
 * Usage: router.delete('/...', protect, restrictTo('admin'), controller)
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${roles.join(', ')}.`,
    });
  }
  next();
};

/**
 * `optionalAuth` – attaches req.user if a valid token is present,
 * but does NOT block the request if no token is supplied.
 * Useful for endpoints that behave differently for logged-in users.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
      const user    = await UserModel.findById(decoded.id);
      if (user && user.is_active) req.user = user;
    }
  } catch (_) {
    // Silently ignore invalid tokens in optional auth
  }
  next();
};

module.exports = { protect, restrictTo, optionalAuth };
