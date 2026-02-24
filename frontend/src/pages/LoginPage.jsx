import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.displayMessage || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill for demo credentials
  const quickFill = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="page-wrapper flex-center" style={{ minHeight:'calc(100vh - 64px)' }}>
      <div style={{ width:'100%', maxWidth:'420px', padding:'0 1rem' }}>
        <div className="card">
          <div className="card-body p-3">
            <h2 style={{ textAlign:'center', marginBottom:'0.25rem' }}>Welcome Back</h2>
            <p style={{ textAlign:'center', color:'var(--gray-500)', marginBottom:'1.5rem', fontSize:'0.88rem' }}>
              Sign in to your account
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email" className="form-control"
                  placeholder="you@campus.edu"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password" className="form-control"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.88rem' }}>
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="card-footer">
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--gray-500)', marginBottom:'0.5rem' }}>
              DEMO CREDENTIALS
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              {[
                { label:'Admin',   e:'admin@campus.edu',  p:'Admin1234'  },
                { label:'Faculty', e:'alice@campus.edu',  p:'Faculty123' },
                { label:'Student', e:'dave@student.edu',  p:'Student123' },
              ].map(c => (
                <button key={c.label} onClick={() => quickFill(c.e, c.p)}
                  className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start', gap:'0.5rem' }}>
                  <span style={{ fontWeight:600, minWidth:'55px' }}>{c.label}:</span>
                  <span style={{ color:'var(--gray-500)' }}>{c.e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
