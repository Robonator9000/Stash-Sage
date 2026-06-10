import { useState } from 'react';

interface WelcomeModalProps {
  onComplete: (language: 'en' | 'es' | 'fr' | 'de' | 'pt') => void;
  isDark: boolean;
  browserLang: string;
}

const LANGUAGES: { code: 'en' | 'es' | 'fr' | 'de' | 'pt'; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'pt', flag: '🇧🇷' },
];

const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese' },
  es: { en: 'Inglés', es: 'Español', fr: 'Francés', de: 'Alemán', pt: 'Portugués' },
  fr: { en: 'Anglais', es: 'Espagnol', fr: 'Français', de: 'Allemand', pt: 'Portuguais' },
  de: { en: 'Englisch', es: 'Spanisch', fr: 'Französisch', de: 'Deutsch', pt: 'Portugiesisch' },
  pt: { en: 'Inglês', es: 'Espanhol', fr: 'Francês', de: 'Alemão', pt: 'Português' },
};

const NATIVE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

const TOUR_STEPS = [
  {
    icon: '📦',
    title: 'Manage Your Stash',
    description: 'Add products with photos, strains, THC/CBD levels, and pricing. View as grid, list, or compact cards. Search, sort, and filter to find what you need.',
  },
  {
    icon: '📊',
    title: 'Dashboard Insights',
    description: 'Track totals, averages, and consumption patterns. Monthly bar charts, spending breakdowns, and a calendar heat map show your usage at a glance.',
  },
  {
    icon: '📝',
    title: 'Session Journal',
    description: 'Log smoking sessions with amounts, people, hits, and notes. Review your history with filters by type and date range.',
  },
  {
    icon: '⚙️',
    title: 'Customize Everything',
    description: 'Dark/light theme, currency, decimal precision, visible stats, backup/restore, PDF reports, and PIN lock. Make the app yours.',
  },
];

export function WelcomeModal({ onComplete, isDark, browserLang }: WelcomeModalProps) {
  const [selected, setSelected] = useState<'en' | 'es' | 'fr' | 'de' | 'pt'>('en');
  const [step, setStep] = useState<'language' | number>('language');

  if (step === 'language') {
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
            <div className="text-4xl mb-3">🍃</div>
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
            onClick={() => setStep(0)}
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

  const currentStep = step as number;
  const tour = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-cyanx/10 via-transparent to-emera/10 pointer-events-none" />
      <div
        className={`relative w-full max-w-lg rounded-2xl p-8 shadow-2xl transition-all ${
          isDark
            ? 'bg-midnight/80 border border-edge'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{tour.icon}</div>
          <h2 className={`text-2xl font-extrabold mb-3 ${isDark ? 'text-frost' : 'text-gray-900'}`}>
            {tour.title}
          </h2>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {tour.description}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {TOUR_STEPS.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${
              idx === currentStep
                ? 'bg-cyanx w-6'
                : isDark ? 'bg-slate-700' : 'bg-gray-300'
            }`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentStep === 0) {
                setStep('language');
              } else {
                setStep(currentStep - 1);
              }
            }}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Back
          </button>
          <div className="flex-1" />
          <button
            onClick={() => {
              if (isLast) {
                onComplete(selected);
              } else {
                setStep(currentStep + 1);
              }
            }}
            className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] bg-gradient-to-r from-cyanx to-emera text-white hover:from-cyanx-dark hover:to-emera-dark"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
