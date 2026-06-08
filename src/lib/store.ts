'use client'

import { create } from 'zustand'

// ── Product type matching Prisma schema ──────────────────────────────────────
export interface Product {
  id: string
  name: string
  strain: string
  type: string
  thc: number
  cbd: number
  amount: number
  price: number
  picture: string | null
  notes: string | null
  rating: number
  brand: string | null
  consumptionCount: number
  lastConsumed: string | null
  favorite: boolean
  tags: string
  effects: string
  createdAt: string
  updatedAt: string
}

// ── AppSettings type matching Prisma schema ──────────────────────────────────
export interface AppSettings {
  language: string
  theme: string
  onboardingDone: boolean
  currency: string
  decimalPrecision: number
  showTimerMs: boolean
  pinEnabled: boolean
  pinHash: string
  lowStockThreshold: number
  statsVisibility: Record<string, boolean>
  sessionDefaults: {
    defaultAmount: number
    defaultPeople: number
    defaultHitTimer: number
    defaultGramsPerBowl: number
    rotationEnabled: boolean
  }
  favoriteBrands: string[]
  recentBrands: string[]
  budgetLimit: number
  budgetPeriod: string
}

export const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'dark',
  onboardingDone: false,
  currency: '$',
  decimalPrecision: 2,
  showTimerMs: false,
  pinEnabled: false,
  pinHash: '',
  lowStockThreshold: 3,
  statsVisibility: {
    totalProducts: true,
    totalAmount: true,
    totalSessions: true,
    averageRating: true,
    averageTHC: true,
    totalValue: true,
    lastConsumed: true,
  },
  sessionDefaults: {
    defaultAmount: 0.5,
    defaultPeople: 2,
    defaultHitTimer: 10,
    defaultGramsPerBowl: 0.25,
    rotationEnabled: false,
  },
  favoriteBrands: [],
  recentBrands: [],
  budgetLimit: 0,
  budgetPeriod: 'monthly',
}

// ── UI State ─────────────────────────────────────────────────────────────────
interface UIState {
  activeTab: 'inventory' | 'dashboard' | 'history' | 'settings'
  searchQuery: string
  sortBy: string
  filterBy: string
  layout: 'grid' | 'list' | 'compact'

  // Modal states
  addProductOpen: boolean
  editingProduct: Product | null
  consumingProduct: Product | null
  sellingProduct: Product | null
  sessionProduct: Product | null
  settingsOpen: boolean

  // Actions
  setActiveTab: (tab: UIState['activeTab']) => void
  setSearchQuery: (q: string) => void
  setSortBy: (s: string) => void
  setFilterBy: (f: string) => void
  setLayout: (l: UIState['layout']) => void
  openAddProduct: () => void
  openEditProduct: (p: Product) => void
  openConsume: (p: Product) => void
  openSell: (p: Product) => void
  openSession: (p: Product) => void
  openSettings: () => void
  closeAllModals: () => void
}

// ── Settings State ───────────────────────────────────────────────────────────
interface SettingsState {
  settings: AppSettings
  setSettings: (s: AppSettings) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  resetSettings: () => void
}

// ── Combined Store ───────────────────────────────────────────────────────────
type StoreState = UIState & SettingsState

export const useStore = create<StoreState>((set) => ({
  // ── UI defaults ──────────────────────────────────────────────────────────
  activeTab: 'inventory',
  searchQuery: '',
  sortBy: 'newest',
  filterBy: 'all',
  layout: 'grid',

  addProductOpen: false,
  editingProduct: null,
  consumingProduct: null,
  sellingProduct: null,
  sessionProduct: null,
  settingsOpen: false,

  // ── UI actions ───────────────────────────────────────────────────────────
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (s) => set({ sortBy: s }),
  setFilterBy: (f) => set({ filterBy: f }),
  setLayout: (l) => set({ layout: l }),

  openAddProduct: () =>
    set({
      addProductOpen: true,
      editingProduct: null,
      consumingProduct: null,
      sellingProduct: null,
      sessionProduct: null,
      settingsOpen: false,
    }),

  openEditProduct: (p) =>
    set({
      addProductOpen: false,
      editingProduct: p,
      consumingProduct: null,
      sellingProduct: null,
      sessionProduct: null,
      settingsOpen: false,
    }),

  openConsume: (p) =>
    set({
      addProductOpen: false,
      editingProduct: null,
      consumingProduct: p,
      sellingProduct: null,
      sessionProduct: null,
      settingsOpen: false,
    }),

  openSell: (p) =>
    set({
      addProductOpen: false,
      editingProduct: null,
      consumingProduct: null,
      sellingProduct: p,
      sessionProduct: null,
      settingsOpen: false,
    }),

  openSession: (p) =>
    set({
      addProductOpen: false,
      editingProduct: null,
      consumingProduct: null,
      sellingProduct: null,
      sessionProduct: p,
      settingsOpen: false,
    }),

  openSettings: () =>
    set({
      addProductOpen: false,
      editingProduct: null,
      consumingProduct: null,
      sellingProduct: null,
      sessionProduct: null,
      settingsOpen: true,
    }),

  closeAllModals: () =>
    set({
      addProductOpen: false,
      editingProduct: null,
      consumingProduct: null,
      sellingProduct: null,
      sessionProduct: null,
      settingsOpen: false,
    }),

  // ── Settings defaults ────────────────────────────────────────────────────
  settings: defaultSettings,

  setSettings: (s) => set({ settings: s }),

  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  resetSettings: () => set({ settings: defaultSettings }),
}))
