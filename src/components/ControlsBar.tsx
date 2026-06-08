import { useState } from 'react';
import { SortOption, FilterType } from '../types';
import { t } from '../utils/translations';
import { ArrowUpDown, Filter, Grid, List, Layout } from 'lucide-react';

interface ControlsBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterBy: FilterType;
  onFilterChange: (filter: FilterType) => void;
  layout: 'grid' | 'list' | 'compact';
  onLayoutChange: (layout: 'grid' | 'list' | 'compact') => void;
  sortOptions: { value: string; labelKey: string }[];
  filterOptions: { value: string; labelKey: string; display?: string }[];
  isDark: boolean;
  lang: string;
}

export function ControlsBar({
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  layout,
  onLayoutChange,
  sortOptions,
  filterOptions,
  isDark,
  lang,
}: ControlsBarProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const btnClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      active
        ? isDark
          ? 'bg-herb/15 text-herb'
          : 'bg-emerald-50 text-emerald-600'
        : isDark
          ? 'bg-leather-light text-stone hover:bg-leather-lighter hover:text-parchment'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowFilterDropdown(false);
            }}
            className={btnClass(showSortDropdown)}
          >
            <ArrowUpDown className="w-4 h-4" />
            {t(sortOptions.find(o => o.value === sortBy)?.labelKey || 'sortNewest', lang)}
          </button>
          {showSortDropdown && (
            <div className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl z-10 overflow-hidden ${
              isDark
                ? 'bg-leather border border-leather-lighter'
                : 'bg-white border border-gray-200'
            }`}>
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value as SortOption);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    sortBy === option.value
                      ? isDark ? 'bg-herb/10 text-herb' : 'bg-emerald-50 text-emerald-600'
                      : isDark ? 'hover:bg-leather-light text-parchment' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {t(option.labelKey, lang)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowSortDropdown(false);
            }}
            className={btnClass(showFilterDropdown)}
          >
            <Filter className="w-4 h-4" />
            {(() => {
              const opt = filterOptions.find(o => o.value === filterBy) as any;
              return opt?.display || t(opt?.labelKey || 'filterAll', lang);
            })()}
          </button>
          {showFilterDropdown && (
            <div className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl z-10 overflow-hidden ${
              isDark
                ? 'bg-leather border border-leather-lighter'
                : 'bg-white border border-gray-200'
            }`}>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(option.value as FilterType);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    filterBy === option.value
                      ? isDark ? 'bg-herb/10 text-herb' : 'bg-emerald-50 text-emerald-600'
                      : isDark ? 'hover:bg-leather-light text-parchment' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {(option as any).display || t(option.labelKey, lang)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl">
        {([
          { value: 'grid' as const, icon: Grid, label: 'Grid view' },
          { value: 'list' as const, icon: List, label: 'List view' },
          { value: 'compact' as const, icon: Layout, label: 'Compact view' },
        ]).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => onLayoutChange(value)}
            className={`p-2 rounded-lg transition-all ${
              layout === value
                ? isDark ? 'bg-herb/15 text-herb' : 'bg-emerald-100 text-emerald-600'
                : isDark ? 'text-ash hover:text-parchment' : 'text-gray-400 hover:text-gray-900'
            }`}
            aria-label={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
