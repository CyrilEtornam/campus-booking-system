import React, { useState, useEffect, useCallback } from 'react';
import { facilityApi } from '../services/api';
import FacilityCard from '../components/FacilityCard';
import { SkeletonCard } from '../components/SkeletonLoader';

const TYPES = ['all', 'room', 'lab', 'gym', 'auditorium', 'sports', 'study_room'];

const FacilitiesPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [type,       setType]       = useState('all');
  const [minCap,     setMinCap]     = useState('');

  const fetchFacilities = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (type !== 'all') params.type = type;
      if (minCap) params.minCapacity = minCap;

      const { data } = await facilityApi.getAll(params);
      setFacilities(data.data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load facilities.');
    } finally {
      setLoading(false);
    }
  }, [search, type, minCap]);

  useEffect(() => {
    const t = setTimeout(fetchFacilities, 300);
    return () => clearTimeout(t);
  }, [fetchFacilities]);

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="section-header">
          <h1>Campus Facilities</h1>
          <span className="text-muted">{facilities.length} facility{facilities.length !== 1 ? 'ies' : 'y'} available</span>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body filters-bar">
            <div className="form-group filter-group filter-group--grow">
              <label className="form-label">Search</label>
              <input
                className="form-control"
                placeholder="Name, location, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group filter-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group filter-group">
              <label className="form-label">Min Capacity</label>
              <input
                type="number" className="form-control" placeholder="e.g. 10"
                style={{ width: '110px' }}
                value={minCap}
                onChange={e => setMinCap(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setType('all'); setMinCap(''); }}>
              Clear
            </button>
          </div>
        </div>

        <div className="type-pills">
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-secondary'}`}>
              {t === 'all' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="grid-3">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : facilities.length === 0 ? (
          <div className="empty-state">
            <h3>No facilities found</h3>
            <p>Try adjusting your search or filters.</p>
            <button className="btn btn-primary mt-2" onClick={() => { setSearch(''); setType('all'); setMinCap(''); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {facilities.map(f => <FacilityCard key={f.id} facility={f} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesPage;
