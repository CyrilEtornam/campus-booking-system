/**
 * BookingForm
 * ============
 * Multi-step booking form:
 *  Step 1 – Select date & view availability grid
 *  Step 2 – Confirm time slot, add purpose & attendees
 */

import React, { useState } from 'react';
import { bookingApi } from '../services/api';
import AvailabilityGrid from './AvailabilityGrid';

const today = () => new Date().toISOString().slice(0, 10);

const BookingForm = ({ facility, onSuccess }) => {
  const [step,      setStep]      = useState(1);
  const [date,      setDate]      = useState(today());
  const [slot,      setSlot]      = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime,   setEndTime]   = useState('');
  const [purpose,   setPurpose]   = useState('');
  const [attendees, setAttendees] = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  // When user clicks a slot in the grid
  const handleSlotSelect = (s) => {
    setSlot(s);
    setStartTime(s.start);
    setEndTime(s.end);
  };

  // Manual time entry: compute end from start + 1h default
  const handleStartChange = (val) => {
    setStartTime(val);
    setSlot(null);
    if (val) {
      const [h, m] = val.split(':').map(Number);
      const endH = String(Math.min(h + 1, 22)).padStart(2, '0');
      setEndTime(`${endH}:${String(m).padStart(2, '0')}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await bookingApi.create({
        facility_id: facility.id,
        date, start_time: startTime, end_time: endTime,
        purpose, attendees: parseInt(attendees),
      });
      setSuccess(`Booking ${facility.requires_approval ? 'submitted for approval' : 'confirmed'}!`);
      onSuccess && onSuccess();
    } catch (err) {
      const conflicts = err.response?.data?.conflicts;
      if (conflicts?.length) {
        setError(`Conflict: this slot is already booked (${conflicts[0].start_time}–${conflicts[0].end_time}).`);
      } else {
        setError(err.displayMessage || 'Booking failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="alert alert-success" style={{ textAlign:'center', padding:'1.5rem' }}>
      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>✅</div>
      <strong>{success}</strong>
      <p className="text-muted mt-1" style={{ marginTop:'0.5rem', fontSize:'0.85rem' }}>
        {facility.requires_approval
          ? 'An admin will review and confirm your booking.'
          : 'Your booking is confirmed. Check your dashboard for details.'}
      </p>
    </div>
  );

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Step indicator */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem' }}>
        {[1,2].map(n => (
          <div key={n} style={{
            flex:1, padding:'0.5rem', textAlign:'center', borderRadius:'6px', fontSize:'0.82rem', fontWeight:600,
            background: step === n ? 'var(--primary)' : step > n ? 'var(--secondary)' : 'var(--gray-100)',
            color: step >= n ? '#fff' : 'var(--gray-500)',
          }}>
            {n === 1 ? '1. Select Date & Slot' : '2. Confirm Booking'}
          </div>
        ))}
      </div>

      {/* ── Step 1: Date + Availability ─────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="form-group">
            <label className="form-label">Select Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              min={today()}
              onChange={e => { setDate(e.target.value); setSlot(null); }}
            />
          </div>

          <p style={{ fontSize:'0.85rem', fontWeight:600, marginBottom:'0.5rem' }}>
            Available Slots for <strong>{date}</strong>
          </p>
          <AvailabilityGrid
            facilityId={facility.id}
            date={date}
            onSelectSlot={handleSlotSelect}
            selectedSlot={slot}
          />

          <div style={{ marginTop:'1rem', display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.82rem', color:'var(--gray-500)' }}>Or enter manually:</span>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <input type="time" className="form-control" style={{ width:'110px' }}
                value={startTime} onChange={e => handleStartChange(e.target.value)} />
              <span style={{ color:'var(--gray-500)' }}>–</span>
              <input type="time" className="form-control" style={{ width:'110px' }}
                value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <button
            className="btn btn-primary btn-block mt-3"
            style={{ marginTop:'1rem' }}
            onClick={() => setStep(2)}
            disabled={!startTime || !endTime}
          >
            Next → Confirm Details
          </button>
        </div>
      )}

      {/* ── Step 2: Confirm ─────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          {/* Summary card */}
          <div style={{
            background:'var(--primary-light)', border:'1.5px solid var(--primary)',
            borderRadius:'8px', padding:'1rem', marginBottom:'1rem', fontSize:'0.9rem',
          }}>
            <p style={{ margin:'0 0 0.25rem', fontWeight:600 }}>📅 Booking Summary</p>
            <p style={{ margin:0, color:'var(--gray-700)' }}>
              <strong>{facility.name}</strong><br/>
              {date} &nbsp;|&nbsp; {startTime} – {endTime}
            </p>
            {facility.requires_approval && (
              <p style={{ margin:'0.5rem 0 0', fontSize:'0.78rem', color:'#b45309' }}>
                ⚠️ This facility requires admin approval.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Group project meeting, Lab session…"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              style={{ resize:'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Number of Attendees (max {facility.capacity})</label>
            <input
              type="number" className="form-control"
              min={1} max={facility.capacity}
              value={attendees}
              onChange={e => setAttendees(e.target.value)}
            />
          </div>

          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex:1 }} disabled={loading}>
              {loading ? 'Submitting…' : facility.requires_approval ? 'Submit for Approval' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookingForm;
