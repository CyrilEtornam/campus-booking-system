import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const navLinkClass = (path) =>
    `header-nav-link ${location.pathname === path ? 'active' : ''}`;

  const navLinks = (
    <>
      <Link to="/" className={navLinkClass('/')} onClick={closeMobile}>Home</Link>
      <Link to="/facilities" className={navLinkClass('/facilities')} onClick={closeMobile}>Facilities</Link>
      {user && <Link to="/dashboard" className={navLinkClass('/dashboard')} onClick={closeMobile}>My Bookings</Link>}
      {isAdmin && <Link to="/admin" className={navLinkClass('/admin')} onClick={closeMobile}>Admin</Link>}
    </>
  );

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="header-logo">CampusBook</Link>

        <nav className="header-nav">{navLinks}</nav>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              <div className="header-user">
                <div className="header-user-name">{user.name}</div>
                <div className="header-user-role">{user.role}</div>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-auth-link">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label="Navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <nav className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        {navLinks}
        {user ? (
          <button onClick={handleLogout} className="btn btn-secondary btn-sm mt-1" style={{ alignSelf: 'flex-start' }}>
            Logout
          </button>
        ) : (
          <div className="flex gap-1 mt-1">
            <Link to="/login" className="btn btn-secondary btn-sm" onClick={closeMobile}>Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMobile}>Register</Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
