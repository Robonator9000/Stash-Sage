import { useState, useEffect, useRef } from 'react';
import { Product, Settings } from '../types';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { createExportData, downloadExport, downloadCsvExport, copyExportToClipboard, parseImportData, ImportResult } from '../utils/dataTransfer';
import { X, Globe, Palette, BarChart3, ChevronDown, Check, Download, Upload, Database, FileSpreadsheet, Clipboard, Merge, Clock, Users, Scale, RotateCcw, DollarSign, Lock, Hash } from 'lucide-react';
interface SettingsModalProps {
  products: Product[];
  onImport: (data: ImportResult) => void;
  onMergeImport: (data: ImportResult) => void;
  onClose: () => void;
  isDark?: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export function SettingsModal({ products, onImport, onMergeImport, onClose, isDark = true }: SettingsModalProps) {
  const { settings, updateSettings, toggleStatVisibility } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'personalization' | 'dangerZone'>('personalization');
  const [pinSetupValue, setPinSetupValue] = useState('');
  const [pinDisableValue, setPinDisableValue] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinDisable, setShowPinDisable] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

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

  const handleCopyToClipboard = async () => {
    try {
      const data = createExportData(products, settings);
      await copyExportToClipboard(data);
      setFeedback({ type: 'success', message: t('copiedToClipboard', settings.language) });
    } catch {
      setFeedback({ type: 'error', message: t('importError', settings.language) });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleMergeImportClick = () => {
    mergeFileInputRef.current?.click();
  };

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
        const confirmed = window.confirm(t('importConfirm', settings.language));
        if (!confirmed) return;
        onImport(data);
      } else {
        onMergeImport(data);
      }

      setFeedback({ type: 'success', message: t('importSuccess', settings.language) });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('importError', settings.language);
      setFeedback({ type: 'error', message });
    }
  };

  const statOptions = [
    { key: 'totalProducts' as const, label: t('totalProducts', settings.language) },
    { key: 'totalAmount' as const, label: t('totalAmount', settings.language) },
    { key: 'totalSessions' as const, label: t('totalSessions', settings.language) },
    { key: 'averageRating' as const, label: t('averageRating', settings.language) },
    { key: 'averageTHC' as const, label: t('averageTHC', settings.language) },
    { key: 'totalValue' as const, label: t('totalValue', settings.language) },
    { key: 'lastConsumed' as const, label: t('lastConsumed', settings.language) },
  ];

  const sectionLabel = `flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
  const actionButton = (active: boolean) =>
    `py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
      active
        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
        : isDark
          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
          : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
    }`;

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
          isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
        }`}
        onClick={handleClose}
      >
        <div
          className={`w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border-2 shadow-2xl transition-all duration-200 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-5 border-b shrink-0 ${
            isDark ? 'border-slate-800' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('settings', settings.language)}
            </h2>
            <button
              onClick={handleClose}
              className={`p-2 rounded-xl transition-all ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('personalization')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'personalization'
                  ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Personalization
              {activeTab === 'personalization' && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('dangerZone')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'dangerZone'
                  ? isDark ? 'text-red-400' : 'text-red-600'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t('dangerZone', settings.language)}
              {activeTab === 'dangerZone' && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 overflow-y-auto">
            {activeTab === 'dangerZone' && (
              <>
                {/* Backup & Restore */}
                <div>
                  <label className={sectionLabel}>
                    <Database className="w-4 h-4" />
                    {t('dataBackup', settings.language)}
                  </label>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {t('dataBackupHint', settings.language)}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button onClick={handleExport} className={actionButton(false)}>
                      <Download className="w-4 h-4" />
                      <span className="text-[10px] leading-tight">{t('exportData', settings.language)}</span>
                    </button>
                    <button onClick={handleExportCsv} className={actionButton(false)}>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-[10px] leading-tight">{t('exportCsv', settings.language)}</span>
                    </button>
                    <button onClick={handleCopyToClipboard} className={actionButton(false)}>
                      <Clipboard className="w-4 h-4" />
                      <span className="text-[10px] leading-tight">{t('copyToClipboard', settings.language)}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleImportClick} className={actionButton(false)}>
                      <Upload className="w-4 h-4" />
                      {t('importData', settings.language)}
                    </button>
                    <button onClick={handleMergeImportClick} className={actionButton(false)}>
                      <Merge className="w-4 h-4" />
                      {t('importMerge', settings.language)}
                    </button>
                  </div>

                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {t('importMergeHint', settings.language)}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => handleImportFile(e, false)}
                    className="hidden"
                  />
                  <input
                    ref={mergeFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => handleImportFile(e, true)}
                    className="hidden"
                  />
                  {feedback && (
                    <p className={`mt-3 text-xs font-medium ${
                      feedback.type === 'success'
                        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {feedback.message}
                    </p>
                  )}
                </div>

                {/* PIN Lock */}
                <div>
                  <label className={sectionLabel}>
                    <Lock className="w-4 h-4" />
                    {t('pinLock', settings.language)}
                  </label>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {t('pinLockHint', settings.language)}
                  </p>

                  {!settings.pinEnabled ? (
                    <>
                      {!showPinSetup ? (
                        <button
                          onClick={() => { setShowPinSetup(true); setPinSetupValue(''); setPinError(''); }}
                          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                            isDark
                              ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {t('enablePin', settings.language)}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pinSetupValue}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setPinSetupValue(val);
                              setPinError('');
                            }}
                            placeholder={t('enterPin', settings.language)}
                            className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg tracking-widest font-mono outline-none ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500'
                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                            }`}
                          />
                          {pinError && (
                            <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{pinError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowPinSetup(false); setPinSetupValue(''); setPinError(''); }}
                              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {t('cancel', settings.language)}
                            </button>
                            <button
                              onClick={() => {
                                if (pinSetupValue.length < 4) {
                                  setPinError(t('pinLengthError', settings.language));
                                  return;
                                }
                                updateSettings({ pinEnabled: true, pinHash: btoa(pinSetupValue) });
                                setShowPinSetup(false);
                                setPinSetupValue('');
                              }}
                              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                pinSetupValue.length >= 4
                                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                                  : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {t('save', settings.language)}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {!showPinDisable ? (
                        <button
                          onClick={() => { setShowPinDisable(true); setPinDisableValue(''); setPinError(''); }}
                          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                            isDark
                              ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {t('disablePin', settings.language)}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pinDisableValue}
                            onChange={(e) => {
                              setPinDisableValue(e.target.value.replace(/\D/g, '').slice(0, 6));
                              setPinError('');
                            }}
                            placeholder={t('enterCurrentPin', settings.language)}
                            className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg tracking-widest font-mono outline-none ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500'
                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                            }`}
                          />
                          {pinError && (
                            <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{pinError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowPinDisable(false); setPinDisableValue(''); setPinError(''); }}
                              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {t('cancel', settings.language)}
                            </button>
                            <button
                              onClick={() => {
                                if (btoa(pinDisableValue) !== settings.pinHash) {
                                  setPinError(t('pinMismatch', settings.language));
                                  return;
                                }
                                updateSettings({ pinEnabled: false, pinHash: '' });
                                setShowPinDisable(false);
                                setPinDisableValue('');
                              }}
                              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                pinDisableValue.length >= 4
                                  ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                                  : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {t('disablePin', settings.language)}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {activeTab === 'personalization' && (
              <>
                {/* Language */}
                <div>
                  <label className={sectionLabel}>
                    <Globe className="w-4 h-4" />
                    {t('language', settings.language)}
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-left flex items-center justify-between ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                      } outline-none`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{LANGUAGES.find(l => l.code === settings.language)?.flag}</span>
                        {LANGUAGES.find(l => l.code === settings.language)?.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showLanguageDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border-2 shadow-xl z-10 overflow-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                      }`}>
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              updateSettings({ language: lang.code as typeof settings.language });
                              setShowLanguageDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                              settings.language === lang.code
                                ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                                : isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{lang.flag}</span>
                              {lang.name}
                            </span>
                            {settings.language === lang.code && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className={sectionLabel}>
                    <Palette className="w-4 h-4" />
                    {t('theme', settings.language)}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={actionButton(settings.theme === 'dark')}
                    >
                      {t('dark', settings.language)}
                    </button>
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={actionButton(settings.theme === 'light')}
                    >
                      {t('light', settings.language)}
                    </button>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className={sectionLabel}>
                    <DollarSign className="w-4 h-4" />
                    {t('currency', settings.language)}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['$', '€', '£', '¥', '₿'].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleCurrencyChange(sym)}
                        className={`py-3 rounded-xl text-lg font-bold transition-all border-2 ${
                          settings.currency === sym
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                              : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decimal Precision */}
                <div>
                  <label className={sectionLabel}>
                    <Hash className="w-4 h-4" />
                    {t('decimalPrecision', settings.language)}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((p) => (
                      <button
                        key={p}
                        onClick={() => updateSettings({ decimalPrecision: p })}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                          settings.decimalPrecision === p
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                              : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show Timer Milliseconds */}
                <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                  isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div>
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('showTimerMs', settings.language)}
                    </span>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {t('showTimerMsHint', settings.language)}
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ showTimerMs: !settings.showTimerMs })}
                    className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
                      settings.showTimerMs
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                        : isDark ? 'bg-slate-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                      settings.showTimerMs ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Session Defaults */}
                <div>
                  <label className={sectionLabel}>
                    <RotateCcw className="w-4 h-4" />
                    {t('sessionDefaults', settings.language)}
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <Scale className="w-3 h-3 inline mr-1" />
                          {t('defaultAmount', settings.language)}
                        </label>
                        <input
                          type="number"
                          value={settings.sessionDefaults.defaultAmount}
                          onChange={(e) => updateSettings({
                            sessionDefaults: { ...settings.sessionDefaults, defaultAmount: Math.max(0, parseFloat(e.target.value) || 0) }
                          })}
                          min="0"
                          step="0.1"
                          className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <Users className="w-3 h-3 inline mr-1" />
                          {t('defaultPeople', settings.language)}
                        </label>
                        <input
                          type="number"
                          value={settings.sessionDefaults.defaultPeople}
                          onChange={(e) => updateSettings({
                            sessionDefaults: { ...settings.sessionDefaults, defaultPeople: Math.max(1, parseInt(e.target.value) || 1) }
                          })}
                          min="1"
                          step="1"
                          className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {t('defaultHitTimer', settings.language)}
                        </label>
                        <input
                          type="number"
                          value={settings.sessionDefaults.defaultHitTimer}
                          onChange={(e) => updateSettings({
                            sessionDefaults: { ...settings.sessionDefaults, defaultHitTimer: Math.max(1, parseInt(e.target.value) || 1) }
                          })}
                          min="1"
                          step="1"
                          className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <Scale className="w-3 h-3 inline mr-1" />
                          {t('defaultGramsPerBowl', settings.language)}
                        </label>
                        <input
                          type="number"
                          value={settings.sessionDefaults.defaultGramsPerBowl}
                          onChange={(e) => updateSettings({
                            sessionDefaults: { ...settings.sessionDefaults, defaultGramsPerBowl: Math.max(0.01, parseFloat(e.target.value) || 0.01) }
                          })}
                          min="0.01"
                          step="0.05"
                          className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                      isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {t('rotationEnabled', settings.language)}
                      </span>
                      <button
                        onClick={() => updateSettings({
                          sessionDefaults: { ...settings.sessionDefaults, rotationEnabled: !settings.sessionDefaults.rotationEnabled }
                        })}
                        className={`w-12 h-7 rounded-full transition-colors relative ${
                          settings.sessionDefaults.rotationEnabled
                            ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                            : isDark ? 'bg-slate-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                          settings.sessionDefaults.rotationEnabled ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Visibility */}
                <div>
                  <label className={sectionLabel}>
                    <BarChart3 className="w-4 h-4" />
                    {t('showStats', settings.language)}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statOptions.map((stat) => (
                      <button
                        key={stat.key}
                        onClick={() => handleStatToggle(stat.key)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border-2 text-left ${
                          settings.statsVisibility[stat.key]
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                              : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {stat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
