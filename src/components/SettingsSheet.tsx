import { useState, useEffect, useRef } from 'react';
import { Product, Settings } from '../types';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { hashPin } from '../utils/helpers';
import { createExportData, downloadExport, downloadCsvExport, copyExportToClipboard, parseImportData, ImportResult } from '../utils/dataTransfer';
import { exportProductsPdf } from '../utils/pdfExport';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { X, Globe, Palette, ChevronDown, Check, Download, Upload, FileSpreadsheet, FileText, Clipboard, Merge, Clock, Users, Scale, DollarSign, Lock, Hash, AlertTriangle, Database, BarChart3, User, Camera } from 'lucide-react';

interface SettingsSheetProps {
  products: Product[];
  onImport: (data: ImportResult) => void;
  onMergeImport: (data: ImportResult) => void;
  onClose: () => void;
  isDark?: boolean;
  defaultTab?: 'profile' | 'personalization' | 'session' | 'stats' | 'data' | 'security';
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

export function SettingsSheet({ products, onImport, onMergeImport, onClose, isDark = true, defaultTab = 'personalization' }: SettingsSheetProps) {
  const { settings, updateSettings, toggleStatVisibility } = useSettings();
  const { user, signIn, signUp, error: authError } = useAuth();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authLocalError, setAuthLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'personalization' | 'session' | 'stats' | 'data' | 'security'>(defaultTab);
  const [pinSetupValue, setPinSetupValue] = useState('');
  const [pinDisableValue, setPinDisableValue] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinDisable, setShowPinDisable] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isPinProcessing, setIsPinProcessing] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [profileUsername, setProfileUsername] = useState(settings.profile?.username || '');
  const [profileBio, setProfileBio] = useState(settings.profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(settings.profile?.avatar_url);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleStatToggle = (key: keyof Settings['statsVisibility']) => {
    toggleStatVisibility(key);
  };

  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
  };

  const handleCurrencyChange = (sym: string) => {
    updateSettings({ currency: sym });
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

  const handleExportPdf = () => {
    try {
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
    setAuthSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signIn(authEmail.trim(), authPassword);
      } else {
        await signUp(authEmail.trim(), authPassword);
      }
    } catch (err: any) {
      setAuthLocalError(err?.message || 'Something went wrong');
    }
    setAuthSubmitting(false);
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
  const actionButton = (active: boolean) =>
    `py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
      active
        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
        : isDark
          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
          : 'bg-gray-200 border-gray-200 text-gray-700 hover:border-gray-400'
    }`;

  const lang = settings.language;
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={handleClose}>
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
        }`}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md h-full flex flex-col shadow-2xl transition-all duration-200 border-l ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        } ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('settings', lang)}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('settings', lang)}
          </h2>
          <button onClick={handleClose} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex flex-wrap border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          {([
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'personalization', icon: Palette, label: t('personalization', lang) },
            { id: 'session', icon: Clock, label: t('sessionDefaults', lang) },
            { id: 'stats', icon: BarChart3, label: t('showStats', lang) },
            { id: 'data', icon: Database, label: t('dataBackup', lang) },
            { id: 'security', icon: Lock, label: t('pinLock', lang) },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 min-w-[33.33%] py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="flex flex-col items-center gap-0.5">
                <tab.icon className="w-4 h-4" />
                <span className="leading-tight">{tab.label}</span>
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
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
                    <input type="email" placeholder="Email" value={authEmail}
                      onChange={e => { setAuthEmail(e.target.value); setAuthLocalError(null); }}
                      required autoFocus
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${
                        isDark ? 'bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                      }`} />
                    <input type="password" placeholder="Password" value={authPassword}
                      onChange={e => { setAuthPassword(e.target.value); setAuthLocalError(null); }}
                      required minLength={6}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none ${
                        isDark ? 'bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                      }`} />
                    <button type="submit" disabled={authSubmitting}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                    >
                      {authSubmitting ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                  </form>

                  <button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthLocalError(null); }}
                    className={`w-full text-sm ${isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}>
                    {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              ) : (
                <>
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
                        onClick={() => { setAvatarPreview(undefined); updateSettings({ profile: { ...settings.profile!, avatar_url: undefined } }); if (user) supabase.from('profiles').upsert({ user_id: user.id, display_name: settings.profile?.username || 'User', avatar_url: null }, { onConflict: 'user_id' }).then(undefined, (e: unknown) => { console.error('Avatar remove sync failed:', e); }); }}
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
                <label className={sectionLabel}><User className="w-4 h-4" />Username</label>
                <input type="text" value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value)} maxLength={24}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  }`} />
              </div>

              <div>
                <label className={sectionLabel}><User className="w-4 h-4" />Bio</label>
                <textarea value={profileBio}
                  onChange={e => setProfileBio(e.target.value)} maxLength={160} rows={3}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none resize-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  }`} />
              </div>

              <button
                onClick={() => {
                  const p = { username: profileUsername.trim() || 'User', bio: profileBio.trim(), joinedAt: settings.profile?.joinedAt || new Date().toISOString(), avatar_url: avatarPreview };
                  updateSettings({ profile: p });
                  if (user) supabase.from('profiles').upsert({ user_id: user.id, display_name: p.username, avatar_url: p.avatar_url || null }, { onConflict: 'user_id' }).then(undefined, (e: unknown) => { console.error('Profile save sync failed:', e); });
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 transition-all"
              >
                Save Profile
              </button>

              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
                const reader = new FileReader();
                reader.onload = () => { const url = reader.result as string; setAvatarPreview(url); };
                reader.readAsDataURL(file);
              }} />
            </>
            )}
            </>
          )}

          {activeTab === 'personalization' && (
            <>
              {/* Language */}
              <div className="mb-4">
                <label className={sectionLabel}><Globe className="w-4 h-4" />{t('language', lang)}</label>
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-left flex items-center justify-between ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    } outline-none`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{LANGUAGES.find(l => l.code === settings.language)?.flag}</span>
                      {LANGUAGE_NAMES[settings.language]?.[settings.language] || settings.language}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showLanguageDropdown && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border-2 shadow-xl z-10 overflow-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                    }`}>
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { updateSettings({ language: l.code as typeof settings.language }); setShowLanguageDropdown(false); }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                            settings.language === l.code
                              ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                              : isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{l.flag}</span>
                            {LANGUAGE_NAMES[settings.language]?.[l.code] || l.code}
                          </span>
                          {settings.language === l.code && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Theme */}
              <div className="mb-4">
                <label className={sectionLabel}><Palette className="w-4 h-4" />{t('theme', lang)}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleThemeChange('dark')} className={actionButton(settings.theme === 'dark')}>{t('dark', lang)}</button>
                  <button onClick={() => handleThemeChange('light')} className={actionButton(settings.theme === 'light')}>{t('light', lang)}</button>
                </div>
              </div>

              {/* Decimal Precision */}
              <div className="mb-4">
                <label className={sectionLabel}><Hash className="w-4 h-4" />{t('decimalPrecision', lang)}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map(p => (
                    <button key={p} onClick={() => updateSettings({ decimalPrecision: p })}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                        settings.decimalPrecision === p
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Show Timer Ms */}
              <div className={`flex items-center justify-between p-3 rounded-xl border-2 mb-4 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div>
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('showTimerMs', lang)}</span>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('showTimerMsHint', lang)}</p>
                </div>
                <button onClick={() => updateSettings({ showTimerMs: !settings.showTimerMs })}
                  className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
                    settings.showTimerMs ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : isDark ? 'bg-slate-600' : 'bg-gray-300'
                  }`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                    settings.showTimerMs ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Currency */}
              <div className="mb-4">
                <label className={sectionLabel}><DollarSign className="w-4 h-4" />{t('currency', lang)}</label>
                <div className="grid grid-cols-5 gap-2">
                  {['$', '\u20ac', '\u00a3', '\u00a5', '\u20bf'].map((sym) => (
                    <button key={sym} onClick={() => handleCurrencyChange(sym)}
                      className={`py-3 rounded-xl text-lg font-bold transition-all border-2 ${
                        settings.currency === sym
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>{sym}</button>
                  ))}
                </div>
              </div>

              {/* Budget Limit */}
              <div className="mb-4">
                <label className={sectionLabel}><DollarSign className="w-4 h-4" />{t('budgetLimit', lang)}</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={settings.budgetLimit}
                    onChange={(e) => updateSettings({ budgetLimit: Math.max(0, parseFloat(e.target.value) || 0) })}
                    min="0" step="10" placeholder="0 = disabled"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                             : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    }`} />
                  <div className={`flex rounded-xl border-2 overflow-hidden ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    {(['weekly', 'monthly', 'yearly'] as const).map(period => (
                      <button key={period} onClick={() => updateSettings({ budgetPeriod: period })}
                        className={`flex-1 py-3 text-xs font-medium transition-colors ${
                          settings.budgetPeriod === period
                            ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                            : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}>{period}</button>
                    ))}
                  </div>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('budgetLimitHint', lang)}</p>
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className={sectionLabel}><AlertTriangle className="w-4 h-4" />{t('lowStockThreshold', lang)}</label>
                <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('lowStockThresholdHint', lang)}</p>
                <input type="number" value={settings.lowStockThreshold}
                  onChange={(e) => updateSettings({ lowStockThreshold: Math.max(0, parseFloat(e.target.value) || 0) })}
                  min="0" step="0.5"
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                           : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  }`} />
              </div>
            </>
          )}

          {activeTab === 'session' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Scale className="w-3 h-3 inline mr-1" />{t('defaultAmount', lang)}
                  </label>
                  <input type="number" value={settings.sessionDefaults.defaultAmount}
                    onChange={(e) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultAmount: Math.max(0, parseFloat(e.target.value) || 0) } })}
                    min="0" step="0.1"
                    className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                             : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    }`} />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Users className="w-3 h-3 inline mr-1" />{t('defaultPeople', lang)}
                  </label>
                  <input type="number" value={settings.sessionDefaults.defaultPeople}
                    onChange={(e) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultPeople: Math.max(1, parseInt(e.target.value) || 1) } })}
                    min="1" step="1"
                    className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                             : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    }`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Clock className="w-3 h-3 inline mr-1" />{t('defaultHitTimer', lang)}
                  </label>
                  <input type="number" value={settings.sessionDefaults.defaultHitTimer}
                    onChange={(e) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultHitTimer: Math.max(1, parseInt(e.target.value) || 1) } })}
                    min="1" step="1"
                    className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                             : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    }`} />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Scale className="w-3 h-3 inline mr-1" />{t('defaultGramsPerBowl', lang)}
                  </label>
                  <input type="number" value={settings.sessionDefaults.defaultGramsPerBowl}
                    onChange={(e) => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, defaultGramsPerBowl: Math.max(0.01, parseFloat(e.target.value) || 0.01) } })}
                    min="0.01" step="0.05"
                    className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                             : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    }`} />
                </div>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('rotationEnabled', lang)}</span>
                <button onClick={() => updateSettings({ sessionDefaults: { ...settings.sessionDefaults, rotationEnabled: !settings.sessionDefaults.rotationEnabled } })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    settings.sessionDefaults.rotationEnabled ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : isDark ? 'bg-slate-600' : 'bg-gray-300'
                  }`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                    settings.sessionDefaults.rotationEnabled ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
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
          )}

          {activeTab === 'data' && (
            <>
              <div>
                <label className={sectionLabel}><Database className="w-4 h-4" />{t('dataBackup', lang)}</label>
                <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('dataBackupHint', lang)}</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <button onClick={handleExport} className={actionButton(false)}>
                    <Download className="w-4 h-4" /><span className="text-[10px] leading-tight">{t('exportData', lang)}</span>
                  </button>
                  <button onClick={handleExportCsv} className={actionButton(false)}>
                    <FileSpreadsheet className="w-4 h-4" /><span className="text-[10px] leading-tight">{t('exportCsv', lang)}</span>
                  </button>
                  <button onClick={handleExportPdf} className={actionButton(false)}>
                    <FileText className="w-4 h-4" /><span className="text-[10px] leading-tight">PDF</span>
                  </button>
                  <button onClick={handleCopyToClipboard} className={actionButton(false)}>
                    <Clipboard className="w-4 h-4" /><span className="text-[10px] leading-tight">{t('copyToClipboard', lang)}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleImportClick} className={actionButton(false)}>
                    <Upload className="w-4 h-4" />{t('importData', lang)}
                  </button>
                  <button onClick={handleMergeImportClick} className={actionButton(false)}>
                    <Merge className="w-4 h-4" />{t('importMerge', lang)}
                  </button>
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
                    <button onClick={() => { setShowPinSetup(true); setPinSetupValue(''); setPinError(''); }}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                        isDark ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                               : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      }`}>{t('enablePin', lang)}</button>
                  ) : (
                    <div className="space-y-3">
                      <input type="password" inputMode="numeric" maxLength={6} value={pinSetupValue}
                        onChange={(e) => { setPinSetupValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                        placeholder={t('enterPin', lang)}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg tracking-widest font-mono outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500'
                                 : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                        }`} />
                      {pinError && <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{pinError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => { setShowPinSetup(false); setPinSetupValue(''); setPinError(''); }}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                            isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}>{t('cancel', lang)}</button>
                        <button onClick={async () => {
                          if (pinSetupValue.length < 4) { setPinError(t('pinLengthError', lang)); return; }
                          if (isPinProcessing) return;
                          setIsPinProcessing(true);
                          try { const hash = await hashPin(pinSetupValue); updateSettings({ pinEnabled: true, pinHash: hash }); setShowPinSetup(false); setPinSetupValue(''); }
                          catch { setPinError(t('importError', lang)); }
                          finally { setIsPinProcessing(false); }
                        }}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            pinSetupValue.length >= 4 && !isPinProcessing
                              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                              : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}>{t('save', lang)}</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!showPinDisable ? (
                    <button onClick={() => { setShowPinDisable(true); setPinDisableValue(''); setPinError(''); }}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                        isDark ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                               : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      }`}>{t('disablePin', lang)}</button>
                  ) : (
                    <div className="space-y-3">
                      <input type="password" inputMode="numeric" maxLength={6} value={pinDisableValue}
                        onChange={(e) => { setPinDisableValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                        placeholder={t('enterCurrentPin', lang)}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg tracking-widest font-mono outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500'
                                 : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                        }`} />
                      {pinError && <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{pinError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => { setShowPinDisable(false); setPinDisableValue(''); setPinError(''); }}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                            isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}>{t('cancel', lang)}</button>
                        <button onClick={async () => {
                          if (isPinProcessing) return;
                          setIsPinProcessing(true);
                          try { const hash = await hashPin(pinDisableValue); if (hash !== settings.pinHash) { setPinError(t('pinMismatch', lang)); return; } updateSettings({ pinEnabled: false, pinHash: '' }); setShowPinDisable(false); setPinDisableValue(''); }
                          catch { setPinError(t('importError', lang)); }
                          finally { setIsPinProcessing(false); }
                        }}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            pinDisableValue.length >= 4 && !isPinProcessing
                              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                              : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}>{t('disablePin', lang)}</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
