import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { clearAllTokens } from './tokenStorage';
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
  isLoading: boolean;
  isRecovery: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function syncWithFastAPI(session: Session): Promise<User | null> {
  try {
    const response = await api.post('/auth/supabase-sync', {}, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    return response.data;
  } catch {
    return null;
  }
}

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split('@')[0],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const localUser = await syncWithFastAPI(currentSession);
        setUser(localUser ?? mapSupabaseUser(currentSession.user));
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          setIsRecovery(false);
          const localUser = await syncWithFastAPI(currentSession);
          setUser(localUser ?? mapSupabaseUser(currentSession.user));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsRecovery(false);
          clearAllTokens();
        } else if (event === 'PASSWORD_RECOVERY') {
          setIsRecovery(true);
          if (currentSession?.user) {
            setUser(mapSupabaseUser(currentSession.user));
          }
        } else if (event === 'USER_UPDATED' && currentSession?.user) {
          setUser(mapSupabaseUser(currentSession.user));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    clearAllTokens();
    setUser(null);
    setSession(null);
    setIsRecovery(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ensure clean state even if network request fails
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.auth.refreshSession();
    return !error && !!data.session;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setIsRecovery(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token: session?.access_token ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      isRecovery,
      login,
      register,
      logout,
      refreshToken,
      resetPassword,
      updatePassword,
    }),
    [user, session, isLoading, isRecovery, login, register, logout, refreshToken, resetPassword, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
