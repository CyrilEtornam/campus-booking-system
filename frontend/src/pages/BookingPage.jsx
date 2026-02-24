import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { facilityApi } from '../services/api';
import BookingForm from '../components/BookingForm';

const TYPE_ICONS = { lab:'🔬', room:'🏫', gym:'💪', auditorium:'🎭', sports:'⚽', study_room:'📚' };

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
      <div className="spinner"/><p>Loading facility…</p>
    </div>
  );

  if (error) return (
    <div className="page-wrapper container" style={{ maxWidth:'600px' }}>
      <div className="alert alert-danger">{error}</div>
      <Link to="/facilities" className="btn btn-secondary">← Back to Facilities</Link>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth:'900px' }}>
        <Link to="/facilities" style={{ color:'var(--gray-500)', fontSize:'0.85rem', display:'inline-flex', alignItems:'center', gap:'0.3rem', marginBottom:'1rem' }}>
          ← Back to Facilities
        </Link>

        <div className="grid-2" style={{ alignItems:'start' }}>
          {/* Left: Facility info */}
          <div>
            <div className="card">
              {/* Colour banner */}
              <div style={{ height:'6px', background:'linear-gradient(90deg,#1a73e8,#4285f4)' }}/>
              <div className="card-body">
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
                  <span style={{ fontSize:'2rem' }}>{TYPE_ICONS[facility.facility_type] || '🏢'}</span>
                  <div>
                    <h2 style={{ margin:0 }}>{facility.name}</h2>
                    <p style={{ margin:0, color:'var(--gray-500)', fontSize:'0.85rem' }}>📍 {facility.location}</p>
                  </div>
                </div>

                <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', fontSize:'0.88rem', marginBottom:'1rem' }}>
                  <span>👥 Capacity: <strong>{facility.capacity}</strong></span>
                  <span>🏷️ Type: <strong>{facility.facility_type?.replace('_',' ')}</strong></span>
                  {facility.requires_approval && (
                    <span style={{ color:'#b45309' }}>✋ <strong>Approval required</strong></span>
                  )}
                </div>

                {facility.description && (
                  <p style={{ fontSize:'0.88rem', color:'var(--gray-700)', lineHeight:1.6 }}>
                    {facility.description}
                  </p>
                )}

                {facility.amenities?.length > 0 && (
                  <div style={{ marginTop:'0.75rem' }}>
                    <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-500)', marginBottom:'0.4rem' }}>AMENITIES</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                      {facility.amenities.map(a => (
                        <span key={a} style={{
                          background:'var(--primary-light)', color:'var(--primary)',
                          padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.75rem',
                        }}>{a}</span>
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
                📅 {done ? 'Booking Submitted' : 'Make a Booking'}
              </div>
              <div className="card-body">
                {done ? (
                  <div style={{ textAlign:'center', padding:'1rem' }}>
                    <p>What would you like to do next?</p>
                    <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap', marginTop:'1rem' }}>
                      <button className="btn btn-primary" onClick={() => setDone(false)}>Book Again</button>
                      <Link to="/dashboard" className="btn btn-secondary">View My Bookings</Link>
                      <Link to="/facilities" className="btn btn-secondary">Browse Facilities</Link>
                    </div>
                  </div>
                ) : (
                  <BookingForm facility={facility} onSuccess={() => setDone(true)}/>
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
