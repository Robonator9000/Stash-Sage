import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { supabase, isConfigured } from '../utils/supabase';
import type { User, AuthError } from '@supabase/supabase-js';
import { showToast } from '../components/Toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data?.subscription.unsubscribe();
  }, []);

  const handleAuthError = useCallback((err: AuthError | Error): string => {
    const msg = err?.message ?? 'An unknown error occurred.';
    if (msg.includes('Invalid login credentials')) return 'Invalid email or password.';
    if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
    if (msg.includes('User already registered')) return 'An account with this email already exists.';
    if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.';
    return msg;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'); throw new Error('Auth not configured'); }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
    showToast({ id: 'auth-signin', title: 'Signed in', body: 'Welcome back!' });
  }, [handleAuthError]);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isConfigured) { setError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'); throw new Error('Auth not configured'); }
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(handleAuthError(err));
      throw err;
    }
    showToast({
      id: 'auth-signup', title: 'Account created',
      body: 'Check your email for confirmation.',
    });
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
      redirectTo: window.location.origin + '/Stash-Tracker',
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
    user, isLoading, error,
    signIn, signUp, signOut,
    updatePassword, updateEmail, resetPasswordForEmail, deleteAccount, clearError,
  }), [user, isLoading, error, signIn, signUp, signOut, updatePassword, updateEmail, resetPasswordForEmail, deleteAccount, clearError]);

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
