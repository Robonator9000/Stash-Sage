import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
}

export function SearchBar({ value, onChange, isDark = true }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
        isDark ? 'text-slate-500' : 'text-gray-400'
      }`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-colors ${
          isDark 
            ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' 
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
        } outline-none`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}