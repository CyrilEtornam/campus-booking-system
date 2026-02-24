import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { facilityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FacilityCard from '../components/FacilityCard';

const STATS = [
  { icon:'🏢', label:'Facilities',      value:'8+' },
  { icon:'📅', label:'Daily Bookings',  value:'50+' },
  { icon:'👥', label:'Active Users',    value:'500+' },
  { icon:'⏱️', label:'Avg Wait Time',   value:'<1 min' },
];

const HomePage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    facilityApi.getAll().then(({ data }) => {
      setFeatured(data.data.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
        color: '#fff', padding: '5rem 1rem', textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth:'700px' }}>
          <h1 style={{ fontSize:'2.5rem', marginBottom:'1rem', lineHeight:1.2 }}>
            Campus Facility Booking System
          </h1>
          <p style={{ fontSize:'1.15rem', opacity:0.9, marginBottom:'2rem', lineHeight:1.7 }}>
            Easily reserve labs, study rooms, sports halls, and lecture theatres.
            Check availability, book in seconds, manage your schedule.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/facilities" className="btn btn-lg" style={{
              background:'#fff', color:'#1a73e8', fontWeight:700,
              padding:'0.75rem 2rem',
            }}>
              Browse Facilities
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-lg btn-outline" style={{
                borderColor:'#fff', color:'#fff', padding:'0.75rem 2rem',
              }}>
                Get Started Free
              </Link>
            )}
            {user && (
              <Link to="/dashboard" className="btn btn-lg btn-outline" style={{
                borderColor:'#fff', color:'#fff', padding:'0.75rem 2rem',
              }}>
                My Bookings →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background:'#fff', padding:'2rem 1rem', borderBottom:'1px solid var(--gray-100)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.5rem', textAlign:'center' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize:'2rem', marginBottom:'0.25rem' }}>{s.icon}</div>
                <div style={{ fontSize:'1.75rem', fontWeight:700, color:'var(--primary)' }}>{s.value}</div>
                <div style={{ fontSize:'0.85rem', color:'var(--gray-500)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@media(max-width:600px){.container div[style*="repeat(4"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      </section>

      {/* Featured Facilities */}
      <section className="page-wrapper">
        <div className="container">
          <div className="section-header" style={{ marginBottom:'1.5rem' }}>
            <h2>Featured Facilities</h2>
            <Link to="/facilities" className="btn btn-outline">View All →</Link>
          </div>
          {featured.length ? (
            <div className="grid-3">
              {featured.map(f => <FacilityCard key={f.id} facility={f}/>)}
            </div>
          ) : (
            <div className="loading-container"><div className="spinner"/></div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background:'#fff', padding:'3rem 1rem' }}>
        <div className="container" style={{ maxWidth:'800px', textAlign:'center' }}>
          <h2 style={{ marginBottom:'0.5rem' }}>How It Works</h2>
          <p className="text-muted" style={{ marginBottom:'2rem' }}>Book a facility in three simple steps</p>
          <div className="grid-3">
            {[
              { icon:'🔍', step:'1', title:'Browse', desc:'Find the perfect facility. Filter by type, capacity, or location.' },
              { icon:'📅', step:'2', title:'Check Availability', desc:'View real-time 30-minute slot grid and pick your time.' },
              { icon:'✅', step:'3', title:'Confirm', desc:'Submit your booking instantly. Get email confirmation.' },
            ].map(item => (
              <div key={item.step} style={{
                padding:'1.5rem', background:'var(--gray-100)',
                borderRadius:'12px', textAlign:'center',
              }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{item.icon}</div>
                <div style={{
                  width:'28px', height:'28px', borderRadius:'50%',
                  background:'var(--primary)', color:'#fff', fontWeight:700,
                  fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 0.75rem',
                }}>{item.step}</div>
                <h4 style={{ marginBottom:'0.4rem' }}>{item.title}</h4>
                <p style={{ fontSize:'0.85rem', color:'var(--gray-500)', margin:0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop:'2rem', display:'inline-block' }}>
              Create Your Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
