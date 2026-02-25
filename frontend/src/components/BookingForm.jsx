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

  const handleSlotSelect = (s) => {
    setSlot(s);
    setStartTime(s.start);
    setEndTime(s.end);
  };

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
        setError(`Conflict: this slot is already booked (${conflicts[0].start_time}\u2013${conflicts[0].end_time}).`);
      } else {
        setError(err.displayMessage || 'Booking failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="alert alert-success" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <strong>{success}</strong>
      <p className="text-muted mt-1" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
        {facility.requires_approval
          ? 'An admin will review and confirm your booking.'
          : 'Your booking is confirmed. Check your dashboard for details.'}
      </p>
    </div>
  );

  const stepClass = (n) => {
    if (step === n) return 'step-indicator-item step-indicator-item--active';
    if (step > n) return 'step-indicator-item step-indicator-item--completed';
    return 'step-indicator-item step-indicator-item--pending';
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="step-indicator">
        <div className={stepClass(1)}>1. Select Date & Slot</div>
        <div className={stepClass(2)}>2. Confirm Booking</div>
      </div>

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

          <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Available Slots for <strong>{date}</strong>
          </p>
          <AvailabilityGrid
            facilityId={facility.id}
            date={date}
            onSelectSlot={handleSlotSelect}
            selectedSlot={slot}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="text-muted text-small">Or enter manually:</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="time" className="form-control" style={{ width: '110px' }}
                value={startTime} onChange={e => handleStartChange(e.target.value)} />
              <span className="text-muted">&ndash;</span>
              <input type="time" className="form-control" style={{ width: '110px' }}
                value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <button
            className="btn btn-primary btn-block mt-3"
            onClick={() => setStep(2)}
            disabled={!startTime || !endTime}
          >
            Next &rarr; Confirm Details
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="booking-summary">
            <p className="booking-summary-title">Booking Summary</p>
            <p className="booking-summary-details">
              <strong>{facility.name}</strong><br />
              {date} &nbsp;|&nbsp; {startTime} &ndash; {endTime}
            </p>
            {facility.requires_approval && (
              <p className="booking-summary-warning">
                This facility requires admin approval.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Group project meeting, Lab session..."
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              style={{ resize: 'vertical' }}
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              &larr; Back
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Submitting\u2026' : facility.requires_approval ? 'Submit for Approval' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookingForm;
