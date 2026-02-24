/**
 * AdminPanel
 * ===========
 * Tab-based admin interface:
 *   - Bookings tab: view all bookings, approve/reject pending ones
 *   - Facilities tab: add/edit/deactivate facilities
 */

import React, { useState, useEffect } from 'react';
import { bookingApi, facilityApi } from '../services/api';
import BookingHistory from './BookingHistory';

// ── Facility Form (create/edit) ───────────────────────────────────────────────
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

  const types = ['room','lab','gym','auditorium','sports','study_room'];

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Facility Name *</label>
          <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required/>
        </div>
        <div className="form-group">
          <label className="form-label">Location *</label>
          <input className="form-control" value={form.location} onChange={e => set('location', e.target.value)} required/>
        </div>
        <div className="form-group">
          <label className="form-label">Capacity *</label>
          <input type="number" className="form-control" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} required/>
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-control" value={form.facility_type} onChange={e => set('facility_type', e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={2} value={form.description} onChange={e => set('description', e.target.value)}/>
      </div>
      <div className="form-group">
        <label className="form-label">Amenities (comma-separated)</label>
        <input className="form-control" placeholder="Projector, Whiteboard, AC…"
          value={Array.isArray(form.amenities) ? form.amenities.join(', ') : form.amenities}
          onChange={e => set('amenities', e.target.value)}/>
      </div>
      <div className="form-group" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <input type="checkbox" id="req_approval" checked={form.requires_approval}
          onChange={e => set('requires_approval', e.target.checked)}/>
        <label htmlFor="req_approval" style={{ margin:0, cursor:'pointer' }}>Requires admin approval</label>
      </div>
      <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Update Facility' : 'Create Facility'}
        </button>
      </div>
    </form>
  );
};

// ── Main AdminPanel ───────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [tab,        setTab]        = useState('bookings');
  const [bookings,   setBookings]   = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [editFacility, setEditFacility] = useState(null);
  const [showForm,   setShowForm]   = useState(false);

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

  const handleReject = async (id) => {
    const notes = prompt('Reason for rejection (optional):');
    await bookingApi.update(id, { status: 'rejected', admin_notes: notes });
    loadBookings();
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this facility?')) return;
    await facilityApi.remove(id);
    loadFacilities();
  };

  const pending = bookings.filter(b => b.status === 'pending');

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'2px solid var(--gray-200)', paddingBottom:'0' }}>
        {[
          { key:'bookings',   label: `Bookings ${pending.length ? `(${pending.length} pending)` : ''}` },
          { key:'facilities', label: 'Facilities' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:'none', border:'none', padding:'0.6rem 1rem', cursor:'pointer',
            fontWeight: tab === t.key ? 700 : 400,
            borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)',
            marginBottom:'-2px', fontSize:'0.95rem',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"/></div>
      ) : (
        <>
          {/* ── Bookings Tab ─────────────────────────────────────────── */}
          {tab === 'bookings' && (
            <div>
              {pending.length > 0 && (
                <div style={{ marginBottom:'1.5rem' }}>
                  <h3 style={{ marginBottom:'0.75rem', color:'#856404' }}>
                    ⏳ Pending Approval ({pending.length})
                  </h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    {pending.map(b => (
                      <div key={b.id} style={{
                        background:'#fff8e1', border:'1.5px solid #ff9800',
                        borderRadius:'8px', padding:'1rem', display:'flex', alignItems:'center',
                        justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem',
                      }}>
                        <div>
                          <strong>{b.facility_name}</strong>
                          <span style={{ color:'var(--gray-500)', fontSize:'0.82rem', marginLeft:'0.5rem' }}>#{b.id}</span><br/>
                          <span style={{ fontSize:'0.85rem' }}>
                            {b.user_name} · {b.date} {b.start_time}–{b.end_time}
                          </span>
                          {b.purpose && <span style={{ fontSize:'0.82rem', color:'var(--gray-600)', display:'block' }}>{b.purpose}</span>}
                        </div>
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(b.id)}>✅ Approve</button>
                          <button className="btn btn-danger  btn-sm" onClick={() => handleReject(b.id)}>❌ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 style={{ marginBottom:'0.75rem' }}>All Bookings</h3>
              <BookingHistory bookings={bookings} onRefresh={loadBookings} showUser={true}/>
            </div>
          )}

          {/* ── Facilities Tab ─────────────────────────────────────────── */}
          {tab === 'facilities' && (
            <div>
              <div className="flex-between" style={{ marginBottom:'1rem' }}>
                <h3 style={{ margin:0 }}>Manage Facilities ({facilities.length})</h3>
                <button className="btn btn-primary" onClick={() => { setEditFacility(null); setShowForm(true); }}>
                  + Add Facility
                </button>
              </div>

              {showForm && (
                <div className="card" style={{ marginBottom:'1.5rem' }}>
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

              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {facilities.map(f => (
                  <div key={f.id} style={{
                    background:'var(--white)', border:'1px solid var(--gray-200)',
                    borderRadius:'8px', padding:'1rem', display:'flex',
                    alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem',
                    opacity: f.is_active ? 1 : 0.5,
                  }}>
                    <div>
                      <strong>{f.name}</strong>
                      <span className={`badge badge-${f.facility_type}`} style={{ marginLeft:'0.5rem' }}>{f.facility_type}</span>
                      {!f.is_active && <span className="badge badge-cancelled" style={{ marginLeft:'0.5rem' }}>Inactive</span>}
                      <p style={{ margin:'0.25rem 0 0', fontSize:'0.82rem', color:'var(--gray-500)' }}>
                        📍 {f.location} · 👥 {f.capacity}
                        {f.requires_approval ? ' · ✋ Approval required' : ''}
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditFacility(f); setShowForm(true); }}>Edit</button>
                      {f.is_active && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(f.id)}>Deactivate</button>
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
