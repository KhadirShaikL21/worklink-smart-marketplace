import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) {
      setLoading(false);
      return;
    }
    api
      .post('/api/auth/refresh', { refreshToken: rt })
      .then(res => {
        const { accessToken, refreshToken: newRt } = res.data;
        if (accessToken) setAccessToken(accessToken);
        if (newRt) localStorage.setItem('refreshToken', newRt);
        return api.get('/api/auth/me');
      })
      .then(res => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser: async () => {
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
        return res.data.user;
      },
      login: async ({ emailOrPhone, password }) => {
        const res = await api.post('/api/auth/login', { emailOrPhone, password });
        const { accessToken, refreshToken, user: u } = res.data;
        setAccessToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(u);
        return u;
      },
      register: async payload => {
        const res = await api.post('/api/auth/register', payload);
        const { accessToken, refreshToken, user: u } = res.data;
        setAccessToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(u);
        return u;
      },
      logout: async () => {
        const rt = localStorage.getItem('refreshToken');
        try {
          await api.post('/api/auth/logout', { refreshToken: rt });
        } catch (_) {
          /* ignore */
        }
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
