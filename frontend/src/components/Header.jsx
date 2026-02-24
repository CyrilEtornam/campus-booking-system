import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header style={{
      background: '#1a73e8', color: '#fff',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>

        {/* Logo */}
        <Link to="/" style={{ color:'#fff', textDecoration:'none', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'1.5rem' }}>🏛️</span>
          <span style={{ fontWeight:700, fontSize:'1.1rem' }}>CampusBook</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display:'flex', alignItems:'center', gap:'0.25rem' }} className="desktop-nav">
          <Link to="/"           className={isActive('/')}           style={navStyle}>Home</Link>
          <Link to="/facilities" className={isActive('/facilities')} style={navStyle}>Facilities</Link>
          {user && (
            <Link to="/dashboard" className={isActive('/dashboard')} style={navStyle}>My Bookings</Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={isActive('/admin')} style={{ ...navStyle, background:'rgba(255,255,255,.15)', borderRadius:'6px' }}>
              ⚙️ Admin
            </Link>
          )}
        </nav>

        {/* Auth section */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div style={{ textAlign:'right', lineHeight:'1.2' }}>
                <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{user.name}</div>
                <div style={{ fontSize:'0.7rem', opacity:0.8, textTransform:'capitalize' }}>{user.role}</div>
              </div>
              <button onClick={handleLogout} style={{
                background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)',
                color:'#fff', padding:'0.4rem 0.9rem', borderRadius:'6px',
                cursor:'pointer', fontSize:'0.85rem', fontWeight:500,
              }}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"    style={{ color:'#fff', textDecoration:'none', fontSize:'0.9rem', fontWeight:500 }}>Login</Link>
              <Link to="/register" style={{
                background:'#fff', color:'#1a73e8', textDecoration:'none',
                padding:'0.4rem 1rem', borderRadius:'6px', fontSize:'0.9rem', fontWeight:600,
              }}>Register</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .nav-link { color:#fff; text-decoration:none; padding:0.4rem 0.75rem; border-radius:6px; font-size:0.9rem; font-weight:500; transition:background 0.2s; }
        .nav-link:hover { background:rgba(255,255,255,.15); text-decoration:none; }
        .nav-link.active { background:rgba(255,255,255,.2); }
      `}</style>
    </header>
  );
};

const navStyle = { color:'#fff', textDecoration:'none', padding:'0.4rem 0.75rem', borderRadius:'6px', fontSize:'0.9rem', fontWeight:500 };

export default Header;
