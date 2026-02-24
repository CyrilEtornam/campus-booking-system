/**
 * App.jsx  –  Root component
 * ============================
 * Sets up Auth context, global layout, and client-side routing.
 * MVC (frontend): This is the "View" orchestrator that maps routes to page components.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Header        from './components/Header';
import HomePage      from './pages/HomePage';
import FacilitiesPage from './pages/FacilitiesPage';
import BookingPage   from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import AdminPage     from './pages/AdminPage';

// ── Protected route wrapper ───────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner"/></div>;
  if (!user)             return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// ── App shell (needs AuthProvider context) ────────────────────────────────
const AppShell = () => {
  return (
    <>
      <Header />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/"           element={<HomePage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />

          {/* Authenticated */}
          <Route path="/book/:facilityId" element={
            <PrivateRoute><BookingPage /></PrivateRoute>
          }/>
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          }/>

          {/* Admin only */}
          <Route path="/admin" element={
            <AdminRoute><AdminPage /></AdminRoute>
          }/>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
