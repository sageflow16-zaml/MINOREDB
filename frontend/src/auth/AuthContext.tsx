import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getToken, setToken, clearToken, setRefreshToken, getRefreshToken, clearRefreshToken, clearAllTokens } from './tokenStorage';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onStorage = () => setTokenState(getToken());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setTokenState(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    const data = response.data;
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setTokenState(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearAllTokens();
    setTokenState(null);
    setUser(null);
    api.post('/auth/logout').catch(() => {});
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const stored = getRefreshToken();
    if (!stored) return false;
    try {
      const response = await api.post('/auth/refresh', { refresh_token: stored });
      const data = response.data;
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setTokenState(data.access_token);
      return true;
    } catch {
      clearAllTokens();
      setTokenState(null);
      setUser(null);
      return false;
    }
  }, []);

  // Attempt to load user info if token exists but user is null
  useEffect(() => {
    if (!token || user) return;
    const controller = new AbortController();
    api.get('/auth/me', { signal: controller.signal })
      .then(res => { if (!controller.signal.aborted) setUser(res.data); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        clearAllTokens();
        setTokenState(null);
      });
    return () => controller.abort();
  }, [token, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshToken,
    }),
    [user, token, login, register, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
