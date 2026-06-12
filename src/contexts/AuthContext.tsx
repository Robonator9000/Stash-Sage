import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import type { User, AuthError } from '@supabase/supabase-js';
import { showToast } from '../components/Toast';

interface Profile {
  display_name: string;
  avatar_url: string;
}

type SyncStatus = 'synced' | 'syncing' | 'offline';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  profile: Profile | null;
  syncStatus: SyncStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsLoading(false);
      if (u && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        setSyncStatus('syncing');
        loadProfile(u.id);
      } else if (!u) {
        setProfile(null);
        setSyncStatus('offline');
      }
    });
    return () => data?.subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', userId).single();
    if (data) {
      setProfile(data as Profile);
      setSyncStatus('synced');
    } else {
      setProfile({ display_name: '', avatar_url: '' });
      setSyncStatus('synced');
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setSyncStatus('syncing');
    await loadProfile(user.id);
    setSyncStatus('synced');
  }, [user?.id]);

  const handleAuthError = (err: AuthError | Error): string => {
    const msg = err.message;
    if (msg.includes('Invalid login credentials')) return 'Invalid email or password.';
    if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
    if (msg.includes('User already registered')) return 'An account with this email already exists.';
    if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.';
    return msg;
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      const msg = handleAuthError(err);
      setError(msg);
      throw err;
    }
    showToast({ id: 'auth-signin', title: 'Signed in', body: 'Welcome back!' });
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      const msg = handleAuthError(err);
      setError(msg);
      throw err;
    }
    showToast({ id: 'auth-signup', title: 'Account created', body: 'Check your email for confirmation.' });
  };

  const signOut = async () => {
    const { error: err } = await supabase.auth.signOut();
    if (err) setError(err.message);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (err) {
      const msg = handleAuthError(err);
      setError(msg);
      throw err;
    }
    showToast({ id: 'auth-reset', title: 'Password reset sent', body: 'Check your email for the reset link.' });
  };

  const deleteAccount = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    const { error: err } = await supabase.rpc('delete_user_account');
    if (err) {
      const msg = handleAuthError(err);
      setError(msg);
      throw err;
    }
    await supabase.auth.signOut();
    showToast({ id: 'auth-deleted', title: 'Account deleted', body: 'Your account and data have been permanently removed.' });
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    setSyncStatus('syncing');
    const updates = { ...data, user_id: user.id, updated_at: new Date().toISOString() };
    const { error: err } = await supabase.from('profiles').upsert(updates, { onConflict: 'user_id' });
    if (err) {
      setSyncStatus('offline');
      throw err;
    }
    setProfile((prev) => prev ? { ...prev, ...data } : { display_name: '', avatar_url: '', ...data });
    setSyncStatus('synced');
    showToast({ id: 'profile-updated', title: 'Profile updated', body: 'Your changes have been saved.' });
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user, isLoading, error, profile, syncStatus,
      signIn, signUp, signOut, clearError,
      resetPassword, deleteAccount, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
