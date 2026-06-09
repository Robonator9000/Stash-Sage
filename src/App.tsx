import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Session, SortOption, FilterType } from './types';
import { useProducts } from './utils/useProducts';
import { useSessions } from './utils/useSessions';
import { useSettings } from './utils/useSettings';
import { useDebounce } from './hooks/useDebounce';
import { useActivity } from './utils/useActivity';
import { ImportResult } from './utils/dataTransfer';
import { searchProducts, sortProducts, filterProducts, generateId, formatPrecision } from './utils/helpers';
import { t } from './utils/translations';
import { ToastContainer, showToast } from './components/Toast';
import { ProductGrid } from './components/ProductGrid';
import { StatsCard } from './components/StatsCard';
import { ProductModal } from './components/ProductModal';
import { ConsumeModal } from './components/ConsumeModal';
import { SellModal } from './components/SellModal';
import { SessionModal } from './components/SessionModal';
import { SettingsSheet } from './components/SettingsSheet';
import { PinModal } from './components/PinModal';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { WelcomeModal } from './components/WelcomeModal';
import { CalendarHeatmap } from './components/CalendarHeatmap';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DASHBOARD_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function formatCurrency(value: number, currency: string): string {
  if (currency === 'EUR') return `€${value.toFixed(2)}`;
  if (currency === 'GBP') return `£${value.toFixed(2)}`;
  if (currency === 'JPY') return `¥${value.toFixed(0)}`;
  if (currency === 'CAD') return `C$${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
}

function formatActivityDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function App() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, consumeProduct, replaceAllProducts } = useProducts();
  const { sessions, addSession } = useSessions();
  const { settings, updateSettings, replaceSettings } = useSettings();
  const { entries: activityEntries, addEntry: addActivityEntry, clearEntries: clearActivity } = useActivity();

  const [activeTab, setActiveTab] = useState<'inventory' | 'dashboard' | 'history'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [layout, setLayout] = useState<'grid' | 'list' | 'compact'>('grid');
  const [productsPerPage, setProductsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [consumingProduct, setConsumingProduct] = useState<Product | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sessionProduct, setSessionProduct] = useState<Product | null>(null);
  const [sessionAmount, setSessionAmount] = useState(0);
  const [sessionPeople, setSessionPeople] = useState(2);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);

  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('all');

  const isDark = settings.theme === 'dark';

  const browserLang = useMemo(() => {
    const raw = navigator.language || 'en';
    const code = raw.split('-')[0];
    return (['en', 'es', 'fr', 'de', 'pt'] as const).includes(code as any) ? code as 'en' | 'es' | 'fr' | 'de' | 'pt' : 'en';
  }, []);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  useEffect(() => {
    if (settings.pinEnabled && settings.pinHash && !pinUnlocked) {
      setShowPinModal(true);
    } else if (!settings.pinEnabled) {
      setPinUnlocked(true);
    }
  }, [settings.pinEnabled, settings.pinHash]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.language;
    root.classList.toggle('dark', isDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0b1120' : '#f0f4f8');
  }, [settings.language, isDark]);

  useEffect(() => {
    if (!settings.themeAuto) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => {
      updateSettings({ theme: e.matches ? 'light' : 'dark' });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.themeAuto, updateSettings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, filterBy, sortBy, productsPerPage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[type="text"]');
        input?.focus();
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (debouncedQuery) result = searchProducts(result, debouncedQuery);
    if (filterBy !== 'all') result = filterProducts(result, filterBy);
    return sortProducts(result, sortBy);
  }, [products, debouncedQuery, filterBy, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, safePage, productsPerPage]);

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(product);
      addActivityEntry({
        id: generateId(), type: 'edit', productId: product.id, productName: product.name, timestamp: new Date(),
      });
    } else {
      addProduct(product);
      addActivityEntry({
        id: generateId(), type: 'add', productId: product.id, productName: product.name, timestamp: new Date(),
      });
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    deleteProduct(id);
    addActivityEntry({
      id: generateId(), type: 'delete', productId: id, productName: p.name, timestamp: new Date(),
    });
    const lng = settings.language;
    showToast({
      id: 'undo-delete-' + id,
      title: t('productDeleted', lng),
      body: p.name,
      action: {
        label: t('undo', lng),
        onClick: () => {
          addProduct(p);
        },
      },
      variant: 'info',
    });
  };

  const checkLowStock = useCallback((product: Product, deducted: number) => {
    const newAmount = Math.max(0, product.amount - deducted);
    const lng = settings.language;
    if (settings.lowStockThreshold > 0 && newAmount > 0 && newAmount <= settings.lowStockThreshold) {
      showToast({
        id: 'low-stock-' + product.id,
        title: t('lowStockAlert', lng),
        body: t('lowStockMessage', lng).replace('{name}', product.name).replace('{amount}', formatPrecision(newAmount, settings.decimalPrecision)),
      });
    }
  }, [settings.lowStockThreshold, settings.decimalPrecision, settings.language]);

  const [showDollar, setShowDollar] = useState(false);

  const handleSell = useCallback((amount: number) => {
    if (sellingProduct) {
      checkLowStock(sellingProduct, amount);
      consumeProduct(sellingProduct.id, amount);
      addActivityEntry({
        id: generateId(), type: 'sell', productId: sellingProduct.id, productName: sellingProduct.name, amount, timestamp: new Date(),
      });
      setSellingProduct(null);
      setShowDollar(true);
      setTimeout(() => setShowDollar(false), 1600);
    }
  }, [sellingProduct, consumeProduct, checkLowStock, addActivityEntry]);

  const handleConsume = (amount: number, startSession: boolean, people: number, consumedAt?: Date) => {
    if (consumingProduct) {
      checkLowStock(consumingProduct, amount);
      consumeProduct(consumingProduct.id, amount, consumedAt);
      addActivityEntry({
        id: generateId(), type: 'consume', productId: consumingProduct.id, productName: consumingProduct.name, amount, timestamp: consumedAt || new Date(),
      });
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
    addActivityEntry({
      id: generateId(), type: 'session', productId: session.productId, productName: session.productName, amount: session.amount, notes: session.notes, timestamp: new Date(),
    });
    setSessionProduct(null);
    setSessionAmount(0);
    setSessionPeople(2);
    setShowSmoke(true);
    setTimeout(() => setShowSmoke(false), 1200);
  };

  const handleImport = useCallback((data: ImportResult) => {
    replaceAllProducts(data.products);
    if (data.settings) replaceSettings(data.settings);
  }, [replaceAllProducts, replaceSettings]);

  const handleMergeImport = useCallback((data: ImportResult) => {
    for (const product of data.products) {
      addProduct({ ...product, id: generateId(), createdAt: new Date(), updatedAt: new Date() });
    }
  }, [addProduct]);

  // Search preview
  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const previewProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchProducts(products, searchQuery).slice(0, 5);
  }, [products, searchQuery]);

  // Dashboard data
  const lang = settings.language;

  const totalValue = useMemo(() => products.reduce((s, p) => s + (p.price || 0) * p.amount, 0), [products]);

  const typeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.type, (map.get(p.type) || 0) + p.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  const spendingByType = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.type, (map.get(p.type) || 0) + (p.price || 0) * p.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  const brandList = useMemo(() => {
    return [...new Set(products.map(p => p.brand).filter((b): b is string => !!b))].sort();
  }, [products]);

  const topStrains = useMemo(() => {
    return [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  }, [products]);

  const consumptionByMonth = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + s.amount);
    });
    const entries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    const labels: Record<string, string> = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
      '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
    };
    return entries.map(([key, amount]) => {
      const [, m] = key.split('-');
      return { month: labels[m] || m, amount };
    });
  }, [sessions]);

  // History filtering
  const filteredHistory = useMemo(() => {
    let result = activityEntries;
    if (historyFilterType !== 'all') {
      result = result.filter(e => e.type === historyFilterType);
    }
    if (historyDateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (historyDateFilter === '7d') cutoff.setDate(now.getDate() - 7);
      else if (historyDateFilter === '30d') cutoff.setDate(now.getDate() - 30);
      else if (historyDateFilter === '90d') cutoff.setDate(now.getDate() - 90);
      result = result.filter(e => e.timestamp >= cutoff);
    }
    return result;
  }, [activityEntries, historyFilterType, historyDateFilter]);

  const [isSelectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => handleDeleteProduct(id));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkSession = () => {
    const selected = products.filter(p => selectedIds.has(p.id));
    if (selected.length === 1) {
      setSessionProduct(selected[0]);
      setSessionAmount(Math.min(selected[0].amount, 0.5));
      setSessionPeople(2);
    }
    setSelectedIds(new Set());
    setSelectMode(false);
  };

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
    ...brandList.map(b => ({ value: `brand:${b}`, labelKey: b, display: b })),
  ];

  if (!settings.onboardingDone) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <BackgroundCanvas isDark={isDark} />
        <WelcomeModal
          onComplete={(language) => updateSettings({ language, onboardingDone: true })}
          isDark={isDark}
          browserLang={browserLang}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <BackgroundCanvas isDark={isDark} />

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${isDark ? 'bg-[#0b1120]/80 border-border' : 'bg-[#e2e8f0]/80 border-gray-200'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          {/* Logo */}
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-2xl font-extrabold bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent hover:opacity-80 transition-opacity shrink-0"
          >
            🍃 STASH
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-2xl">
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-muted' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchPreview(true); }}
                onFocus={() => setShowSearchPreview(true)}
                onBlur={() => setTimeout(() => setShowSearchPreview(false), 200)}
                placeholder={t('searchPlaceholder', lang)}
                className={`w-full pl-10 pr-4 py-1.5 rounded-xl text-sm border transition-all outline-none
                  ${isDark
                    ? 'bg-midnight/80 border border-edge text-white placeholder-muted focus:border-cyan-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400'}`}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchPreview(false); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  &times;
                </button>
              )}
            </div>
            {/* Search preview dropdown */}
            {showSearchPreview && searchQuery.trim() && previewProducts.length > 0 && (
              <div className={`absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl border overflow-hidden z-50
                ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                {previewProducts.map(p => (
                  <button
                    key={p.id}
                    onMouseDown={() => { setSearchQuery(p.name); setShowSearchPreview(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                      ${isDark ? 'hover:bg-midnight text-white' : 'hover:bg-gray-50 text-gray-900'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="flex-1 text-left">
                      <span className="font-medium">{p.name}</span>
                      {p.strain && <span className={`ml-2 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{p.strain}</span>}
                    </div>
                    <span className={isDark ? 'text-muted' : 'text-gray-400'}>{formatPrecision(p.amount, settings.decimalPrecision)}g</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('addProduct', lang)}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark', themeAuto: false })}
              className={`p-2 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs + Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Tab bar */}
        <div className="flex items-center mb-4">
          <div className={`flex w-full items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-surface' : 'bg-gray-100'}`}>
            {[
              { id: 'inventory', label: t('inventory', lang), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'dashboard', label: t('dashboard', lang), icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
              { id: 'history', label: t('history', lang), icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'inventory' | 'dashboard' | 'history')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyanx to-emera text-white'
                    : isDark ? 'text-mist hover:text-frost' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== INVENTORY TAB ==================== */}
        {activeTab === 'inventory' && (
          <div>
            <div className="mb-5">
              <StatsCard products={products} isDark={isDark} />
            </div>

            {/* Controls bar */}
            <div className={`flex flex-wrap items-center justify-center gap-2 mb-4`}>
              {/* Select mode toggle */}
              <button
                onClick={() => { setSelectMode(!isSelectMode); if (isSelectMode) setSelectedIds(new Set()); }}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelectMode
                    ? 'bg-gradient-to-r from-cyanx to-emera text-white'
                    : isDark ? 'text-mist hover:text-frost hover:bg-midnight' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isSelectMode ? 'Done' : 'Select'}
              </button>

              {isSelectMode && selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isDark ? 'bg-midnight text-mist hover:bg-surface hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedIds.size === paginatedProducts.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <button
                    onClick={handleBulkSession}
                    disabled={selectedIds.size !== 1}
                    title={selectedIds.size !== 1 ? 'Select exactly 1 item to start a session' : ''}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedIds.size === 1
                        ? isDark ? 'bg-cyanx/12 text-cyanx hover:bg-cyanx/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                        : isDark ? 'bg-midnight text-mist/40 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Session
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`text-sm rounded-lg px-2 py-1 border outline-none transition-colors
                    ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  {sortOptions.map(o => (
                    <option key={o.value} value={o.value}>{t(o.labelKey, lang)}</option>
                  ))}
                </select>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>Filter</span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className={`text-sm rounded-lg px-2 py-1 border outline-none transition-colors
                    ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  {filterOptions.map(o => (
                    <option key={o.value} value={o.value}>{t(o.labelKey, lang)}</option>
                  ))}
                </select>
              </div>

              {/* Layout */}
              <div className="flex items-center gap-1">
                {(['grid', 'list', 'compact'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`p-1.5 rounded-lg transition-all ${layout === l
                      ? (isDark ? 'bg-gradient-to-r from-cyanx to-emera text-white' : 'bg-gray-800 text-white')
                      : isDark ? 'text-mist hover:text-frost hover:bg-midnight' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    title={l}
                  >
                    {l === 'grid' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    ) : l === 'list' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Per page */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('perPage', lang)}</span>
                <select
                  value={productsPerPage}
                  onChange={(e) => { setProductsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className={`text-sm rounded-lg px-1.5 py-1 border outline-none transition-colors
                    ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Product grid */}
            <ProductGrid
              products={products}
              filteredProducts={paginatedProducts}
              isDark={isDark}
              layout={layout}
              precision={settings.decimalPrecision}
              onEditProduct={setEditingProduct}
              onConsumeProduct={setConsumingProduct}
              onSellProduct={setSellingProduct}
              onToggleFavorite={toggleFavorite}
              onAddProduct={() => setIsAddModalOpen(true)}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />

            {/* Pagination */}
            {filteredProducts.length > productsPerPage && (
              <div className="flex items-center justify-center gap-2 pb-6 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-midnight text-mist hover:bg-surface hover:text-frost disabled:opacity-30'
                      : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30'
                  }`}
                >
                  &larr;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className={`px-1 ${isDark ? 'text-mist' : 'text-gray-400'}`}>...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          p === safePage
                            ? 'bg-gradient-to-r from-cyanx to-emera text-white'
                            : isDark
                              ? 'bg-midnight text-mist hover:bg-surface hover:text-frost'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-midnight text-mist hover:bg-surface hover:text-frost disabled:opacity-30'
                      : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30'
                  }`}
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6">
              <StatsCard products={products} isDark={isDark} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Type Distribution */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('stockOverview', lang)}
                </h3>
                {typeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {typeDistribution.map((_, idx) => (
                          <Cell key={idx} fill={DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#111827' : '#fff',
                          border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          color: isDark ? '#e2e8f0' : '#0f172a',
                        }}
                        formatter={(value: any) => [`${formatPrecision(Number(value), 1)}g`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                    {t('noProductsYet', lang)}
                  </div>
                )}
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {typeDistribution.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length] }} />
                      <span className={isDark ? 'text-muted' : 'text-gray-500'}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consumption Trend */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('consumptionTrend', lang)}
                </h3>
                {consumptionByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={consumptionByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                      <XAxis dataKey="month" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#111827' : '#fff',
                          border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          color: isDark ? '#e2e8f0' : '#0f172a',
                        }}
                        formatter={(value: any) => [`${formatPrecision(Number(value), 1)}g`, '']}
                      />
                      <Bar dataKey="amount" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                    {t('noSessions', lang)}
                  </div>
                )}
              </div>

              {/* Top Strains */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('topStrains', lang)}
                </h3>
                {topStrains.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topStrains} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                      <XAxis type="number" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} domain={[0, 5]} />
                      <YAxis dataKey="name" type="category" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} width={75} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#111827' : '#fff',
                          border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          color: isDark ? '#e2e8f0' : '#0f172a',
                        }}
                        formatter={(value: any) => [Number(value).toFixed(1), t('rating', lang)]}
                      />
                      <Bar dataKey="rating" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                    {t('noProductsYet', lang)}
                  </div>
                )}
              </div>

              {/* Total Spent */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('totalSpent', lang)}
                </h3>
                {spendingByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={spendingByType}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                      <XAxis dataKey="name" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#111827' : '#fff',
                          border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          color: isDark ? '#e2e8f0' : '#0f172a',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value), settings.currency), '']}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                    {t('noProductsYet', lang)}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Heatmap */}
            <div className="mb-6">
              <CalendarHeatmap sessions={sessions} isDark={isDark} />
            </div>

            {/* Budget Info */}
            {settings.budgetLimit > 0 && (
              <div className={`rounded-2xl p-5 border mb-6 ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('budgetLimit', lang)} ({settings.budgetPeriod})
                  </span>
                  <span className={`text-sm ${isDark ? 'text-muted' : 'text-gray-500'}`}>
                    {formatCurrency(totalValue, settings.currency)} / {formatCurrency(settings.budgetLimit, settings.currency)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#1e293b' : '#e5e7eb' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (totalValue / settings.budgetLimit) * 100)}%`,
                      background: totalValue > settings.budgetLimit
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : totalValue > settings.budgetLimit * 0.8
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : 'linear-gradient(90deg, #10b981, #059669)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== HISTORY TAB ==================== */}
        {activeTab === 'history' && (
          <div>
            {/* Filters */}
            <div className={`flex flex-wrap items-center justify-center gap-2 mb-4`}>
              <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                {t('filterByType', lang)}
              </span>
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className={`text-sm rounded-lg px-2 py-1 border outline-none transition-colors
                  ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                <option value="all">{t('allTypes', lang)}</option>
                <option value="consume">Consume</option>
                <option value="sell">Sell</option>
                <option value="session">Session</option>
                <option value="add">Add</option>
                <option value="delete">Delete</option>
                <option value="edit">Edit</option>
              </select>

              <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                {t('filterByDate', lang)}
              </span>
              <select
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className={`text-sm rounded-lg px-2 py-1 border outline-none transition-colors
                  ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                <option value="all">{t('allDates', lang)}</option>
                <option value="7d">{t('last7days', lang)}</option>
                <option value="30d">{t('last30days', lang)}</option>
                <option value="90d">{t('last90days', lang)}</option>
              </select>

              {filteredHistory.length > 0 && (
                <button
                  onClick={clearActivity}
                  className={`ml-auto text-xs px-3 py-1.5 rounded-lg transition-all
                    ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                >
                  {t('clearHistory', lang)}
                </button>
              )}
            </div>

            {/* Activity Table */}
            {filteredHistory.length > 0 ? (
              <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-midnight text-muted' : 'bg-gray-50 text-gray-400'}`}>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: isDark ? 'var(--border)' : '#e5e7eb' }}>
                      {filteredHistory.map((entry) => (
                        <tr key={entry.id} className={`transition-colors ${isDark ? 'hover:bg-midnight' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${entry.type === 'add' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : ''}
                              ${entry.type === 'delete' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : ''}
                              ${entry.type === 'edit' ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}
                              ${entry.type === 'consume' ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600') : ''}
                              ${entry.type === 'sell' ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') : ''}
                              ${entry.type === 'session' ? (isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : ''}
                            `}>
                              {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {entry.productName}
                          </td>
                          <td className={`px-4 py-3 text-right ${isDark ? 'text-mist' : 'text-gray-600'}`}>
                            {entry.amount != null ? `${formatPrecision(entry.amount, settings.decimalPrecision)}g` : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right ${isDark ? 'text-mist' : 'text-gray-600'}`}>
                            {entry.price != null ? formatCurrency(entry.price, settings.currency) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                            {formatActivityDate(entry.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={`text-center py-16 rounded-2xl border ${isDark ? 'bg-midnight/80 border border-edge text-muted' : 'bg-white border-gray-200 text-gray-400'}`}>
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{t('noActivities', lang)}</p>
              </div>
            )}
          </div>
        )}
      </div>

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
          onDelete={editingProduct ? handleDeleteProduct : undefined}
          onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
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
          onClose={() => { setSessionProduct(null); setSessionAmount(0); setSessionPeople(2); }}
          isDark={isDark}
        />
      )}

      {isSettingsOpen && (
        <SettingsSheet
          products={products}
          onImport={handleImport}
          onMergeImport={handleMergeImport}
          onClose={() => setIsSettingsOpen(false)}
          isDark={isDark}
        />
      )}

      {/* Toast */}
      <ToastContainer isDark={isDark} />

      {/* Animations */}
      {showSmoke && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <span className="animate-smoke-puff text-7xl">💨</span>
          <span className="animate-smoke-puff-2 text-6xl ml-4">💨</span>
          <span className="animate-smoke-puff text-5xl ml-2" style={{ animationDelay: '0.2s' }}>💨</span>
        </div>
      )}
      {showDollar && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <span className="animate-dollar-float text-5xl font-bold text-emerald-400">$</span>
          <span className="animate-dollar-float text-4xl font-bold text-emerald-400 ml-6" style={{ animationDelay: '0.15s' }}>$</span>
          <span className="animate-dollar-float text-5xl font-bold text-emerald-400 ml-8" style={{ animationDelay: '0.3s' }}>$</span>
          <span className="animate-dollar-float text-4xl font-bold text-emerald-400 ml-4" style={{ animationDelay: '0.1s' }}>$</span>
          <span className="animate-dollar-float text-5xl font-bold text-emerald-400 ml-6" style={{ animationDelay: '0.2s' }}>$</span>
          <span className="animate-dollar-float text-4xl font-bold text-emerald-400 ml-6" style={{ animationDelay: '0.25s' }}>$</span>
        </div>
      )}
    </div>
  );
}
