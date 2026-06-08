import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Session, SortOption, FilterType } from './types';
import { useProducts } from './utils/useProducts';
import { useSessions } from './utils/useSessions';
import { useSettings } from './utils/useSettings';
import { useDebounce } from './hooks/useDebounce';
import { ImportResult } from './utils/dataTransfer';
import { searchProducts, sortProducts, filterProducts, generateId } from './utils/helpers';
import { AppHeader } from './components/AppHeader';
import { ProductGrid } from './components/ProductGrid';
import { ProductModal } from './components/ProductModal';
import { ConsumeModal } from './components/ConsumeModal';
import { SellModal } from './components/SellModal';
import { SessionModal } from './components/SessionModal';
import { SettingsModal } from './components/SettingsModal';
import { PinModal } from './components/PinModal';
import { BackgroundCanvas } from './components/BackgroundCanvas';

export default function App() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, consumeProduct, replaceAllProducts } = useProducts();
  const { addSession } = useSessions();
  const { settings, replaceSettings } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [layout, setLayout] = useState<'grid' | 'list' | 'compact'>('grid');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [consumingProduct, setConsumingProduct] = useState<Product | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sessionProduct, setSessionProduct] = useState<Product | null>(null);
  const [sessionAmount, setSessionAmount] = useState(0);
  const [sessionPeople, setSessionPeople] = useState(2);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);

  const isDark = settings.theme === 'dark';

  // Pin lock
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  useEffect(() => {
    if (settings.pinEnabled && settings.pinHash && !pinUnlocked) {
      setShowPinModal(true);
    } else if (!settings.pinEnabled) {
      setPinUnlocked(true);
    }
  }, [settings.pinEnabled, settings.pinHash]);

  // Dynamic lang attribute + dark class + theme-color
  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.language;
    root.classList.toggle('dark', isDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0b1120' : '#f0f4f8');
  }, [settings.language, isDark]);

  // Filter, search, and sort products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (debouncedQuery) {
      result = searchProducts(result, debouncedQuery);
    }

    if (filterBy !== 'all') {
      result = filterProducts(result, filterBy);
    }

    result = sortProducts(result, sortBy);

    return result;
  }, [products, debouncedQuery, filterBy, sortBy]);

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(product);
    } else {
      addProduct(product);
    }
    setEditingProduct(null);
  };

  const handleSell = useCallback((amount: number) => {
    if (sellingProduct) {
      consumeProduct(sellingProduct.id, amount);
      setSellingProduct(null);
    }
  }, [sellingProduct, consumeProduct]);

  const handleConsume = (amount: number, startSession: boolean, people: number, consumedAt?: Date) => {
    if (consumingProduct) {
      consumeProduct(consumingProduct.id, amount, consumedAt);
      setConsumingProduct(null);
      if (startSession) {
        setSessionProduct(consumingProduct);
        setSessionAmount(amount);
        setSessionPeople(people);
      } else {
        setShowSmoke(true);
        setTimeout(() => setShowSmoke(false), 1200);
      }
    }
  };

  const handleFinishSession = (_productId: string, _amountUsed: number, session: Session) => {
    addSession(session);
    setSessionProduct(null);
    setSessionAmount(0);
    setSessionPeople(2);
    setShowSmoke(true);
    setTimeout(() => setShowSmoke(false), 1200);
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
    { value: 'favorites', labelKey: 'sortFavorites' },
  ];

  const customTypes = [...new Set(products.map(p => p.type).filter(t => !['indica', 'sativa', 'hybrid'].includes(t)))];
  const filterOptions = [
    { value: 'all', labelKey: 'filterAll' },
    { value: 'indica', labelKey: 'filterIndica' },
    { value: 'sativa', labelKey: 'filterSativa' },
    { value: 'hybrid', labelKey: 'filterHybrid' },
    ...customTypes.map(t => ({ value: t, labelKey: t, display: t.charAt(0).toUpperCase() + t.slice(1) })),
    { value: 'favorites', labelKey: 'filterFavorites' },
    { value: 'inStock', labelKey: 'filterInStock' },
    { value: 'lowStock', labelKey: 'filterLowStock' },
    { value: 'outOfStock', labelKey: 'filterOutOfStock' },
  ];

  const lang = settings.language;

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        backgroundColor: 'var(--bg)',
        backgroundImage: `url(${isDark ? '/bg-dark.gif' : '/bg-light.gif'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'overlay',
      }}
    >
      <BackgroundCanvas isDark={isDark} />
      <AppHeader
        isDark={isDark}
        lang={lang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddProduct={() => setIsAddModalOpen(true)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        layout={layout}
        onLayoutChange={setLayout}
        sortOptions={sortOptions}
        filterOptions={filterOptions}
      />

      <ProductGrid
        products={products}
        filteredProducts={filteredProducts}
        isDark={isDark}
        layout={layout}
        precision={settings.decimalPrecision}
        onEditProduct={setEditingProduct}
        onConsumeProduct={setConsumingProduct}
        onSellProduct={setSellingProduct}
        onToggleFavorite={toggleFavorite}
        onAddProduct={() => setIsAddModalOpen(true)}
      />

      {/* Pin Lock */}
      {showPinModal && (
        <PinModal
          pinHash={settings.pinHash}
          onSuccess={() => { setPinUnlocked(true); setShowPinModal(false); }}
          isDark={isDark}
          language={lang}
        />
      )}

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

      {sellingProduct && (
        <SellModal
          product={sellingProduct}
          onSell={handleSell}
          onClose={() => setSellingProduct(null)}
          isDark={isDark}
        />
      )}

      {sessionProduct && (
        <SessionModal
          product={sessionProduct}
          initialAmount={sessionAmount}
          people={sessionPeople}
          onFinish={handleFinishSession}
          onClose={() => {
            setSessionProduct(null);
            setSessionAmount(0);
            setSessionPeople(2);
          }}
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

      {/* Smoke Animation */}
      {showSmoke && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <span className="animate-smoke-puff text-7xl">💨</span>
          <span className="animate-smoke-puff-2 text-6xl ml-4">💨</span>
          <span className="animate-smoke-puff text-5xl ml-2" style={{ animationDelay: '0.2s' }}>💨</span>
        </div>
      )}
    </div>
  );
}
