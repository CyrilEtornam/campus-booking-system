import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminPanel from '../components/AdminPanel';

const AdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="section-header" style={{ marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ margin:'0 0 0.25rem' }}>Admin Dashboard</h1>
            <p className="text-muted" style={{ margin:0 }}>
              Logged in as <strong>{user?.name}</strong> (Administrator)
            </p>
          </div>
          <span className="badge" style={{
            background:'linear-gradient(135deg,#1a73e8,#0d47a1)',
            color:'#fff', padding:'0.4rem 1rem', fontSize:'0.82rem',
          }}>
            ⚙️ Admin Access
          </span>
        </div>

        <div className="card">
          <div className="card-body">
            <AdminPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
