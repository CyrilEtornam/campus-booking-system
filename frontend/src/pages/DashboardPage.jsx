import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingHistory from '../components/BookingHistory';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card" style={{ textAlign:'center', padding:'1.25rem' }}>
    <div style={{ fontSize:'1.75rem', marginBottom:'0.25rem' }}>{icon}</div>
    <div style={{ fontSize:'2rem', fontWeight:700, color }}>{value}</div>
    <div style={{ fontSize:'0.82rem', color:'var(--gray-500)' }}>{label}</div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await bookingApi.getAll();
      setBookings(data.data);
      setStats(data.stats);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const upcoming = bookings.filter(b =>
    (b.status === 'confirmed' || b.status === 'pending') &&
    new Date(b.date) >= new Date(new Date().toDateString())
  );

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 style={{ margin:'0 0 0.25rem' }}>My Dashboard</h1>
            <p className="text-muted" style={{ margin:0 }}>Welcome back, <strong>{user?.name}</strong></p>
          </div>
          <Link to="/facilities" className="btn btn-primary">+ New Booking</Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
            <StatCard icon="📅" label="Total Bookings"   value={stats.total}     color="var(--primary)"/>
            <StatCard icon="✅" label="Confirmed"         value={stats.confirmed} color="var(--secondary)"/>
            <StatCard icon="⏳" label="Pending Approval"  value={stats.pending}   color="#f59e0b"/>
            <StatCard icon="🗓️" label="Upcoming"          value={stats.upcoming}  color="#6366f1"/>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"/></div>
        ) : (
          <>
            {/* Upcoming bookings highlight */}
            {upcoming.length > 0 && (
              <div className="card" style={{ marginBottom:'1.5rem' }}>
                <div className="card-header">🗓️ Upcoming Bookings ({upcoming.length})</div>
                <div className="card-body">
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                    {upcoming.slice(0, 3).map(b => (
                      <div key={b.id} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'0.75rem', background:'var(--gray-100)', borderRadius:'8px',
                        flexWrap:'wrap', gap:'0.5rem',
                      }}>
                        <div>
                          <strong style={{ fontSize:'0.9rem' }}>{b.facility_name}</strong>
                          <p style={{ margin:0, fontSize:'0.8rem', color:'var(--gray-500)' }}>
                            {b.date} · {b.start_time}–{b.end_time}
                          </p>
                        </div>
                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                      </div>
                    ))}
                    {upcoming.length > 3 && (
                      <p style={{ fontSize:'0.82rem', color:'var(--gray-500)', textAlign:'center', margin:0 }}>
                        +{upcoming.length - 3} more upcoming bookings
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Full booking history */}
            <div className="card">
              <div className="card-header">Booking History</div>
              <div className="card-body">
                <BookingHistory bookings={bookings} onRefresh={loadData}/>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
