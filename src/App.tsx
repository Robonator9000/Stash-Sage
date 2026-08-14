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
import { CoachMarks } from './components/CoachMarks';
import { PinModal } from './components/PinModal';
import { MagicBackground } from './components/magicui';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './utils/supabase';
import { Box, Button, Group, Select, SegmentedControl, Text, Pagination } from '@mantine/core';

import { MenuButton } from './components/MenuButton';
import { LeftSidebar } from './components/LeftSidebar';
import { BottomNav } from './components/BottomNav';
import { MessagePopup } from './components/MessagePopup';
import { NotificationsPage } from './components/NotificationsPage';
const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const HistoryTab = lazy(() => import('./components/HistoryTab').then(m => ({ default: m.HistoryTab })));
const ProductModal = lazy(() => import('./components/ProductModal').then(m => ({ default: m.ProductModal })));
const ConsumeModal = lazy(() => import('./components/ConsumeModal').then(m => ({ default: m.ConsumeModal })));
const SellModal = lazy(() => import('./components/SellModal').then(m => ({ default: m.SellModal })));
const SessionModal = lazy(() => import('./components/SessionModal').then(m => ({ default: m.SessionModal })));
const SettingsSheet = lazy(() => import('./components/SettingsSheet').then(m => ({ default: m.SettingsSheet })));
const MarketplaceFeed = lazy(() => import('./components/MarketplaceFeed').then(m => ({ default: m.MarketplaceFeed })));
const CommunityPage = lazy(() => import('./components/CommunityPage').then(m => ({ default: m.CommunityPage })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export default function App() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, consumeProduct, replaceAllProducts } = useProducts();
  const { sessions, addSession } = useSessions();
  const { settings, updateSettings, replaceSettings } = useSettings();
  const { entries: activityEntries, addEntry: addActivityEntry, clearEntries: clearActivity } = useActivity();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'stash' | 'dashboard' | 'community' | 'marketplace' | 'admin' | 'notifications' | 'history' | 'settings' | 'messages' | 'explore') || 'stash';
  function setActiveTab(tab: string) {
    setSearchParams(prev => { prev.set('tab', tab); prev.delete('user'); return prev; }, { replace: true });
  }

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
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security'>('preferences');
  const [showChat, setShowChat] = useState(false);
  const [chatTargetUserId, setChatTargetUserId] = useState<string | null>(null);

  const [showSmoke, setShowSmoke] = useState(false);

  const [settingsDirty, setSettingsDirty] = useState(false);
  const settingsSnapshot = useRef(settings);

  useEffect(() => {
    if (activeTab === 'settings' && !settingsDirty) settingsSnapshot.current = settings;
  }, [activeTab, settingsDirty, settings]);

  useEffect(() => {
    if (settingsDirty && activeTab !== 'settings') {
      const current = settings;
      replaceSettings({
        ...settingsSnapshot.current,
        // Keep the user's live theme choice (Header toggle applies instantly);
        // a settings-tab revert should never flip the visible color scheme.
        theme: current.theme,
        themeAuto: current.themeAuto,
      });
      setSettingsDirty(false);
      showToast({ id: 'settings-reverted', title: '', body: t('settingsReverted', settings.language) });
    }
  }, [activeTab, settingsDirty, replaceSettings, settings.language]);

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
    root.setAttribute('data-mantine-color-scheme', isDark ? 'dark' : 'light');
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

  const handleSell = useCallback((amount: number, notes?: string) => {
    const product = sellingProduct;
    if (!product) return;
    setSellingProduct(null);
    setShowDollar(true);
    playSellSound();
      setTimeout(() => setShowDollar(false), 2200);
    try {
      checkLowStock(product, amount);
      consumeProduct(product.id, amount);
      addActivityEntry({
        id: generateId(), type: 'sell', productId: product.id, productName: product.name, amount, notes, timestamp: new Date(),
      });
    } catch (err) {
      console.error('sell failed', err);
    }
  }, [sellingProduct, consumeProduct, checkLowStock, addActivityEntry]);

  const handleConsume = useCallback((amount: number, startSession: boolean, people: number, consumedAt?: Date, notes?: string) => {
    const product = consumingProduct;
    if (!product) return;
    // Close the consume modal and (optionally) open the session modal FIRST,
    // so the UI always advances even if the data mutation below throws.
    setConsumingProduct(null);
    if (startSession) {
      setSessionProduct(product);
      setSessionAmount(amount);
      setSessionPeople(people);
    } else {
      setShowSmoke(true);
      playSmokeSound();
      setTimeout(() => setShowSmoke(false), 2200);
    }
    // Persist + record in a try/catch so a failure can never block the UI flow.
    try {
      checkLowStock(product, amount);
      consumeProduct(product.id, amount, consumedAt);
      addActivityEntry({
        id: generateId(), type: 'consume', productId: product.id, productName: product.name, amount, notes: notes || undefined, timestamp: consumedAt || new Date(),
      });
    } catch (err) {
      console.error('consume failed', err);
    }
  }, [consumingProduct, consumeProduct, checkLowStock, addActivityEntry]);

  const handleFinishSession = useCallback((_productId: string, _amountUsed: number, session: Session) => {
    setSessionProduct(null);
    setSessionAmount(0);
    setSessionPeople(2);
    setShowSmoke(true);
    playSmokeSound();
    setTimeout(() => setShowSmoke(false), 2200);
    try {
      addSession(session);
      addActivityEntry({
        id: generateId(), type: 'session', productId: session.productId, productName: session.productName, amount: session.amount, notes: session.notes, timestamp: new Date(),
      });
    } catch (err) {
      console.error('finish session failed', err);
    }
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
      <MagicBackground isDark={isDark} variant="full" />

        <WelcomeModal
          onComplete={(language) => updateSettings({ language, onboardingDone: true })}
          isDark={isDark}
          browserLang={browserLang}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" id="main-content">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <MagicBackground isDark={isDark} variant="full" />

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
          onOpenSettings={() => setActiveTab('settings')}
          onCloseSettings={() => setActiveTab('stash')}
        />
      )}

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsAddModalOpen={setIsAddModalOpen}
      />


      {/* Main layout with left sidebar */}
      <div className="flex flex-1 w-full">
        {/* Left Nav - desktop only, pinned to left wall, fixed on scroll */}
        <div className="hidden lg:block lg:sticky lg:top-[56px] lg:self-start lg:h-[calc(100vh-56px)] shrink-0">
          <Box style={{ height: '100%' }}>
            <LeftSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isDark={isDark}
              onOpenProfileSettings={() => { setSettingsDefaultTab('profile'); setActiveTab('settings'); }}
              currentUserId={user?.id || ''}
            />
          </Box>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
        <main className="max-w-7xl mx-auto px-4 py-4 w-full pb-16 lg:pb-0">
          {/* ==================== SETTINGS PAGE (unique page) ==================== */}
        {activeTab === 'settings' && (
          <ErrorBoundary isDark={isDark} lang={lang}>
            <Suspense fallback={<div className="text-center py-16 text-slate-500">Loading...</div>}>
              <SettingsSheet
                products={products}
                onImport={handleImport}
                onMergeImport={handleMergeImport}
                onClose={() => setActiveTab('stash')}
                isDark={isDark}
                defaultTab={settingsDefaultTab}
                onDirtyChange={setSettingsDirty}
              />
            </Suspense>
          </ErrorBoundary>
        )}

          {/* ==================== DASHBOARD TAB (unique page) ==================== */}
        {activeTab === 'dashboard' && (
          <Suspense fallback={
            <div className={`text-center py-16 ${isDark ? 'text-muted' : 'text-gray-400'}`}>Loading dashboard...</div>
          }>
            <ErrorBoundary isDark={isDark} lang={lang}>
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
            </ErrorBoundary>
          </Suspense>
        )}

          {/* ==================== STASH TAB ==================== */}
        {activeTab === 'stash' && (
            <div>
            <div>
            <div className="mb-5" data-coach="stats">
              <StatsCard products={products} sessions={sessions} isDark={isDark} />
            </div>
            {/* Controls bar */}
            <Group justify="center" gap="sm" wrap="wrap" mb="md">
              <Button
                size="compact-sm"
                variant={isSelectMode ? 'gradient' : 'subtle'}
                gradient={{ from: 'cyan', to: 'teal', deg: 135 }}
                onClick={() => { setSelectMode(!isSelectMode); if (isSelectMode) setSelectedIds(new Set()); }}
              >
                {isSelectMode ? 'Done' : 'Select'}
              </Button>

              {isSelectMode && selectedIds.size > 0 && (
                <Group gap="xs">
                  <Text size="xs" c={isDark ? 'gray.4' : 'gray.6'}>
                    {t('itemsSelected', lang).replace('{count}', String(selectedIds.size))}
                  </Text>
                  <Button
                    size="compact-xs"
                    variant={isDark ? 'subtle' : 'default'}
                    onClick={handleSelectAll}
                  >
                    {selectedIds.size === paginatedProducts.length ? 'Deselect all' : 'Select all'}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="cyan"
                    disabled={selectedIds.size !== 1}
                    title={
                      selectedIds.size === 0 ? 'Select a product' :
                      selectedIds.size > 1 ? 'Select only 1 product for a session' :
                      'Start a session'
                    }
                    onClick={handleBulkSession}
                  >
                    {selectedIds.size > 1 ? 'Session (1 only)' : 'Session'}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="amber"
                    onClick={() => {
                      selectedIds.forEach(id => toggleFavorite(id));
                      setSelectedIds(new Set());
                      setSelectMode(false);
                    }}
                  >
                    Favorite
                  </Button>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="red"
                    onClick={handleBulkDelete}
                  >
                    Delete ({selectedIds.size})
                  </Button>
                </Group>
              )}

              <Group gap="xs">
                <Text size="xs" tt="uppercase" fw={700} c={isDark ? 'white' : 'black'}>Sort</Text>
                <Select
                  size="xs"
                  value={sortBy}
                  onChange={(v) => setSortBy((v || 'recent') as SortOption)}
                  data={sortOptions.map(o => ({ value: o.value, label: t(o.labelKey, lang) }))}
                  w={160}
                  comboboxProps={{ withinPortal: false }}
                />
              </Group>

              <Group gap="xs">
                <Text size="xs" tt="uppercase" fw={700} c={isDark ? 'white' : 'black'}>Filter</Text>
                <Select
                  size="xs"
                  value={filterBy}
                  onChange={(v) => setFilterBy((v || 'all') as FilterType)}
                  data={filterOptions.map(o => ({ value: o.value, label: t(o.labelKey, lang) }))}
                  w={140}
                  comboboxProps={{ withinPortal: false }}
                />
              </Group>

              <SegmentedControl
                size="xs"
                value={layout}
                onChange={(v) => setLayout(v as 'grid' | 'list' | 'compact')}
                data={['grid', 'list', 'compact']}
                color="cyan"
              />

              <Group gap="xs">
                <Text size="xs" tt="uppercase" fw={700} c={isDark ? 'white' : 'black'}>{t('perPage', lang)}</Text>
                <Select
                  size="xs"
                  value={String(productsPerPage)}
                  onChange={(v) => { setProductsPerPage(Number(v)); setCurrentPage(1); }}
                  data={[10, 20, 50, 100].map(n => String(n))}
                  w={80}
                  comboboxProps={{ withinPortal: false }}
                />
              </Group>
            </Group>

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
              <Group justify="center" pb="lg" mt="lg">
                <Pagination
                  value={safePage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  siblings={1}
                  color="cyan"
                  radius="md"
                />
              </Group>
            )}
            </div>
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
                  <Lock className={`w-7 h-7 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('wipTitle', lang)}
                </h3>
                <p className={`text-sm max-w-xs ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t('wipCommunityDesc', lang)}
                </p>
              </div>
            ) : (
              <Suspense fallback={<div className="text-center py-16 text-slate-500">Loading...</div>}>
                <CommunityPage onOpenChat={handleOpenChat} />
              </Suspense>
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
                  <Lock className={`w-7 h-7 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('wipTitle', lang)}
                </h3>
                <p className={`text-sm max-w-xs ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t('wipMarketplaceDesc', lang)}
                </p>
              </div>
            ) : (
              <Suspense fallback={<div className="text-center py-16 text-slate-500">Loading...</div>}>
                <MarketplaceFeed
                  isDark={isDark}
                  lang={lang}
                  currentUserId={user?.id || ''}
                  products={products}
                  searchQuery={searchQuery}
                  onViewProfile={handleViewProfile}
                  onOpenChat={handleOpenChat}
                />
              </Suspense>
            )}
          </div>
          </ErrorBoundary>
        )}

        {/* ==================== ADMIN TAB ==================== */}
        {activeTab === 'admin' && isAdmin && (
          <ErrorBoundary isDark={isDark} lang={lang}>
          <div className="space-y-4">
            <Suspense fallback={<div className="text-center py-16 text-slate-500">Loading...</div>}>
              <AdminDashboard
                isDark={isDark}
                currentUserId={user?.id || ''}
                onViewProfile={handleViewProfile}
              />
            </Suspense>
          </div>
          </ErrorBoundary>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && user && (
          <ErrorBoundary isDark={isDark} lang={lang}>
            <NotificationsPage
              isDark={isDark}
              currentUserId={user.id}
              onViewProfile={handleViewProfile}
            />
          </ErrorBoundary>
        )}

        {/* ==================== HISTORY TAB ==================== */}
        {activeTab === 'history' && (
          <ErrorBoundary isDark={isDark} lang={lang}>
            <Suspense fallback={<div className="text-center py-16 text-slate-500">Loading...</div>}>
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
          </ErrorBoundary>
        )}

        </main>
        </div>
      </div>

      {/* Bottom Nav - mobile only */}
      <BottomNav
        isDark={isDark}
        onOpenChat={() => setShowChat(true)}
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
          initialOpen={showChat && !chatTargetUserId}
          onClose={() => { setShowChat(false); setChatTargetUserId(null); }}
        />
      )}

      {/* Toast */}
      <ToastContainer isDark={isDark} />

      {/* Menu shortcut */}
      <MenuButton />

      {/* Animations */}
      {showSmoke && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center gap-2">
          <div className="flex items-end gap-3">
            <span className="animate-smoke-puff text-6xl" style={{ animationDuration: '1.6s', animationDelay: '0s' }}>{'\uD83D\uDD25'}</span>
            <span className="animate-smoke-puff text-7xl" style={{ animationDuration: '1.1s', animationDelay: '0.2s' }}>{'\uD83D\uDCA8'}</span>
            <span className="animate-smoke-puff text-5xl" style={{ animationDuration: '1.4s', animationDelay: '0.4s' }}>{'\uD83D\uDCA8'}</span>
          </div>
          <div className="flex items-end gap-4 mt-2">
            <span className="animate-smoke-puff text-4xl" style={{ animationDuration: '1.3s', animationDelay: '0.1s' }}>{'\uD83D\uDCA8'}</span>
            <span className="animate-smoke-puff text-5xl" style={{ animationDuration: '0.9s', animationDelay: '0.35s' }}>{'\uD83D\uDD25'}</span>
            <span className="animate-smoke-puff text-3xl" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}>{'\uD83D\uDCA8'}</span>
          </div>
        </div>
      )}
      {showDollar && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center gap-1">
          <div className="flex items-end gap-3">
            <span className="animate-dollar-float text-4xl" style={{ animationDuration: '1.8s', animationDelay: '0s' }}>{'\uD83D\uDCB0'}</span>
            <span className="animate-dollar-float text-6xl font-black text-emerald-400" style={{ animationDuration: '1.2s', animationDelay: '0.15s' }}>$</span>
            <span className="animate-dollar-float text-4xl" style={{ animationDuration: '1.6s', animationDelay: '0.3s' }}>{'\uD83D\uDCB8'}</span>
          </div>
          <div className="flex items-end gap-4 mt-1">
            <span className="animate-dollar-float text-3xl font-bold text-emerald-400" style={{ animationDuration: '1.4s', animationDelay: '0.1s' }}>$</span>
            <span className="animate-dollar-float text-5xl font-black text-emerald-400" style={{ animationDuration: '2s', animationDelay: '0.35s' }}>$</span>
            <span className="animate-dollar-float text-3xl" style={{ animationDuration: '1.3s', animationDelay: '0.05s' }}>{'\uD83D\uDCB0'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
