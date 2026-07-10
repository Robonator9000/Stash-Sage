import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Lock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Product, Session, SortOption, FilterType } from './types';
import { useProducts } from './utils/useProducts';
import { useSessions } from './utils/useSessions';
import { useSettings } from './utils/useSettings';
import { useDebounce } from './hooks/useDebounce';
import { useActivity } from './utils/useActivity';
import { ImportResult, mergeImportProducts } from './utils/dataTransfer';
import { searchProducts, sortProducts, filterProducts, generateId, formatPrecision, roundToHundredth, formatCurrency } from './utils/helpers';
import { t } from './utils/translations';
import { playSmokeSound, playSellSound } from './utils/sounds';
import { ToastContainer, showToast } from './components/Toast';
import { ProductGrid } from './components/ProductGrid';
import { StatsCard } from './components/StatsCard';
import { SettingsSheet } from './components/SettingsSheet';
import { CoachMarks } from './components/CoachMarks';
import { PinModal } from './components/PinModal';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { MarketplaceFeed } from './components/MarketplaceFeed';
import { CommunityPage } from './components/CommunityPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './utils/supabase';

import { AdminDashboard } from './components/AdminDashboard';
import { MenuButton } from './components/MenuButton';
import { LeftSidebar } from './components/LeftSidebar';
import { BottomNav } from './components/BottomNav';
import { MessagePopup } from './components/MessagePopup';
const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const HistoryTab = lazy(() => import('./components/HistoryTab').then(m => ({ default: m.HistoryTab })));
const ProductModal = lazy(() => import('./components/ProductModal').then(m => ({ default: m.ProductModal })));
const ConsumeModal = lazy(() => import('./components/ConsumeModal').then(m => ({ default: m.ConsumeModal })));
const SellModal = lazy(() => import('./components/SellModal').then(m => ({ default: m.SellModal })));
const SessionModal = lazy(() => import('./components/SessionModal').then(m => ({ default: m.SessionModal })));

export default function App() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, consumeProduct, replaceAllProducts } = useProducts();
  const { sessions, addSession } = useSessions();
  const { settings, updateSettings, replaceSettings } = useSettings();
  const { entries: activityEntries, addEntry: addActivityEntry, clearEntries: clearActivity } = useActivity();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'stash' | 'community' | 'marketplace' | 'admin') || 'stash';
  function setActiveTab(tab: 'stash' | 'community' | 'marketplace' | 'admin') {
    setSearchParams(prev => { prev.set('tab', tab); prev.delete('user'); return prev; }, { replace: true });
  }
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
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security'>('preferences');
  const [showChat, setShowChat] = useState(false);
  const [chatTargetUserId, setChatTargetUserId] = useState<string | null>(null);

  const [showSmoke, setShowSmoke] = useState(false);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleViewProfile = useCallback((uid: string) => {
    supabase.from('profiles').select('username').eq('user_id', uid).maybeSingle().then(({ data }) => {
      setSearchParams(prev => { prev.set('tab', 'community'); prev.set('user', data?.username || uid); return prev; }, { replace: true });
    });
  }, [setSearchParams]);

  const handleOpenChat = useCallback((userId: string) => {
    setChatTargetUserId(userId);
    setShowChat(true);
  }, []);

  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const isDark = settings.theme === 'dark';
  const { user, isAdmin } = useAuth();



  useEffect(() => {
    const target = searchParams.get('openChat');
    if (target) {
      setChatTargetUserId(target);
      setShowChat(true);
      setSearchParams(prev => { prev.delete('openChat'); return prev; }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!showChat) setChatTargetUserId(null);
  }, [showChat]);

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
    replaceAllProducts(mergeImportProducts(products, data.products));
  }, [products, replaceAllProducts]);

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

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === paginatedProducts.length) return new Set();
      return new Set(paginatedProducts.map(p => p.id));
    });
  }, [paginatedProducts]);

  const handleBulkDelete = useCallback(() => {
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
  }, [products, selectedIds, deleteProduct, addActivityEntry, addProduct, settings.language]);

  const handleBulkSession = useCallback(() => {
    const selected = products.filter(p => selectedIds.has(p.id));
    if (selected.length === 1) {
      setSessionProduct(selected[0]);
      setSessionAmount(Math.min(selected[0].amount, 0.5));
      setSessionPeople(2);
      setSelectedIds(new Set());
      setSelectMode(false);
    }
  }, [products, selectedIds]);

  const sortOptions = useMemo(() => [
    { value: 'newest', labelKey: 'sortNewest' },
    { value: 'oldest', labelKey: 'sortOldest' },
    { value: 'name', labelKey: 'sortName' },
    { value: 'rating', labelKey: 'sortRating' },
    { value: 'thc', labelKey: 'sortThc' },
    { value: 'amount', labelKey: 'sortAmount' },
    { value: 'price', labelKey: 'sortPrice' },
    { value: 'favorites', labelKey: 'sortFavorites' },
  ], []);

  const customTypes = useMemo(() => [...new Set(products.map(p => p.type).filter(t => !['indica', 'sativa', 'hybrid'].includes(t)))], [products]);

  const filterOptions = useMemo(() => [
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
  ], [customTypes, brandList]);

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }} id="main-content">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <BackgroundCanvas isDark={isDark} />

      {!isOnline && (
        <div
          role="status"
          className={`w-full text-center text-sm font-medium py-2 px-4 ${isDark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-400 text-amber-900'}`}
        >
          {t('offlineBanner', lang)}
        </div>
      )}

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

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsAddModalOpen={setIsAddModalOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setSettingsDefaultTab={setSettingsDefaultTab}
        setStashSection={setStashSection}
      />


      {/* Main layout with left sidebar */}
      <div className="flex max-w-7xl mx-auto px-4 py-4 flex-1 gap-4 lg:gap-6 w-full pb-16 lg:pb-0">
        {/* Left Nav - desktop only */}
        <div className="hidden lg:block">
          <LeftSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDark={isDark}
            lang={lang}
            onSettings={() => { setIsSettingsOpen(true); }}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* ==================== STASH TAB ==================== */}
        {activeTab === 'stash' && (
          <div>
            {/* Sub-navigation pills */}
            <div className="flex items-center justify-center gap-2 mb-5 max-w-md mx-auto" role="tablist">
              {(['products', 'dashboard', 'history'] as const).map(section => (
                <button
                  key={section}
                  role="tab"
                  aria-selected={stashSection === section}
                  onClick={() => setStashSection(section)}
                  className={`flex-1 px-5 py-2 rounded-xl text-sm font-medium ${
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
            {!user ? (
              <div className={`flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl ${
                isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-slate-700/60' : 'bg-gray-200'
                }`}>
                  <Lock className={`w-7 h-7 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('wipTitle', lang)}
                </h3>
                <p className={`text-sm max-w-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t('wipCommunityDesc', lang)}
                </p>
              </div>
            ) : (
              <CommunityPage onOpenChat={handleOpenChat} />
            )}
          </div>
          </ErrorBoundary>
        )}

        {/* ==================== MARKETPLACE TAB ==================== */}
        {activeTab === 'marketplace' && (
          <ErrorBoundary isDark={isDark} lang={lang}>
          <div className="space-y-4">
            {!user ? (
              <div className={`flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl ${
                isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-slate-700/60' : 'bg-gray-200'
                }`}>
                  <Lock className={`w-7 h-7 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('wipTitle', lang)}
                </h3>
                <p className={`text-sm max-w-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t('wipMarketplaceDesc', lang)}
                </p>
              </div>
            ) : (
              <MarketplaceFeed
                isDark={isDark}
                lang={lang}
                currentUserId={user?.id || ''}
                products={products}
                searchQuery={searchQuery}
                onViewProfile={handleViewProfile}
                onOpenChat={handleOpenChat}
              />
            )}
          </div>
          </ErrorBoundary>
        )}

        {/* ==================== ADMIN TAB ==================== */}
        {activeTab === 'admin' && isAdmin && (
          <ErrorBoundary isDark={isDark} lang={lang}>
          <div className="space-y-4">
            <AdminDashboard
              isDark={isDark}
              currentUserId={user?.id || ''}
              onViewProfile={handleViewProfile}
            />
          </div>
          </ErrorBoundary>
        )}
      </main>
      </div>

      {/* Bottom Nav - mobile only */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        lang={lang}
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
        <Suspense fallback={null}>
          <ProductModal
            product={editingProduct}
            sessions={sessions}
            onSave={handleSaveProduct}
            onDelete={editingProduct ? handleDeleteProduct : undefined}
            onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
            isDark={isDark}
          />
        </Suspense>
      )}

      {consumingProduct && (
        <Suspense fallback={null}>
          <ConsumeModal
            product={consumingProduct}
            onConsume={handleConsume}
            onClose={() => setConsumingProduct(null)}
            isDark={isDark}
          />
        </Suspense>
      )}

      {sellingProduct && (
        <Suspense fallback={null}>
          <SellModal
            product={sellingProduct}
            onSell={handleSell}
            onClose={() => setSellingProduct(null)}
            isDark={isDark}
          />
        </Suspense>
      )}

      {sessionProduct && (
        <Suspense fallback={null}>
          <SessionModal
            product={sessionProduct}
            initialAmount={sessionAmount}
            people={sessionPeople}
            onFinish={handleFinishSession}
            onClose={() => { setSessionProduct(null); setSessionAmount(0); setSessionPeople(2); }}
            isDark={isDark}
          />
        </Suspense>
      )}

      {user && (
        <MessagePopup
          currentUserId={user.id}
          isDark={isDark}
          lang={lang}
          initialTargetUserId={showChat ? (chatTargetUserId || undefined) : undefined}
          onClose={() => { setShowChat(false); setChatTargetUserId(null); }}
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

      {/* Toast */}
      <ToastContainer isDark={isDark} />

      {/* Footer */}
      <footer className="py-6 px-4 text-center">
        <p className={`text-xs font-display font-semibold tracking-widest uppercase ${isDark ? 'text-slate-700' : 'text-gray-300'}`}>
          STASH TRACKER
        </p>
      </footer>

      {/* Menu shortcut */}
      <MenuButton />

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
