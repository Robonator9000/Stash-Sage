import { useState } from 'react';
import { t } from '../utils/translations';
import { Plus, BarChart3, Search, Settings } from 'lucide-react';

interface CoachMarksProps {
  language: string;
  isDark: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  { icon: Plus, titleKey: 'coachAddTitle', descKey: 'coachAddDesc', position: 'top-right' as const },
  { icon: BarChart3, titleKey: 'coachStatsTitle', descKey: 'coachStatsDesc', position: 'top-center' as const },
  { icon: Search, titleKey: 'coachSearchTitle', descKey: 'coachSearchDesc', position: 'center' as const },
  { icon: Settings, titleKey: 'coachSettingsTitle', descKey: 'coachSettingsDesc', position: 'top-right-2' as const },
];

function getPositionClasses(position: string) {
  switch (position) {
    case 'top-right':
      return 'top-20 right-6';
    case 'top-right-2':
      return 'top-20 right-20';
    case 'top-center':
      return 'top-48 left-1/2 -translate-x-1/2';
    case 'center':
      return 'top-72 left-1/2 -translate-x-1/2';
    default:
      return 'top-1/2 left-1/2';
  }
}

function getArrowStyle(position: string) {
  switch (position) {
    case 'top-right':
      return { top: '-6px', right: '30px', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid' };
    case 'top-right-2':
      return { top: '-6px', right: '24px', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid' };
    case 'top-center':
      return { top: '-6px', left: '50%', marginLeft: '-6px', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid' };
    case 'center':
      return { top: '-6px', left: '50%', marginLeft: '-6px', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid' };
    default:
      return {};
  }
}

export function CoachMarks({ language, isDark, onComplete, onSkip }: CoachMarksProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* Coach mark card */}
      <div
        className={`pointer-events-auto absolute ${getPositionClasses(current.position)} w-72 p-4 rounded-xl shadow-2xl border-2 transition-all ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Arrow */}
        <div
          className="absolute w-0 h-0"
          style={{
            ...getArrowStyle(current.position),
            borderBottomColor: isDark ? '#334155' : '#e5e7eb',
          }}
        />
        <div
          className="absolute w-0 h-0"
          style={{
            ...getArrowStyle(current.position),
            top: '-5px',
            borderBottomColor: isDark ? '#0f172a' : '#ffffff',
          }}
        />

        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-cyanx/10' : 'bg-cyan-50'
          }`}>
            <Icon className={`w-5 h-5 ${isDark ? 'text-cyanx' : 'text-cyan-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t(current.titleKey, language)}
            </p>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {t(current.descKey, language)}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {STEPS.map((_, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === step ? 'bg-cyanx w-4' : isDark ? 'bg-slate-700' : 'bg-gray-300'
            }`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {t('skip', language)}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDark
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
            }`}
          >
            {isLast ? t('done', language) : t('next', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
