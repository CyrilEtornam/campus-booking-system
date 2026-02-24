/**
 * API Service Layer
 * ==================
 * Centralised axios instance for all HTTP calls to the backend.
 * All components import named helpers from here – no raw fetch/axios elsewhere.
 */

import axios from 'axios';

// Base URL: uses Vite proxy in dev (/api → localhost:5000/api)
// In production, VITE_API_URL must point to the deployed backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Response interceptor – normalise errors ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Something went wrong';
    err.displayMessage = message;
    return Promise.reject(err);
  }
);

// ── Facility helpers ──────────────────────────────────────────────────────
export const facilityApi = {
  getAll:   (params) => api.get('/facilities', { params }),
  getById:  (id)     => api.get(`/facilities/${id}`),
  create:   (data)   => api.post('/facilities', data),
  update:   (id, d)  => api.put(`/facilities/${id}`, d),
  remove:   (id)     => api.delete(`/facilities/${id}`),
};

// ── Booking helpers ───────────────────────────────────────────────────────
export const bookingApi = {
  getAll:   (params) => api.get('/bookings', { params }),
  getById:  (id)     => api.get(`/bookings/${id}`),
  create:   (data)   => api.post('/bookings', data),
  update:   (id, d)  => api.put(`/bookings/${id}`, d),
  cancel:   (id)     => api.delete(`/bookings/${id}`),
};

// ── Availability helpers ──────────────────────────────────────────────────
export const availabilityApi = {
  getSlots:  (params) => api.get('/availability', { params }),
  getWeekly: (params) => api.get('/availability/week', { params }),
};

// ── Auth helpers ──────────────────────────────────────────────────────────
export const authApi = {
  register:    (data) => api.post('/auth/register', data),
  login:       (data) => api.post('/auth/login', data),
  getProfile:  ()     => api.get('/auth/me'),
  updateProfile:(data)=> api.put('/auth/profile', data),
  getUsers:    ()     => api.get('/auth/users'),
};

export default api;
