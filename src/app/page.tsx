'use client'

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { t } from '@/lib/translations'
import { useStore, type Product, type AppSettings, defaultSettings } from '@/lib/store'
import { toast } from 'sonner'

// ── Feature Components ──────────────────────────────────────────────────────
import { WelcomeModal } from '@/components/WelcomeModal'
import { PinModal } from '@/components/PinModal'
import { hashPin } from '@/lib/crypto'

// ── UI Components ────────────────────────────────────────────────────────────
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Plus, Settings, Sun, Moon, LayoutGrid, List, Grid3X3,
  Heart, Star, Trash2, Edit3,
  Flame, DollarSign, Clock, Users, Zap, Package,
  BarChart3, Download, Upload, Copy, Lock, Unlock,
  X, Timer, RotateCw, Leaf, Archive, Activity,
  Filter, ArrowUpDown, Pause, Cloud, ChevronLeft, ChevronRight,
  Eye, EyeOff
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalProducts: number
  totalAmount: number
  totalSessions: number
  averageRating: number
  averageTHC: number
  totalValue: number
  lastConsumed: string | null
  consumptionTrend: { date: string; amount: number }[]
  topStrains: { id: string; name: string; strain: string; rating: number; type: string }[]
  spendingByMonth: { month: string; total: number }[]
  stockDistribution: { inStock: number; lowStock: number; outOfStock: number }
}

interface ConsumptionLog {
  id: string
  productId: string
  amount: number
  consumedAt: string
  type: string
  note: string | null
  product: Product
}

interface ActivityLog {
  id: string
  type: string
  entityId: string
  entityType: string
  details: string
  productName: string
  createdAt: string
}

// ── API helpers ──────────────────────────────────────────────────────────────
const api = {
  get: async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Fetch failed')
    return res.json()
  },
  post: async (url: string, body?: unknown) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Request failed') }
    return res.json()
  },
  put: async (url: string, body: unknown) => {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Request failed') }
    return res.json()
  },
  del: async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    return res.json()
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(dateStr: string | null, lang: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return t('minutesAgo', lang).replace('{n}', String(mins))
  if (hours < 24) return t('hoursAgo', lang).replace('{n}', String(hours))
  if (days < 30) return t('daysAgo', lang).replace('{n}', String(days))
  return t('monthsAgo', lang).replace('{n}', String(Math.floor(days / 30)))
}

function getTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'indica': return 'bg-purple-500/15 text-purple-400 border-purple-500/25'
    case 'sativa': return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    case 'hybrid': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  }
}

function getTypeGlow(type: string): string {
  switch (type?.toLowerCase()) {
    case 'indica': return 'glow-indica'
    case 'sativa': return 'glow-sativa'
    case 'hybrid': return 'glow-hybrid'
    default: return ''
  }
}

function getTypeStripe(type: string): string {
  switch (type?.toLowerCase()) {
    case 'indica': return 'stripe-indica'
    case 'sativa': return 'stripe-sativa'
    case 'hybrid': return 'stripe-hybrid'
    default: return ''
  }
}

function getTypeChartColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'indica': return '#a855f7'
    case 'sativa': return '#f59e0b'
    case 'hybrid': return '#10b981'
    default: return '#64748b'
  }
}

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'sm' }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'size-3' : 'size-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={readonly} onClick={() => onChange?.(i)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          <Star className={`${sz} ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  )
}

// ── Theme Toggle (hydration-safe) ────────────────────────────────────────────
function ThemeToggleButton({ resolvedTheme, onToggle }: { resolvedTheme: string | undefined; onToggle: () => void }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  if (!mounted) return <div className="size-8" />
  return (
    <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onToggle}>
      {resolvedTheme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </Button>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const queryClient = useQueryClient()
  const { setTheme, resolvedTheme } = useTheme()
  const store = useStore()
  const lang = store.settings.language

  // ── Local state ──────────────────────────────────────────────────────────
  const [searchDebounced, setSearchDebounced] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchPreviewOpen, setSearchPreviewOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyFilter, setHistoryFilter] = useState<string>('all')

  // Product form
  const [formName, setFormName] = useState('')
  const [formStrain, setFormStrain] = useState('')
  const [formType, setFormType] = useState('hybrid')
  const [formCustomType, setFormCustomType] = useState('')
  const [formThc, setFormThc] = useState('')
  const [formCbd, setFormCbd] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formRating, setFormRating] = useState(0)
  const [formBrand, setFormBrand] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formEffects, setFormEffects] = useState('')
  const [formPicture, setFormPicture] = useState<string | null>(null)

  // Consume form
  const [consumeAmount, setConsumeAmount] = useState('0.5')
  const [consumeTime, setConsumeTime] = useState('')
  const [consumeMode, setConsumeMode] = useState<'quick' | 'session'>('quick')

  // Animation state — rendered at PAGE level so visible after dialog closes
  const [smokeEffects, setSmokeEffects] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [dollarEffects, setDollarEffects] = useState<Array<{ id: number; x: number; y: number }>>([])

  // Sell form
  const [sellGramsPerPortion, setSellGramsPerPortion] = useState('0.5')
  const [sellNumPortions, setSellNumPortions] = useState('1')
  const [sellPricePerPortion, setSellPricePerPortion] = useState('')
  const [sellNote, setSellNote] = useState('')

  // Session form — new design: countdown timer with auto-rotation
  const [sessionPeople, setSessionPeople] = useState(2)
  const [sessionTimePerHit, setSessionTimePerHit] = useState(10) // seconds per hit
  const [sessionCountdown, setSessionCountdown] = useState(0) // remaining seconds
  const [sessionTimerRunning, setSessionTimerRunning] = useState(false)
  const [sessionRotationIndex, setSessionRotationIndex] = useState(0)
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Onboarding
  const [showWelcome, setShowWelcome] = useState(false)

  // PIN unlock
  const [pinUnlocked, setPinUnlocked] = useState(false)

  // Settings
  const [settingsTab, setSettingsTab] = useState<'personalization' | 'stats' | 'danger'>('personalization')
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [showPinSetup, setShowPinSetup] = useState(false)

  // ── Debounced search ─────────────────────────────────────────────────────
  const handleSearch = useCallback((val: string) => {
    setSearchInput(val)
    setSearchPreviewOpen(val.length > 0)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchDebounced(val)
      setPage(1)
    }, 300)
  }, [])

  // ── Queries ──────────────────────────────────────────────────────────────
  const productsQuery = useQuery({
    queryKey: ['products', searchDebounced, store.filterBy, store.sortBy, page, store.pageSize],
    queryFn: () => api.get(`/api/products?search=${encodeURIComponent(searchDebounced)}&filter=${store.filterBy}&sort=${store.sortBy}&page=${page}&limit=${store.pageSize}`),
  })

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/api/stats') as Promise<Stats>,
  })

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings') as Promise<AppSettings>,
  })

  const consumptionQuery = useQuery({
    queryKey: ['consumption', historyPage, historyFrom, historyTo],
    queryFn: () => api.get(`/api/consumption?page=${historyPage}&limit=20${historyFrom ? `&from=${historyFrom}` : ''}${historyTo ? `&to=${historyTo}` : ''}`),
  })

  const activityQuery = useQuery({
    queryKey: ['activity', historyPage, historyFrom, historyTo, historyFilter],
    queryFn: () => api.get(`/api/activity?page=${historyPage}&limit=20${historyFrom ? `&from=${historyFrom}` : ''}${historyTo ? `&to=${historyTo}` : ''}${historyFilter !== 'all' ? `&type=${historyFilter}` : ''}`) as Promise<{ logs: ActivityLog[]; total: number; page: number; totalPages: number }>,
  })

  // ── Sync settings ────────────────────────────────────────────────────────
  useEffect(() => {
    if (settingsQuery.data) store.setSettings(settingsQuery.data)
  }, [settingsQuery.data, store.setSettings])

  const appliedThemeRef = useRef(false)
  useEffect(() => {
    if (!appliedThemeRef.current && settingsQuery.data?.theme) {
      appliedThemeRef.current = true
      setTheme(settingsQuery.data.theme)
    }
  }, [settingsQuery.data?.theme, setTheme])

  // Show welcome modal if onboarding not done
  useEffect(() => {
    if (settingsQuery.data && !settingsQuery.data.onboardingDone) {
      setShowWelcome(true)
    }
  }, [settingsQuery.data])

  // Close search preview on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchPreviewOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Mutations ────────────────────────────────────────────────────────────
  const createProduct = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/products', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stats'] }); queryClient.invalidateQueries({ queryKey: ['activity'] }); store.closeAllModals(); toast.success('Product added!') },
    onError: () => toast.error('Failed to add product'),
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.put(`/api/products/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stats'] }); queryClient.invalidateQueries({ queryKey: ['activity'] }); store.closeAllModals(); toast.success('Product updated!') },
    onError: () => toast.error('Failed to update product'),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.del(`/api/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stats'] }); queryClient.invalidateQueries({ queryKey: ['activity'] }); setDeleteConfirm(null); store.closeAllModals(); toast.success('Product deleted') },
    onError: () => toast.error('Failed to delete product'),
  })

  // ── Animation triggers (fire BEFORE closing dialog) ──────────────────────
  const triggerSmokeEffect = useCallback(() => {
    const effects: Array<{ id: number; x: number; y: number }> = []
    for (let i = 0; i < 5; i++) {
      effects.push({ id: Date.now() + i, x: 35 + Math.random() * 30, y: 30 + Math.random() * 25 })
    }
    setSmokeEffects(effects)
    setTimeout(() => setSmokeEffects([]), 1400)
  }, [])

  const triggerDollarEffect = useCallback(() => {
    const effects: Array<{ id: number; x: number; y: number }> = []
    for (let i = 0; i < 6; i++) {
      effects.push({ id: Date.now() + i, x: 25 + Math.random() * 50, y: 35 + Math.random() * 25 })
    }
    setDollarEffects(effects)
    setTimeout(() => setDollarEffects([]), 1600)
  }, [])

  const consumeProduct = useMutation({
    mutationFn: ({ id, amount, consumedAt }: { id: string; amount: number; consumedAt?: string }) =>
      api.post(`/api/products/${id}/consume`, { amount, consumedAt }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['consumption'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      triggerSmokeEffect()
      toast.success(`Consumed ${consumeAmount}g`)
      // Delay close so user sees animation start
      setTimeout(() => store.closeAllModals(), 100)
      if (data.lowStock) {
        toast.warning(t('lowStockAlert', lang), { description: t('lowStockMessage', lang).replace('{name}', data.product.name).replace('{amount}', String(data.product.amount)) })
      }
    },
    onError: () => toast.error('Failed to consume'),
  })

  const sellProduct = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      api.post(`/api/products/${id}/sell`, { amount, note }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['consumption'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      triggerDollarEffect()
      toast.success('Sold successfully!')
      setTimeout(() => store.closeAllModals(), 100)
      if (data.lowStock) toast.warning(t('lowStockAlert', lang))
    },
    onError: () => toast.error('Failed to sell'),
  })

  const toggleFavorite = useMutation({
    mutationFn: (id: string) => api.post(`/api/products/${id}/favorite`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const updateSettings = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put('/api/settings', data),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['settings'] }); if (data.theme) setTheme(data.theme); toast.success('Settings updated') },
    onError: () => toast.error('Failed to update settings'),
  })

  const createSession = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/sessions', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stats'] }); queryClient.invalidateQueries({ queryKey: ['consumption'] }); queryClient.invalidateQueries({ queryKey: ['activity'] }); store.closeAllModals(); toast.success('Session completed!') },
    onError: () => toast.error('Failed to create session'),
  })

  // ── Form helpers ─────────────────────────────────────────────────────────
  const resetProductForm = useCallback(() => {
    setFormName(''); setFormStrain(''); setFormType('hybrid'); setFormCustomType('')
    setFormThc(''); setFormCbd(''); setFormAmount(''); setFormPrice('')
    setFormRating(0); setFormBrand(''); setFormNotes(''); setFormTags('')
    setFormEffects(''); setFormPicture(null)
  }, [])

  const populateProductForm = useCallback((p: Product) => {
    setFormName(p.name); setFormStrain(p.strain)
    setFormType(['indica', 'sativa', 'hybrid'].includes(p.type?.toLowerCase()) ? p.type.toLowerCase() : 'custom')
    setFormCustomType(['indica', 'sativa', 'hybrid'].includes(p.type?.toLowerCase()) ? '' : p.type)
    setFormThc(String(p.thc)); setFormCbd(String(p.cbd)); setFormAmount(String(p.amount))
    setFormPrice(String(p.price)); setFormRating(p.rating); setFormBrand(p.brand || '')
    setFormNotes(p.notes || ''); setFormTags(p.tags || ''); setFormEffects(p.effects || '')
    setFormPicture(p.picture)
  }, [])

  const handleOpenAddProduct = useCallback(() => { resetProductForm(); store.openAddProduct() }, [resetProductForm, store])
  const handleOpenEditProduct = useCallback((p: Product) => { populateProductForm(p); store.openEditProduct(p) }, [populateProductForm, store])
  const handleOpenConsume = useCallback((p: Product) => {
    setConsumeAmount('0.5'); setConsumeTime(''); setConsumeMode('quick'); store.openConsume(p)
  }, [store])
  const handleOpenSell = useCallback((p: Product) => {
    setSellGramsPerPortion('0.5'); setSellNumPortions('1'); setSellPricePerPortion(''); setSellNote(''); store.openSell(p)
  }, [store])
  const handleOpenSession = useCallback((p: Product) => {
    const defaults = store.settings.sessionDefaults || defaultSettings.sessionDefaults
    setSessionPeople(defaults.defaultPeople)
    setSessionTimePerHit(defaults.defaultHitTimer)
    countdownRef.current = 0
    setSessionCountdown(0)
    setSessionTimerRunning(false)
    setSessionRotationIndex(0)
    setSessionNotes('')
    setSessionStarted(false)
    store.openSession(p)
  }, [store])

  // ── Timer refs (declared before useCallback) ─────────────────────────────
  const countdownRef = useRef(0)

  // ── Session countdown timer with auto-rotation ──────────────────────────
  const sessionPeopleRef = useRef(sessionPeople)
  sessionPeopleRef.current = sessionPeople
  const sessionTimePerHitRef = useRef(sessionTimePerHit)
  sessionTimePerHitRef.current = sessionTimePerHit
  useEffect(() => {
    if (sessionTimerRunning) {
      sessionTimerRef.current = setInterval(() => {
        const prev = countdownRef.current
        if (prev <= 1) {
          setSessionRotationIndex(ri => (ri + 1) % sessionPeopleRef.current)
          countdownRef.current = sessionTimePerHitRef.current
          setSessionCountdown(countdownRef.current)
        } else {
          countdownRef.current = prev - 1
          setSessionCountdown(countdownRef.current)
        }
      }, 1000)
    } else {
      clearInterval(sessionTimerRef.current)
    }
    return () => clearInterval(sessionTimerRef.current)
  }, [sessionTimerRunning])

  // ── Computed values ──────────────────────────────────────────────────────
  const products = productsQuery.data?.products || []
  const totalPages = productsQuery.data?.totalPages || 1
  const totalProductsCount = productsQuery.data?.total || 0
  const stats = statsQuery.data
  const consumptionLogs = consumptionQuery.data?.logs || []
  const consumptionTotalPages = consumptionQuery.data?.totalPages || 1
  const activityLogs = activityQuery.data?.logs || []
  const activityTotalPages = activityQuery.data?.totalPages || 1

  const sellTotalGrams = useMemo(() => parseFloat(sellGramsPerPortion || '0') * parseFloat(sellNumPortions || '0'), [sellGramsPerPortion, sellNumPortions])
  const sellTotalValue = useMemo(() => parseFloat(sellPricePerPortion || '0') * parseFloat(sellNumPortions || '0'), [sellPricePerPortion, sellNumPortions])
  const sellProfit = useMemo(() => {
    if (!store.sellingProduct) return 0
    const costPerGram = store.sellingProduct.price / Math.max(store.sellingProduct.amount + sellTotalGrams, 0.01)
    return sellTotalValue - (costPerGram * sellTotalGrams)
  }, [store.sellingProduct, sellTotalGrams, sellTotalValue])

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(Math.max(0, secs) / 60)
    const s = Math.max(0, secs) % 60
    return `${mins}:${String(s).padStart(2, '0')}`
  }

  const currency = store.settings.currency || '$'

  // ── Stats visibility ─────────────────────────────────────────────────────
  const statsVis = store.settings.statsVisibility || defaultSettings.statsVisibility

  // ── Backup / Export ──────────────────────────────────────────────────────
  const handleExportJson = async () => {
    try {
      const data = await api.get('/api/backup')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `stash-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click(); URL.revokeObjectURL(url); toast.success(t('exportSuccess', lang))
    } catch { toast.error('Export failed') }
  }
  const handleExportCsv = async () => {
    try {
      const prods = productsQuery.data?.products || []
      if (prods.length === 0) { toast.error('No data to export'); return }
      const headers = ['Name', 'Strain', 'Type', 'THC', 'CBD', 'Amount', 'Price', 'Rating', 'Brand', 'Notes', 'Tags', 'Effects', 'Favorite', 'Created']
      const rows = prods.map((p: Product) => [p.name, p.strain, p.type, p.thc, p.cbd, p.amount, p.price, p.rating, p.brand || '', (p.notes || '').replace(/"/g, '""'), p.tags, p.effects, p.favorite, p.createdAt].map(v => `"${v}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `stash-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url); toast.success(t('exportSuccess', lang))
    } catch { toast.error('Export failed') }
  }
  const handleCopyBackup = async () => {
    try { const data = await api.get('/api/backup'); await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); toast.success(t('copiedToClipboard', lang)) }
    catch { toast.error('Copy failed') }
  }
  const handleImportBackup = async (mode: 'replace' | 'merge') => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      try {
        const text = await file.text(); const data = JSON.parse(text)
        await api.post('/api/backup', { mode, data })
        queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stats'] })
        queryClient.invalidateQueries({ queryKey: ['settings'] }); queryClient.invalidateQueries({ queryKey: ['consumption'] })
        toast.success(t('importSuccess', lang))
      } catch { toast.error(t('importError', lang)) }
    }
    input.click()
  }

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFormPicture(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Submit handlers ──────────────────────────────────────────────────────
  const handleSubmitProduct = () => {
    if (!formName.trim()) { toast.error('Name is required'); return }
    const finalType = formType === 'custom' ? formCustomType : formType
    const data: Record<string, unknown> = {
      name: formName.trim(), strain: formStrain, type: finalType,
      thc: parseFloat(formThc) || 0, cbd: parseFloat(formCbd) || 0,
      amount: parseFloat(formAmount) || 0, price: parseFloat(formPrice) || 0,
      rating: formRating, brand: formBrand || null,
      notes: formNotes || null, tags: formTags, effects: formEffects,
      picture: formPicture,
    }
    if (store.editingProduct) updateProduct.mutate({ id: store.editingProduct.id, data })
    else createProduct.mutate(data)
  }

  const handleSubmitConsume = () => {
    if (!store.consumingProduct) return
    const amt = parseFloat(consumeAmount)
    if (!amt || amt <= 0) { toast.error('Invalid amount'); return }
    consumeProduct.mutate({ id: store.consumingProduct.id, amount: amt, consumedAt: consumeTime || undefined })
  }

  const handleSubmitSell = () => {
    if (!store.sellingProduct) return
    if (sellTotalGrams <= 0) { toast.error('Invalid amount'); return }
    sellProduct.mutate({ id: store.sellingProduct.id, amount: sellTotalGrams, note: sellNote || undefined })
  }

  const handleSubmitSession = () => {
    if (!store.sessionProduct) return
    createSession.mutate({
      productId: store.sessionProduct.id,
      amount: parseFloat(consumeAmount) || (store.settings.sessionDefaults?.defaultAmount ?? 0.5),
      people: sessionPeople,
      notes: sessionNotes || null,
      rotationEnabled: true,
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ═══ PAGE-LEVEL ANIMATION OVERLAYS ═══ */}
      {smokeEffects.map((effect) => (
        <div key={effect.id} className="fixed z-[100] animate-smoke-puff" style={{ left: `${effect.x}%`, top: `${effect.y}%` }}>
          <Cloud className="size-10 text-teal-300/40" />
        </div>
      ))}
      {dollarEffects.map((effect) => (
        <div key={effect.id} className="fixed z-[100] animate-dollar-float" style={{ left: `${effect.x}%`, top: `${effect.y}%` }}>
          <DollarSign className="size-7 text-emerald-400/70 font-bold" />
        </div>
      ))}

      {/* ═══ WELCOME MODAL ═══ */}
      {showWelcome && (
        <WelcomeModal onComplete={(language) => {
          updateSettings.mutate({ language, onboardingDone: true })
          setShowWelcome(false)
        }} />
      )}

      {/* ═══ PIN MODAL ═══ */}
      {!showWelcome && store.settings.pinEnabled && !pinUnlocked && (
        <PinModal pinHash={store.settings.pinHash || ''} onSuccess={() => setPinUnlocked(true)} />
      )}

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="px-6 lg:px-10 py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black gradient-text flex items-center gap-1.5 shrink-0 tracking-tight">
              <Leaf className="size-5" /> STASH
            </h1>
            {/* Search with preview dropdown — centered, grown, takes available space */}
            <div ref={searchContainerRef} className="relative flex-1 max-w-3xl mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
              <Input value={searchInput} onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (searchInput) setSearchPreviewOpen(true) }}
                placeholder={t('searchPlaceholder', lang)}
                className="pl-9 h-9 bg-muted/40 border-0 text-sm rounded-full focus-visible:ring-1 focus-visible:ring-teal-400/50 w-full" />
              {/* Search preview dropdown */}
              {searchPreviewOpen && searchInput && products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {products.slice(0, 8).map((p: Product) => (
                    <button key={p.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-colors"
                      onClick={() => { handleOpenEditProduct(p); setSearchInput(''); setSearchDebounced(''); setSearchPreviewOpen(false); }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.type?.toLowerCase() === 'indica' ? 'bg-purple-500/10' : p.type?.toLowerCase() === 'sativa' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                        <Leaf className={`size-3.5 ${p.type?.toLowerCase() === 'indica' ? 'text-purple-400' : p.type?.toLowerCase() === 'sativa' ? 'text-amber-400' : 'text-emerald-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {[p.strain, p.type, p.brand, p.thc > 0 ? `${p.thc}% THC` : ''].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{p.amount.toFixed(1)}g</span>
                    </button>
                  ))}
                  {products.length > 8 && (
                    <div className="px-3 py-2 text-[10px] text-muted-foreground text-center border-t border-border/30">
                      +{products.length - 8} more results
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Right-aligned action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" onClick={handleOpenAddProduct}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 h-8 text-xs rounded-full px-3 shadow-md shadow-teal-500/20">
                <Plus className="size-3.5 mr-0.5" />{t('addProduct', lang)}
              </Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => store.openSettings()}>
                <Settings className="size-3.5" />
              </Button>
              <ThemeToggleButton resolvedTheme={resolvedTheme}
                onToggle={() => { const next = resolvedTheme === 'dark' ? 'light' : 'dark'; setTheme(next); updateSettings.mutate({ theme: next }) }} />
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 w-full px-8 lg:px-16 xl:px-24 py-6">
        <Tabs value={store.activeTab} onValueChange={(v) => store.setActiveTab(v as 'inventory' | 'dashboard' | 'history')}>
          <TabsList className="mb-6 w-full justify-start gap-2 bg-transparent p-0 h-auto border-0 shadow-none">
            <TabsTrigger value="inventory" className="text-sm gap-1.5 rounded-none px-3 py-2 border-0 bg-transparent shadow-none hover:bg-muted/30 underline-offset-4 data-[state=active]:bg-transparent data-[state=active]:underline data-[state=active]:decoration-2 data-[state=active]:decoration-teal-400 data-[state=active]:shadow-none data-[state=active]:outline-0 data-[state=active]:border-0"><Package className="size-4" />{t('inventory', lang)}</TabsTrigger>
            <TabsTrigger value="dashboard" className="text-sm gap-1.5 rounded-none px-3 py-2 border-0 bg-transparent shadow-none hover:bg-muted/30 underline-offset-4 data-[state=active]:bg-transparent data-[state=active]:underline data-[state=active]:decoration-2 data-[state=active]:decoration-teal-400 data-[state=active]:shadow-none data-[state=active]:outline-0 data-[state=active]:border-0"><BarChart3 className="size-4" />{t('dashboard', lang)}</TabsTrigger>
            <TabsTrigger value="history" className="text-sm gap-1.5 rounded-none px-3 py-2 border-0 bg-transparent shadow-none hover:bg-muted/30 underline-offset-4 data-[state=active]:bg-transparent data-[state=active]:underline data-[state=active]:decoration-2 data-[state=active]:decoration-teal-400 data-[state=active]:shadow-none data-[state=active]:outline-0 data-[state=active]:border-0"><Clock className="size-4" />{t('history', lang)}</TabsTrigger>
          </TabsList>

          {/* ═══ INVENTORY ═══ */}
          <TabsContent value="inventory">
            <h2 className="text-lg font-bold underline decoration-teal-400 decoration-2 underline-offset-4 mb-4">{t('inventory', lang)}</h2>
            {/* Stats Bar */}
            {stats && (() => {
              const visibleStats = [
                { key: 'totalProducts', value: stats.totalProducts, icon: Package, color: 'text-teal-400' },
                { key: 'totalAmount', value: `${stats.totalAmount.toFixed(1)}g`, icon: Archive, color: 'text-emerald-400' },
                { key: 'averageRating', value: stats.averageRating.toFixed(1), icon: Star, color: 'text-amber-400' },
                { key: 'averageTHC', value: `${stats.averageTHC.toFixed(1)}%`, icon: Zap, color: 'text-purple-400' },
                { key: 'totalValue', value: `${currency}${stats.totalValue.toFixed(0)}`, icon: DollarSign, color: 'text-green-400' },
                { key: 'totalSessions', value: stats.totalSessions, icon: Users, color: 'text-cyan-400' },
              ].filter(({ key }) => statsVis[key] !== false)
              const count = visibleStats.length
              // Determine cols to keep rows balanced: 1→1, 2→2, 3→3, 4→2, 5→3, 6→3
              const cols = count <= 3 ? count : count === 4 ? 2 : 3
              return (
                <div className={`grid gap-3 mb-6`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {visibleStats.map(({ key, value, icon: Icon, color }) => (
                    <Card key={key} className="glass-card py-3 px-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50"><Icon className={`size-4 ${color}`} /></div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t(key, lang)}</p>
                          <p className="text-base font-bold">{value}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            })()}

            {/* Inventory controls: sort, filter, layout, page size */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 rounded-full px-2.5">
                    <ArrowUpDown className="size-2.5" />
                    {t(`sort${store.sortBy.charAt(0).toUpperCase() + store.sortBy.slice(1)}`, lang)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['newest', 'oldest', 'name', 'rating', 'thc', 'amount', 'price', 'favorites'].map(s => (
                    <DropdownMenuItem key={s} onClick={() => store.setSortBy(s)}>
                      {t(`sort${s.charAt(0).toUpperCase() + s.slice(1)}`, lang)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 rounded-full px-2.5">
                    <Filter className="size-2.5" />
                    {t(`filter${store.filterBy.charAt(0).toUpperCase() + store.filterBy.slice(1)}`, lang) || 'Filter'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['all', 'indica', 'sativa', 'hybrid', 'favorites', 'inStock', 'lowStock', 'outOfStock'].map(f => (
                    <DropdownMenuItem key={f} onClick={() => { store.setFilterBy(f); setPage(1) }}>
                      {t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}`, lang) || f}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center border rounded-full overflow-hidden">
                {([['grid', LayoutGrid], ['list', List], ['compact', Grid3X3]] as const).map(([l, Icon]) => (
                  <Button key={l} variant="ghost" size="icon"
                    className={`size-7 rounded-none ${store.layout === l ? 'bg-muted' : ''}`}
                    onClick={() => store.setLayout(l as 'grid' | 'list' | 'compact')}>
                    <Icon className="size-3" />
                  </Button>
                ))}
              </div>
              <Select value={String(store.pageSize)} onValueChange={(v) => { store.setPageSize(parseInt(v)); setPage(1) }}>
                <SelectTrigger className="h-7 w-[70px] text-[11px] rounded-full border px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100].map(s => <SelectItem key={s} value={String(s)}>{s} {t('perPage', lang)}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground ml-auto">
                {totalProductsCount} {t('totalProducts', lang).toLowerCase()}
              </span>
            </div>

            {/* Loading */}
            {productsQuery.isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="p-4 rounded-xl"><Skeleton className="h-32 w-full rounded-lg" /></Card>)}
              </div>
            )}

            {/* Empty states */}
            {!productsQuery.isLoading && products.length === 0 && !searchDebounced && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                  <Leaf className="size-10 text-teal-500/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{t('noProductsYet', lang)}</h3>
                <p className="text-muted-foreground text-sm mb-5">{t('addFirstProductHint', lang)}</p>
                <Button onClick={handleOpenAddProduct} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-lg shadow-teal-500/20">
                  <Plus className="size-4 mr-1" />{t('addProduct', lang)}
                </Button>
              </div>
            )}
            {!productsQuery.isLoading && products.length === 0 && searchDebounced && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="size-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-semibold mb-1">{t('noProductsFound', lang)}</h3>
                <p className="text-muted-foreground text-sm">{t('adjustSearchHint', lang)}</p>
              </div>
            )}

            {/* Grid */}
            {products.length > 0 && store.layout === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p: Product) => (
                  <ProductCardGrid key={p.id} product={p} lang={lang} currency={currency}
                    onEdit={() => handleOpenEditProduct(p)} onConsume={() => handleOpenConsume(p)}
                    onSell={() => handleOpenSell(p)} onSession={() => handleOpenSession(p)}
                    onFavorite={() => toggleFavorite.mutate(p.id)} onDelete={() => setDeleteConfirm(p.id)} />
                ))}
              </div>
            )}

            {/* List */}
            {products.length > 0 && store.layout === 'list' && (
              <div className="flex flex-col gap-1.5">
                {products.map((p: Product) => (
                  <ProductCardList key={p.id} product={p} lang={lang} currency={currency}
                    onEdit={() => handleOpenEditProduct(p)} onConsume={() => handleOpenConsume(p)}
                    onSell={() => handleOpenSell(p)} onSession={() => handleOpenSession(p)}
                    onFavorite={() => toggleFavorite.mutate(p.id)} onDelete={() => setDeleteConfirm(p.id)} />
                ))}
              </div>
            )}

            {/* Compact */}
            {products.length > 0 && store.layout === 'compact' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {products.map((p: Product) => (
                  <ProductCardCompact key={p.id} product={p} lang={lang} currency={currency}
                    onEdit={() => handleOpenEditProduct(p)} onConsume={() => handleOpenConsume(p)}
                    onSell={() => handleOpenSell(p)} onFavorite={() => toggleFavorite.mutate(p.id)} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ═══ DASHBOARD ═══ */}
          <TabsContent value="dashboard">
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6 rounded-xl"><Skeleton className="h-64 w-full rounded-lg" /></Card>)}
              </div>
            ) : stats ? (
              <div className="space-y-6">
                <h2 className="text-lg font-bold underline decoration-teal-400 decoration-2 underline-offset-4">{t('dashboard', lang)}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: t('totalProducts', lang), value: stats.totalProducts, icon: Package, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                    { label: t('totalAmount', lang), value: `${stats.totalAmount.toFixed(1)}g`, icon: Archive, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: t('totalValue', lang), value: `${currency}${stats.totalValue.toFixed(0)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: t('totalSessions', lang), value: stats.totalSessions, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className="p-4 rounded-xl glass-card">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`size-5 ${color}`} /></div>
                        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p><p className="text-xl font-black">{value}</p></div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-5 rounded-xl">
                    <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-bold underline decoration-teal-400 decoration-2 underline-offset-4">{t('consumptionTrend', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.consumptionTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" tickFormatter={(v: string) => v.slice(5)} />
                            <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                            <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="p-5 rounded-xl">
                    <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-bold underline decoration-teal-400 decoration-2 underline-offset-4">{t('stockOverview', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-56 flex items-center justify-center">
                        {stats.stockDistribution.inStock + stats.stockDistribution.lowStock + stats.stockDistribution.outOfStock > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie data={[
                                { name: t('filterInStock', lang), value: stats.stockDistribution.inStock, fill: '#10b981' },
                                { name: t('filterLowStock', lang), value: stats.stockDistribution.lowStock, fill: '#f59e0b' },
                                { name: t('filterOutOfStock', lang), value: stats.stockDistribution.outOfStock, fill: '#ef4444' },
                              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                                {[{ name: 'inStock', fill: '#10b981' }, { name: 'lowStock', fill: '#f59e0b' }, { name: 'outOfStock', fill: '#ef4444' }].map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                              </Pie>
                              <Legend /><RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            </RechartsPie>
                          </ResponsiveContainer>
                        ) : <p className="text-muted-foreground text-sm">{t('noProductsYet', lang)}</p>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="p-5 rounded-xl">
                    <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-bold underline decoration-teal-400 decoration-2 underline-offset-4">{t('topStrains', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-56">
                        {stats.topStrains.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topStrains} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={80} />
                              <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                              <Bar dataKey="rating" radius={[0, 4, 4, 0]}>{stats.topStrains.map((s) => <Cell key={s.id} fill={getTypeChartColor(s.type)} />)}</Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{t('noProductsYet', lang)}</p></div>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="p-5 rounded-xl">
                    <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-bold underline decoration-teal-400 decoration-2 underline-offset-4">{t('totalSpent', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-56">
                        {stats.spendingByMonth.some(m => m.total > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.spendingByMonth}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" tickFormatter={(v: string) => v.slice(5)} />
                              <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                              <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                              <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{t('noActivity', lang)}</p></div>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* ═══ HISTORY ═══ */}
          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold underline decoration-teal-400 decoration-2 underline-offset-4">{t('history', lang)}</h2>
                {/* Filter by type */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'product_created', 'consumed', 'sold', 'product_updated', 'session_completed', 'favorite_toggled', 'product_deleted'] as const).map(filterType => {
                    const { icon: FIcon, label: fLabel, color: fColor } = (() => {
                      switch (filterType) {
                        case 'all': return { icon: Activity, label: 'All', color: 'text-muted-foreground' }
                        case 'product_created': return { icon: Plus, label: 'Added', color: 'text-teal-400' }
                        case 'consumed': return { icon: Flame, label: 'Consumed', color: 'text-teal-400' }
                        case 'sold': return { icon: DollarSign, label: 'Sold', color: 'text-green-400' }
                        case 'product_updated': return { icon: Edit3, label: 'Edited', color: 'text-amber-400' }
                        case 'session_completed': return { icon: Users, label: 'Session', color: 'text-purple-400' }
                        case 'favorite_toggled': return { icon: Heart, label: 'Favorited', color: 'text-red-400' }
                        case 'product_deleted': return { icon: Trash2, label: 'Deleted', color: 'text-red-400' }
                      }
                    })()
                    return (
                      <Button key={filterType} variant="ghost" size="sm"
                        className={`h-6 text-[10px] px-2 rounded-full gap-1 ${historyFilter === filterType ? 'bg-muted font-semibold' : ''}`}
                        onClick={() => { setHistoryFilter(filterType); setHistoryPage(1) }}>
                        <FIcon className={`size-2.5 ${fColor}`} />{fLabel}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs text-muted-foreground">{t('from', lang)}</Label>
                <Input type="date" value={historyFrom} onChange={(e) => { setHistoryFrom(e.target.value); setHistoryPage(1) }} className="h-7 w-auto text-xs rounded-lg" />
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={historyTo} onChange={(e) => { setHistoryTo(e.target.value); setHistoryPage(1) }} className="h-7 w-auto text-xs rounded-lg" />
                {(historyFrom || historyTo) && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full" onClick={() => { setHistoryFrom(''); setHistoryTo(''); setHistoryFilter('all'); setHistoryPage(1) }}>
                    <X className="size-3 mr-1" />Clear
                  </Button>
                )}
              </div>
              {activityQuery.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Card key={i} className="p-3 rounded-xl"><Skeleton className="h-12 w-full rounded-lg" /></Card>)}</div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <Activity className="size-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-semibold">{t('noActivity', lang)}</h3>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activityLogs.map((log: ActivityLog) => {
                    const details = (() => { try { return JSON.parse(log.details) } catch { return {} } })()
                    const { icon: Icon, color, bg, label, detail } = (() => {
                      switch (log.type) {
                        case 'product_created': return { icon: Plus, color: 'text-teal-400', bg: 'bg-teal-500/10', label: 'Added', detail: details.amount ? `${details.amount}g · ${details.type || ''}` : '' }
                        case 'product_updated': return { icon: Edit3, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Updated', detail: details.changedFields ? details.changedFields.join(', ') : '' }
                        case 'product_deleted': return { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Deleted', detail: details.amount ? `Had ${details.amount}g remaining` : '' }
                        case 'consumed': return { icon: Flame, color: 'text-teal-400', bg: 'bg-teal-500/10', label: 'Consumed', detail: `${details.amount ? `${details.amount}g` : ''}${details.remaining !== undefined ? ` → ${details.remaining.toFixed(1)}g left` : ''}` }
                        case 'sold': return { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Sold', detail: `${details.amount ? `${details.amount}g` : ''}${details.revenue ? ` for ${currency}${details.revenue.toFixed(2)}` : ''}${details.remaining !== undefined ? ` → ${details.remaining.toFixed(1)}g left` : ''}` }
                        case 'session_completed': return { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Session', detail: `${details.people ?? '?'} people${details.amount ? ` · ${details.amount}g consumed` : ''}` }
                        case 'favorite_toggled': return { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', label: details.favorite ? 'Favorited' : 'Unfavorited', detail: '' }
                        default: return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted/50', label: log.type, detail: '' }
                      }
                    })()
                    return (
                      <Card key={log.id} className="p-3 flex items-center gap-3 rounded-xl glass-card">
                        <div className={`p-2 rounded-xl ${bg}`}>
                          <Icon className={`size-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{log.productName || 'Unknown'}</p>
                            <Badge variant="outline" className={`text-[8px] px-1.5 py-0 rounded-full ${color} border-current/20`}>{label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {detail || log.type}
                            {details.changedFields && log.type === 'product_updated' ? ` — ${details.changedFields.join(', ')}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt, lang) || new Date(log.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
              {activityTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                  <span className="text-sm text-muted-foreground">{historyPage} / {activityTotalPages}</span>
                  <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={historyPage >= activityTotalPages} onClick={() => setHistoryPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto border-t border-border/30 py-3 px-8 lg:px-16 xl:px-24 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
        Stash Tracker
      </footer>

      {/* ═══ ADD/EDIT PRODUCT DIALOG ═══ */}
      <Dialog open={store.addProductOpen || !!store.editingProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">{store.editingProduct ? t('editProduct', lang) : t('addProduct', lang)}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs font-medium">{t('strainName', lang)} *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('strainNamePlaceholder', lang)} className="rounded-lg" /></div>
            <div className="space-y-1"><Label className="text-xs font-medium">{t('brandDispensary', lang)}</Label><Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder={t('selectBrand', lang)} className="rounded-lg" /></div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t('strainType', lang)}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indica">Indica</SelectItem><SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="custom">{t('custom', lang)}</SelectItem>
                </SelectContent>
              </Select>
              {formType === 'custom' && <Input value={formCustomType} onChange={(e) => setFormCustomType(e.target.value)} placeholder={t('customStrainPlaceholder', lang)} className="mt-1 rounded-lg" />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs font-medium">{t('thcPercent', lang)}</Label><Input type="number" step="0.1" value={formThc} onChange={(e) => setFormThc(e.target.value)} className="rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">{t('cbdPercent', lang)}</Label><Input type="number" step="0.1" value={formCbd} onChange={(e) => setFormCbd(e.target.value)} className="rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs font-medium">{t('amountGrams', lang)}</Label><Input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder={t('amountPlaceholder', lang)} className="rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">{t('priceLabel', lang)} ({currency})</Label><Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder={t('pricePlaceholder', lang)} className="rounded-lg" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs font-medium">{t('rating', lang)}</Label><StarRating value={formRating} onChange={setFormRating} size="md" /></div>
            <div className="space-y-1"><Label className="text-xs font-medium">{t('tags', lang)}</Label><Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="e.g., relaxing, euphoric" className="rounded-lg" /></div>
            <div className="space-y-1"><Label className="text-xs font-medium">{t('effects', lang)}</Label><Input value={formEffects} onChange={(e) => setFormEffects(e.target.value)} placeholder="e.g., happy, creative" className="rounded-lg" /></div>
            <div className="space-y-1"><Label className="text-xs font-medium">{t('notesLabel', lang)}</Label><Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder={t('notesPlaceholder', lang)} rows={2} className="rounded-lg" /></div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">{formPicture ? t('changePicture', lang) : t('uploadPicture', lang)}</Label>
              <Input type="file" accept="image/*" onChange={handlePictureUpload} className="text-xs" />
              {formPicture && (
                <div className="relative mt-1 w-20 h-20 rounded-xl overflow-hidden border">
                  <img src={formPicture} alt="Product" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormPicture(null)} className="absolute top-0.5 right-0.5 bg-destructive rounded-full p-0.5"><X className="size-3 text-white" /></button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {store.editingProduct && <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(store.editingProduct!.id)} className="mr-auto rounded-lg"><Trash2 className="size-3.5 mr-1" />{t('delete', lang)}</Button>}
            <Button variant="outline" onClick={() => store.closeAllModals()} className="rounded-lg">{t('cancel', lang)}</Button>
            <Button onClick={handleSubmitProduct} disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg">{t('save', lang)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONSUME / SESSION DIALOG ═══ */}
      <Dialog open={!!store.consumingProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Flame className="size-4 text-teal-400" />
              {consumeMode === 'session' ? t('session', lang) : t('consume', lang)} — {store.consumingProduct?.name}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {store.consumingProduct && (
            <div className="space-y-3">
              {/* Mode toggle */}
              <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-xl">
                <button type="button" onClick={() => setConsumeMode('quick')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${consumeMode === 'quick' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                  <Flame className="size-3" />{t('consume', lang)}
                </button>
                <button type="button" onClick={() => setConsumeMode('session')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${consumeMode === 'session' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                  <Users className="size-3" />{t('session', lang)}
                </button>
              </div>

              {/* Quick consume */}
              {consumeMode === 'quick' && (
                <>
                  <div className="text-center">
                    <span className="text-3xl font-black text-teal-400">{consumeAmount}g</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {[0.1, 0.25, 0.5, 1, 2].map(v => (
                      <Button key={v} variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-full"
                        onClick={() => setConsumeAmount(String(parseFloat(consumeAmount) + v))}>+{v}</Button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('amount', lang)} ({t('grams', lang)})</Label>
                    <Input type="number" step="0.01" value={consumeAmount} onChange={(e) => setConsumeAmount(e.target.value)} className="rounded-lg" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {store.consumingProduct.amount.toFixed(1)}g {t('grams', lang)} {t('filterInStock', lang).toLowerCase()}
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('setConsumptionTime', lang)}</Label>
                    <Input type="datetime-local" value={consumeTime} onChange={(e) => setConsumeTime(e.target.value)} className="rounded-lg" />
                  </div>
                </>
              )}

              {/* Session mode — new design: countdown timer with auto-rotation */}
              {consumeMode === 'session' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t('amount', lang)} ({t('grams', lang)})</Label>
                    <Input type="number" step="0.01" value={consumeAmount} onChange={(e) => setConsumeAmount(e.target.value)} className="rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t('people', lang)}</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionPeople(p => Math.max(2, p - 1))}>-</Button>
                      <span className="text-lg font-black w-8 text-center">{sessionPeople}</span>
                      <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionPeople(p => p + 1)}>+</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t('timePerHit', lang)}</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionTimePerHit(s => Math.max(5, s - 5))}>-</Button>
                      <span className="text-lg font-black w-12 text-center">{sessionTimePerHit}s</span>
                      <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionTimePerHit(s => s + 5)}>+</Button>
                    </div>
                  </div>

                  {/* Timer display */}
                  <div className="text-center py-3">
                    <div className={`text-4xl font-mono font-black ${sessionTimerRunning ? 'text-teal-400 animate-timer-pulse' : sessionStarted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {formatCountdown(sessionCountdown)}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                      {sessionTimerRunning ? t('sessionActive', lang) : t('sessionIdle', lang)}
                    </p>
                  </div>

                  {/* Timer controls */}
                  <div className="flex items-center justify-center gap-2">
                    {!sessionStarted ? (
                      <Button onClick={() => { countdownRef.current = sessionTimePerHit; setSessionStarted(true); setSessionCountdown(countdownRef.current); setSessionTimerRunning(true); setSessionRotationIndex(0) }}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full px-6 shadow-lg shadow-teal-500/20">
                        <Timer className="size-4 mr-1.5" />{t('sessionStart', lang)}
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="rounded-full"
                          onClick={() => setSessionTimerRunning(!sessionTimerRunning)}>
                          {sessionTimerRunning ? <Pause className="size-3.5 mr-1" /> : <Timer className="size-3.5 mr-1" />}
                          {sessionTimerRunning ? t('sessionPause', lang) : t('start', lang)}
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full"
                          onClick={() => { setSessionTimerRunning(false); countdownRef.current = sessionTimePerHit; setSessionCountdown(countdownRef.current) }}>
                          <RotateCw className="size-3.5 mr-1" />Reset
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Rotation indicator */}
                  {sessionStarted && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t('rotation', lang)}</Label>
                      <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: sessionPeople }).map((_, i) => (
                          <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            i === sessionRotationIndex
                              ? 'border-teal-400 bg-teal-500/20 text-teal-400 rotation-active'
                              : 'border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground">
                        {t('currentPerson', lang)}: {sessionRotationIndex + 1} / {sessionPeople}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t('sessionNotes', lang)}</Label>
                    <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder={t('sessionNotesPlaceholder', lang)} rows={2} className="rounded-lg" />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => store.closeAllModals()} className="rounded-lg">{t('cancel', lang)}</Button>
            {consumeMode === 'quick' ? (
              <Button onClick={handleSubmitConsume} disabled={consumeProduct.isPending}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg">
                <Flame className="size-3.5 mr-1" />{t('consume', lang)}
              </Button>
            ) : (
              <Button onClick={handleSubmitSession} disabled={createSession.isPending}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg">
                <Users className="size-3.5 mr-1" />{t('finishSession', lang)}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SELL DIALOG ═══ */}
      <Dialog open={!!store.sellingProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-md rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">{t('sell', lang)} — {store.sellingProduct?.name}</DialogTitle>
            <DialogDescription>{t('divideIntoPortions', lang)}</DialogDescription>
          </DialogHeader>
          {store.sellingProduct && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">{t('gramsPerPortion', lang)}</Label><Input type="number" step="0.01" value={sellGramsPerPortion} onChange={(e) => setSellGramsPerPortion(e.target.value)} className="rounded-lg" /></div>
                <div className="space-y-1"><Label className="text-xs">{t('numberOfPortions', lang)}</Label><Input type="number" step="1" value={sellNumPortions} onChange={(e) => setSellNumPortions(e.target.value)} className="rounded-lg" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">{t('pricePerPortion', lang)} ({currency})</Label><Input type="number" step="0.01" value={sellPricePerPortion} onChange={(e) => setSellPricePerPortion(e.target.value)} className="rounded-lg" /></div>
              <Card className="p-3 rounded-xl bg-muted/30">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('totalToSell', lang)}</span><span className="font-medium">{sellTotalGrams.toFixed(2)}g</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('saleValue', lang)}</span><span className="font-medium">{currency}{sellTotalValue.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('remainingAfter', lang)}</span><span className="font-medium">{Math.max(0, store.sellingProduct.amount - sellTotalGrams).toFixed(2)}g</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>{sellProfit >= 0 ? t('profit', lang) : t('loss', lang)}</span>
                    <span className={sellProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{currency}{Math.abs(sellProfit).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
              <div className="space-y-1"><Label className="text-xs">{t('notesLabel', lang)}</Label><Input value={sellNote} onChange={(e) => setSellNote(e.target.value)} placeholder="Note (optional)" className="rounded-lg" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => store.closeAllModals()} className="rounded-lg">{t('cancel', lang)}</Button>
            <Button onClick={handleSubmitSell} disabled={sellProduct.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg">
              <DollarSign className="size-3.5 mr-1" />{t('sell', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SESSION DIALOG (standalone, kept for backward compat but simplified) ═══ */}
      <Dialog open={!!store.sessionProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">{t('session', lang)} — {store.sessionProduct?.name}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {store.sessionProduct && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t('people', lang)}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionPeople(p => Math.max(2, p - 1))}>-</Button>
                  <span className="text-lg font-black w-8 text-center">{sessionPeople}</span>
                  <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionPeople(p => p + 1)}>+</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t('timePerHit', lang)}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionTimePerHit(s => Math.max(5, s - 5))}>-</Button>
                  <span className="text-lg font-black w-12 text-center">{sessionTimePerHit}s</span>
                  <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={() => setSessionTimePerHit(s => s + 5)}>+</Button>
                </div>
              </div>
              {/* Timer */}
              <div className="text-center py-3">
                <div className={`text-4xl font-mono font-black ${sessionTimerRunning ? 'text-teal-400 animate-timer-pulse' : sessionStarted ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {formatCountdown(sessionCountdown)}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                {!sessionStarted ? (
                  <Button onClick={() => { countdownRef.current = sessionTimePerHit; setSessionStarted(true); setSessionCountdown(countdownRef.current); setSessionTimerRunning(true); setSessionRotationIndex(0) }}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full px-6">
                    <Timer className="size-4 mr-1.5" />{t('sessionStart', lang)}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSessionTimerRunning(!sessionTimerRunning)}>
                      {sessionTimerRunning ? <Pause className="size-3.5 mr-1" /> : <Timer className="size-3.5 mr-1" />}
                      {sessionTimerRunning ? t('sessionPause', lang) : t('start', lang)}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => { setSessionTimerRunning(false); countdownRef.current = sessionTimePerHit; setSessionCountdown(countdownRef.current) }}>
                      <RotateCw className="size-3.5 mr-1" />Reset
                    </Button>
                  </>
                )}
              </div>
              {/* Rotation */}
              {sessionStarted && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('rotation', lang)}</Label>
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: sessionPeople }).map((_, i) => (
                      <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        i === sessionRotationIndex ? 'border-teal-400 bg-teal-500/20 text-teal-400 rotation-active' : 'border-muted-foreground/20 text-muted-foreground'
                      }`}>{i + 1}</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t('sessionNotes', lang)}</Label>
                <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder={t('sessionNotesPlaceholder', lang)} rows={2} className="rounded-lg" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => store.closeAllModals()} className="rounded-lg">{t('cancel', lang)}</Button>
            <Button onClick={handleSubmitSession} disabled={createSession.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg">{t('finishSession', lang)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SETTINGS SHEET ═══ */}
      <Sheet open={store.settingsOpen} onOpenChange={(open) => { if (!open) store.closeAllModals() }}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg font-black">{t('settings', lang)}</SheetTitle>
            <SheetDescription />
          </SheetHeader>
          <div className="mt-4">
            <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as 'personalization' | 'stats' | 'danger')}>
              <TabsList className="w-full">
                <TabsTrigger value="personalization" className="flex-1 text-xs">{t('personalization', lang)}</TabsTrigger>
                <TabsTrigger value="stats" className="flex-1 text-xs">{t('showStatToggles', lang)}</TabsTrigger>
                <TabsTrigger value="danger" className="flex-1 text-xs">{t('dangerZone', lang)}</TabsTrigger>
              </TabsList>

              <TabsContent value="personalization" className="space-y-3 mt-4">
                {/* Row 1: Language + Theme */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs font-medium">{t('language', lang)}</Label>
                    <Select value={store.settings.language} onValueChange={(v) => updateSettings.mutate({ language: v })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem><SelectItem value="fr">Français</SelectItem><SelectItem value="de">Deutsch</SelectItem><SelectItem value="pt">Português</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs font-medium">{t('theme', lang)}</Label>
                    <Select value={store.settings.theme} onValueChange={(v) => updateSettings.mutate({ theme: v })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="dark">{t('dark', lang)}</SelectItem><SelectItem value="light">{t('light', lang)}</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Row 2: Currency + Decimal Precision */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs font-medium">{t('currency', lang)}</Label>
                    <Select value={store.settings.currency} onValueChange={(v) => updateSettings.mutate({ currency: v })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="$">$ USD</SelectItem><SelectItem value="€">€ EUR</SelectItem><SelectItem value="£">£ GBP</SelectItem><SelectItem value="¥">¥ JPY</SelectItem><SelectItem value="C$">C$ CAD</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs font-medium">{t('decimalPrecision', lang)}</Label>
                    <Select value={String(store.settings.decimalPrecision)} onValueChange={(v) => updateSettings.mutate({ decimalPrecision: parseInt(v) })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Row 3: Low Stock + Show Timer Ms */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs font-medium">{t('lowStockThreshold', lang)}</Label>
                    <Input type="number" step="0.5" value={store.settings.lowStockThreshold} onChange={(e) => updateSettings.mutate({ lowStockThreshold: parseFloat(e.target.value) || 3 })} className="h-8 text-xs rounded-lg" />
                    <p className="text-[9px] text-muted-foreground">{t('lowStockThresholdHint', lang)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><Label className="text-xs font-medium">{t('showTimerMs', lang)}</Label><Switch checked={store.settings.showTimerMs} onCheckedChange={(v) => updateSettings.mutate({ showTimerMs: v })} /></div>
                    <p className="text-[9px] text-muted-foreground">{t('showTimerMsHint', lang)}</p>
                  </div>
                </div>
                {/* Row 4: Budget Limit + Budget Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs font-medium">Budget Limit</Label>
                    <Input type="number" step="10" value={store.settings.budgetLimit || ''} onChange={(e) => updateSettings.mutate({ budgetLimit: parseFloat(e.target.value) || 0 })} className="h-8 text-xs rounded-lg" placeholder="0 = disabled" />
                    <p className="text-[9px] text-muted-foreground">Monthly spending limit</p>
                  </div>
                  <div className="space-y-1"><Label className="text-xs font-medium">Budget Period</Label>
                    <Select value={store.settings.budgetPeriod || 'monthly'} onValueChange={(v) => updateSettings.mutate({ budgetPeriod: v })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wider">{t('sessionDefaults', lang)}</p>
                {/* Session defaults in 2x2 grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">{t('defaultAmount', lang)}</Label>
                    <Input type="number" step="0.1" value={store.settings.sessionDefaults?.defaultAmount ?? 0.5} onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultAmount: parseFloat(e.target.value) || 0.5 } })} className="h-8 text-xs rounded-lg" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t('defaultPeople', lang)}</Label>
                    <Input type="number" step="1" value={store.settings.sessionDefaults?.defaultPeople ?? 2} onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultPeople: parseInt(e.target.value) || 2 } })} className="h-8 text-xs rounded-lg" /></div>
                  <div className="space-y-1"><Label className="text-xs">{t('defaultHitTimer', lang)}</Label>
                    <Input type="number" step="1" value={store.settings.sessionDefaults?.defaultHitTimer ?? 10} onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultHitTimer: parseInt(e.target.value) || 10 } })} className="h-8 text-xs rounded-lg" /></div>
                  <div className="space-y-1 flex items-center justify-between">
                    <Label className="text-xs">{t('rotationEnabled', lang)}</Label>
                    <Switch checked={store.settings.sessionDefaults?.rotationEnabled ?? false} onCheckedChange={(v) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, rotationEnabled: v } })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-2 mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider">{t('showStatToggles', lang)}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    { key: 'totalProducts', label: t('totalProducts', lang), icon: Package, color: 'text-teal-400' },
                    { key: 'totalAmount', label: t('totalAmount', lang), icon: Archive, color: 'text-emerald-400' },
                    { key: 'averageRating', label: t('averageRating', lang), icon: Star, color: 'text-amber-400' },
                    { key: 'averageTHC', label: t('averageTHC', lang), icon: Zap, color: 'text-purple-400' },
                    { key: 'totalValue', label: t('totalValue', lang), icon: DollarSign, color: 'text-green-400' },
                    { key: 'totalSessions', label: t('totalSessions', lang), icon: Users, color: 'text-cyan-400' },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`size-3.5 ${color}`} />
                        <span className="text-xs">{label}</span>
                      </div>
                      <Switch
                        checked={statsVis[key] !== false}
                        onCheckedChange={(v) => {
                          const newVis = { ...statsVis, [key]: v }
                          updateSettings.mutate({ statsVisibility: newVis })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="danger" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider">{t('dataBackup', lang)}</p>
                  <p className="text-xs text-muted-foreground">{t('dataBackupHint', lang)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={handleExportJson}><Download className="size-3 mr-1" />{t('exportData', lang)}</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={handleExportCsv}><Download className="size-3 mr-1" />{t('exportCsv', lang)}</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={handleCopyBackup}><Copy className="size-3 mr-1" />{t('copyToClipboard', lang)}</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => handleImportBackup('replace')}><Upload className="size-3 mr-1" />{t('importData', lang)}</Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs w-full rounded-lg" onClick={() => handleImportBackup('merge')}>
                    <Upload className="size-3 mr-1" />{t('importMerge', lang)}
                  </Button>
                  <p className="text-[9px] text-muted-foreground">{t('importMergeHint', lang)}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider">{t('pinLock', lang)}</p>
                  <p className="text-xs text-muted-foreground">{t('pinLockHint', lang)}</p>
                  {!showPinSetup ? (
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setShowPinSetup(true)}>
                      {store.settings.pinEnabled ? <Unlock className="size-3 mr-1" /> : <Lock className="size-3 mr-1" />}
                      {store.settings.pinEnabled ? t('disablePin', lang) : t('enablePin', lang)}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="password" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder={t('enterPin', lang)} className="h-8 text-xs rounded-lg" />
                        <Input type="password" maxLength={6} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))} placeholder={t('enterCurrentPin', lang)} className="h-8 text-xs rounded-lg" />
                      </div>
                      {pinInput && pinInput.length < 4 && <p className="text-xs text-destructive">{t('pinLengthError', lang)}</p>}
                      {pinInput && pinConfirm && pinInput !== pinConfirm && <p className="text-xs text-destructive">{t('pinMismatch', lang)}</p>}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowPinSetup(false); setPinInput(''); setPinConfirm('') }} className="rounded-lg">{t('cancel', lang)}</Button>
                        <Button size="sm" disabled={pinInput.length < 4 || pinInput !== pinConfirm}
                          onClick={async () => {
                            if (store.settings.pinEnabled) {
                              updateSettings.mutate({ pinEnabled: false, pinHash: '' })
                            } else {
                              const hashed = await hashPin(pinInput)
                              updateSettings.mutate({ pinEnabled: true, pinHash: hashed })
                            }
                            setShowPinSetup(false); setPinInput(''); setPinConfirm('')
                          }}
                          className="rounded-lg">{store.settings.pinEnabled ? t('disablePin', lang) : t('enablePin', lang)}</Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ DELETE CONFIRM ═══ */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure', lang)}</AlertDialogTitle>
            <AlertDialogDescription>{t('thisActionCannot', lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteProduct.mutate(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg">{t('delete', lang)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══ PRODUCT CARD — Grid ══════════════════════════════════════════════════
function ProductCardGrid({ product: p, lang, currency, onEdit, onConsume, onSell, onSession, onFavorite, onDelete }: {
  product: Product; lang: string; currency: string;
  onEdit: () => void; onConsume: () => void; onSell: () => void; onSession: () => void; onFavorite: () => void; onDelete: () => void;
}) {
  return (
    <Card className={`group relative overflow-hidden transition-all hover:shadow-xl cursor-pointer rounded-xl ${getTypeGlow(p.type)} ${getTypeStripe(p.type)}`}
      onClick={onEdit}>
      {p.picture && (
        <div className="w-full h-28 overflow-hidden"><img src={p.picture} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>
      )}
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{p.name}</h3>
            {p.brand && <p className="text-[10px] text-muted-foreground truncate">{p.brand}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onFavorite() }} className="shrink-0 transition-transform hover:scale-125">
            <Heart className={`size-3.5 ${p.favorite ? 'fill-red-400 text-red-400' : 'text-muted-foreground/30'}`} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded-full ${getTypeColor(p.type)}`}>{p.type}</Badge>
          {p.thc > 0 && <span className="text-[9px] text-muted-foreground">{p.thc}%</span>}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-bold">{p.amount.toFixed(1)}g</span>
          {p.price > 0 && <span className="text-[10px] text-muted-foreground">{currency}{p.price.toFixed(0)}</span>}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <StarRating value={p.rating} readonly />
          {p.lastConsumed && <span className="text-[9px] text-muted-foreground">{formatRelativeTime(p.lastConsumed, lang)}</span>}
        </div>
        <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1 px-0 rounded-full" onClick={onConsume}>
            <Flame className="size-2.5 mr-0.5 text-teal-400" />{t('consume', lang)}
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1 px-0 rounded-full" onClick={onSession}>
            <Users className="size-2.5 mr-0.5" />
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1 px-0 rounded-full" onClick={onSell}>
            <DollarSign className="size-2.5 mr-0.5 text-green-400" />{t('sell', lang)}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full"><span className="text-muted-foreground text-xs">···</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit3 className="size-3 mr-2" />{t('editProduct', lang)}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="size-3 mr-2" />{t('delete', lang)}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══ PRODUCT CARD — List ══════════════════════════════════════════════════
function ProductCardList({ product: p, lang, currency, onEdit, onConsume, onSell, onSession, onFavorite, onDelete }: {
  product: Product; lang: string; currency: string;
  onEdit: () => void; onConsume: () => void; onSell: () => void; onSession: () => void; onFavorite: () => void; onDelete: () => void;
}) {
  return (
    <Card className={`p-2.5 flex items-center gap-3 cursor-pointer hover:shadow-lg transition-all rounded-xl ${getTypeStripe(p.type)}`} onClick={onEdit}>
      {p.picture ? (
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"><img src={p.picture} alt={p.name} className="w-full h-full object-cover" /></div>
      ) : (
        <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"><Leaf className="size-4 text-muted-foreground/30" /></div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm truncate">{p.name}</h3>
          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 rounded-full ${getTypeColor(p.type)}`}>{p.type}</Badge>
          <button onClick={(e) => { e.stopPropagation(); onFavorite() }} className="shrink-0">
            <Heart className={`size-3 ${p.favorite ? 'fill-red-400 text-red-400' : 'text-muted-foreground/30'}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {p.brand && <span className="text-[10px] text-muted-foreground">{p.brand}</span>}
          {p.thc > 0 && <span className="text-[10px] text-muted-foreground">{p.thc}%</span>}
          <span className="text-[10px] font-bold">{p.amount.toFixed(1)}g</span>
          {p.price > 0 && <span className="text-[10px] text-muted-foreground">{currency}{p.price.toFixed(0)}</span>}
          <StarRating value={p.rating} readonly />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full" onClick={onConsume}><Flame className="size-2.5 text-teal-400" /></Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full" onClick={onSession}><Users className="size-2.5" /></Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full" onClick={onSell}><DollarSign className="size-2.5 text-green-400" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full"><span className="text-muted-foreground text-xs">···</span></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit3 className="size-3 mr-2" />{t('editProduct', lang)}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="size-3 mr-2" />{t('delete', lang)}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

// ═══ PRODUCT CARD — Compact ══════════════════════════════════════════════
function ProductCardCompact({ product: p, lang, currency, onEdit, onConsume, onSell, onFavorite }: {
  product: Product; lang: string; currency: string;
  onEdit: () => void; onConsume: () => void; onSell: () => void; onFavorite: () => void;
}) {
  return (
    <Card className={`p-2 cursor-pointer hover:shadow-lg transition-all rounded-xl ${getTypeStripe(p.type)}`} onClick={onEdit}>
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-[10px] font-bold truncate">{p.name}</h3>
        <button onClick={(e) => { e.stopPropagation(); onFavorite() }}>
          <Heart className={`size-2.5 ${p.favorite ? 'fill-red-400 text-red-400' : 'text-muted-foreground/30'}`} />
        </button>
      </div>
      <Badge variant="outline" className={`text-[8px] px-1 py-0 rounded-full mb-0.5 ${getTypeColor(p.type)}`}>{p.type}</Badge>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold">{p.amount.toFixed(1)}g</span>
        {p.price > 0 && <span className="text-[9px] text-muted-foreground">{currency}{p.price.toFixed(0)}</span>}
      </div>
      <div className="flex items-center gap-0.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="h-5 text-[7px] flex-1 px-0 rounded-full" onClick={onConsume}>
          <Flame className="size-2 text-teal-400" />
        </Button>
        <Button size="sm" variant="outline" className="h-5 text-[7px] flex-1 px-0 rounded-full" onClick={onSell}>
          <DollarSign className="size-2 text-green-400" />
        </Button>
      </div>
    </Card>
  )
}
