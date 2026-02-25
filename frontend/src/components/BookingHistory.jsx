import React, { useState } from 'react';
import { bookingApi } from '../services/api';
import { format } from 'date-fns';
import { ConfirmModal, AlertModal } from './Modal';

const STATUS_OPTIONS = ['all', 'confirmed', 'pending', 'cancelled', 'rejected', 'completed'];

const BookingHistory = ({ bookings, onRefresh, showUser = false }) => {
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [cancelling,  setCancelling]  = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [alertMsg,    setAlertMsg]    = useState('');

  const handleCancelClick = (id) => setCancelTarget(id);

  const confirmCancel = async () => {
    const id = cancelTarget;
    setCancelTarget(null);
    setCancelling(id);
    try {
      await bookingApi.cancel(id);
      onRefresh && onRefresh();
    } catch (err) {
      setAlertMsg(err.displayMessage || 'Failed to cancel booking.');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch = !search ||
      b.facility_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      (showUser && b.user_name?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const fmtDate = (d) => {
    try { return format(new Date(d), 'MMM d, yyyy'); }
    catch { return d; }
  };

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hh = parseInt(h);
    return `${hh > 12 ? hh - 12 : hh || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
  };

  if (!bookings.length) return (
    <div className="empty-state">
      <h3>No bookings yet</h3>
      <p>You haven't made any bookings. Browse facilities to get started.</p>
    </div>
  );

  return (
    <div>
      <ConfirmModal
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        confirmLabel="Cancel Booking"
        variant="danger"
      />
      <AlertModal
        isOpen={!!alertMsg}
        onClose={() => setAlertMsg('')}
        title="Error"
        message={alertMsg}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-control"
          style={{ maxWidth: '200px' }}
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>
                  ({bookings.filter(b => b.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-center" style={{ padding: '1.5rem' }}>No bookings match your filter.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="col-hide-sm">#</th>
                {showUser && <th>User</th>}
                <th>Facility</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th className="col-hide-sm">Attendees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td className="col-hide-sm" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{b.id}</td>
                  {showUser && (
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{b.facility_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.facility_location}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{fmtDate(b.date)}</td>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {fmtTime(b.start_time)} &ndash; {fmtTime(b.end_time)}
                  </td>
                  <td className="col-truncate" style={{ fontSize: '0.82rem' }}>
                    {b.purpose || <span className="text-muted">&ndash;</span>}
                  </td>
                  <td className="col-hide-sm" style={{ textAlign: 'center', fontSize: '0.85rem' }}>{b.attendees}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  <td>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelClick(b.id)}
                        disabled={cancelling === b.id}
                      >
                        {cancelling === b.id ? '\u2026' : 'Cancel'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '0.75rem', fontSize: '0.8rem' }} className="text-muted">
        Showing {filtered.length} of {bookings.length} bookings
      </p>
    </div>
  );
};

export default BookingHistory;
