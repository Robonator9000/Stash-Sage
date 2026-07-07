import { useState } from 'react';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface ResetPasswordModalProps {
  isDark: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ isDark, onClose }: ResetPasswordModalProps) {
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const { error, resetPasswordForEmail, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/10 backdrop-blur-[2px]' : 'bg-black/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Reset Password"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border-2 shadow-2xl transition-all duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Reset Password
          </h2>
          <button onClick={handleClose} className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            Check your email for the password reset link.
          </div>
        ) : (
          <>
            {error && (
              <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label htmlFor="reset-email" className="sr-only">Email</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                required
                autoFocus
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-800 text-white border border-slate-700 focus:border-cyan-500 placeholder-slate-500'
                    : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <button
          onClick={handleClose}
          className={`mt-4 w-full text-center text-xs ${isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
        >
          Back to Sign In
        </button>
        </div>
      </div>
    </div>
  );
}
