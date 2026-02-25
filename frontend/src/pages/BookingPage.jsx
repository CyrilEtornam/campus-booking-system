import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { facilityApi } from '../services/api';
import BookingForm from '../components/BookingForm';

const facilityColor = (type) => {
  const map = {
    lab:        'linear-gradient(90deg,#3b82f6,#60a5fa)',
    room:       'linear-gradient(90deg,#ec4899,#f472b6)',
    gym:        'linear-gradient(90deg,#8b5cf6,#a78bfa)',
    auditorium: 'linear-gradient(90deg,#22c55e,#4ade80)',
    sports:     'linear-gradient(90deg,#f59e0b,#fbbf24)',
    study_room: 'linear-gradient(90deg,#14b8a6,#2dd4bf)',
  };
  return map[type] || 'linear-gradient(90deg,#6b7280,#9ca3af)';
};

const BookingPage = () => {
  const { facilityId } = useParams();
  const navigate       = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    facilityApi.getById(facilityId)
      .then(({ data }) => setFacility(data.data))
      .catch(err => setError(err.displayMessage || 'Facility not found.'))
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) return (
    <div className="loading-container page-wrapper">
      <div className="spinner" /><p>Loading facility...</p>
    </div>
  );

  if (error) return (
    <div className="page-wrapper container" style={{ maxWidth: '600px' }}>
      <div className="alert alert-danger">{error}</div>
      <Link to="/facilities" className="btn btn-secondary">&larr; Back to Facilities</Link>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '900px' }}>
        <Link to="/facilities" className="back-link">
          &larr; Back to Facilities
        </Link>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Facility info */}
          <div>
            <div className="card">
              <div className="facility-card-banner" style={{ background: facilityColor(facility.facility_type) }} />
              <div className="card-body">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>{facility.name}</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem' }} className="text-muted">{facility.location}</p>
                </div>

                <div className="facility-info-stats">
                  <span>Capacity: <strong>{facility.capacity}</strong></span>
                  <span>Type: <strong>{facility.facility_type?.replace('_', ' ')}</strong></span>
                  {facility.requires_approval && (
                    <span style={{ color: 'var(--warning)' }}><strong>Approval required</strong></span>
                  )}
                </div>

                {facility.description && (
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {facility.description}
                  </p>
                )}

                {facility.amenities?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <p className="availability-section-label">Amenities</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {facility.amenities.map(a => (
                        <span key={a} className="amenity-tag">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Booking form */}
          <div>
            <div className="card">
              <div className="card-header">
                {done ? 'Booking Submitted' : 'Make a Booking'}
              </div>
              <div className="card-body">
                {done ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <p>What would you like to do next?</p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                      <button className="btn btn-primary" onClick={() => setDone(false)}>Book Again</button>
                      <Link to="/dashboard" className="btn btn-secondary">View My Bookings</Link>
                      <Link to="/facilities" className="btn btn-secondary">Browse Facilities</Link>
                    </div>
                  </div>
                ) : (
                  <BookingForm facility={facility} onSuccess={() => setDone(true)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
