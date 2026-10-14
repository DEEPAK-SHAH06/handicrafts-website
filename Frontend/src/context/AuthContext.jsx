import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './authContextBase';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session from backend (/api/auth/me)
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/auth/me')
      .then((res) => {
        if (active && res.data?.success && res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          localStorage.removeItem('auth_token');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle email/password login
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success) {
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      setUser(response.data.user);
      return response.data;
    }
    throw new Error(response.data?.message || 'Login failed');
  };

  // Handle email/password sign up
  const signup = async (name, email, password, confirmPassword) => {
    const response = await api.post('/auth/signup', {
      name,
      email,
      password,
      confirmPassword,
    });
    if (response.data?.success) {
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      setUser(response.data.user);
      return response.data;
    }
    throw new Error(response.data?.message || 'Signup failed');
  };

  // Handle Google OAuth login
  const googleLogin = async (credential, accessToken) => {
    const payload = {};
    if (credential) payload.credential = credential;
    if (accessToken) payload.accessToken = accessToken;

    const response = await api.post('/auth/google', payload);
    if (response.data?.success) {
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      setUser(response.data.user);
      return response.data;
    }
    throw new Error(response.data?.message || 'Google sign-in failed');
  };

  // Handle logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  // Update profile
  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data);
    if (response.data?.success) {
      setUser(response.data.user);
      return response.data;
    }
    throw new Error(response.data?.message || 'Failed to update profile');
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    loading,
    login,
    signup,
    googleLogin,
    logout,
    refreshUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
