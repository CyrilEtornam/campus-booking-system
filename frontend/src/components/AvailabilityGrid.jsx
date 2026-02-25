import React, { useState, useEffect, useCallback } from 'react';
import { availabilityApi } from '../services/api';

const STATUS_MAP = {
  available: { cssClass: 'slot--available', label: 'Free' },
  confirmed: { cssClass: 'slot--booked',    label: 'Booked' },
  pending:   { cssClass: 'slot--pending',   label: 'Pending' },
};

const AvailabilityGrid = ({ facilityId, date, onSelectSlot, selectedSlot }) => {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [summary, setSummary] = useState(null);

  const fetchSlots = useCallback(async () => {
    if (!facilityId || !date) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await availabilityApi.getSlots({
        facility_id: facilityId,
        date,
        start_time: '08:00',
        end_time:   '22:00',
      });
      setSlots(data.data.slots);
      setSummary(data.data.summary);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load availability.');
    } finally {
      setLoading(false);
    }
  }, [facilityId, date]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  if (loading) return (
    <div className="loading-container" style={{ padding: '2rem' }}>
      <div className="spinner" />
      <p>Loading availability...</p>
    </div>
  );

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!slots.length) return <p className="text-muted text-center">No slots found for this date.</p>;

  const am = slots.filter(s => parseInt(s.start) < 12);
  const pm = slots.filter(s => parseInt(s.start) >= 12);

  const isSelected = (s) =>
    selectedSlot && s.start === selectedSlot.start && s.end === selectedSlot.end;

  const renderSlot = (slot) => {
    const info    = STATUS_MAP[slot.status] || STATUS_MAP.available;
    const canBook = slot.status === 'available';
    const sel     = isSelected(slot);

    return (
      <button
        key={slot.start}
        onClick={() => canBook && onSelectSlot && onSelectSlot(slot)}
        disabled={!canBook}
        title={canBook ? `Book ${slot.start}\u2013${slot.end}` : `${info.label} by ${slot.booking?.booked_by || 'another user'}`}
        className={`slot ${info.cssClass} ${sel ? 'slot--selected' : ''}`}
      >
        <div>{slot.start}</div>
        <div className="slot-label">{info.label}</div>
      </button>
    );
  };

  return (
    <div>
      {summary && (
        <div className="availability-summary">
          <span><span className="status-dot status-dot--available" /> {summary.available} available</span>
          <span><span className="status-dot status-dot--booked" /> {summary.booked} booked</span>
          <span className="text-muted">Total: {summary.total} slots</span>
        </div>
      )}

      <div className="availability-legend">
        <span className="availability-legend-item">
          <span className="availability-legend-swatch" style={{ background: 'var(--slot-available-bg)', borderColor: 'var(--slot-available-border)' }} />
          Free
        </span>
        <span className="availability-legend-item">
          <span className="availability-legend-swatch" style={{ background: 'var(--slot-booked-bg)', borderColor: 'var(--slot-booked-border)' }} />
          Booked
        </span>
        <span className="availability-legend-item">
          <span className="availability-legend-swatch" style={{ background: 'var(--slot-pending-bg)', borderColor: 'var(--slot-pending-border)' }} />
          Pending
        </span>
        <span className="availability-legend-item">
          <span className="availability-legend-swatch" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }} />
          Selected
        </span>
      </div>

      {am.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="availability-section-label">Morning (08:00-12:00)</p>
          <div className="availability-grid">{am.map(renderSlot)}</div>
        </div>
      )}

      {pm.length > 0 && (
        <div>
          <p className="availability-section-label">Afternoon / Evening (12:00-22:00)</p>
          <div className="availability-grid">{pm.map(renderSlot)}</div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityGrid;
