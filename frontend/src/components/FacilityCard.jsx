import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TYPE_ICONS = {
  lab:        '🔬',
  room:       '🏫',
  gym:        '💪',
  auditorium: '🎭',
  sports:     '⚽',
  study_room: '📚',
};

const FacilityCard = ({ facility }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    id, name, location, capacity, description,
    amenities = [], facility_type, requires_approval,
    upcoming_bookings = 0, is_active,
  } = facility;

  const icon = TYPE_ICONS[facility_type] || '🏢';

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/book/${id}`);
  };

  return (
    <div className="card" style={{ display:'flex', flexDirection:'column' }}>
      {/* Colour banner */}
      <div style={{
        height: '8px',
        background: facilityColor(facility_type),
      }}/>

      <div className="card-body" style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {/* Header */}
        <div className="flex-between">
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ fontSize:'1.6rem' }}>{icon}</span>
            <div>
              <h3 style={{ margin:0, fontSize:'1rem' }}>{name}</h3>
              <p style={{ margin:0, fontSize:'0.8rem', color:'var(--gray-500)' }}>📍 {location}</p>
            </div>
          </div>
          <span className={`badge badge-${facility_type}`}>{facility_type.replace('_', ' ')}</span>
        </div>

        {/* Description */}
        {description && (
          <p style={{ fontSize:'0.85rem', color:'var(--gray-700)', lineHeight:'1.5', margin:0 }}>
            {description.length > 120 ? description.slice(0, 120) + '…' : description}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display:'flex', gap:'1rem', fontSize:'0.82rem', color:'var(--gray-700)' }}>
          <span>👥 <strong>{capacity}</strong> capacity</span>
          <span>📅 <strong>{upcoming_bookings}</strong> upcoming</span>
          {requires_approval && <span>✋ Approval required</span>}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
            {amenities.slice(0, 4).map(a => (
              <span key={a} style={{
                background:'var(--gray-100)', padding:'0.15rem 0.5rem',
                borderRadius:'999px', fontSize:'0.72rem', color:'var(--gray-700)',
              }}>{a}</span>
            ))}
            {amenities.length > 4 && (
              <span style={{ fontSize:'0.72rem', color:'var(--gray-500)' }}>+{amenities.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card-footer" style={{ display:'flex', gap:'0.5rem' }}>
        <button
          onClick={() => navigate(`/facilities`)}
          className="btn btn-secondary btn-sm"
          style={{ flex:1 }}
        >
          View Details
        </button>
        <button
          onClick={handleBook}
          className="btn btn-primary btn-sm"
          style={{ flex:1 }}
          disabled={!is_active}
        >
          {is_active ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

const facilityColor = (type) => {
  const map = {
    lab:        'linear-gradient(90deg,#1a73e8,#4285f4)',
    room:       'linear-gradient(90deg,#e91e63,#f06292)',
    gym:        'linear-gradient(90deg,#7b1fa2,#ab47bc)',
    auditorium: 'linear-gradient(90deg,#1b5e20,#43a047)',
    sports:     'linear-gradient(90deg,#f57f17,#ffa726)',
    study_room: 'linear-gradient(90deg,#00695c,#26a69a)',
  };
  return map[type] || 'linear-gradient(90deg,#607d8b,#90a4ae)';
};

export default FacilityCard;
