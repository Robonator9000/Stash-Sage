import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { isConfigured } from '../utils/supabase';
import { supabase } from '../utils/supabase';
import { showToast } from './Toast';
import { X, AlertTriangle, User as UserIcon } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';

interface UserSettingsProps {
  isDark: boolean;
  onClose: () => void;
}

export function UserSettings({ isDark, onClose }: UserSettingsProps) {
  const { user, error, signIn, signUp, signOut, updatePassword, updateEmail, deleteAccount, clearError } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const profile = settings.profile;
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const [accountTab, setAccountTab] = useState<'info' | 'password' | 'email'>('info');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      setEmail('');
      setPassword('');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = () => {
    const p = { username: username.trim() || 'User', bio: bio.trim(), joinedAt: profile?.joinedAt || new Date().toISOString() };
    updateSettings({ profile: p });
    if (user) {
      supabase.from('profiles').upsert({ user_id: user.id, display_name: p.username }, { onConflict: 'user_id' }).then(() => {}, () => {});
    }
    showToast({ id: 'profile-saved', title: 'Profile saved', body: 'Your profile has been updated.' });
  };

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

  const handleDeleteAccount = async () => {
    setSubmitting(true);
    try {
      await deleteAccount();
      handleClose();
    } catch {
    } finally {
      setSubmitting(false);
      setConfirmDelete(false);
    }
  };

  const profileInitial = profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  const inputClass = `w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
    isDark
      ? 'bg-deep text-frost border border-edge focus:border-cyan-500 placeholder-muted'
      : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
  }`;

  const btnPrimary = `w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all disabled:opacity-50`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center" onClick={handleClose}>
      <div className={`absolute inset-0 transition-all duration-200 ${visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 pointer-events-none'}`} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg flex-1 min-h-0 flex flex-col transition-all duration-200 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        } ${visible ? 'opacity-100' : 'opacity-0'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Account"
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-5 border-b shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyanx to-emera`}>
              {user ? (
                <span className="text-white font-display font-bold text-lg">{profileInitial}</span>
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user ? (profile?.username || 'Account') : 'Account'}
            </h2>
          </div>
          <button onClick={handleClose} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!isConfigured && (
            <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
              Auth is not configured. Set <code className="text-xs px-1 py-0.5 rounded bg-black/10">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-black/10">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your .env file.
            </div>
          )}

          {(error || localError) && (
            <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {localError || error}
            </div>
          )}

          {/* Profile section — always visible at the top */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Profile</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Username" value={username}
                onChange={e => setUsername(e.target.value)} maxLength={24} className={inputClass} />
              <textarea placeholder="Bio" value={bio}
                onChange={e => setBio(e.target.value)} maxLength={160} rows={2}
                className={`${inputClass} resize-none`} />
              <button onClick={handleSaveProfile} className={btnPrimary}>Save Profile</button>
            </div>
          </div>

          {!user ? (
            <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h3>
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input type="email" placeholder="Email" value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  required autoFocus={!user} className={inputClass} />
                <input type="password" placeholder="Password" value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  required minLength={6} className={inputClass} />
                <button type="submit" disabled={submitting || !isConfigured} className={btnPrimary}>
                  {!isConfigured ? 'Auth Unavailable' : submitting ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4">
                {authMode === 'signin' && isConfigured && (
                  <button onClick={() => setShowReset(true)}
                    className={`text-xs ${isDark ? 'text-mist hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}>
                    Forgot password?
                  </button>
                )}
                <button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); clearError(); }}
                  className={`text-sm ml-auto ${isDark ? 'text-mist hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}>
                  {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          ) : (
            <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <div className="flex gap-1 mb-4">
                {(['info', 'password', 'email'] as const).map(tab => (
                  <button key={tab}
                    onClick={() => { setAccountTab(tab); clearError(); setLocalError(null); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      accountTab === tab
                        ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                        : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {tab === 'info' ? 'Info' : tab === 'password' ? 'Password' : 'Email'}
                  </button>
                ))}
              </div>

              {accountTab === 'info' && (
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
                  <button onClick={() => { signOut(); handleClose(); }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all mt-2">
                    Sign Out
                  </button>
                  <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-red-400' : 'text-red-600'}`}>Danger Zone</span>
                    </div>
                    {!confirmDelete ? (
                      <button onClick={() => setConfirmDelete(true)}
                        className="w-full py-2 rounded-xl text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all">
                        Delete Account
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-500'}`}>
                          This permanently deletes your account and all data. This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDelete(false)} disabled={submitting}
                            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                              isDark ? 'text-slate-300 border-slate-700 hover:bg-slate-800' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}>Cancel</button>
                          <button onClick={handleDeleteAccount} disabled={submitting}
                            className="flex-1 py-2 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50">
                            {submitting ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {accountTab === 'password' && (
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                  <input type="password" placeholder="New password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} required minLength={6} className={inputClass} />
                  <input type="password" placeholder="Confirm new password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className={inputClass} />
                  <button type="submit" disabled={submitting} className={btnPrimary}>
                    {submitting ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              {accountTab === 'email' && (
                <form onSubmit={handleEmailChange} className="flex flex-col gap-4">
                  <input type="email" placeholder="New email address" value={newEmail}
                    onChange={e => setNewEmail(e.target.value)} required className={inputClass} />
                  <button type="submit" disabled={submitting} className={btnPrimary}>
                    {submitting ? 'Updating...' : 'Change Email'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {showReset && <ResetPasswordModal isDark={isDark} onClose={() => setShowReset(false)} />}
      </div>
    </div>
  );
}
