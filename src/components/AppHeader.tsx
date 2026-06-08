import { SearchBar } from './SearchBar';
import { ControlsBar } from './ControlsBar';
import { SortOption, FilterType } from '../types';
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
}: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl ${
      isDark ? 'bg-ink/80' : 'bg-white/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`font-heading text-2xl font-bold tracking-tight ${
              isDark ? 'text-parchment' : 'text-gray-900'
            }`}>
              🌿 Stash Tracker
            </h1>
            <p className={`text-sm font-body ${
              isDark ? 'text-stone' : 'text-gray-500'
            }`}>
              Manage your consumption
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-xl transition-all ${
                isDark
                  ? 'bg-leather-light text-stone hover:bg-leather-lighter hover:text-parchment'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onAddProduct}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-herb text-parchment hover:bg-herb-dark active:scale-[0.97]"
              aria-label="Add Product"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Add Product</span>
            </button>
          </div>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          isDark={isDark}
          language={lang}
        />

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
        />
      </div>
      <div className={`h-px ${
        isDark
          ? 'bg-gradient-to-r from-transparent via-herb/40 to-transparent'
          : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
      }`} />
    </header>
  );
}
