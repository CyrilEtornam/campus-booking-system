/**
 * AvailabilityGrid
 * =================
 * Shows a 30-minute time-slot grid for a facility on a selected date.
 * Slots are colour-coded: available (green), pending (yellow), confirmed (red).
 * Users click an available slot to pre-fill the booking form.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { availabilityApi } from '../services/api';

const STATUS_COLOR = {
  available: { bg:'#e8f5e9', border:'#4caf50', text:'#2e7d32',  label:'Free' },
  confirmed: { bg:'#ffebee', border:'#f44336', text:'#c62828',  label:'Booked' },
  pending:   { bg:'#fff8e1', border:'#ff9800', text:'#e65100',  label:'Pending' },
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
    <div className="loading-container" style={{ padding:'2rem' }}>
      <div className="spinner"/>
      <p>Loading availability…</p>
    </div>
  );

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!slots.length) return <p className="text-muted text-center">No slots found for this date.</p>;

  // Group into AM / PM sections
  const am = slots.filter(s => parseInt(s.start) < 12);
  const pm = slots.filter(s => parseInt(s.start) >= 12);

  const isSelected = (s) =>
    selectedSlot && s.start === selectedSlot.start && s.end === selectedSlot.end;

  const renderSlot = (slot) => {
    const col     = STATUS_COLOR[slot.status] || STATUS_COLOR.available;
    const canBook = slot.status === 'available';
    const sel     = isSelected(slot);

    return (
      <button
        key={slot.start}
        onClick={() => canBook && onSelectSlot && onSelectSlot(slot)}
        disabled={!canBook}
        title={canBook ? `Book ${slot.start}–${slot.end}` : `${col.label} by ${slot.booking?.booked_by || 'another user'}`}
        style={{
          background:    sel ? '#1a73e8'    : col.bg,
          border:        `2px solid ${sel ? '#1a73e8' : col.border}`,
          color:         sel ? '#fff'       : col.text,
          borderRadius:  '6px',
          padding:       '0.4rem 0.5rem',
          fontSize:      '0.78rem',
          fontWeight:    sel ? 700 : 500,
          cursor:        canBook ? 'pointer' : 'default',
          transition:    'all 0.15s',
          textAlign:     'center',
          lineHeight:    '1.3',
          transform:     sel ? 'scale(1.05)' : 'none',
          boxShadow:     sel ? '0 2px 8px rgba(26,115,232,.3)' : 'none',
        }}
      >
        <div>{slot.start}</div>
        <div style={{ fontSize:'0.68rem', opacity:0.8 }}>{col.label}</div>
      </button>
    );
  };

  return (
    <div>
      {/* Summary bar */}
      {summary && (
        <div style={{
          display:'flex', gap:'1rem', marginBottom:'1rem',
          padding:'0.75rem', background:'var(--gray-100)', borderRadius:'8px',
          fontSize:'0.85rem', flexWrap:'wrap',
        }}>
          <span style={{ color:'#2e7d32' }}>✅ {summary.available} available</span>
          <span style={{ color:'#c62828' }}>🔴 {summary.booked} booked</span>
          <span style={{ color:'var(--gray-500)' }}>Total: {summary.total} slots</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.75rem', fontSize:'0.78rem', flexWrap:'wrap' }}>
        {Object.entries(STATUS_COLOR).map(([k, v]) => (
          <span key={k} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
            <span style={{ width:'12px', height:'12px', background:v.bg, border:`2px solid ${v.border}`, borderRadius:'3px', display:'inline-block' }}/>
            {v.label}
          </span>
        ))}
        <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
          <span style={{ width:'12px', height:'12px', background:'#1a73e8', borderRadius:'3px', display:'inline-block' }}/>
          Selected
        </span>
      </div>

      {/* AM slots */}
      {am.length > 0 && (
        <div style={{ marginBottom:'1rem' }}>
          <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-500)', marginBottom:'0.4rem' }}>MORNING (08:00–12:00)</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'0.4rem' }}>
            {am.map(renderSlot)}
          </div>
        </div>
      )}

      {/* PM slots */}
      {pm.length > 0 && (
        <div>
          <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-500)', marginBottom:'0.4rem' }}>AFTERNOON / EVENING (12:00–22:00)</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'0.4rem' }}>
            {pm.map(renderSlot)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityGrid;
