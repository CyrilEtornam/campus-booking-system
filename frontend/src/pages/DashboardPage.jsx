import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingHistory from '../components/BookingHistory';
import { SkeletonStat } from '../components/SkeletonLoader';

const StatCard = ({ label, value, color }) => (
  <div className="card stat-card">
    <div className="stat-card-value" style={{ color }}>{value}</div>
    <div className="stat-card-label">{label}</div>
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
        <div className="section-header">
          <div>
            <h1 style={{ margin: '0 0 0.25rem' }}>My Dashboard</h1>
            <p className="text-muted" style={{ margin: 0 }}>Welcome back, <strong>{user?.name}</strong></p>
          </div>
          <Link to="/facilities" className="btn btn-primary">+ New Booking</Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {stats ? (
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <StatCard label="Total Bookings"  value={stats.total}     color="var(--accent-text)" />
            <StatCard label="Confirmed"       value={stats.confirmed} color="var(--success)" />
            <StatCard label="Pending Approval" value={stats.pending}  color="var(--warning)" />
            <StatCard label="Upcoming"        value={stats.upcoming}  color="#6366f1" />
          </div>
        ) : loading && (
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">Upcoming Bookings ({upcoming.length})</div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {upcoming.slice(0, 3).map(b => (
                      <div key={b.id} className="upcoming-item">
                        <div>
                          <div className="upcoming-item-name">{b.facility_name}</div>
                          <p className="upcoming-item-details">
                            {b.date} &middot; {b.start_time}&ndash;{b.end_time}
                          </p>
                        </div>
                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                      </div>
                    ))}
                    {upcoming.length > 3 && (
                      <p className="text-muted text-center text-small" style={{ margin: 0 }}>
                        +{upcoming.length - 3} more upcoming bookings
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">Booking History</div>
              <div className="card-body">
                <BookingHistory bookings={bookings} onRefresh={loadData} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
