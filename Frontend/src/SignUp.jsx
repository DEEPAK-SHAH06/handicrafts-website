import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './context/useAuth';
import './Login.css';

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.62 5.91c4.45-4.11 7.15-10.17 7.15-17.56Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.89l-7.62-5.91c-2.12 1.42-4.84 2.27-8.3 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isGoogleConfigured = clientId && !clientId.includes('your-google-client-id');

  // Password criteria checklist
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      match: Boolean(password && confirmPassword && password === confirmPassword),
    };
  }, [password, confirmPassword]);

  // Google OAuth flow
  const triggerGoogleSignUp = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsGoogleLoading(true);
        setError('');
        await googleLogin(null, tokenResponse.access_token);
        navigate('/', { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Google sign-up failed.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.warn('Google sign-up error:', err);
      setIsGoogleLoading(false);
      setError('Google authorization was cancelled or failed.');
    },
  });

  function handleGoogleButtonClick() {
    setError('');
    setInfoMessage('');

    if (!isGoogleConfigured) {
      setInfoMessage(
        'Google OAuth requires valid credentials: Set VITE_GOOGLE_CLIENT_ID in Frontend/.env and GOOGLE_CLIENT_ID in Backend/.env to complete live Google authorization.'
      );
      return;
    }

    setIsGoogleLoading(true);
    triggerGoogleSignUp();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfoMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!passwordChecks.length || !passwordChecks.lower || !passwordChecks.upper || !passwordChecks.number) {
      setError('Please ensure your password meets all strength criteria listed below.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(trimmedName, trimmedEmail, password, confirmPassword);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-topbar">
        <Link to="/" className="login-back">
          <ArrowLeft size={17} /> Back to home
        </Link>
        <Link to="/" className="login-wordmark">
          HIMALAYAN <span>SACRED ARTS</span>
        </Link>
      </div>

      <section className="login-layout" aria-labelledby="signup-heading">
        <aside className="login-story">
          <div className="login-story-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 7C32 7 19 21 19 34C19 44 24 51 32 51C40 51 45 44 45 34C45 21 32 7 32 7Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 34C8 34 19 27 32 34C45 41 56 34 56 34" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="32" cy="34" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="login-eyebrow">Join the circle of patrons</p>
          <h1>Begin your sacred <em>collection.</em></h1>
          <p className="login-story-copy">
            Create an account to submit custom sculpture enquiries, commission bespoke deity statues, and receive updates on finished works directly from the Patan artisans.
          </p>
          <div className="login-trust">
            <ShieldCheck size={18} />
            <span>Pure craftsmanship. Direct artisan patronage.</span>
          </div>
          <div className="login-ornament" aria-hidden="true">✦ &nbsp; ✧ &nbsp; ✦</div>
        </aside>

        <div className="login-card">
          <div className="login-card-heading">
            <p className="login-eyebrow">New Patron</p>
            <h2 id="signup-heading">Create your account</h2>
            <p>Join Himalayan Sacred Arts today.</p>
          </div>

          {error && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="auth-alert info" role="status">
              <ShieldCheck size={18} />
              <span>{infoMessage}</span>
            </div>
          )}

          <button
            type="button"
            className="google-signin"
            onClick={handleGoogleButtonClick}
            disabled={isGoogleLoading || isSubmitting}
            aria-label="Continue with Google"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleMark />
            )}
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="login-divider"><span>or register with email</span></div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="signup-name">Full name</label>
            <div className="login-input-wrap">
              <User size={18} />
              <input
                id="signup-name"
                type="text"
                placeholder="Pema Dorje"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <label htmlFor="signup-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <label htmlFor="signup-password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                className="password-visibility"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                className="password-visibility"
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength checklist */}
            <div className="password-criteria" aria-live="polite">
              <div className={`criterion ${passwordChecks.length ? 'met' : ''}`}>
                {passwordChecks.length ? <CheckCircle2 size={13} /> : <span className="dot">•</span>}
                <span>At least 8 characters</span>
              </div>
              <div className={`criterion ${passwordChecks.upper && passwordChecks.lower ? 'met' : ''}`}>
                {passwordChecks.upper && passwordChecks.lower ? <CheckCircle2 size={13} /> : <span className="dot">•</span>}
                <span>Upper & lowercase letters</span>
              </div>
              <div className={`criterion ${passwordChecks.number ? 'met' : ''}`}>
                {passwordChecks.number ? <CheckCircle2 size={13} /> : <span className="dot">•</span>}
                <span>At least one number</span>
              </div>
              {confirmPassword && (
                <div className={`criterion ${passwordChecks.match ? 'met' : 'unmet'}`}>
                  {passwordChecks.match ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  <span>{passwordChecks.match ? 'Passwords match' : 'Passwords do not match yet'}</span>
                </div>
              )}
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <p className="login-signup">
            Already have an account?{' '}
            <Link to="/login" className="signup-link">
              Sign in
            </Link>
          </p>
          <p className="login-terms">By registering, you agree to our terms of patronage and privacy policy.</p>
        </div>
      </section>
      <footer className="login-footer">
        © 2026 Himalayan Sacred Arts <span>·</span> Handcrafted in the Kathmandu Valley
      </footer>
    </main>
  );
}
