import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => api.getToken());
  const [loading, setLoading] = useState(!!api.getToken());
  const [demoMode, setDemoMode] = useState(false);
  const skipFetchRef = useRef(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await api.get('/me');
      // Normalized JSONAPI returns flat object: { id, email, name, ... }
      setUser(data.user || data);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      api.removeToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // Skip re-fetch if we just logged in and already have the user
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      setLoading(false);
      return;
    }
    fetchCurrentUser();
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    const data = await api.post('/auth/sign_in', { user: { email, password } });
    const newToken = data.token;
    api.setToken(newToken);
    skipFetchRef.current = true;
    setDemoMode(false);
    setUser(data.user);
    setToken(newToken);
    setLoading(false);
    return data;
  };

  const signup = async (email, password, name) => {
    const data = await api.post('/auth', { user: { email, password, name } });
    const newToken = data.token;
    api.setToken(newToken);
    skipFetchRef.current = true;
    setDemoMode(false);
    setUser(data.user);
    setToken(newToken);
    setLoading(false);
    return data;
  };

  const logout = async () => {
    try {
      await api.delete('/auth/sign_out');
    } catch {
      // ignore logout errors
    }
    api.removeToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const enterDemoMode = useCallback(async () => {
    setDemoMode(true);
    setUser({ id: 0, name: 'Demo User', email: 'demo@claude-fit.dev' });
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, demoMode, login, signup, logout, updateUser, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
