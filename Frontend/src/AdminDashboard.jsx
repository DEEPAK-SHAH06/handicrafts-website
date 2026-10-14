import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  ShieldAlert,
  ShieldCheck,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  UserCheck,
  UserX,
} from 'lucide-react';
import api from './services/api';
import { useAuth } from './context/useAuth';
import './Login.css';

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load administrator data.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/users')])
      .then(([statsRes, usersRes]) => {
        if (active) {
          if (statsRes.data?.success) setStats(statsRes.data.stats);
          if (usersRes.data?.success) setUsers(usersRes.data.users);
        }
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load administrator data.',
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleToggleStatus(userId, currentStatus) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setActionLoading(`status-${userId}`);
    setFeedback({ type: '', text: '' });

    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      if (res.data?.success) {
        setFeedback({ type: 'success', text: res.data.message });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
        );
        loadData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update user status.',
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleRole(userId, currentRole) {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    setActionLoading(`role-${userId}`);
    setFeedback({ type: '', text: '' });

    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: nextRole });
      if (res.data?.success) {
        setFeedback({ type: 'success', text: res.data.message });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
        );
        loadData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update user role.',
      });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="login-page">
      <div className="login-topbar">
        <Link to="/profile" className="login-back">
          <ArrowLeft size={17} /> Back to Profile
        </Link>
        <Link to="/" className="login-wordmark">
          HIMALAYAN <span>SACRED ARTS · ADMIN</span>
        </Link>
      </div>

      <div style={{
        maxWidth: '1200px',
        width: 'calc(100% - 48px)',
        margin: '40px auto',
        flex: 1
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid rgba(184, 137, 43, 0.3)',
          paddingBottom: '20px',
          marginBottom: '28px'
        }}>
          <div>
            <p className="login-eyebrow">Workshop Authority</p>
            <h1 style={{
              margin: '0 0 6px',
              fontFamily: 'var(--display, Georgia, serif)',
              color: 'var(--login-gold-pale)',
              fontSize: '28px',
              fontWeight: 500
            }}>
              Patron & Artisan Administration
            </h1>
            <p style={{ color: 'var(--login-muted)', margin: 0, fontSize: '14px' }}>
              Logged in as Master Artisan <strong>{currentUser?.email}</strong>
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid var(--login-gold)',
              color: 'var(--login-gold-pale)',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: '13px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>

        {feedback.text && (
          <div className={`auth-alert ${feedback.type}`} style={{ marginBottom: '24px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '36px'
        }}>
          <div className="login-card" style={{ padding: '20px', textAlign: 'center' }}>
            <Users size={24} color="var(--login-gold-bright)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '28px', color: 'var(--login-gold-pale)', fontWeight: 600 }}>
              {stats?.totalUsers ?? '...'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--login-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Registered Patrons
            </div>
          </div>

          <div className="login-card" style={{ padding: '20px', textAlign: 'center' }}>
            <ShieldCheck size={24} color="#8ed081" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '28px', color: 'var(--login-gold-pale)', fontWeight: 600 }}>
              {stats?.activeUsers ?? '...'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--login-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Accounts
            </div>
          </div>

          <div className="login-card" style={{ padding: '20px', textAlign: 'center' }}>
            <ShieldAlert size={24} color="var(--login-gold-bright)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '28px', color: 'var(--login-gold-pale)', fontWeight: 600 }}>
              {stats?.admins ?? '...'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--login-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Master Artisans (Admins)
            </div>
          </div>

          <div className="login-card" style={{ padding: '20px', textAlign: 'center' }}>
            <Globe size={24} color="#4285f4" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '28px', color: 'var(--login-gold-pale)', fontWeight: 600 }}>
              {stats?.googleLinkedUsers ?? '...'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--login-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Google Linked Patrons
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="login-card" style={{ padding: '24px', overflowX: 'auto' }}>
          <h2 style={{
            fontSize: '18px',
            color: 'var(--login-gold-pale)',
            fontFamily: 'var(--display, Georgia, serif)',
            margin: '0 0 16px'
          }}>
            Patron Accounts Directory
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(184, 137, 43, 0.3)', color: 'var(--login-gold-pale)' }}>
                <th style={{ padding: '10px 12px' }}>ID</th>
                <th style={{ padding: '10px 12px' }}>Name</th>
                <th style={{ padding: '10px 12px' }}>Email</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Auth Source</th>
                <th style={{ padding: '10px 12px' }}>Joined</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(232, 217, 176, 0.1)' }}>
                    <td style={{ padding: '12px', color: 'var(--login-muted)' }}>#{u.id}</td>
                    <td style={{ padding: '12px', color: 'var(--login-parchment)', fontWeight: 500 }}>
                      {u.name} {isSelf && <span style={{ fontSize: '11px', color: 'var(--login-gold-bright)' }}>(You)</span>}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--login-muted)' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        background: u.role === 'ADMIN' ? 'var(--login-maroon)' : 'rgba(255,255,255,0.06)',
                        color: u.role === 'ADMIN' ? 'var(--login-gold-bright)' : 'var(--login-parchment)',
                        border: '1px solid rgba(184, 137, 43, 0.3)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: u.status === 'ACTIVE' ? '#8ed081' : '#ff9d90',
                        border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(142, 208, 129, 0.3)' : 'rgba(255, 157, 144, 0.3)'}`
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--login-muted)' }}>
                      {u.google_id ? 'Google + DB' : 'Email/Password'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--login-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {/* Status button */}
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          disabled={isSelf || actionLoading === `status-${u.id}`}
                          title={isSelf ? 'Cannot disable your own account' : `${u.status === 'ACTIVE' ? 'Disable' : 'Activate'} user`}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            border: '1px solid rgba(232, 217, 176, 0.2)',
                            color: u.status === 'ACTIVE' ? '#ff9d90' : '#8ed081',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isSelf ? 0.4 : 1
                          }}
                        >
                          {u.status === 'ACTIVE' ? <Lock size={12} /> : <Unlock size={12} />}
                          <span>{u.status === 'ACTIVE' ? 'Disable' : 'Activate'}</span>
                        </button>

                        {/* Role button */}
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          disabled={isSelf || actionLoading === `role-${u.id}`}
                          title={isSelf ? 'Cannot demote yourself' : `Make ${u.role === 'ADMIN' ? 'User' : 'Admin'}`}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            border: '1px solid rgba(184, 137, 43, 0.3)',
                            color: 'var(--login-gold-bright)',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isSelf ? 0.4 : 1
                          }}
                        >
                          {u.role === 'ADMIN' ? <UserX size={12} /> : <UserCheck size={12} />}
                          <span>{u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="login-footer">
        © 2026 Himalayan Sacred Arts <span>·</span> Administrative Portal
      </footer>
    </main>
  );
}
