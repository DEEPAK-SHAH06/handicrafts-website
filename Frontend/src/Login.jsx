import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/';

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isGoogleConfigured = clientId && !clientId.includes('your-google-client-id');

  // Real Google OAuth hook
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsGoogleLoading(true);
        setError('');
        await googleLogin(null, tokenResponse.access_token);
        navigate(destination, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Google sign-in failed.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.warn('Google sign-in error:', err);
      setIsGoogleLoading(false);
      setError('Google authentication was cancelled or failed. Please try again.');
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
    triggerGoogleLogin();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to sign in. Please verify your credentials.';
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

      <section className="login-layout" aria-labelledby="login-heading">
        <aside className="login-story">
          <div className="login-story-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 7C32 7 19 21 19 34C19 44 24 51 32 51C40 51 45 44 45 34C45 21 32 7 32 7Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 34C8 34 19 27 32 34C45 41 56 34 56 34" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="32" cy="34" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="login-eyebrow">A tradition shaped by hand</p>
          <h1>Bring home a piece of <em>heritage.</em></h1>
          <p className="login-story-copy">
            Sign in to keep your enquiries together, follow up on custom commissions, and stay connected with the artisans of the Kathmandu Valley.
          </p>
          <div className="login-trust">
            <ShieldCheck size={18} />
            <span>Your account. Your enquiries. Your collection.</span>
          </div>
          <div className="login-ornament" aria-hidden="true">✦ &nbsp; ✧ &nbsp; ✦</div>
        </aside>

        <div className="login-card">
          <div className="login-card-heading">
            <p className="login-eyebrow">Welcome back</p>
            <h2 id="login-heading">Sign in to your account</h2>
            <p>Enter your details below to continue.</p>
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

          <div className="login-divider"><span>or sign in with email</span></div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <a
                href="mailto:dorjehandicraft2@gmail.com?subject=Password%20reset%20request"
                title="Contact workshop for password assistance"
              >
                Forgot password?
              </a>
            </div>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
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

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                disabled={isSubmitting}
              />
              <span>Remember me on this device</span>
            </label>

            <button
              className="login-submit"
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <p className="login-signup">
            New to Himalayan Sacred Arts?{' '}
            <Link to="/signup" className="signup-link">
              Create an account
            </Link>
          </p>
          <p className="login-terms">By continuing, you agree to our terms and privacy policy.</p>
        </div>
      </section>
      <footer className="login-footer">
        © 2026 Himalayan Sacred Arts <span>·</span> Handcrafted in the Kathmandu Valley
      </footer>
    </main>
  );
}
