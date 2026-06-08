import { useState } from 'react';

interface WelcomeModalProps {
  onComplete: (language: 'en' | 'es' | 'fr' | 'de' | 'pt') => void;
  isDark: boolean;
}

const LANGUAGES: { code: 'en' | 'es' | 'fr' | 'de' | 'pt'; name: string; flag: string; native: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', native: 'Deutsch' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', native: 'Português' },
];

export function WelcomeModal({ onComplete, isDark }: WelcomeModalProps) {
  const [selected, setSelected] = useState<'en' | 'es' | 'fr' | 'de' | 'pt'>('en');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-cyanx/10 via-transparent to-emera/10 pointer-events-none" />
      <div
        className={`relative w-full max-w-lg rounded-3xl p-8 shadow-2xl transition-all ${
          isDark
            ? 'bg-midnight border border-edge'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-frost' : 'text-gray-900'}`}>
            Stash Tracker
          </h1>
          <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            Choose your language to get started
          </p>
        </div>

        <div className="grid gap-3 mb-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all border-2 ${
                selected === lang.code
                  ? isDark
                    ? 'bg-cyanx/10 border-cyanx text-cyanx'
                    : 'bg-cyan-50 border-cyan-500 text-cyan-700'
                  : isDark
                    ? 'bg-surface border-transparent text-frost hover:bg-surface-light hover:border-edge'
                    : 'bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="text-left">
                <div className="font-semibold">{lang.native}</div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-haze' : 'text-gray-400'}`}>
                  {lang.name}
                </div>
              </div>
              {selected === lang.code && (
                <div className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-cyanx text-white' : 'bg-cyan-500 text-white'
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => onComplete(selected)}
          className="w-full py-3.5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] bg-gradient-to-r from-cyanx to-emera text-white hover:from-cyanx-dark hover:to-emera-dark"
        >
          Get Started
        </button>

        <p className={`text-center text-xs mt-4 ${isDark ? 'text-haze' : 'text-gray-400'}`}>
          You can change language anytime in Settings
        </p>
      </div>
    </div>
  );
}
