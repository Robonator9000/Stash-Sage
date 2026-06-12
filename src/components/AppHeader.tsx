import { SearchBar } from './SearchBar';
import { ControlsBar } from './ControlsBar';
import { SortOption, FilterType } from '../types';
import { t } from '../utils/translations';
import { Plus, Settings } from 'lucide-react';

interface AppHeaderProps {
  isDark: boolean;
  lang: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onAddProduct: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterBy: FilterType;
  onFilterChange: (filter: FilterType) => void;
  layout: 'grid' | 'list' | 'compact';
  onLayoutChange: (layout: 'grid' | 'list' | 'compact') => void;
  sortOptions: { value: string; labelKey: string }[];
  filterOptions: { value: string; labelKey: string; display?: string }[];
  productsPerPage: number;
  onProductsPerPageChange: (n: number) => void;
}

export function AppHeader({
  isDark,
  lang,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onAddProduct,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  layout,
  onLayoutChange,
  sortOptions,
  filterOptions,
  productsPerPage,
  onProductsPerPageChange,
}: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl ${
      isDark ? 'bg-deep/80' : 'bg-slate-100/85'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${
              isDark ? 'text-frost' : 'text-gray-900'
            }`}>
              🌿 Stash Tracker
            </h1>
            <p className={`text-sm ${
              isDark ? 'text-mist' : 'text-gray-500'
            }`}>
              {t('manageConsumption', lang)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-xl transition-all ${
                isDark
                  ? 'bg-surface text-mist hover:bg-surface-light hover:text-frost'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label={t('settings', lang)}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onAddProduct}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-gradient-to-r from-cyanx to-emera text-white hover:from-cyanx-dark hover:to-emera-dark active:scale-[0.97]"
              aria-label={t('addProduct', lang)}
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">{t('addProduct', lang)}</span>
            </button>
          </div>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          isDark={isDark}
          language={lang}
        />

        <div className="mt-2" />

        <ControlsBar
          sortBy={sortBy}
          onSortChange={onSortChange}
          filterBy={filterBy}
          onFilterChange={onFilterChange}
          layout={layout}
          onLayoutChange={onLayoutChange}
          sortOptions={sortOptions}
          filterOptions={filterOptions}
          isDark={isDark}
          lang={lang}
          productsPerPage={productsPerPage}
          onProductsPerPageChange={onProductsPerPageChange}
        />
      </div>
      <div className={`h-px ${
        isDark
          ? 'bg-gradient-to-r from-transparent via-cyanx/30 via-emera/30 to-transparent'
          : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
      }`} />
    </header>
  );
}
