import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { clearAllTokens } from './tokenStorage';
import { isSessionExpiredOrNearExpiry } from './sessionExpiry';
import { queryClient } from '../lib/queryClient';
import { track, breadcrumb, reportError } from '../lib/observability';
import { identifyTelemetryUser } from '../lib/telemetry';

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
    let cancelled = false;
    (async () => {
      let sessionError: Error | null = null;
      let sessionRevoked = false;
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (cancelled) return;
        let activeSession = currentSession;
        if (currentSession && isSessionExpiredOrNearExpiry(currentSession.expires_at)) {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            // Refresh failed (token revoked/expired or offline). Drop the
            // session locally so route guards send the user to /login instead
            // of trapping them in a dead state where every call silently 401s.
            breadcrumb('auth', 'session refresh failed; signing out locally', {
              reason: error.code ?? error.message,
            });
            reportError(error, {
              category: 'auth',
              operation: 'session-refresh', // never attach tokens/refresh payloads
              route: typeof window !== 'undefined' ? window.location.pathname : '',
            });
            await supabase.auth.signOut({ scope: 'local' });
            activeSession = null;
            sessionRevoked = true;
            track('auth.session_revoked', { reason: error.code ?? 'refresh_failed' });
          } else if (data.session) {
            activeSession = data.session;
            track('auth.refresh_success');
          }
        }
        setSession(activeSession);
        if (activeSession?.user) {
          setUser(mapSupabaseUser(activeSession.user));
          void identifyTelemetryUser(activeSession.user.id);
        }
        setIsLoading(false);
        if (sessionRevoked) track('auth.logout', { source: 'expired' });
      } catch (err) {
        // Auth initialization failure — report for telemetry, keep app
        // usable unauthenticated (guards will redirect).
        sessionError = err instanceof Error ? err : new Error(String(err));
        reportError(sessionError, { category: 'auth', operation: 'init' });
        track('auth.init_failure', {});
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          setIsRecovery(false);
          setUser(mapSupabaseUser(currentSession.user));
          void identifyTelemetryUser(currentSession.user.id);
          track('auth.login_success', {});
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsRecovery(false);
          clearAllTokens();
          // Never let the previous user's cached data leak into the next
          // session (or back into this one after a revoked session or
          // cross-tab sign-out). All queries refetch on next mount.
          queryClient.clear();
          track('auth.logout', { source: 'signout' });
        } else if (event === 'PASSWORD_RECOVERY') {
          setIsRecovery(true);
          if (currentSession?.user) {
            setUser(mapSupabaseUser(currentSession.user));
          }
          breadcrumb('auth', 'password recovery flow');
        } else if (event === 'USER_UPDATED' && currentSession?.user) {
          setUser(mapSupabaseUser(currentSession.user));
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          breadcrumb('auth', 'token refreshed');
          queryClient.removeQueries({ predicate: (q) => q.state.status === 'error' });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      track('auth.login_failure', { reason: error.code ?? 'credentials' });
      throw error;
    }
    // NOTE: SIGNED_IN event (handled above) emits the success event —
    // password is never held or logged here.
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
    // Clear cached data immediately so a failed signOut (offline) cannot
    // leave the previous user's data behind or on screen.
    queryClient.clear();
    track('auth.logout', { source: 'user' });
    try {
      await supabase.auth.signOut();
    } catch {
      // Ensure clean state even if network request fails
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      track('auth.refresh_failure', { reason: error.code ?? 'unknown' });
      return false;
    }
    if (data.session) track('auth.refresh_success', {});
    return !error && !!data.session;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    breadcrumb('auth', 'reset password email sent');
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setIsRecovery(false);
    breadcrumb('auth', 'password updated');
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
