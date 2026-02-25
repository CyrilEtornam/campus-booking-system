import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { facilityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FacilityCard from '../components/FacilityCard';
import { SkeletonCard } from '../components/SkeletonLoader';

const STATS = [
  { label: 'Facilities',     value: '8+' },
  { label: 'Daily Bookings', value: '50+' },
  { label: 'Active Users',   value: '500+' },
  { label: 'Avg Wait Time',  value: '<1 min' },
];

const HomePage = () => {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    facilityApi.getAll().then(({ data }) => {
      setFeatured(data.data.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ maxWidth: '700px' }}>
          <h1>Campus Facility Booking System</h1>
          <p>
            Easily reserve labs, study rooms, sports halls, and lecture theatres.
            Check availability, book in seconds, manage your schedule.
          </p>
          <div className="hero-actions">
            <Link to="/facilities" className="btn-hero-primary">
              Browse Facilities
            </Link>
            {!user && (
              <Link to="/register" className="btn-hero-outline">
                Get Started Free
              </Link>
            )}
            {user && (
              <Link to="/dashboard" className="btn-hero-outline">
                My Bookings &rarr;
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Facilities */}
      <section className="page-wrapper">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <h2>Featured Facilities</h2>
            <Link to="/facilities" className="btn btn-outline">View All &rarr;</Link>
          </div>
          {featured.length ? (
            <div className="grid-3">
              {featured.map(f => <FacilityCard key={f.id} facility={f} />)}
            </div>
          ) : (
            <div className="grid-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--surface)', padding: '3rem 1rem', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>How It Works</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Book a facility in three simple steps</p>
          <div className="grid-3">
            {[
              { step: '1', title: 'Browse', desc: 'Find the perfect facility. Filter by type, capacity, or location.' },
              { step: '2', title: 'Check Availability', desc: 'View real-time 30-minute slot grid and pick your time.' },
              { step: '3', title: 'Confirm', desc: 'Submit your booking instantly. Get email confirmation.' },
            ].map(item => (
              <div key={item.step} className="how-it-works-step">
                <div className="step-number">{item.step}</div>
                <h4 style={{ marginBottom: '0.4rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop: '2rem', display: 'inline-block' }}>
              Create Your Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
