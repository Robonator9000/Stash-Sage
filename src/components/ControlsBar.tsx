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
  productsPerPage: number;
  onProductsPerPageChange: (n: number) => void;
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
  productsPerPage,
  onProductsPerPageChange,
}: ControlsBarProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);

  const btnClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      active
        ? isDark
          ? 'bg-cyanx/10 text-cyanx'
          : 'bg-cyan-100 text-cyan-700'
        : isDark
          ? 'bg-midnight text-mist hover:bg-surface hover:text-frost'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                ? 'bg-surface border border-edge'
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
                      ? isDark ? 'bg-cyanx/10 text-cyanx' : 'bg-cyan-50 text-cyan-600'
                      : isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-100 text-gray-900'
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
                ? 'bg-surface border border-edge'
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
                      ? isDark ? 'bg-cyanx/10 text-cyanx' : 'bg-cyan-50 text-cyan-600'
                      : isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {(option as any).display || t(option.labelKey, lang)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Per-page dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowPerPageDropdown(!showPerPageDropdown); setShowSortDropdown(false); setShowFilterDropdown(false); }}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? 'bg-midnight text-mist hover:bg-surface hover:text-frost'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {productsPerPage} {t('perPage', lang)}
          </button>
          {showPerPageDropdown && (
            <div className={`absolute top-full right-0 mt-2 w-32 rounded-xl shadow-xl z-10 overflow-hidden ${
              isDark ? 'bg-surface border border-edge' : 'bg-white border border-gray-200'
            }`}>
              {[20, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => { onProductsPerPageChange(n); setShowPerPageDropdown(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    productsPerPage === n
                      ? isDark ? 'bg-cyanx/10 text-cyanx' : 'bg-cyan-50 text-cyan-600'
                      : isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl">
        {([
          { value: 'grid' as const, icon: Grid, labelKey: 'gridView' },
          { value: 'list' as const, icon: List, labelKey: 'listView' },
          { value: 'compact' as const, icon: Layout, labelKey: 'compactView' },
        ]).map(({ value, icon: Icon, labelKey }) => (
          <button
            key={value}
            onClick={() => onLayoutChange(value)}
            className={`p-2 rounded-lg transition-all ${
              layout === value
                ? isDark ? 'bg-cyanx/10 text-cyanx' : 'bg-cyan-100 text-cyan-600'
                : isDark ? 'text-haze hover:text-frost' : 'text-gray-400 hover:text-gray-700'
            }`}
            aria-label={t(labelKey, lang)}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
