import { useState, useEffect } from 'react';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { X, Globe, Palette, BarChart3, ChevronDown, Check } from 'lucide-react';
import { Toast } from './Toast';

interface SettingsModalProps {
  onClose: () => void;
  onStatsChange?: () => void;
  isDark?: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export function SettingsModal({ onClose, onStatsChange, isDark = true }: SettingsModalProps) {
  const { settings, updateSettings, toggleStatVisibility } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleStatToggle = (key: 'totalProducts' | 'totalAmount' | 'totalSessions' | 'averageRating' | 'averageTHC' | 'totalValue') => {
    toggleStatVisibility(key);
    setShowRefreshToast(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const statOptions = [
    { key: 'totalProducts' as const, label: t('totalProducts', settings.language) },
    { key: 'totalAmount' as const, label: t('totalAmount', settings.language) },
    { key: 'totalSessions' as const, label: t('totalSessions', settings.language) },
    { key: 'averageRating' as const, label: t('averageRating', settings.language) },
    { key: 'averageTHC' as const, label: t('averageTHC', settings.language) },
    { key: 'totalValue' as const, label: t('totalValue', settings.language) },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
          isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
        }`}
        onClick={handleClose}
      >
        <div 
          className={`w-full max-w-md rounded-2xl border-2 shadow-2xl transition-all duration-200 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-5 border-b ${
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

          {/* Content */}
          <div className="p-5 space-y-6">
            {/* Language */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
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
                          updateSettings({ language: lang.code as any });
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
              <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                <Palette className="w-4 h-4" />
                {t('theme', settings.language)}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                    settings.theme === 'dark'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('dark', settings.language)}
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                    settings.theme === 'light'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('light', settings.language)}
                </button>
              </div>
            </div>

            {/* Stats Visibility */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                <BarChart3 className="w-4 h-4" />
                {t('showStats', settings.language)}
              </label>
              <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Changes require page refresh to take effect
              </p>
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
          </div>
        </div>
      </div>

      {/* Refresh Toast */}
      {showRefreshToast && (
        <Toast
          message="Stats visibility changed"
          onClose={() => setShowRefreshToast(false)}
          onRefresh={handleRefresh}
          isDark={isDark}
        />
      )}
    </>
  );
}