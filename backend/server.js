/**
 * Campus Facility Booking System - Main Server Entry Point
 * =========================================================
 * MVC Architecture Overview:
 *   - Models   (models/)      → Database interactions & business logic
 *   - Views    (frontend/)    → React SPA (separate folder)
 *   - Controllers (controllers/) → Request handling & response logic
 *   - Routes   (routes/)      → URL-to-controller mapping
 *
 * This file: Bootstraps Express, registers middleware & routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

// ── Route Imports (MVC: Routes connect HTTP verbs/paths to Controllers) ──────
const authRoutes         = require('./routes/auth');
const facilityRoutes     = require('./routes/facilities');
const bookingRoutes      = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');

const app  = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE CONFIGURATION
// ============================================================

// CORS – allow the React frontend to call this API
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));          // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));   // Parse URL-encoded bodies

// Development request logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================
// ROUTES  (MVC: Routes layer – directs requests to Controllers)
// ============================================================
app.use('/api/auth',         authRoutes);
app.use('/api/facilities',   facilityRoutes);
app.use('/api/bookings',     bookingRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check – useful for Render/Railway deployment probes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// ============================================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ============================================================
// Must have 4 params so Express recognises it as error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ============================================================
// SERVER STARTUP
// ============================================================
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database initialised successfully');

    app.listen(PORT, () => {
      console.log(`\n🚀 Campus Booking API running`);
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port        : ${PORT}`);
      console.log(`   Base URL    : http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app; // exported for testing
