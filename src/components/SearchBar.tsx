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
          ? 'text-ash group-focus-within:text-herb'
          : 'text-gray-400 group-focus-within:text-emerald-600'
      }`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('searchPlaceholder', language)}
        className={`w-full pl-12 pr-10 py-3 rounded-xl transition-all outline-none ${
          isDark
            ? 'bg-leather border border-leather-lighter text-parchment placeholder-ash focus:border-herb/50 focus:shadow-[0_0_0_3px_rgba(45,138,78,0.1)]'
            : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-400/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-leather-lighter text-ash' : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
