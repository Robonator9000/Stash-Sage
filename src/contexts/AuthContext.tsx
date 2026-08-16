import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { supabase, isConfigured } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { showToast } from '../components/Toast';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';
import { t } from '../utils/translations';

// Brute-force friction for the password form: 5 failed attempts buy a 60s
// cooldown. Server-side limits remain the real boundary; this stops a script
// (or an impatient user) from hammering the grant from this device.
const AUTH_FAIL_KEY = 'weed-auth-fails';
const AUTH_FAIL_MAX = 5;
const AUTH_FAIL_COOLDOWN_MS = 60_000;

function authFailState(): { count: number; until: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_FAIL_KEY) || 'null');
    if (parsed && typeof parsed.count === 'number') return parsed;
  } catch { /* corrupt state counts as none */ }
  return { count: 0, until: 0 };
}

function authLang(): string {
  try {
    const lang = JSON.parse(localStorage.getItem('weed-settings') || '{}').language;
    return ['en', 'es', 'fr', 'de', 'pt'].includes(lang) ? lang : 'en';
  } catch { return 'en'; }
}

async function upsertProfile(userId: string, displayName: string) {
  // Create the default profile only on first sign-in. Never overwrite a
  // user's chosen username/display name on later visits (an upsert without
  // ignoreDuplicates WOULD clobber it). ignoreDuplicates keeps this insert-only.
  const { error } = await supabase.from('profiles').upsert(
    { user_id: userId, display_name: displayName, username: displayName },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );
  if (error) {
    const { error: fbError } = await supabase.from('profiles').upsert(
      { user_id: userId, display_name: displayName },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
    if (fbError) throw fbError;
  }
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
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
    supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle().then(({ data }) => {
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
            upsertProfile(session.user.id, session.user.email?.split('@')[0] || 'User').then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
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
        subscribeToPush();
        upsertProfile(session.user.id, session.user.email?.split('@')[0] || 'User').then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
      }
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id && isConfigured) {
        subscribeToPush();
        upsertProfile(session.user.id, session.user.email?.split('@')[0] || 'User').then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
      }
    });
    return () => data?.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!user || !isConfigured) return;
    const update = () => { supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('user_id', user.id).then(undefined, () => {}); };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [user]);

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
    const fails = authFailState();
    if (fails.until > Date.now()) {
      const msg = t('tooManyAttempts', authLang());
      setError(msg);
      throw new Error(msg);
    }
    let failed = false;
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        failed = true;
        setError(handleAuthError(err));
        throw err;
      }
    } catch (err: any) {
      failed = true;
      if (!(err instanceof AuthError)) {
        setError(handleAuthError(err));
      }
      throw err;
    } finally {
      if (failed) {
        const f = authFailState();
        const next = { count: f.count + 1, until: 0 };
        if (next.count >= AUTH_FAIL_MAX) {
          next.until = Date.now() + AUTH_FAIL_COOLDOWN_MS;
          next.count = 0;
        }
        try { localStorage.setItem(AUTH_FAIL_KEY, JSON.stringify(next)); } catch { /* storage may be blocked */ }
      } else {
        try { localStorage.removeItem(AUTH_FAIL_KEY); } catch { /* ignore */ }
      }
    }
    subscribeToPush();
    showToast({ id: 'auth-signin', title: 'Signed in', body: 'Welcome back!' });
  }, [handleAuthError]);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
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
        const uname = username?.trim() || email.split('@')[0] || 'User';
        await upsertProfile(uid, uname).catch(() => {});
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
    await unsubscribeFromPush();
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
