import { Lock } from 'lucide-react';
import { t } from '../utils/translations';

interface FeatureGateProps {
  isDark: boolean;
  lang: string;
  titleKey: string;
  descKey: string;
}

/**
 * Placeholder panel shown to signed-out users for features that require an
 * account (community, marketplace). Previously duplicated inline in App.tsx.
 */
export function FeatureGate({ isDark, lang, titleKey, descKey }: FeatureGateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl ${
        isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isDark ? 'bg-slate-700/60' : 'bg-gray-200'
        }`}
      >
        <Lock className={`w-7 h-7 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
      </div>
      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t(titleKey, lang)}
      </h3>
      <p className={`text-sm max-w-xs ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
        {t(descKey, lang)}
      </p>
    </div>
  );
}