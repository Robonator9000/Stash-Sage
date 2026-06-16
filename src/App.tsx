import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Product, Session, SortOption, FilterType } from './types';
import { useProducts } from './utils/useProducts';
import { useSessions } from './utils/useSessions';
import { useSettings } from './utils/useSettings';
import { useDebounce } from './hooks/useDebounce';
import { useActivity } from './utils/useActivity';
import { ImportResult } from './utils/dataTransfer';
import { searchProducts, sortProducts, filterProducts, generateId, formatPrecision, roundToHundredth } from './utils/helpers';
import { t } from './utils/translations';
import { playSmokeSound, playSellSound } from './utils/sounds';
import { ToastContainer, showToast } from './components/Toast';
import { ProductGrid } from './components/ProductGrid';
import { StatsCard } from './components/StatsCard';
import { ProductModal } from './components/ProductModal';
import { ConsumeModal } from './components/ConsumeModal';
import { SellModal } from './components/SellModal';
import { SessionModal } from './components/SessionModal';
import { SettingsSheet } from './components/SettingsSheet';
import { CoachMarks } from './components/CoachMarks';
import { PinModal } from './components/PinModal';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { WelcomeModal } from './components/WelcomeModal';
import { UserSettings } from './components/UserSettings';
import { LogoIcon } from './components/LogoIcon';
import { ProfileCard } from './components/ProfileCard';
import { SocialFeed } from './components/SocialFeed';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationBell } from './components/NotificationBell';
import { UserProfileModal } from './components/UserProfileModal';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './utils/supabase';
const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const HistoryTab = lazy(() => import('./components/HistoryTab').then(m => ({ default: m.HistoryTab })));

function formatCurrency(value: number, currency: string): string {
  if (currency === 'EUR') return `€${value.toFixed(2)}`;
  if (currency === 'GBP') return `£${value.toFixed(2)}`;
  if (currency === 'JPY') return `¥${value.toFixed(0)}`;
  if (currency === 'CAD') return `C$${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
}

export default function App() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, consumeProduct, replaceAllProducts } = useProducts();
  const { sessions, addSession } = useSessions();
  const { settings, updateSettings, replaceSettings } = useSettings();
  const { entries: activityEntries, addEntry: addActivityEntry, clearEntries: clearActivity } = useActivity();

  const [activeTab, setActiveTab] = useState<'stash' | 'community'>('stash');
  const [stashSection, setStashSection] = useState<'products' | 'dashboard' | 'history'>('products');
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
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'profile' | 'personalization' | 'session' | 'stats' | 'data' | 'security'>('personalization');
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);

  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const isDark = settings.theme === 'dark';
  const { user } = useAuth();

  const browserLang = useMemo(() => {
    const raw = navigator.language || 'en';
    const code = raw.split('-')[0];
    const codes = new Set(['en', 'es', 'fr', 'de', 'pt'] as const);
    return codes.has(code as typeof codes extends Set<infer T> ? T : never) ? code as 'en' | 'es' | 'fr' | 'de' | 'pt' : 'en';
  }, []);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  useEffect(() => {
    if (settings.pinEnabled && settings.pinHash && !pinUnlocked) {
      setShowPinModal(true);
    } else if (!settings.pinEnabled) {
      setPinUnlocked(true);
    }
  }, [settings.pinEnabled, settings.pinHash, pinUnlocked]);

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

  const handleSaveProduct = useCallback((product: Product) => {
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
  }, [editingProduct, updateProduct, addProduct, addActivityEntry]);

  const handleDeleteProduct = useCallback((id: string) => {
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
  }, [products, deleteProduct, addProduct, addActivityEntry, settings.language]);

  const checkLowStock = useCallback((product: Product, deducted: number) => {
    const newAmount = Math.max(0, roundToHundredth(product.amount - deducted));
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
      playSellSound();
      setTimeout(() => setShowDollar(false), 1600);
    }
  }, [sellingProduct, consumeProduct, checkLowStock, addActivityEntry]);

  const handleConsume = useCallback((amount: number, startSession: boolean, people: number, consumedAt?: Date) => {
    if (!consumingProduct) return;
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
      playSmokeSound();
      setTimeout(() => setShowSmoke(false), 1200);
    }
  }, [consumingProduct, consumeProduct, checkLowStock, addActivityEntry]);

  const handleFinishSession = useCallback((_productId: string, _amountUsed: number, session: Session) => {
    addSession(session);
    addActivityEntry({
      id: generateId(), type: 'session', productId: session.productId, productName: session.productName, amount: session.amount, notes: session.notes, timestamp: new Date(),
    });
    setSessionProduct(null);
    setSessionAmount(0);
    setSessionPeople(2);
    setShowSmoke(true);
    setTimeout(() => setShowSmoke(false), 1200);
  }, [addSession, addActivityEntry]);

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

  const budgetAlertedRef = useRef<{ limit: number; period: string } | null>(null);
  useEffect(() => {
    if (settings.budgetLimit <= 0) return;
    if (totalValue > settings.budgetLimit) {
      const key = { limit: settings.budgetLimit, period: settings.budgetPeriod };
      if (!budgetAlertedRef.current || budgetAlertedRef.current.limit !== key.limit || budgetAlertedRef.current.period !== key.period) {
        budgetAlertedRef.current = key;
        showToast({
          id: 'budget-exceeded',
          title: t('budgetExceeded', settings.language),
          body: t('budgetExceededMessage', settings.language).replace('{amount}', formatCurrency(totalValue - settings.budgetLimit, settings.currency)),
          variant: 'danger',
        });
      }
    } else {
      budgetAlertedRef.current = null;
    }
  }, [totalValue, settings.budgetLimit, settings.budgetPeriod, settings.language, settings.currency]);

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
    const selected = products.filter(p => selectedIds.has(p.id));
    const deletedProducts = [...selected];
    selected.forEach(p => deleteProduct(p.id));
    selected.forEach(p => {
      addActivityEntry({
        id: generateId(), type: 'delete', productId: p.id, productName: p.name, timestamp: new Date(),
      });
    });
    const lng = settings.language;
    showToast({
      id: 'bulk-delete',
      title: `${deletedProducts.length} ${t('productDeleted', lng)}`,
      body: deletedProducts.map(p => p.name).join(', '),
      action: {
        label: t('undo', lng),
        onClick: () => {
          deletedProducts.forEach(p => addProduct(p));
        },
      },
      variant: 'info',
    });
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkSession = () => {
    const selected = products.filter(p => selectedIds.has(p.id));
    if (selected.length === 1) {
      setSessionProduct(selected[0]);
      setSessionAmount(Math.min(selected[0].amount, 0.5));
      setSessionPeople(2);
      setSelectedIds(new Set());
      setSelectMode(false);
    }
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

      {!settings.coachMarksDone && (
        <CoachMarks
          language={settings.language}
          isDark={isDark}
          onComplete={() => updateSettings({ coachMarksDone: true })}
          onSkip={() => updateSettings({ coachMarksDone: true })}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCloseSettings={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 ${isDark ? 'bg-[#0b1120]/80' : 'bg-[#e2e8f0]/80'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => { setActiveTab('stash'); setStashSection('products'); }}
            className="font-display text-2xl font-extrabold hover:opacity-80 transition-opacity shrink-0 flex items-center gap-1.5"
          >
            <LogoIcon className="w-8 h-8" />
            <span className="bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent font-display font-extrabold text-xl tracking-tight">STASH</span>
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xl mx-auto">
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
                data-coach="search"
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
              data-coach="add-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('addProduct', lang)}
            </button>
            {user && <NotificationBell isDark={isDark} lang={lang} onViewProfile={(uid) => { setViewProfileUserId(uid); }} />}
            <button
              onClick={() => { setSettingsDefaultTab('profile'); setIsSettingsOpen(true); }}
              className={`p-1.5 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
            >
              {user ? (
                settings.profile?.avatar_url ? (
                  <div className="w-7 h-7 rounded-lg overflow-hidden">
                    <img src={settings.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyanx to-emera flex items-center justify-center">
                    <span className="text-white font-display font-bold text-xs">
                      {settings.profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyanx to-emera flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
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
      {showUserSettings && <UserSettings isDark={isDark} onClose={() => setShowUserSettings(false)} />}

      {/* Tabs + Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Main tab bar */}
        <div className="flex items-center mb-4">
          <div className={`flex w-full items-center gap-0`}>
            {[
              { id: 'stash', label: t('stash', lang), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'community', label: t('community', lang), icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'stash' | 'community')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-base font-medium transition-all duration-200 relative
                  ${activeTab === tab.id
                    ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                    : isDark ? 'text-mist hover:text-frost' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyanx to-emera rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== STASH TAB ==================== */}
        {activeTab === 'stash' && (
          <div>
            {/* Sub-navigation pills */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {(['products', 'dashboard', 'history'] as const).map(section => (
                <button
                  key={section}
                  onClick={() => setStashSection(section)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    stashSection === section
                      ? 'bg-gradient-to-r from-cyanx to-emera text-white'
                      : isDark ? 'text-mist hover:text-frost hover:bg-midnight' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {section === 'products' ? t('products', lang) : section === 'dashboard' ? t('dashboard', lang) : t('history', lang)}
                </button>
              ))}
            </div>

            {stashSection === 'products' && (
            <div>
            <div className="mb-5" data-coach="stats">
              <StatsCard products={products} sessions={sessions} isDark={isDark} />
            </div>

            {/* Controls bar */}
            <div className={`flex flex-wrap items-center justify-center gap-3 mb-4`}>
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
                    {t('itemsSelected', lang).replace('{count}', String(selectedIds.size))}
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
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedIds.size === 1
                        ? isDark ? 'bg-cyanx/12 text-cyanx hover:bg-cyanx/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                        : isDark ? 'bg-midnight text-mist/40' : 'bg-gray-100 text-gray-400'
                    }`}
                    title={
                      selectedIds.size === 0 ? 'Select a product' :
                      selectedIds.size > 1 ? 'Select only 1 product for a session' :
                      'Start a session'
                    }
                  >
                    {selectedIds.size > 1 ? 'Session (1 only)' : 'Session'}
                  </button>
                  <button
                    onClick={() => {
                      selectedIds.forEach(id => toggleFavorite(id));
                      setSelectedIds(new Set());
                      setSelectMode(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isDark ? 'bg-amberx/12 text-amberx hover:bg-amberx/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    Favorite
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete ({selectedIds.size})
                  </button>
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`text-sm rounded-lg px-2 py-1 border-0 outline-none transition-colors
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
                  className={`text-sm rounded-lg px-2 py-1 border-0 outline-none transition-colors
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
                  className={`text-sm rounded-lg px-1.5 py-1 border-0 outline-none transition-colors
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
            )} {/* end products section */}

            {stashSection === 'dashboard' && (
              <Suspense fallback={
                <div className={`text-center py-16 ${isDark ? 'text-muted' : 'text-gray-400'}`}>Loading dashboard...</div>
              }>
                <DashboardTab
                  products={products}
                  sessions={sessions}
                  isDark={isDark}
                  lang={lang}
                  settings={settings}
                  typeDistribution={typeDistribution}
                  consumptionByMonth={consumptionByMonth}
                  topStrains={topStrains}
                  spendingByType={spendingByType}
                  totalValue={totalValue}
                />
              </Suspense>
            )}

            {stashSection === 'history' && (
              <Suspense fallback={
                <div className={`text-center py-16 ${isDark ? 'text-muted' : 'text-gray-400'}`}>Loading history...</div>
              }>
                <HistoryTab
                  filteredHistory={filteredHistory}
                  isDark={isDark}
                  lang={lang}
                  settings={settings}
                  historyFilterType={historyFilterType}
                  historyDateFilter={historyDateFilter}
                  expandedNotes={expandedNotes}
                  onFilterTypeChange={setHistoryFilterType}
                  onDateFilterChange={setHistoryDateFilter}
                  onClearHistory={clearActivity}
                  onToggleNote={(id: string) => {
                    setExpandedNotes(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* ==================== COMMUNITY TAB ==================== */}
        {activeTab === 'community' && (
          <ErrorBoundary isDark={isDark} lang={lang}>
          <div className="space-y-4">
            <ProfileCard
              profile={settings.profile}
              products={products}
              sessions={sessions}
              isDark={isDark}
              lang={lang}
              onEditProfile={() => { setSettingsDefaultTab('profile'); setIsSettingsOpen(true); }}
              onUpdateProfile={(p) => {
                updateSettings({ profile: p });
                if (user) supabase.from('profiles').upsert({ user_id: user.id, display_name: p.username }, { onConflict: 'user_id' }).then(() => {}, () => {});
              }}
            />

            {!user && (
              <div className={`max-w-lg mx-auto p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <h3 className={`text-lg font-display font-bold mb-2 ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                  {t('community', lang)}
                </h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                  Sign up to share your stash, connect with others, and see what the community is talking about.
                </p>
                <button
                  onClick={() => { setSettingsDefaultTab('profile'); setIsSettingsOpen(true); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/20"
                >
                  Sign Up
                </button>
              </div>
            )}

            {user && (
              <SocialFeed
                isDark={isDark}
                lang={lang}
                currentUserId={user.id}
                username={settings.profile?.username || 'User'}
                products={products}
                profile={settings.profile}
                onViewProfile={(uid) => setViewProfileUserId(uid)}
              />
            )}
          </div>
          </ErrorBoundary>
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
          sessions={sessions}
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
          defaultTab={settingsDefaultTab}
        />
      )}

      {/* User Profile Modal */}
      {viewProfileUserId && (
        <UserProfileModal
          userId={viewProfileUserId}
          isDark={isDark}
          lang={lang}
          onClose={() => setViewProfileUserId(null)}
        />
      )}

      {/* Toast */}
      <ToastContainer isDark={isDark} />

      {/* Footer */}
      <footer className={`text-center py-6 text-xs font-display font-semibold tracking-widest uppercase ${isDark ? 'text-slate-700' : 'text-gray-300'}`}>
        STASH TRACKER
      </footer>

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
