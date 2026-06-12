import { Search, X } from 'lucide-react';
import { t } from '../utils/translations';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
  language?: string;
}

export function SearchBar({ value, onChange, isDark = true, language = 'en' }: SearchBarProps) {
  return (
    <div className="relative group">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
        isDark
          ? 'text-haze group-focus-within:text-cyanx'
          : 'text-gray-400 group-focus-within:text-cyan-600'
      }`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('searchPlaceholder', language)}
        className={`w-full pl-12 pr-10 py-3 rounded-xl transition-all outline-none ${
          isDark
            ? 'bg-midnight border border-edge text-frost placeholder-haze focus:border-cyanx/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.1)]'
            : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.1)]'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-surface text-haze' : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
