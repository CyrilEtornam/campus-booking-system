import React, { useState, useEffect } from 'react';
import { bookingApi, facilityApi } from '../services/api';
import BookingHistory from './BookingHistory';
import { ConfirmModal, PromptModal } from './Modal';

const FacilityForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    name: '', location: '', capacity: '', description: '',
    facility_type: 'room', amenities: '', requires_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        capacity: parseInt(form.capacity),
        amenities: typeof form.amenities === 'string'
          ? form.amenities.split(',').map(s => s.trim()).filter(Boolean)
          : form.amenities,
      };
      if (initial?.id) {
        await facilityApi.update(initial.id, payload);
      } else {
        await facilityApi.create(payload);
      }
      onSave();
    } catch (err) {
      setError(err.displayMessage || 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const types = ['room', 'lab', 'gym', 'auditorium', 'sports', 'study_room'];

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Facility Name *</label>
          <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Location *</label>
          <input className="form-control" value={form.location} onChange={e => set('location', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Capacity *</label>
          <input type="number" className="form-control" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-control" value={form.facility_type} onChange={e => set('facility_type', e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Amenities (comma-separated)</label>
        <input className="form-control" placeholder="Projector, Whiteboard, AC..."
          value={Array.isArray(form.amenities) ? form.amenities.join(', ') : form.amenities}
          onChange={e => set('amenities', e.target.value)} />
      </div>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" id="req_approval" checked={form.requires_approval}
          onChange={e => set('requires_approval', e.target.checked)} />
        <label htmlFor="req_approval" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-secondary)' }}>Requires admin approval</label>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving\u2026' : initial ? 'Update Facility' : 'Create Facility'}
        </button>
      </div>
    </form>
  );
};

const AdminPanel = () => {
  const [tab,        setTab]        = useState('bookings');
  const [bookings,   setBookings]   = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [editFacility, setEditFacility] = useState(null);
  const [showForm,   setShowForm]   = useState(false);

  // Modal state
  const [rejectTarget,     setRejectTarget]     = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingApi.getAll();
      setBookings(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const { data } = await facilityApi.getAll();
      setFacilities(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 'bookings')   loadBookings();
    if (tab === 'facilities') loadFacilities();
  }, [tab]);

  const handleApprove = async (id) => {
    await bookingApi.update(id, { status: 'confirmed' });
    loadBookings();
  };

  const handleRejectSubmit = async (notes) => {
    const id = rejectTarget;
    setRejectTarget(null);
    await bookingApi.update(id, { status: 'rejected', admin_notes: notes || '' });
    loadBookings();
  };

  const handleDeactivateConfirm = async () => {
    const id = deactivateTarget;
    setDeactivateTarget(null);
    await facilityApi.remove(id);
    loadFacilities();
  };

  const pending = bookings.filter(b => b.status === 'pending');

  return (
    <div>
      <PromptModal
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleRejectSubmit}
        title="Reject Booking"
        message="Reason for rejection (optional):"
        placeholder="Enter reason..."
      />
      <ConfirmModal
        isOpen={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Facility"
        message="Are you sure you want to deactivate this facility?"
        confirmLabel="Deactivate"
        variant="danger"
      />

      <div className="admin-tabs">
        {[
          { key: 'bookings', label: `Bookings ${pending.length ? `(${pending.length} pending)` : ''}` },
          { key: 'facilities', label: 'Facilities' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`admin-tab ${tab === t.key ? 'admin-tab--active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          {tab === 'bookings' && (
            <div>
              {pending.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', color: 'var(--warning)' }}>
                    Pending Approval ({pending.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pending.map(b => (
                      <div key={b.id} className="pending-card">
                        <div className="pending-card-info">
                          <strong>{b.facility_name}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>#{b.id}</span><br />
                          <span className="pending-card-details">
                            {b.user_name} &middot; {b.date} {b.start_time}&ndash;{b.end_time}
                          </span>
                          {b.purpose && <span className="pending-card-purpose">{b.purpose}</span>}
                        </div>
                        <div className="pending-card-actions">
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(b.id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejectTarget(b.id)}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 style={{ marginBottom: '0.75rem' }}>All Bookings</h3>
              <BookingHistory bookings={bookings} onRefresh={loadBookings} showUser={true} />
            </div>
          )}

          {tab === 'facilities' && (
            <div>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Manage Facilities ({facilities.length})</h3>
                <button className="btn btn-primary" onClick={() => { setEditFacility(null); setShowForm(true); }}>
                  + Add Facility
                </button>
              </div>

              {showForm && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">{editFacility ? 'Edit Facility' : 'Add New Facility'}</div>
                  <div className="card-body">
                    <FacilityForm
                      initial={editFacility}
                      onSave={() => { setShowForm(false); setEditFacility(null); loadFacilities(); }}
                      onCancel={() => { setShowForm(false); setEditFacility(null); }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {facilities.map(f => (
                  <div key={f.id} className={`facility-list-item ${!f.is_active ? 'facility-list-item--inactive' : ''}`}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{f.name}</strong>
                      <span className={`badge badge-${f.facility_type}`} style={{ marginLeft: '0.5rem' }}>{f.facility_type}</span>
                      {!f.is_active && <span className="badge badge-cancelled" style={{ marginLeft: '0.5rem' }}>Inactive</span>}
                      <p className="facility-list-item-meta">
                        {f.location} &middot; Capacity: {f.capacity}
                        {f.requires_approval ? ' \u00B7 Approval required' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditFacility(f); setShowForm(true); }}>Edit</button>
                      {f.is_active && (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeactivateTarget(f.id)}>Deactivate</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
