import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FacilityCard = ({ facility }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    id, name, location, capacity, description,
    amenities = [], facility_type, requires_approval,
    upcoming_bookings = 0, is_active,
  } = facility;

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/book/${id}`);
  };

  return (
    <div className="card card-hoverable facility-card">
      <div className="facility-card-banner" style={{ background: facilityColor(facility_type) }} />

      <div className="card-body">
        <div className="facility-card-header">
          <div>
            <h3 className="facility-card-name">{name}</h3>
            <p className="facility-card-location">{location}</p>
          </div>
          <span className={`badge badge-${facility_type}`}>{facility_type.replace('_', ' ')}</span>
        </div>

        {description && (
          <p className="facility-card-desc">
            {description.length > 120 ? description.slice(0, 120) + '\u2026' : description}
          </p>
        )}

        <div className="facility-card-stats">
          <span>Capacity: <strong>{capacity}</strong></span>
          <span>Upcoming: <strong>{upcoming_bookings}</strong></span>
          {requires_approval && <span>Approval required</span>}
        </div>

        {amenities.length > 0 && (
          <div className="facility-card-amenities">
            {amenities.slice(0, 4).map(a => (
              <span key={a} className="facility-card-amenity">{a}</span>
            ))}
            {amenities.length > 4 && (
              <span className="text-muted text-small">+{amenities.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      <div className="card-footer">
        <button onClick={() => navigate('/facilities')} className="btn btn-secondary btn-sm">
          View Details
        </button>
        <button onClick={handleBook} className="btn btn-primary btn-sm" disabled={!is_active}>
          {is_active ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

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

export default FacilityCard;
