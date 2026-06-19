import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { supabase, isConfigured } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { showToast } from '../components/Toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from('profiles').select('role').eq('user_id', user.id).single().then(({ data }) => {
      setIsAdmin(data?.role === 'admin');
    }).then(undefined, () => setIsAdmin(false));
  }, [user]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    if (hashParams.get('type') === 'recovery') {
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' }).then(({ data: { session }, error: sessionErr }) => {
          setUser(session?.user ?? null);
          if (!sessionErr && session?.user?.id && isConfigured) {
            supabase.from('profiles').upsert(
              { user_id: session.user.id, display_name: session.user.email?.split('@')[0] || 'User' },
              { onConflict: 'user_id' }
            ).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
            showToast({ id: 'auth-recovery', title: 'Password reset', body: 'Link accepted. Go to Profile to set a new password.' });
          }
          setIsLoading(false);
        });
        window.location.hash = '';
      } else {
        setIsLoading(false);
      }
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.id && isConfigured) {
        supabase.from('profiles').upsert(
          { user_id: session.user.id, display_name: session.user.email?.split('@')[0] || 'User' },
          { onConflict: 'user_id' }
        ).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
      }
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id && isConfigured) {
        supabase.from('profiles').upsert(
          { user_id: session.user.id, display_name: session.user.email?.split('@')[0] || 'User' },
          { onConflict: 'user_id' }
        ).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
      }
    });
    return () => data?.subscription.unsubscribe();
    }
  }, []);

  const handleAuthError = useCallback((err: AuthError | Error): string => {
    const msg = err?.message ?? 'An unknown error occurred.';
    if (msg.includes('Invalid login credentials')) return 'Invalid email or password.';
    if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
    if (msg.includes('User already registered')) return 'An account with this email already exists.';
    if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network Error') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
      return 'Unable to reach server. Check your connection or if the server is running (supabase start).';
    }
    return msg;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'); throw new Error('Auth not configured'); }
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(handleAuthError(err));
        throw err;
      }
      showToast({ id: 'auth-signin', title: 'Signed in', body: 'Welcome back!' });
    } catch (err: any) {
      if (!(err instanceof AuthError)) {
        setError(handleAuthError(err));
        throw err;
      }
    }
  }, [handleAuthError]);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'); throw new Error('Auth not configured'); }
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(handleAuthError(err));
        throw err;
      }
      const uid = data?.user?.id;
      if (uid) {
        await supabase.from('profiles').upsert(
          { user_id: uid, display_name: email.split('@')[0] || 'User' },
          { onConflict: 'user_id' }
        );
      }
      showToast({
        id: 'auth-signup', title: 'Account created',
        body: 'Check your email for confirmation.',
      });
    } catch (err: any) {
      if (!(err instanceof AuthError)) {
        setError(handleAuthError(err));
        throw err;
      }
    }
  }, [handleAuthError]);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: err } = await supabase.auth.signOut();
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
  }, [handleAuthError]);

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'); throw new Error('Auth not configured'); }
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
    showToast({ id: 'auth-password', title: 'Password updated', body: 'Your password has been changed.' });
  }, [handleAuthError]);

  const updateEmail = useCallback(async (newEmail: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'); throw new Error('Auth not configured'); }
    const { error: err } = await supabase.auth.updateUser({ email: newEmail });
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
    showToast({ id: 'auth-email', title: 'Verification sent', body: 'Check your new email for confirmation.' });
  }, [handleAuthError]);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured.'); throw new Error('Auth not configured'); }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
    showToast({ id: 'auth-reset', title: 'Reset sent', body: 'Check your email for the password reset link.' });
  }, [handleAuthError]);

  const deleteAccount = useCallback(async () => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured.'); throw new Error('Auth not configured'); }
    const { error: err } = await supabase.rpc('delete_my_account');
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
    showToast({ id: 'auth-deleted', title: 'Account deleted', body: 'Your account has been permanently deleted.' });
  }, [handleAuthError]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(() => ({
    user, isLoading, error, isAdmin,
    signIn, signUp, signOut,
    updatePassword, updateEmail, resetPasswordForEmail, deleteAccount, clearError,
  }), [user, isLoading, error, isAdmin, signIn, signUp, signOut, updatePassword, updateEmail, resetPasswordForEmail, deleteAccount, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
