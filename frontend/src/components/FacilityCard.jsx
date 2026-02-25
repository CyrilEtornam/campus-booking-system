import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FacilityCard = ({ facility }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    id, name, location, capacity,
    facility_type, requires_approval, is_active,
  } = facility;

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/book/${id}`);
  };

  return (
    <div className="card card-hoverable facility-card">
      <div className="card-body">
        <div className="facility-card-header">
          <div>
            <h3 className="facility-card-name">{name}</h3>
            <p className="facility-card-location">{location}</p>
          </div>
          <span className={`badge badge-sm badge-${facility_type}`}>
            {facility_type.replace('_', ' ')}
          </span>
        </div>

        <div className="facility-card-stats">
          <span>Capacity: <strong>{capacity}</strong></span>
          {requires_approval && (
            <span style={{ color: 'var(--danger)' }}>Approval required</span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <button onClick={() => navigate(`/book/${id}`)} className="btn btn-secondary btn-sm">
          View Details
        </button>
        <button onClick={handleBook} className="btn btn-primary btn-sm" disabled={!is_active}>
          {is_active ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default FacilityCard;
