import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/verify')
      .then((res) => {
        if (res.data.valid) {
          setUser({ email: res.data.email });
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_email');
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_email');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('auth_email', res.data.email);
    setUser({ email: res.data.email });
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
