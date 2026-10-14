import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#17110c',
        color: '#efe6d3',
        fontFamily: 'Spectral, Georgia, serif',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(184, 137, 43, 0.3)',
          borderTopColor: '#d9b45f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#d9b45f', fontStyle: 'italic', letterSpacing: '0.05em' }}>
          Verifying sacred credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#17110c',
        color: '#efe6d3',
        padding: '24px',
        fontFamily: 'Spectral, Georgia, serif'
      }}>
        <div style={{
          maxWidth: '480px',
          padding: '40px',
          border: '1px solid rgba(184, 137, 43, 0.4)',
          background: 'rgba(239, 230, 211, 0.05)',
          textAlign: 'center'
        }}>
          <ShieldAlert size={48} color="#d9b45f" style={{ margin: '0 auto 16px' }} />
          <h1 style={{
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: '24px',
            color: '#e8d9b0',
            margin: '0 0 12px'
          }}>
            Access Restricted
          </h1>
          <p style={{ color: '#b7a888', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
            This sanctum requires {requiredRole} privileges. Your account ({user.email}) currently has the <strong>{user.role}</strong> role.
          </p>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: '1px solid #b8892b',
            background: '#450f14',
            color: '#e8d9b0',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return children;
}
