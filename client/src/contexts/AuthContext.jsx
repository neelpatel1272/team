import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AUTH_API } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('workwave_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('workwave_token'));
  const [loading, setLoading] = useState(true);

  const persist = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('workwave_user', JSON.stringify(u));
    localStorage.setItem('workwave_token', t);
    connectSocket(t);
  };

  useEffect(() => {
    async function bootstrap() {
      const savedToken = localStorage.getItem('workwave_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await AUTH_API.me();
        setUser(data.data.user);
        localStorage.setItem('workwave_user', JSON.stringify(data.data.user));
        connectSocket(savedToken);
      } catch (err) {
        localStorage.removeItem('workwave_token');
        localStorage.removeItem('workwave_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await AUTH_API.login({ email, password });
    persist(data.data.user, data.data.token);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await AUTH_API.register(payload);
    persist(data.data.user, data.data.token);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await AUTH_API.logout();
    } catch (e) {
      /* ignore network errors on logout */
    }
    disconnectSocket();
    localStorage.removeItem('workwave_token');
    localStorage.removeItem('workwave_user');
    setUser(null);
    setToken(null);
  }, []);

  const updateLocalUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('workwave_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
