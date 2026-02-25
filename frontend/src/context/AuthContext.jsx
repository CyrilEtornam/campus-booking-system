/**
 * Auth Context
 * =============
 * Provides authentication state + actions to the entire React tree.
 * Stores the JWT in localStorage and automatically attaches it to
 * all axios requests via the api.js default headers.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);  // initial profile fetch

  // ── Attach token to axios on every render where it changes ────────────────
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // ── Fetch current user on app load (if token present) ────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data);
      } catch {
        // Token invalid / expired – clear it
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Set header synchronously before navigate() triggers child component effects
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    // Set header synchronously before navigate() triggers child component effects
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(prev => ({ ...prev, ...updated }));
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isAdmin   = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAdmin, isFaculty,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for clean import in components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
