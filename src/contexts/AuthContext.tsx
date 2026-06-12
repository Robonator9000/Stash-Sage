import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import type { User, AuthError } from '@supabase/supabase-js';
import { showToast } from '../components/Toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => data?.subscription.unsubscribe();
  }, []);

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
    showToast({
      id: 'auth-signup', title: 'Account created',
      body: 'Check your email for confirmation.',
    });
  };

  const signOut = async () => {
    const { error: err } = await supabase.auth.signOut();
    if (err) setError(err.message);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signIn, signUp, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
