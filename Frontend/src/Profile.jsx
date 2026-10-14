import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from './context/useAuth';
import './Login.css';

export default function Profile() {
  const { user, role, isAdmin, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  async function handleUpdateProfile(event) {
    event.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    setIsUpdating(true);
    setFeedback({ type: '', text: '' });

    try {
      await updateProfile({ name: name.trim() });
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <main className="login-page">
      <div className="login-topbar">
        <Link to="/" className="login-back">
          <ArrowLeft size={17} /> Back to gallery
        </Link>
        <Link to="/" className="login-wordmark">
          HIMALAYAN <span>SACRED ARTS</span>
        </Link>
      </div>

      <div style={{
        maxWidth: '820px',
        width: 'calc(100% - 48px)',
        margin: '48px auto',
        flex: 1
      }}>
        {/* Header banner */}
        <div style={{
          borderBottom: '1px solid rgba(184, 137, 43, 0.3)',
          paddingBottom: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <p className="login-eyebrow">Patron Sanctum</p>
            <h1 style={{
              margin: '0 0 8px',
              fontFamily: 'var(--display, Georgia, serif)',
              color: 'var(--login-gold-pale)',
              fontSize: '32px',
              fontWeight: 500
            }}>
              Your Profile & Collection
            </h1>
            <p style={{ color: 'var(--login-muted)', margin: 0, fontSize: '15px' }}>
              Manage your personal patronage details and account security.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  border: '1px solid var(--login-gold)',
                  background: 'var(--login-maroon)',
                  color: 'var(--login-gold-pale)',
                  fontSize: '13px',
                  letterSpacing: '0.04em'
                }}
              >
                <LayoutDashboard size={16} /> Admin Portal
              </Link>
            )}
            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                border: '1px solid rgba(232, 217, 176, 0.25)',
                background: 'transparent',
                color: 'var(--login-muted)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '13px'
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {feedback.text && (
          <div className={`auth-alert ${feedback.type}`} style={{ marginBottom: '24px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {/* Card 1: Account overview */}
          <div className="login-card" style={{ padding: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              color: 'var(--login-gold-pale)',
              fontFamily: 'var(--display, Georgia, serif)',
              margin: '0 0 20px',
              borderBottom: '1px solid rgba(184, 137, 43, 0.2)',
              paddingBottom: '12px'
            }}>
              Patron Record
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--login-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Email Address
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: 'var(--login-parchment)' }}>
                  <Mail size={16} color="var(--login-gold)" />
                  <span>{user?.email}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--login-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Role & Privileges
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Shield size={16} color="var(--login-gold-bright)" />
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    background: role === 'ADMIN' ? 'var(--login-maroon)' : 'rgba(184, 137, 43, 0.2)',
                    color: role === 'ADMIN' ? 'var(--login-gold-bright)' : 'var(--login-gold-pale)',
                    border: '1px solid var(--login-gold)'
                  }}>
                    {role === 'ADMIN' ? '✦ MASTER ARTISAN (ADMIN)' : 'DEVOUT PATRON (USER)'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--login-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Authentication Methods
                </span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {user?.hasPassword && (
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(232, 217, 176, 0.2)',
                      color: 'var(--login-muted)'
                    }}>
                      ✓ Password Protected
                    </span>
                  )}
                  {user?.isGoogleLinked && (
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: 'rgba(66, 133, 244, 0.15)',
                      border: '1px solid rgba(66, 133, 244, 0.4)',
                      color: '#93bbf8'
                    }}>
                      ✓ Google Account Linked
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--login-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Member Since
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: 'var(--login-muted)', fontSize: '14px' }}>
                  <Calendar size={16} />
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Edit profile details */}
          <div className="login-card" style={{ padding: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              color: 'var(--login-gold-pale)',
              fontFamily: 'var(--display, Georgia, serif)',
              margin: '0 0 20px',
              borderBottom: '1px solid rgba(184, 137, 43, 0.2)',
              paddingBottom: '12px'
            }}>
              Personal Information
            </h2>

            <form onSubmit={handleUpdateProfile}>
              <label htmlFor="profile-name" style={{ display: 'block', color: 'var(--login-gold-pale)', fontSize: '13px' }}>
                Full Name
              </label>
              <div className="login-input-wrap" style={{ margin: '8px 0 24px' }}>
                <User size={18} />
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={isUpdating}
                style={{ justifyContent: 'center', gap: '10px' }}
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{isUpdating ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        © 2026 Himalayan Sacred Arts <span>·</span> Patan, Kathmandu Valley
      </footer>
    </main>
  );
}
