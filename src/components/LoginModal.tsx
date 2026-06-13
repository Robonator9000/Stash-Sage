import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isConfigured } from '../utils/supabase';
import { X } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';

interface LoginModalProps {
  isDark: boolean;
  onClose: () => void;
}

export function LoginModal({ isDark, onClose }: LoginModalProps) {
  const { error, signIn, signUp, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-midnight border border-edge' : 'bg-white border border-gray-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isConfigured && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
            Auth is not configured. Sign-in requires{' '}
            <code className="text-xs px-1 py-0.5 rounded bg-black/10">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-xs px-1 py-0.5 rounded bg-black/10">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your{' '}
            <code className="text-xs px-1 py-0.5 rounded bg-black/10">.env</code> file.
          </div>
        )}

        {error && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError(); }}
            required
            autoFocus
            className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-deep text-frost border border-edge focus:border-cyan-500 placeholder-muted'
                : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
            }`}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); clearError(); }}
            required
            minLength={6}
            className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-deep text-frost border border-edge focus:border-cyan-500 placeholder-muted'
                : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
            }`}
          />
          <button
            type="submit"
            disabled={submitting || !isConfigured}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all disabled:opacity-50"
          >
            {!isConfigured ? 'Auth Unavailable' : submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          {mode === 'signin' && isConfigured && (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className={`text-xs ${isDark ? 'text-mist hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
            >
              Forgot password?
            </button>
          )}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); clearError(); }}
            className={`text-sm ${isDark ? 'text-mist hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
        {showReset && <ResetPasswordModal isDark={isDark} onClose={() => setShowReset(false)} />}
      </div>
    </div>
  );
}
