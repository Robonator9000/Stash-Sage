import { useState, useMemo, useCallback } from 'react';
import { Product } from './types';
import { useProducts } from './utils/useProducts';
import { useSettings } from './utils/useSettings';
import { ImportResult } from './utils/dataTransfer';
import { searchProducts, sortProducts, filterProducts, generateId } from './utils/helpers';
import { t } from './utils/translations';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { ConsumeModal } from './components/ConsumeModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsCard } from './components/StatsCard';
import { SearchBar } from './components/SearchBar';
import { EmptyState } from './components/EmptyState';
import { Plus, Settings, Grid, List, Layout, ArrowUpDown, Filter } from 'lucide-react';

export default function App() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, consumeProduct, replaceAllProducts } = useProducts();
  const { settings, replaceSettings } = useSettings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'rating' | 'thc' | 'amount' | 'price'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'indica' | 'sativa' | 'hybrid' | 'favorites' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [layout, setLayout] = useState<'grid' | 'list' | 'compact'>('grid');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [consumingProduct, setConsumingProduct] = useState<Product | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const isDark = settings.theme === 'dark';

  // Filter, search, and sort products
  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (searchQuery) {
      result = searchProducts(result, searchQuery);
    }
    
    if (filterBy !== 'all') {
      result = filterProducts(result, filterBy);
    }
    
    result = sortProducts(result, sortBy);
    
    return result;
  }, [products, searchQuery, filterBy, sortBy]);

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(product);
    } else {
      addProduct(product);
    }
    setEditingProduct(null);
  };

  const handleConsume = (amount: number) => {
    if (consumingProduct) {
      consumeProduct(consumingProduct.id, amount);
      setConsumingProduct(null);
    }
  };

  const handleImport = useCallback((data: ImportResult) => {
    replaceAllProducts(data.products);
    if (data.settings) {
      replaceSettings(data.settings);
    }
  }, [replaceAllProducts, replaceSettings]);

  const handleMergeImport = useCallback((data: ImportResult) => {
    for (const product of data.products) {
      addProduct({
        ...product,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [addProduct]);

  const sortOptions = [
    { value: 'newest', labelKey: 'sortNewest' },
    { value: 'oldest', labelKey: 'sortOldest' },
    { value: 'name', labelKey: 'sortName' },
    { value: 'rating', labelKey: 'sortRating' },
    { value: 'thc', labelKey: 'sortThc' },
    { value: 'amount', labelKey: 'sortAmount' },
    { value: 'price', labelKey: 'sortPrice' },
  ];

  const filterOptions = [
    { value: 'all', labelKey: 'filterAll' },
    { value: 'indica', labelKey: 'filterIndica' },
    { value: 'sativa', labelKey: 'filterSativa' },
    { value: 'hybrid', labelKey: 'filterHybrid' },
    { value: 'favorites', labelKey: 'filterFavorites' },
    { value: 'inStock', labelKey: 'filterInStock' },
    { value: 'lowStock', labelKey: 'filterLowStock' },
    { value: 'outOfStock', labelKey: 'filterOutOfStock' },
  ];

  const lang = settings.language;

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b-2 backdrop-blur-xl ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🌿 Stash Tracker
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Manage your consumption
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-xl transition-all ${
                  isDark 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            isDark={isDark}
            language={lang}
          />

          {/* Controls Row */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            {/* Sort & Filter */}
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowFilterDropdown(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {t(sortOptions.find(o => o.value === sortBy)?.labelKey || 'sortNewest', lang)}
                </button>
                {showSortDropdown && (
                  <div className={`absolute top-full left-0 mt-2 w-48 rounded-xl border-2 shadow-xl z-10 overflow-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value as any);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          sortBy === option.value
                            ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                            : isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        {t(option.labelKey, lang)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowSortDropdown(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {t(filterOptions.find(o => o.value === filterBy)?.labelKey || 'filterAll', lang)}
                </button>
                {showFilterDropdown && (
                  <div className={`absolute top-full left-0 mt-2 w-48 rounded-xl border-2 shadow-xl z-10 overflow-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterBy(option.value as any);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          filterBy === option.value
                            ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                            : isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        {t(option.labelKey, lang)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl">
              <button
                onClick={() => setLayout('grid')}
                className={`p-2 rounded-lg transition-all ${
                  layout === 'grid'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-2 rounded-lg transition-all ${
                  layout === 'list'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout('compact')}
                className={`p-2 rounded-lg transition-all ${
                  layout === 'compact'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <Layout className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        {products.length > 0 && (
          <div className="mb-6">
            <StatsCard products={products} isDark={isDark} />
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <EmptyState 
            isDark={isDark} 
            hasProducts={products.length > 0}
            onAddProduct={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className={
            layout === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : layout === 'list'
                ? 'flex flex-col gap-3'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setEditingProduct(product)}
                onConsume={() => setConsumingProduct(product)}
                onToggleFavorite={() => toggleFavorite(product.id)}
                isDark={isDark}
                layout={layout}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {(isAddModalOpen || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onDelete={editingProduct ? deleteProduct : undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
          isDark={isDark}
        />
      )}

      {consumingProduct && (
        <ConsumeModal
          product={consumingProduct}
          onConsume={handleConsume}
          onClose={() => setConsumingProduct(null)}
          isDark={isDark}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          products={products}
          onImport={handleImport}
          onMergeImport={handleMergeImport}
          onClose={() => setIsSettingsOpen(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
