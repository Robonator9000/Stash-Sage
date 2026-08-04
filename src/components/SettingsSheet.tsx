import { useState, useEffect, useRef } from 'react';
import { Product, Settings, CONTACT_PLATFORMS } from '../types';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { hashPin } from '../utils/helpers';
import { createExportData, downloadExport, downloadCsvExport, copyExportToClipboard, parseImportData, ImportResult } from '../utils/dataTransfer';
// jspdf loaded dynamically on PDF export only
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadProfileImage, deleteProfileImage } from '../utils/supabase';
import { X, Globe, Palette, Download, Upload, FileSpreadsheet, FileText, Clipboard, Merge, Clock, DollarSign, Lock, Hash, AlertTriangle, Database, BarChart3, User, Camera, Mail, MessageCircle, MapPin, Bell, Rss } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';
import { showToast } from './Toast';
import { TextInput, NumberInput, Switch, Select, SegmentedControl, Button, Textarea, Text } from '@mantine/core';

interface SettingsSheetProps {
  products: Product[];
  onImport: (data: ImportResult) => void;
  onMergeImport: (data: ImportResult) => void;
  onClose: () => void;
  isDark?: boolean;
  defaultTab?: 'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security';
}

const LANGUAGES = [
  { code: 'en', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'pt', flag: '\u{1F1E7}\u{1F1F7}' },
];

const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese' },
  es: { en: 'Ingl\u00e9s', es: 'Espa\u00f1ol', fr: 'Franc\u00e9s', de: 'Alem\u00e1n', pt: 'Portugu\u00e9s' },
  fr: { en: 'Anglais', es: 'Espagnol', fr: 'Fran\u00e7ais', de: 'Allemand', pt: 'Portugais' },
  de: { en: 'Englisch', es: 'Spanisch', fr: 'Franz\u00f6sisch', de: 'Deutsch', pt: 'Portugiesisch' },
  pt: { en: 'Ingl\u00eas', es: 'Espanhol', fr: 'Franc\u00eas', de: 'Alem\u00e3o', pt: 'Portugu\u00eas' },
};

export function SettingsSheet({ products, onImport, onMergeImport, onClose, isDark = true, defaultTab = 'preferences' }: SettingsSheetProps) {
  const { settings, updateSettings, toggleStatVisibility } = useSettings();
  const { user, signIn, signUp, updatePassword, updateEmail, error: authError } = useAuth();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authLocalError, setAuthLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security'>(defaultTab);
  const [pinSetupValue, setPinSetupValue] = useState('');
  const [pinDisableValue, setPinDisableValue] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinDisable, setShowPinDisable] = useState(false);
  const [pinError, setPinError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profileUsername, setProfileUsername] = useState(settings.profile?.username || user?.email?.split('@')[0] || '');
  const [profileDisplayName, setProfileDisplayName] = useState(settings.profile?.displayName || '');
  const [profileBio, setProfileBio] = useState(settings.profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(settings.profile?.avatar_url);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(settings.profile?.banner_url);
  const [profileContacts, setProfileContacts] = useState<{ platform: string; value: string }[]>(settings.profile?.contacts || []);
  const [profileLocation, setProfileLocation] = useState(settings.profile?.location || '');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeSubmitting, setPasswordChangeSubmitting] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeSubmitting, setEmailChangeSubmitting] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    setProfileUsername(settings.profile?.username || user?.email?.split('@')[0] || '');
  }, [settings.profile, user]);

  const handleStatToggle = (key: keyof Settings['statsVisibility']) => {
    toggleStatVisibility(key);
  };

  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
  };

  const handleExport = () => {
    try {
      const data = createExportData(products, settings);
      downloadExport(data);
      setFeedback({ type: 'success', message: t('exportSuccess', settings.language) });
    } catch {
      setFeedback({ type: 'error', message: t('importError', settings.language) });
    }
  };

  const handleExportCsv = () => {
    try {
      downloadCsvExport(products);
      setFeedback({ type: 'success', message: t('exportSuccess', settings.language) });
    } catch {
      setFeedback({ type: 'error', message: t('importError', settings.language) });
    }
  };

  const handleExportPdf = async () => {
    try {
      const { exportProductsPdf } = await import('../utils/pdfExport');
      exportProductsPdf(products, settings);
      setFeedback({ type: 'success', message: t('exportSuccess', settings.language) });
    } catch {
      setFeedback({ type: 'error', message: t('importError', settings.language) });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const data = createExportData(products, settings);
      await copyExportToClipboard(data);
      setFeedback({ type: 'success', message: t('copiedToClipboard', settings.language) });
    } catch {
      setFeedback({ type: 'error', message: t('importError', settings.language) });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLocalError(null);
    if (!authEmail.trim() || authPassword.length < 6) {
      setAuthLocalError(authMode === 'signin' ? 'Enter your email and password' : 'Password must be at least 6 characters');
      return;
    }
    if (authMode === 'signup' && !authUsername.trim()) {
      setAuthLocalError('Choose a username');
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signIn(authEmail.trim(), authPassword);
      } else {
        await signUp(authEmail.trim(), authPassword, authUsername.trim());
      }
    } catch (err: any) {
      setAuthLocalError(err?.message || 'Something went wrong');
    }
    setAuthSubmitting(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { setPasswordChangeError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { setPasswordChangeError('Passwords do not match'); return; }
    setPasswordChangeError(null);
    setPasswordChangeSubmitting(true);
    try {
      await updatePassword(newPassword);
      setPasswordChangeSuccess(true);
      setNewPassword('');
      setConfirmNewPassword('');
      showToast({ id: 'password-updated', title: '', body: 'Password updated' });
      setTimeout(() => setPasswordChangeSuccess(false), 4000);
    } catch (err: any) {
      setPasswordChangeError(err?.message || 'Something went wrong');
    }
    setPasswordChangeSubmitting(false);
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) { setEmailChangeError('Enter a valid email address'); return; }
    setEmailChangeError(null);
    setEmailChangeSubmitting(true);
    try {
      await updateEmail(newEmail.trim());
      setEmailChangeSuccess(true);
      setNewEmail('');
      showToast({ id: 'email-updated', title: '', body: 'Verification email sent' });
      setTimeout(() => setEmailChangeSuccess(false), 4000);
    } catch (err: any) {
      setEmailChangeError(err?.message || 'Something went wrong');
    }
    setEmailChangeSubmitting(false);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleMergeImportClick = () => mergeFileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>, merge = false) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setFeedback({ type: 'error', message: t('importError', settings.language) });
      return;
    }
    try {
      const content = await file.text();
      const data = parseImportData(content);
      if (!merge) {
        if (!window.confirm(t('importConfirm', settings.language))) return;
        onImport(data);
      } else {
        onMergeImport(data);
      }
      setFeedback({ type: 'success', message: t('importSuccess', settings.language) });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : t('importError', settings.language) });
    }
  };

  const statOptions = [
    { key: 'totalProducts' as const, label: t('totalProducts', settings.language) },
    { key: 'totalAmount' as const, label: t('totalAmount', settings.language) },
    { key: 'totalSessions' as const, label: t('totalSessions', settings.language) },
    { key: 'averageRating' as const, label: t('averageRating', settings.language) },
    { key: 'averageTHC' as const, label: t('averageTHC', settings.language) },
    { key: 'totalValue' as const, label: t('totalValue', settings.language) },
    { key: 'pricePerGram' as const, label: t('pricePerGram', settings.language) },
    { key: 'lastConsumed' as const, label: t('lastConsumed', settings.language) },
    { key: 'consumptionRate' as const, label: t('consumptionRate', settings.language) },
    { key: 'projectedRunOut' as const, label: t('projectedRunOut', settings.language) },
  ];

  const sectionLabel = `flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;

  const lang = settings.language;
  const handleClose = () => {
    onClose();
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('settings', lang)}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Manage your account, preferences and data
          </p>
        </div>
        <button onClick={handleClose}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
            isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}>
          Done
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Vertical nav */}
        <nav className="sm:w-56 shrink-0 flex sm:flex-col gap-1 overflow-x-auto sm:sticky sm:top-0 sm:self-start">
          {([
            { id: 'profile', icon: User, label: t('profileSetup', lang) },
            { id: 'preferences', icon: Palette, label: t('preferences', lang) },
            { id: 'session', icon: Clock, label: t('sessionDefaults', lang) },
            { id: 'budget', icon: BarChart3, label: t('budgetAndStats', lang) },
            { id: 'data', icon: Database, label: t('dataBackup', lang) },
            { id: 'security', icon: Lock, label: t('pinLock', lang) },
          ] as const).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 text-left whitespace-nowrap ${
                  isActive
                    ? isDark ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
                    : isDark ? 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                             : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'profile' && (
            <>
              {!user ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                    <User className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'} mb-4`}>
                      {authMode === 'signin' ? 'Sign in to manage your profile' : 'Create an account to set up your profile'}
                    </p>
                  </div>

                  {(authLocalError || authError) && (
                    <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                      {authLocalError || authError}
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <TextInput type="email" label="Email" placeholder="Email" value={authEmail}
                      onChange={e => { setAuthEmail(e.currentTarget.value); setAuthLocalError(null); }}
                      required autoFocus
                    />
                    <TextInput type="password" label="Password" placeholder="Password" value={authPassword}
                      onChange={e => { setAuthPassword(e.currentTarget.value); setAuthLocalError(null); }}
                      required minLength={6}
                    />
                    {authMode === 'signup' && (
                      <>
                        <TextInput label="Username" placeholder="Username" value={authUsername}
                          onChange={e => { setAuthUsername(e.currentTarget.value.replace(/[^a-zA-Z0-9_]/g, '')); setAuthLocalError(null); }}
                          required minLength={2} maxLength={20}
                          description="Your unique @username — cannot be changed later"
                        />
                      </>
                    )}
                    {authMode === 'signin' && (
                      <button type="button" onClick={() => setShowResetPassword(true)}
                        className={`self-start text-xs -mt-2 ${isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}>
                        Forgot password?
                      </button>
                    )}
                    <Button type="submit" disabled={authSubmitting} className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500" loading={authSubmitting}>
                      {authSubmitting ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Button>
                  </form>

                  <button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthLocalError(null); setAuthUsername(''); }}
                    className={`w-full text-sm ${isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}>
                    {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              ) : (
                <>
              {/* Profile Completion Progress */}
              {(() => {
                const filled = [
                  !!profileDisplayName.trim(),
                  !!profileBio.trim(),
                  !!avatarPreview,
                  profileContacts.some(c => c.value.trim()),
                ];
                const pct = Math.round((filled.filter(Boolean).length / filled.length) * 100);
                return (
                  <div className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('profileCompletion', lang)}</span>
                      <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>{pct}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    {pct < 100 && (
                      <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('profileSetupHint', lang)}</p>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className={sectionLabel}><User className="w-4 h-4" />Username <span className="text-red-400">*</span></label>
                <div className={`px-4 py-3 rounded-xl border-2 text-sm font-medium ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  @{profileUsername}
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('usernamePermanent', lang)}</p>
              </div>

              <div>
                <label className={sectionLabel}><User className="w-4 h-4" />{t('displayName', lang)}</label>
                <TextInput
                  value={profileDisplayName}
                  onChange={e => setProfileDisplayName(e.currentTarget.value)}
                  maxLength={24}
                  placeholder="Your display name"
                  size="md"
                />
              </div>

              <div>
                <label className={sectionLabel}><User className="w-4 h-4" />{t('bio', lang)}</label>
                <Textarea
                  value={profileBio}
                  onChange={e => setProfileBio(e.currentTarget.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Tell the community about yourself..."
                  size="md"
                />
                <Text size="xs" c="dimmed" ta="right" mt={4}>{profileBio.length}/160</Text>
              </div>

              <div>
                <label className={sectionLabel}><User className="w-4 h-4" />Profile Picture</label>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-cyanx to-emera flex items-center justify-center shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-display font-bold text-xl">
                        {(profileUsername?.[0] || settings.profile?.username?.[0] || '?').toUpperCase()}
                      </span>
                    )}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Upload Photo
                    </button>
                    {avatarPreview && (
                      <button
                        onClick={async () => {
                          if (settings.profile?.avatar_url) await deleteProfileImage(settings.profile.avatar_url, 'profile-images');
                          setAvatarPreview(undefined);
                          const p = { ...settings.profile!, avatar_url: undefined };
                          updateSettings({ profile: p });
                          if (user) supabase.from('profiles').upsert({ user_id: user.id, avatar_url: null }, { onConflict: 'user_id' }).then(undefined, () => {});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'
                        }`}
                      >
                        Remove
                      </button>
                    )}
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Max 2MB, square</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={sectionLabel}><Camera className="w-4 h-4" />Profile Banner</label>
                <div className="space-y-2 mb-4">
                  <div className="relative w-full h-20 rounded-xl overflow-hidden bg-gradient-to-r from-cyanx/40 via-emera/40 to-cyanx/20">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className={`w-6 h-6 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                      </div>
                    )}
                    <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => bannerInputRef.current?.click()} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      Upload Banner
                    </button>
                    {bannerPreview && (
                      <button onClick={() => setBannerPreview(undefined)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                        Remove
                      </button>
                    )}
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Max 5MB, 3:1 ratio</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={sectionLabel}><MapPin className="w-4 h-4" />{t('location', lang)}</label>
                <TextInput
                  value={profileLocation}
                  onChange={e => setProfileLocation(e.currentTarget.value)}
                  maxLength={60}
                  placeholder={t('locationPlaceholder', lang)}
                  size="md"
                />
              </div>

              <div>
                <label className={sectionLabel}><MessageCircle className="w-4 h-4" />{t('contactInfo', lang)}</label>
                <div className="space-y-2 mb-2">
                  {profileContacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={contact.platform} onChange={v => {
                        if (!v) return;
                        const next = [...profileContacts];
                        next[idx] = { ...next[idx], platform: v };
                        setProfileContacts(next);
                      }} data={CONTACT_PLATFORMS} size="xs" style={{ flex: 1, minWidth: 100 }} />
                      <TextInput value={contact.value} onChange={e => {
                        const next = [...profileContacts];
                        next[idx] = { ...next[idx], value: e.currentTarget.value };
                        setProfileContacts(next);
                      }} placeholder={contact.platform === 'email' ? 'user@example.com' : contact.platform === 'phone' ? '+1 555 0000' : '@username'}
                        size="xs" style={{ flex: 1 }} />
                      <Button variant="subtle" color="red" size="compact-xs" onClick={() => setProfileContacts(profileContacts.filter((_, i) => i !== idx))}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setProfileContacts([...profileContacts, { platform: CONTACT_PLATFORMS[0], value: '' }])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  + Add Contact
                </button>
              </div>

              {/* Visibility toggles */}
              <div className={`p-3 rounded-xl border-2 space-y-3 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <Switch
                  checked={settings.showOnlineStatus !== false}
                  onChange={e => updateSettings({ showOnlineStatus: e.currentTarget.checked })}
                  label={t('showOnlineStatus', lang)}
                  description={t('showOnlineStatusHint', lang)}
                  size="md"
                />
                <Switch
                  checked={settings.showLocation !== false}
                  onChange={e => updateSettings({ showLocation: e.currentTarget.checked })}
                  label={t('showLocation', lang)}
                  description={t('showLocationHint', lang)}
                  size="md"
                />
              </div>

              <Button
                onClick={async () => {
                  if (!profileUsername.trim() || !user) return;
                  let avatarUrl = settings.profile?.avatar_url;
                  if (avatarPreview && avatarPreview.startsWith('data:')) {
                    const blob = await (await fetch(avatarPreview)).blob();
                    const file = new File([blob], 'avatar.webp', { type: blob.type || 'image/webp' });
                    const uploaded = await uploadProfileImage(user.id, file, 'profile-images');
                    if (uploaded) {
                      if (avatarUrl && !avatarUrl.startsWith('data:')) await deleteProfileImage(avatarUrl, 'profile-images');
                      avatarUrl = uploaded;
                    }
                  }
                  let bannerUrl = settings.profile?.banner_url;
                  if (bannerPreview && bannerPreview.startsWith('data:')) {
                    const blob = await (await fetch(bannerPreview)).blob();
                    const file = new File([blob], 'banner.webp', { type: blob.type || 'image/webp' });
                    const uploaded = await uploadProfileImage(user.id, file, 'profile-banners');
                    if (uploaded) {
                      if (bannerUrl && !bannerUrl.startsWith('data:')) await deleteProfileImage(bannerUrl, 'profile-banners');
                      bannerUrl = uploaded;
                    }
                  }
                  const p = {
                    username: profileUsername.trim() || 'User',
                    displayName: profileDisplayName.trim() || profileUsername.trim() || 'User',
                    bio: profileBio.trim(),
                    joinedAt: settings.profile?.joinedAt || new Date().toISOString(),
                    avatar_url: avatarUrl,
                    banner_url: bannerUrl,
                    contacts: profileContacts.filter(c => c.value.trim()),
                    location: profileLocation.trim() || undefined,
                  };
                  updateSettings({ profile: p });
                  supabase.from('profiles').upsert({
                    user_id: user.id,
                    username: p.username,
                    display_name: p.displayName,
                    avatar_url: p.avatar_url || null,
                    banner_url: p.banner_url || null,
                    bio: p.bio,
                    contacts: JSON.stringify(p.contacts),
                    location: p.location || null,
                    public_products: settings.publicProducts || false,
                  }, { onConflict: 'user_id' }).then(undefined, () => {});
                  showToast({ id: 'profile-saved', title: '', body: 'Profile saved' });
                }}
                disabled={!profileUsername.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500"
              >
                {t('save', lang)} {t('profileSetup', lang)}
              </Button>

              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
                const reader = new FileReader();
                reader.onload = () => { const url = reader.result as string; setAvatarPreview(url); };
                reader.readAsDataURL(file);
              }} />

              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { alert('Banner must be under 5MB'); return; }
                const reader = new FileReader();
                reader.onload = () => { const url = reader.result as string; setBannerPreview(url); };
                reader.readAsDataURL(file);
              }} />

              <hr className={`my-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />
              <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} flex items-center gap-2`}>
                <Lock className="w-4 h-4" />Change Password
              </h4>
              {passwordChangeError && (
                <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>{passwordChangeError}</div>
              )}
              {passwordChangeSuccess && (
                <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Password updated successfully!</div>
              )}
<TextInput type="password" placeholder="New password" value={newPassword}
                onChange={e => { setNewPassword(e.currentTarget.value); setPasswordChangeError(null); setPasswordChangeSuccess(false); }}
                minLength={6}
              />
              <TextInput type="password" placeholder="Confirm new password" value={confirmNewPassword}
                onChange={e => { setConfirmNewPassword(e.currentTarget.value); setPasswordChangeError(null); setPasswordChangeSuccess(false); }}
                minLength={6}
              />
              <Button onClick={handlePasswordChange} disabled={passwordChangeSubmitting || !newPassword || !confirmNewPassword}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                loading={passwordChangeSubmitting}>
                {passwordChangeSubmitting ? 'Updating...' : 'Update Password'}
              </Button>

              <hr className={`my-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />
              <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} flex items-center gap-2`}>
                <Mail className="w-4 h-4" />Change Email
              </h4>
              {emailChangeError && (
                <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>{emailChangeError}</div>
              )}
              {emailChangeSuccess && (
                <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Verification sent! Check your new email.</div>
              )}
              <TextInput type="email" placeholder="New email address" value={newEmail}
                onChange={e => { setNewEmail(e.currentTarget.value); setEmailChangeError(null); setEmailChangeSuccess(false); }}
              />
              <Button onClick={handleEmailChange} disabled={emailChangeSubmitting || !newEmail}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                loading={emailChangeSubmitting}>
                {emailChangeSubmitting ? 'Sending...' : 'Update Email'}
              </Button>
            </>
            )}
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              {/* Language */}
              <div className="mb-4">
                <label className={sectionLabel}><Globe className="w-4 h-4" />{t('language', lang)}</label>
                <Select
                  value={settings.language}
                  onChange={(v) => v && updateSettings({ language: v as typeof settings.language })}
                  data={LANGUAGES.map(l => ({ value: l.code, label: `${l.flag}  ${LANGUAGE_NAMES[settings.language]?.[l.code] || l.code}` }))}
                  size="md"
                  checkIconPosition="right"
                />
              </div>

              {/* Theme */}
              <div className="mb-4">
                <label className={sectionLabel}><Palette className="w-4 h-4" />{t('theme', lang)}</label>
                <SegmentedControl
                  value={settings.theme}
                  onChange={(v) => handleThemeChange(v as 'dark' | 'light')}
                  data={[{ value: 'dark', label: t('dark', lang) }, { value: 'light', label: t('light', lang) }]}
                  size="md"
                  fullWidth
                />
              </div>

              {/* Decimal Precision */}
              <div className="mb-4">
                <label className={sectionLabel}><Hash className="w-4 h-4" />{t('decimalPrecision', lang)}</label>
                <SegmentedControl
                  value={String(settings.decimalPrecision)}
                  onChange={(v) => updateSettings({ decimalPrecision: parseInt(v, 10) })}
                  data={['0', '1', '2', '3']}
                  size="md"
                  fullWidth
                />
              </div>

              {/* Show Timer Ms */}
              <div className={`p-3 rounded-xl border-2 mb-4 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <Switch
                  checked={settings.showTimerMs}
                  onChange={e => updateSettings({ showTimerMs: e.currentTarget.checked })}
                  label={t('showTimerMs', lang)}
                  description={t('showTimerMsHint', lang)}
                  size="md"
                />
              </div>

              {/* Currency */}
              <div className="mb-4">
                <label className={sectionLabel}><DollarSign className="w-4 h-4" />{t('currency', lang)}</label>
                <SegmentedControl
                  value={settings.currency}
                  onChange={(sym) => updateSettings({ currency: sym })}
                  data={['$', '\u20ac', '\u00a3', '\u00a5', '\u20bf']}
                  size="md"
                  fullWidth
                />
              </div>

              <hr className={`my-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

              {/* Notifications Section */}
              <div className="mb-4">
                <label className={sectionLabel}><Bell className="w-4 h-4" />{t('notifications', lang)}</label>
                <div className={`p-3 rounded-xl border-2 space-y-3 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <Switch
                    checked={settings.notificationsEnabled !== false}
                    onChange={(e) => updateSettings({ notificationsEnabled: e.currentTarget.checked })}
                    label={t('notificationsEnabled', lang)}
                    description={t('notificationsEnabledHint', lang)}
                    size="md"
                  />
                  <Switch
                    checked={settings.notificationsSound !== false}
                    onChange={(e) => updateSettings({ notificationsSound: e.currentTarget.checked })}
                    label={t('notificationsSound', lang)}
                    description={t('notificationsSoundHint', lang)}
                    size="md"
                  />
                </div>
              </div>

              {/* Feed Preferences */}
              <div>
                <label className={sectionLabel}><Rss className="w-4 h-4" />{t('defaultFeedFilter', lang)}</label>
                <SegmentedControl
                  value={settings.defaultFeedFilter || 'latest'}
                  onChange={(f) => updateSettings({ defaultFeedFilter: f as typeof settings.defaultFeedFilter })}
                  data={(['latest', 'following', 'trending'] as const).map(f => ({ value: f, label: f }))}
                  size="md"
                  fullWidth
                />
              </div>
            </>
          )}

          {activeTab === 'session' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <NumberInput
                  label={t('defaultAmount', lang)}
                  value={settings.sessionDefaults.defaultAmount}
                  onChange={(v) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultAmount: Math.max(0, typeof v === 'number' ? v : parseFloat(v) || 0) } })}
                  min={0} step={0.1} decimalScale={2} size="md"
                />
                <NumberInput
                  label={t('defaultPeople', lang)}
                  value={settings.sessionDefaults.defaultPeople}
                  onChange={(v) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultPeople: Math.max(1, typeof v === 'number' ? v : parseInt(v) || 1) } })}
                  min={1} step={1} size="md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <NumberInput
                  label={t('defaultHitTimer', lang)}
                  value={settings.sessionDefaults.defaultHitTimer}
                  onChange={(v) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultHitTimer: Math.max(1, typeof v === 'number' ? v : parseInt(v) || 1) } })}
                  min={1} step={1} size="md"
                />
                <NumberInput
                  label={t('defaultGramsPerBowl', lang)}
                  value={settings.sessionDefaults.defaultGramsPerBowl}
                  onChange={(v) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultGramsPerBowl: Math.max(0.01, typeof v === 'number' ? v : parseFloat(v) || 0.01) } })}
                  min={0.01} step={0.05} decimalScale={2} size="md"
                />
              </div>
              <div className={`p-3 rounded-xl border-2 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <Switch
                  checked={settings.sessionDefaults.rotationEnabled}
                  onChange={(e) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, rotationEnabled: e.currentTarget.checked } })}
                  label={t('rotationEnabled', lang)}
                  size="md"
                />
              </div>
              <div className={`p-3 rounded-xl border-2 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <Switch
                  checked={settings.publicProducts}
                  onChange={(e) => updateSettings({ publicProducts: e.currentTarget.checked })}
                  label={t('publicProducts', lang)}
                  description={t('publicProductsHint', lang)}
                  size="md"
                />
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <>
              {/* Budget Limit */}
              <div className="mb-4">
                <label className={sectionLabel}><DollarSign className="w-4 h-4" />{t('budgetLimit', lang)}</label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <NumberInput
                    value={settings.budgetLimit}
                    onChange={(v) => updateSettings({ budgetLimit: Math.max(0, typeof v === 'number' ? v : parseFloat(v) || 0) })}
                    min={0} step={10} placeholder="0 = disabled" size="md" style={{ flex: 1 }}
                  />
                  <SegmentedControl
                    value={settings.budgetPeriod}
                    onChange={(v) => updateSettings({ budgetPeriod: v as 'weekly' | 'monthly' | 'yearly' })}
                    data={['weekly', 'monthly', 'yearly']}
                    size="md"
                  />
                </div>
                <Text size="xs" c="dimmed" mt="xs">{t('budgetLimitHint', lang)}</Text>
              </div>

              {/* Low Stock Threshold */}
              <div className="mb-4">
                <label className={sectionLabel}><AlertTriangle className="w-4 h-4" />{t('lowStockThreshold', lang)}</label>
                <Text size="xs" c="dimmed" mb="xs">{t('lowStockThresholdHint', lang)}</Text>
                <NumberInput
                  value={settings.lowStockThreshold}
                  onChange={(v) => updateSettings({ lowStockThreshold: Math.max(0, typeof v === 'number' ? v : parseFloat(v) || 0) })}
                  min={0} step={0.5} size="md"
                />
              </div>

              <hr className={`my-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

              {/* Stat Visibility */}
              <div>
                <label className={sectionLabel}><BarChart3 className="w-4 h-4" />{t('showStats', lang)}</label>
                <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('statTogglesHint', lang)}</p>
                <div className="grid grid-cols-2 gap-2">
                  {statOptions.map((stat) => (
                    <button key={stat.key} onClick={() => handleStatToggle(stat.key)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border-2 text-left ${
                        settings.statsVisibility[stat.key]
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                          : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>{stat.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <>
              <div>
                <label className={sectionLabel}><Database className="w-4 h-4" />{t('dataBackup', lang)}</label>
                <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('dataBackupHint', lang)}</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <Button variant="light" onClick={handleExport} className="flex-col h-auto py-2 gap-1">
                    <Download className="w-4 h-4" /><Text size="10" className="leading-tight">{t('exportData', lang)}</Text>
                  </Button>
                  <Button variant="light" onClick={handleExportCsv} className="flex-col h-auto py-2 gap-1">
                    <FileSpreadsheet className="w-4 h-4" /><Text size="10" className="leading-tight">{t('exportCsv', lang)}</Text>
                  </Button>
                  <Button variant="light" onClick={handleExportPdf} className="flex-col h-auto py-2 gap-1">
                    <FileText className="w-4 h-4" /><Text size="10" className="leading-tight">PDF</Text>
                  </Button>
                  <Button variant="light" onClick={handleCopyToClipboard} className="flex-col h-auto py-2 gap-1">
                    <Clipboard className="w-4 h-4" /><Text size="10" className="leading-tight">{t('copyToClipboard', lang)}</Text>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="light" onClick={handleImportClick}>
                    <Upload className="w-4 h-4" />{t('importData', lang)}
                  </Button>
                  <Button variant="light" onClick={handleMergeImportClick}>
                    <Merge className="w-4 h-4" />{t('importMerge', lang)}
                  </Button>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('importMergeHint', lang)}</p>
                <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={(e) => handleImportFile(e, false)} className="hidden" />
                <input ref={mergeFileInputRef} type="file" accept=".json,application/json" onChange={(e) => handleImportFile(e, true)} className="hidden" />
                {feedback && (
                  <p className={`mt-3 text-xs font-medium ${feedback.type === 'success' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                    {feedback.message}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div>
              <label className={sectionLabel}><Lock className="w-4 h-4" />{t('pinLock', lang)}</label>
              <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('pinLockHint', lang)}</p>
              {!settings.pinEnabled ? (
                <>
                  {!showPinSetup ? (
                    <Button color="red" variant="light" fullWidth onClick={() => { setShowPinSetup(true); setPinSetupValue(''); setPinError(''); }}>
                      {t('enablePin', lang)}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <TextInput type="password" inputMode="numeric" maxLength={6} value={pinSetupValue}
                        onChange={(e) => { setPinSetupValue(e.currentTarget.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                        placeholder={t('enterPin', lang)}
                        className="text-center text-lg tracking-widest font-mono"
                        size="md"
                      />
                      {pinError && <Text size="xs" c="red" fw={500}>{pinError}</Text>}
                      <div className="flex gap-2">
                        <Button variant="default" flex={1} onClick={() => { setShowPinSetup(false); setPinSetupValue(''); setPinError(''); }}>
                          {t('cancel', lang)}
                        </Button>
                        <Button flex={1} className="bg-gradient-to-r from-cyan-500 to-emerald-500" disabled={pinSetupValue.length < 4} onClick={async () => {
                          if (pinSetupValue.length < 4) { setPinError(t('pinLengthError', lang)); return; }
                          try { const hash = await hashPin(pinSetupValue); updateSettings({ pinEnabled: true, pinHash: hash }); setShowPinSetup(false); setPinSetupValue(''); }
                          catch { setPinError(t('importError', lang)); }
                        }}>{t('save', lang)}</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!showPinDisable ? (
                    <Button color="red" variant="light" fullWidth onClick={() => { setShowPinDisable(true); setPinDisableValue(''); setPinError(''); }}>
                      {t('disablePin', lang)}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <TextInput type="password" inputMode="numeric" maxLength={6} value={pinDisableValue}
                        onChange={(e) => { setPinDisableValue(e.currentTarget.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                        placeholder={t('enterCurrentPin', lang)}
                        className="text-center text-lg tracking-widest font-mono"
                        size="md"
                      />
                      {pinError && <Text size="xs" c="red" fw={500}>{pinError}</Text>}
                      <div className="flex gap-2">
                        <Button variant="default" flex={1} onClick={() => { setShowPinDisable(false); setPinDisableValue(''); setPinError(''); }}>
                          {t('cancel', lang)}
                        </Button>
                        <Button flex={1} className="bg-gradient-to-r from-red-500 to-rose-500" disabled={pinDisableValue.length < 4} onClick={async () => {
                          try { const hash = await hashPin(pinDisableValue); if (hash !== settings.pinHash) { setPinError(t('pinMismatch', lang)); return; } updateSettings({ pinEnabled: false, pinHash: '' }); setShowPinDisable(false); setPinDisableValue(''); }
                          catch { setPinError(t('importError', lang)); }
                        }}>{t('disablePin', lang)}</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {showResetPassword && (
            <ResetPasswordModal
              isDark={isDark}
              onClose={() => setShowResetPassword(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
