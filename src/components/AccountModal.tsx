import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface AccountModalProps {
  isDark: boolean;
  onClose: () => void;
}

export function AccountModal({ isDark, onClose }: AccountModalProps) {
  const { user, error, signOut, updatePassword, updateEmail, clearError } = useAuth();
  const [tab, setTab] = useState<'info' | 'password' | 'email'>('info');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateEmail(newEmail);
      setNewEmail('');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'info' as const, label: 'Info' },
    { id: 'password' as const, label: 'Password' },
    { id: 'email' as const, label: 'Email' },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-midnight border border-edge' : 'bg-white border border-gray-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>
            Account
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 mb-5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); clearError(); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === t.id
                  ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                  : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(error || localError) && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {localError || error}
          </div>
        )}

        {tab === 'info' && (
          <div className="flex flex-col gap-3">
            <div className={`px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-deep text-frost' : 'bg-gray-50 text-gray-900'}`}>
              <span className={`block text-xs ${isDark ? 'text-muted' : 'text-gray-400'} mb-0.5`}>Email</span>
              {user.email}
            </div>
            <div className={`px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-deep text-frost' : 'bg-gray-50 text-gray-900'}`}>
              <span className={`block text-xs ${isDark ? 'text-muted' : 'text-gray-400'} mb-0.5`}>Joined</span>
              {new Date(user.created_at).toLocaleDateString()}
            </div>
            {user.last_sign_in_at && (
              <div className={`px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-deep text-frost' : 'bg-gray-50 text-gray-900'}`}>
                <span className={`block text-xs ${isDark ? 'text-muted' : 'text-gray-400'} mb-0.5`}>Last sign in</span>
                {new Date(user.last_sign_in_at).toLocaleDateString()}
              </div>
            )}
            <button
              onClick={() => { signOut(); onClose(); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all mt-2"
            >
              Sign Out
            </button>
          </div>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-deep text-frost border border-edge focus:border-cyan-500 placeholder-muted'
                  : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
              }`}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {tab === 'email' && (
          <form onSubmit={handleEmailChange} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-deep text-frost border border-edge focus:border-cyan-500 placeholder-muted'
                  : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
              }`}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Change Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
