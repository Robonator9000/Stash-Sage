import { useState } from 'react';

interface WelcomeModalProps {
  onComplete: (language: 'en' | 'es' | 'fr' | 'de' | 'pt') => void;
  isDark: boolean;
  browserLang: string;
}

const LANGUAGES: { code: 'en' | 'es' | 'fr' | 'de' | 'pt'; flag: string }[] = [
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}' },
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

const NATIVE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Espa\u00f1ol',
  fr: 'Fran\u00e7ais',
  de: 'Deutsch',
  pt: 'Portugu\u00eas',
};

export function WelcomeModal({ onComplete, isDark, browserLang }: WelcomeModalProps) {
  const [selected, setSelected] = useState<'en' | 'es' | 'fr' | 'de' | 'pt'>('en');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-cyanx/10 via-transparent to-emera/10 pointer-events-none" />
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all ${
          isDark
            ? 'bg-midnight/80 border border-edge'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="url(#welcome-leaf)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="welcome-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <path d="M12 2L10.5 7.5L6 4.5L7.5 10L3 10.5L6.5 13.5L4.5 18L9 15.5L12 21L15 15.5L19.5 18L17.5 13.5L21 10.5L16.5 10L18 4.5L13.5 7.5Z" />
              <path d="M12 21V23" strokeWidth={2} />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent mb-2">
            STASH
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
                <div className="font-semibold">{NATIVE_NAMES[lang.code]}</div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-haze' : 'text-gray-400'}`}>
                  {LANGUAGE_NAMES[browserLang]?.[lang.code] || LANGUAGE_NAMES.en[lang.code]}
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
