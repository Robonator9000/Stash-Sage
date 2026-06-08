'use client'

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { t } from '@/lib/translations'
import { useStore, type Product, type AppSettings, defaultSettings } from '@/lib/store'
import { toast } from 'sonner'

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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Plus, Settings, Sun, Moon, LayoutGrid, List, Grid3X3,
  Heart, Star, ChevronDown, MoreVertical, Trash2, Edit3,
  Flame, DollarSign, Clock, Users, Zap, Package, TrendingUp,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Download,
  Upload, Copy, Lock, Unlock, X, Timer, RotateCw, Hash,
  Leaf, Archive, Activity, ShoppingCart, Eye, Filter, ArrowUpDown,
  Pause, Cloud, Sparkles
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
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const months = Math.floor(days / 30)
  if (mins < 1) return 'Just now'
  if (mins < 60) return t('minutesAgo', lang).replace('{n}', String(mins))
  if (hours < 24) return t('hoursAgo', lang).replace('{n}', String(hours))
  if (days < 30) return t('daysAgo', lang).replace('{n}', String(days))
  return t('monthsAgo', lang).replace('{n}', String(months))
}

function getTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'indica': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'sativa': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'hybrid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
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

// ── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'sm' }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'size-3.5' : 'size-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={readonly} onClick={() => onChange?.(i)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          <Star className={`${sz} ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
        </button>
      ))}
    </div>
  )
}

// ── Theme Toggle (hydration-safe) ────────────────────────────────────────────
function ThemeToggleButton({ resolvedTheme, onToggle }: { resolvedTheme: string | undefined; onToggle: () => void }) {
  // resolvedTheme is undefined during SSR, so we render a placeholder
  // to avoid hydration mismatch between server and client.
  // Using useSyncExternalStore to detect client mount without setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},  // subscribe (noop)
    () => true,       // getSnapshot (client)
    () => false       // getServerSnapshot
  )
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8">
        <Sun className="size-3.5 opacity-50" />
      </Button>
    )
  }
  return (
    <Button variant="ghost" size="icon" className="size-8" onClick={onToggle}>
      {resolvedTheme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </Button>
  )
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function Home() {
  const queryClient = useQueryClient()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const store = useStore()
  const lang = store.settings.language

  // ── Local state ──────────────────────────────────────────────────────────
  const [searchDebounced, setSearchDebounced] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [historyPage, setHistoryPage] = useState(1)

  // Product form state
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

  // Animation state
  const [smokeEffects, setSmokeEffects] = useState<Array<{id: number; x: number; y: number}>>([])
  const [dollarEffects, setDollarEffects] = useState<Array<{id: number; x: number; y: number}>>([])

  // Sell form
  const [sellGramsPerPortion, setSellGramsPerPortion] = useState('0.5')
  const [sellNumPortions, setSellNumPortions] = useState('1')
  const [sellPricePerPortion, setSellPricePerPortion] = useState('')
  const [sellNote, setSellNote] = useState('')

  // Session form
  const [sessionPeople, setSessionPeople] = useState(2)
  const [sessionHits, setSessionHits] = useState(0)
  const [sessionTimerRunning, setSessionTimerRunning] = useState(false)
  const [sessionTimerValue, setSessionTimerValue] = useState(0)
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionRotationIndex, setSessionRotationIndex] = useState(0)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval>>()

  // Settings form
  const [settingsTab, setSettingsTab] = useState<'personalization' | 'danger'>('personalization')
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [showPinSetup, setShowPinSetup] = useState(false)

  // ── Debounced search ────────────────────────────────────────────────────
  const handleSearch = useCallback((val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchDebounced(val)
      setPage(1)
    }, 300)
  }, [])

  // ── Queries ─────────────────────────────────────────────────────────────
  const productsQuery = useQuery({
    queryKey: ['products', searchDebounced, store.filterBy, store.sortBy, page],
    queryFn: () => api.get(`/api/products?search=${encodeURIComponent(searchDebounced)}&filter=${store.filterBy}&sort=${store.sortBy}&page=${page}&limit=50`),
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

  // ── Sync settings from API ──────────────────────────────────────────────
  useEffect(() => {
    if (settingsQuery.data) {
      store.setSettings(settingsQuery.data)
    }
  }, [settingsQuery.data, store.setSettings])

  // ── Apply theme from settings on initial load ──────────────────────────
  const appliedThemeRef = useRef(false)
  useEffect(() => {
    if (!appliedThemeRef.current && settingsQuery.data?.theme) {
      appliedThemeRef.current = true
      setTheme(settingsQuery.data.theme)
    }
  }, [settingsQuery.data?.theme, setTheme])

  // ── Mutations ───────────────────────────────────────────────────────────
  const createProduct = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      store.closeAllModals()
      toast.success('Product added!')
    },
    onError: () => toast.error('Failed to add product'),
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.put(`/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      store.closeAllModals()
      toast.success('Product updated!')
    },
    onError: () => toast.error('Failed to update product'),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.del(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setDeleteConfirm(null)
      store.closeAllModals()
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })

  // ── Animation triggers ──────────────────────────────────────────────────
  const triggerSmokeEffect = useCallback(() => {
    const id = Date.now()
    const x = 40 + Math.random() * 20
    const y = 30 + Math.random() * 20
    setSmokeEffects(prev => [...prev, { id, x, y }])
    setTimeout(() => setSmokeEffects(prev => prev.filter(e => e.id !== id)), 1300)
  }, [])

  const triggerDollarEffect = useCallback(() => {
    const effects: Array<{id: number; x: number; y: number}> = []
    for (let i = 0; i < 4; i++) {
      effects.push({
        id: Date.now() + i,
        x: 30 + Math.random() * 40,
        y: 40 + Math.random() * 20,
      })
    }
    setDollarEffects(effects)
    setTimeout(() => setDollarEffects([]), 1500)
  }, [])

  const consumeProduct = useMutation({
    mutationFn: ({ id, amount, consumedAt }: { id: string; amount: number; consumedAt?: string }) =>
      api.post(`/api/products/${id}/consume`, { amount, consumedAt }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['consumption'] })
      triggerSmokeEffect()
      store.closeAllModals()
      toast.success(`Consumed ${consumeAmount}g`)
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
      triggerDollarEffect()
      store.closeAllModals()
      toast.success('Sold successfully!')
      if (data.lowStock) {
        toast.warning(t('lowStockAlert', lang))
      }
    },
    onError: () => toast.error('Failed to sell'),
  })

  const toggleFavorite = useMutation({
    mutationFn: (id: string) => api.post(`/api/products/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateSettings = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put('/api/settings', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      if (data.theme) setTheme(data.theme)
      toast.success('Settings updated')
    },
    onError: () => toast.error('Failed to update settings'),
  })

  const createSession = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['consumption'] })
      store.closeAllModals()
      toast.success('Session completed!')
    },
    onError: () => toast.error('Failed to create session'),
  })

  // ── Form reset helpers ──────────────────────────────────────────────────
  const resetProductForm = useCallback(() => {
    setFormName(''); setFormStrain(''); setFormType('hybrid'); setFormCustomType('')
    setFormThc(''); setFormCbd(''); setFormAmount(''); setFormPrice('')
    setFormRating(0); setFormBrand(''); setFormNotes(''); setFormTags('')
    setFormEffects(''); setFormPicture(null)
  }, [])

  const populateProductForm = useCallback((p: Product) => {
    setFormName(p.name); setFormStrain(p.strain); setFormType(['indica', 'sativa', 'hybrid'].includes(p.type?.toLowerCase()) ? p.type.toLowerCase() : 'custom')
    setFormCustomType(['indica', 'sativa', 'hybrid'].includes(p.type?.toLowerCase()) ? '' : p.type)
    setFormThc(String(p.thc)); setFormCbd(String(p.cbd)); setFormAmount(String(p.amount))
    setFormPrice(String(p.price)); setFormRating(p.rating); setFormBrand(p.brand || '')
    setFormNotes(p.notes || ''); setFormTags(p.tags || ''); setFormEffects(p.effects || '')
    setFormPicture(p.picture)
  }, [])

  // Handlers that open modals AND reset/populate forms (avoiding setState in effects)
  const handleOpenAddProduct = useCallback(() => {
    resetProductForm()
    store.openAddProduct()
  }, [resetProductForm, store])

  const handleOpenEditProduct = useCallback((p: Product) => {
    populateProductForm(p)
    store.openEditProduct(p)
  }, [populateProductForm, store])

  const handleOpenConsume = useCallback((p: Product) => {
    setConsumeAmount('0.5')
    setConsumeTime('')
    setConsumeMode('quick')
    store.openConsume(p)
  }, [store])

  const handleOpenSell = useCallback((p: Product) => {
    setSellGramsPerPortion('0.5')
    setSellNumPortions('1')
    setSellPricePerPortion('')
    setSellNote('')
    store.openSell(p)
  }, [store])

  const handleOpenSession = useCallback((p: Product) => {
    const defaults = store.settings.sessionDefaults || defaultSettings.sessionDefaults
    setSessionPeople(defaults.defaultPeople)
    setSessionHits(0)
    setSessionTimerRunning(false)
    setSessionTimerValue(0)
    setSessionNotes('')
    setSessionRotationIndex(0)
    store.openSession(p)
  }, [store])

  // Session timer
  useEffect(() => {
    if (sessionTimerRunning) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTimerValue(v => v + (store.settings.showTimerMs ? 10 : 100))
      }, store.settings.showTimerMs ? 10 : 100)
    } else {
      clearInterval(sessionTimerRef.current)
    }
    return () => clearInterval(sessionTimerRef.current)
  }, [sessionTimerRunning, store.settings.showTimerMs])

  // ── Computed values ─────────────────────────────────────────────────────
  const products = productsQuery.data?.products || []
  const totalPages = productsQuery.data?.totalPages || 1
  const totalProductsCount = productsQuery.data?.total || 0
  const stats = statsQuery.data
  const consumptionLogs = consumptionQuery.data?.logs || []
  const consumptionTotalPages = consumptionQuery.data?.totalPages || 1

  const sellTotalGrams = useMemo(() => {
    return parseFloat(sellGramsPerPortion || '0') * parseFloat(sellNumPortions || '0')
  }, [sellGramsPerPortion, sellNumPortions])

  const sellTotalValue = useMemo(() => {
    return parseFloat(sellPricePerPortion || '0') * parseFloat(sellNumPortions || '0')
  }, [sellPricePerPortion, sellNumPortions])

  const sellProfit = useMemo(() => {
    if (!store.sellingProduct) return 0
    const costPerGram = store.sellingProduct.price / Math.max(store.sellingProduct.amount + sellTotalGrams, 0.01)
    return sellTotalValue - (costPerGram * sellTotalGrams)
  }, [store.sellingProduct, sellTotalGrams, sellTotalValue])

  const formatTimer = (ms: number) => {
    const secs = Math.floor(ms / 1000)
    const mins = Math.floor(secs / 60)
    const remainSecs = secs % 60
    const remainMs = store.settings.showTimerMs ? `.${String(Math.floor((ms % 1000) / 10)).padStart(2, '0')}` : ''
    return `${mins}:${String(remainSecs).padStart(2, '0')}${remainMs}`
  }

  // ── Backup / Export ─────────────────────────────────────────────────────
  const handleExportJson = async () => {
    try {
      const data = await api.get('/api/backup')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `stash-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click(); URL.revokeObjectURL(url)
      toast.success(t('exportSuccess', lang))
    } catch { toast.error('Export failed') }
  }

  const handleExportCsv = async () => {
    try {
      const prods = productsQuery.data?.products || []
      if (prods.length === 0) { toast.error('No data to export'); return }
      const headers = ['Name', 'Strain', 'Type', 'THC', 'CBD', 'Amount', 'Price', 'Rating', 'Brand', 'Notes', 'Tags', 'Effects', 'Favorite', 'Created']
      const rows = prods.map((p: Product) => [
        p.name, p.strain, p.type, p.thc, p.cbd, p.amount, p.price, p.rating,
        p.brand || '', (p.notes || '').replace(/"/g, '""'), p.tags, p.effects, p.favorite, p.createdAt
      ].map(v => `"${v}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `stash-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url)
      toast.success(t('exportSuccess', lang))
    } catch { toast.error('Export failed') }
  }

  const handleCopyBackup = async () => {
    try {
      const data = await api.get('/api/backup')
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      toast.success(t('copiedToClipboard', lang))
    } catch { toast.error('Copy failed') }
  }

  const handleImportBackup = async (mode: 'replace' | 'merge') => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        await api.post('/api/backup', { mode, data })
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
        queryClient.invalidateQueries({ queryKey: ['settings'] })
        queryClient.invalidateQueries({ queryKey: ['consumption'] })
        toast.success(t('importSuccess', lang))
      } catch { toast.error(t('importError', lang)) }
    }
    input.click()
  }

  // ── Picture upload helper ───────────────────────────────────────────────
  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFormPicture(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Submit handlers ─────────────────────────────────────────────────────
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
    if (store.editingProduct) {
      updateProduct.mutate({ id: store.editingProduct.id, data })
    } else {
      createProduct.mutate(data)
    }
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
    const sessionAmount = store.settings.sessionDefaults?.defaultAmount ?? 0.5
    createSession.mutate({
      productId: store.sessionProduct.id,
      amount: sessionAmount,
      people: sessionPeople,
      hitsCount: sessionHits,
      notes: sessionNotes || null,
      bowlsPerPerson: store.settings.sessionDefaults?.defaultGramsPerBowl ?? 0.25,
      rotationEnabled: store.settings.sessionDefaults?.rotationEnabled ?? false,
    })
  }

  // ── Currency ────────────────────────────────────────────────────────────
  const currency = store.settings.currency || '$'

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-3 py-2">
          {/* Top row */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold gradient-text flex items-center gap-1.5 shrink-0">
              <Leaf className="size-5" /> Stash Tracker
            </h1>
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('searchPlaceholder', lang)}
                className="pl-8 h-8 bg-muted/50 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={handleOpenAddProduct}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 h-8 text-xs">
                <Plus className="size-3.5 mr-0.5" />{t('addProduct', lang)}
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => store.openSettings()}>
                <Settings className="size-3.5" />
              </Button>
              <ThemeToggleButton
                resolvedTheme={resolvedTheme}
                onToggle={() => { const next = resolvedTheme === 'dark' ? 'light' : 'dark'; setTheme(next); updateSettings.mutate({ theme: next }); }}
              />
            </div>
          </div>
          {/* Filter row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <ArrowUpDown className="size-3" />
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
            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <Filter className="size-3" />
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
            {/* Layout toggles */}
            <div className="flex items-center border rounded-md overflow-hidden">
              {([['grid', LayoutGrid], ['list', List], ['compact', Grid3X3]] as const).map(([l, Icon]) => (
                <Button key={l} variant="ghost" size="icon"
                  className={`size-8 rounded-none ${store.layout === l ? 'bg-muted' : ''}`}
                  onClick={() => store.setLayout(l as 'grid' | 'list' | 'compact')}>
                  <Icon className="size-3.5" />
                </Button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {totalProductsCount} {t('totalProducts', lang).toLowerCase()}
            </span>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-3">
        <Tabs value={store.activeTab} onValueChange={(v) => store.setActiveTab(v as 'inventory' | 'dashboard' | 'history')}>
          <TabsList className="mb-2">
            <TabsTrigger value="inventory" className="text-xs"><Package className="size-3 mr-1" />{t('inventory', lang)}</TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs"><BarChart3 className="size-3 mr-1" />{t('dashboard', lang)}</TabsTrigger>
            <TabsTrigger value="history" className="text-xs"><Clock className="size-3 mr-1" />{t('history', lang)}</TabsTrigger>
          </TabsList>

          {/* ═══ INVENTORY TAB ═══ */}
          <TabsContent value="inventory">
            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
                {[
                  { key: 'totalProducts', value: stats.totalProducts, icon: Package, color: 'text-teal-400' },
                  { key: 'totalAmount', value: `${stats.totalAmount.toFixed(1)}g`, icon: Archive, color: 'text-emerald-400' },
                  { key: 'averageRating', value: stats.averageRating.toFixed(1), icon: Star, color: 'text-amber-400' },
                  { key: 'averageTHC', value: `${stats.averageTHC.toFixed(1)}%`, icon: Zap, color: 'text-purple-400' },
                  { key: 'totalValue', value: `${currency}${stats.totalValue.toFixed(0)}`, icon: DollarSign, color: 'text-green-400' },
                  { key: 'totalSessions', value: stats.totalSessions, icon: Users, color: 'text-blue-400' },
                ].map(({ key, value, icon: Icon, color }) => (
                  <Card key={key} className="py-1.5 px-2.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`size-3.5 ${color}`} />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t(key, lang)}</p>
                        <p className="text-xs font-semibold">{value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Loading */}
            {productsQuery.isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-4"><Skeleton className="h-32 w-full" /></Card>
                ))}
              </div>
            )}

            {/* Empty states */}
            {!productsQuery.isLoading && products.length === 0 && !searchDebounced && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Leaf className="size-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('noProductsYet', lang)}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t('addFirstProductHint', lang)}</p>
                <Button onClick={handleOpenAddProduct}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                  <Plus className="size-4 mr-1" />{t('addProduct', lang)}
                </Button>
              </div>
            )}
            {!productsQuery.isLoading && products.length === 0 && searchDebounced && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="size-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('noProductsFound', lang)}</h3>
                <p className="text-muted-foreground text-sm">{t('adjustSearchHint', lang)}</p>
              </div>
            )}

            {/* Grid Layout */}
            {products.length > 0 && store.layout === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p: Product) => (
                  <ProductCardGrid key={p.id} product={p} lang={lang} currency={currency}
                    onEdit={() => handleOpenEditProduct(p)}
                    onConsume={() => handleOpenConsume(p)}
                    onSell={() => handleOpenSell(p)}
                    onSession={() => handleOpenSession(p)}
                    onFavorite={() => toggleFavorite.mutate(p.id)}
                    onDelete={() => setDeleteConfirm(p.id)}
                  />
                ))}
              </div>
            )}

            {/* List Layout */}
            {products.length > 0 && store.layout === 'list' && (
              <div className="flex flex-col gap-1.5">
                {products.map((p: Product) => (
                  <ProductCardList key={p.id} product={p} lang={lang} currency={currency}
                    onEdit={() => handleOpenEditProduct(p)}
                    onConsume={() => handleOpenConsume(p)}
                    onSell={() => handleOpenSell(p)}
                    onSession={() => handleOpenSession(p)}
                    onFavorite={() => toggleFavorite.mutate(p.id)}
                    onDelete={() => setDeleteConfirm(p.id)}
                  />
                ))}
              </div>
            )}

            {/* Compact Layout */}
            {products.length > 0 && store.layout === 'compact' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                {products.map((p: Product) => (
                  <ProductCardCompact key={p.id} product={p} lang={lang} currency={currency}
                    onEdit={() => handleOpenEditProduct(p)}
                    onConsume={() => handleOpenConsume(p)}
                    onSession={() => handleOpenSession(p)}
                    onFavorite={() => toggleFavorite.mutate(p.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </TabsContent>

          {/* ═══ DASHBOARD TAB ═══ */}
          <TabsContent value="dashboard">
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-64 w-full" /></Card>)}
              </div>
            ) : stats ? (
              <div className="space-y-4">
                {/* Key Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: t('totalProducts', lang), value: stats.totalProducts, icon: Package, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                    { label: t('totalAmount', lang), value: `${stats.totalAmount.toFixed(1)}g`, icon: Archive, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: t('totalValue', lang), value: `${currency}${stats.totalValue.toFixed(0)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: t('totalSessions', lang), value: stats.totalSessions, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${bg}`}><Icon className={`size-5 ${color}`} /></div>
                        <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Consumption Trend */}
                  <Card className="p-4">
                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium">{t('consumptionTrend', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.consumptionTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v: string) => v.slice(5)} />
                            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                            <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stock Distribution */}
                  <Card className="p-4">
                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium">{t('stockOverview', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-64 flex items-center justify-center">
                        {stats.stockDistribution.inStock + stats.stockDistribution.lowStock + stats.stockDistribution.outOfStock > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={[
                                  { name: t('filterInStock', lang), value: stats.stockDistribution.inStock, fill: '#10b981' },
                                  { name: t('filterLowStock', lang), value: stats.stockDistribution.lowStock, fill: '#f59e0b' },
                                  { name: t('filterOutOfStock', lang), value: stats.stockDistribution.outOfStock, fill: '#ef4444' },
                                ]}
                                dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                              >
                                {[
                                  { name: 'inStock', fill: '#10b981' },
                                  { name: 'lowStock', fill: '#f59e0b' },
                                  { name: 'outOfStock', fill: '#ef4444' },
                                ].map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                              </Pie>
                              <Legend />
                              <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            </RechartsPie>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-muted-foreground text-sm">{t('noProductsYet', lang)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Strains */}
                  <Card className="p-4">
                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium">{t('topStrains', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-64">
                        {stats.topStrains.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topStrains} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={80} />
                              <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                              <Bar dataKey="rating" radius={[0, 4, 4, 0]}>
                                {stats.topStrains.map((s) => <Cell key={s.id} fill={getTypeChartColor(s.type)} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-sm">{t('noProductsYet', lang)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spending by Month */}
                  <Card className="p-4">
                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium">{t('totalSpent', lang)} — {t('thisMonth', lang)}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="h-64">
                        {stats.spendingByMonth.some(m => m.total > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.spendingByMonth}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v: string) => v.slice(5)} />
                              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                              <RechartsTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                              <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-sm">{t('noActivity', lang)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* ═══ HISTORY TAB ═══ */}
          <TabsContent value="history">
            <div className="space-y-4">
              {/* Date filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs text-muted-foreground">{t('from', lang)}</Label>
                <Input type="date" value={historyFrom} onChange={(e) => { setHistoryFrom(e.target.value); setHistoryPage(1) }}
                  className="h-8 w-auto text-xs" />
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={historyTo} onChange={(e) => { setHistoryTo(e.target.value); setHistoryPage(1) }}
                  className="h-8 w-auto text-xs" />
                {(historyFrom || historyTo) && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs"
                    onClick={() => { setHistoryFrom(''); setHistoryTo(''); setHistoryPage(1) }}>
                    <X className="size-3 mr-1" />Clear
                  </Button>
                )}
              </div>

              {consumptionQuery.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Card key={i} className="p-3"><Skeleton className="h-12 w-full" /></Card>)}</div>
              ) : consumptionLogs.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Activity className="size-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-1">{t('noActivity', lang)}</h3>
                </div>
              ) : (
                <div className="space-y-2">
                  {consumptionLogs.map((log: ConsumptionLog) => (
                    <Card key={log.id} className="p-3 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${log.type === 'sell' ? 'bg-green-500/10' : 'bg-teal-500/10'}`}>
                        {log.type === 'sell' ? <DollarSign className="size-4 text-green-400" /> : <Flame className="size-4 text-teal-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.product?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.type === 'sell' ? t('sell', lang) : t('consume', lang)} — {log.amount}g
                          {log.note && ` — ${log.note}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.consumedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {consumptionTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>Prev</Button>
                  <span className="text-sm text-muted-foreground">Page {historyPage} of {consumptionTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={historyPage >= consumptionTotalPages} onClick={() => setHistoryPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto border-t border-border py-3 text-center text-xs text-muted-foreground">
        🌿 Stash Tracker — {t('manageConsumption', lang)}
      </footer>

      {/* ═══ ADD/EDIT PRODUCT DIALOG ═══ */}
      <Dialog open={store.addProductOpen || !!store.editingProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{store.editingProduct ? t('editProduct', lang) : t('addProduct', lang)}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <Label className="text-xs">{t('strainName', lang)} *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('strainNamePlaceholder', lang)} />
            </div>
            {/* Brand */}
            <div className="space-y-1">
              <Label className="text-xs">{t('brandDispensary', lang)}</Label>
              <Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder={t('selectBrand', lang)} />
            </div>
            {/* Type */}
            <div className="space-y-1">
              <Label className="text-xs">{t('strainType', lang)}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="custom">{t('custom', lang)}</SelectItem>
                </SelectContent>
              </Select>
              {formType === 'custom' && (
                <Input value={formCustomType} onChange={(e) => setFormCustomType(e.target.value)} placeholder={t('customStrainPlaceholder', lang)} className="mt-1" />
              )}
            </div>
            {/* THC / CBD */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t('thcPercent', lang)}</Label>
                <Input type="number" step="0.1" value={formThc} onChange={(e) => setFormThc(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('cbdPercent', lang)}</Label>
                <Input type="number" step="0.1" value={formCbd} onChange={(e) => setFormCbd(e.target.value)} />
              </div>
            </div>
            {/* Amount / Price */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t('amountGrams', lang)}</Label>
                <Input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder={t('amountPlaceholder', lang)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('priceLabel', lang)} ({currency})</Label>
                <Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder={t('pricePlaceholder', lang)} />
              </div>
            </div>
            {/* Rating */}
            <div className="space-y-1">
              <Label className="text-xs">{t('rating', lang)}</Label>
              <StarRating value={formRating} onChange={setFormRating} size="md" />
            </div>
            {/* Tags */}
            <div className="space-y-1">
              <Label className="text-xs">{t('tags', lang)}</Label>
              <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="e.g., relaxing, euphoric" />
            </div>
            {/* Effects */}
            <div className="space-y-1">
              <Label className="text-xs">{t('effects', lang)}</Label>
              <Input value={formEffects} onChange={(e) => setFormEffects(e.target.value)} placeholder="e.g., happy, creative" />
            </div>
            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">{t('notesLabel', lang)}</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder={t('notesPlaceholder', lang)} rows={2} />
            </div>
            {/* Picture */}
            <div className="space-y-1">
              <Label className="text-xs">{formPicture ? t('changePicture', lang) : t('uploadPicture', lang)}</Label>
              <Input type="file" accept="image/*" onChange={handlePictureUpload} className="text-xs" />
              {formPicture && (
                <div className="relative mt-1 w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={formPicture} alt="Product" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormPicture(null)}
                    className="absolute top-0.5 right-0.5 bg-destructive rounded-full p-0.5"><X className="size-3 text-white" /></button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {store.editingProduct && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(store.editingProduct!.id)} className="mr-auto">
                <Trash2 className="size-3.5 mr-1" />{t('delete', lang)}
              </Button>
            )}
            <Button variant="outline" onClick={() => store.closeAllModals()}>{t('cancel', lang)}</Button>
            <Button onClick={handleSubmitProduct} disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONSUME DIALOG ═══ */}
      <Dialog open={!!store.consumingProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="size-4 text-teal-400" />
              {consumeMode === 'session' ? t('session', lang) : t('consume', lang)} — {store.consumingProduct?.name}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {store.consumingProduct && (
            <div className="space-y-3">
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setConsumeMode('quick')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    consumeMode === 'quick'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flame className="size-3" />
                  {t('consume', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setConsumeMode('session')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    consumeMode === 'session'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="size-3" />
                  {t('session', lang)}
                </button>
              </div>

              {/* Quick consume mode */}
              {consumeMode === 'quick' && (
                <>
                  <div className="text-center text-2xl font-bold text-teal-400">
                    {consumeAmount}g
                  </div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {[0.1, 0.25, 0.5, 1, 2].map(v => (
                      <Button key={v} variant="outline" size="sm" className="h-7 text-xs px-2"
                        onClick={() => setConsumeAmount(String(parseFloat(consumeAmount) + v))}>+{v}</Button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('amount', lang)} ({t('grams', lang)})</Label>
                    <Input type="number" step="0.01" value={consumeAmount} onChange={(e) => setConsumeAmount(e.target.value)} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('amount', lang)}: {store.consumingProduct.amount.toFixed(1)}g {t('grams', lang)} {t('filterInStock', lang).toLowerCase()}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('setConsumptionTime', lang)}</Label>
                    <Input type="datetime-local" value={consumeTime} onChange={(e) => setConsumeTime(e.target.value)} />
                  </div>
                </>
              )}

              {/* Session mode */}
              {consumeMode === 'session' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('amount', lang)} ({t('grams', lang)})</Label>
                    <Input type="number" step="0.01" value={consumeAmount} onChange={(e) => setConsumeAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('people', lang)}</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="size-7" onClick={() => setSessionPeople(p => Math.max(1, p - 1))}>-</Button>
                      <span className="text-base font-bold w-6 text-center">{sessionPeople}</span>
                      <Button variant="outline" size="icon" className="size-7" onClick={() => setSessionPeople(p => p + 1)}>+</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('hits', lang)}</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSessionHits(h => Math.max(0, h - 1))}>-</Button>
                      <span className="text-base font-bold w-6 text-center">{sessionHits}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-teal-500/20" onClick={() => setSessionHits(h => h + 1)}>+1</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSessionHits(h => h + 5)}>+5</Button>
                    </div>
                  </div>
                  {/* Timer */}
                  <div className="space-y-1">
                    <Label className="text-xs">{t('hitTimer', lang)}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-bold">{formatTimer(sessionTimerValue)}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSessionTimerRunning(!sessionTimerRunning)}>
                        {sessionTimerRunning ? <Pause className="size-3" /> : <Timer className="size-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSessionTimerRunning(false); setSessionTimerValue(0) }}>
                        <RotateCw className="size-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Rotation */}
                  {store.settings.sessionDefaults?.rotationEnabled && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('rotation', lang)}</Label>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: sessionPeople }).map((_, i) => (
                          <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${i === sessionRotationIndex ? 'border-teal-400 bg-teal-500/20 text-teal-400' : 'border-muted-foreground/30'}`}>
                            {i + 1}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="h-7 text-xs ml-1" onClick={() => setSessionRotationIndex(i => (i + 1) % sessionPeople)}>
                          {t('nextHit', lang)}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">{t('sessionNotes', lang)}</Label>
                    <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder={t('sessionNotesPlaceholder', lang)} rows={2} />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => store.closeAllModals()}>{t('cancel', lang)}</Button>
            {consumeMode === 'quick' ? (
              <Button onClick={handleSubmitConsume} disabled={consumeProduct.isPending}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <Flame className="size-3.5 mr-1" />{t('consume', lang)}
              </Button>
            ) : (
              <Button onClick={handleSubmitSession} disabled={createSession.isPending}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <Users className="size-3.5 mr-1" />{t('finishSession', lang)}
              </Button>
            )}
          </DialogFooter>
          {/* Smoke animation overlay */}
          {smokeEffects.map((effect) => (
            <div key={effect.id} className="absolute animate-smoke-puff" style={{ left: `${effect.x}%`, top: `${effect.y}%` }}>
              <Cloud className="size-8 text-muted-foreground/50" />
            </div>
          ))}
        </DialogContent>
      </Dialog>

      {/* ═══ SELL DIALOG ═══ */}
      <Dialog open={!!store.sellingProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('sell', lang)} — {store.sellingProduct?.name}</DialogTitle>
            <DialogDescription>{t('divideIntoPortions', lang)}</DialogDescription>
          </DialogHeader>
          {store.sellingProduct && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t('gramsPerPortion', lang)}</Label>
                  <Input type="number" step="0.01" value={sellGramsPerPortion} onChange={(e) => setSellGramsPerPortion(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('numberOfPortions', lang)}</Label>
                  <Input type="number" step="1" value={sellNumPortions} onChange={(e) => setSellNumPortions(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('pricePerPortion', lang)} ({currency})</Label>
                <Input type="number" step="0.01" value={sellPricePerPortion} onChange={(e) => setSellPricePerPortion(e.target.value)} />
              </div>
              {/* Summary */}
              <Card className="p-3 bg-muted/50">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('totalToSell', lang)}</span><span>{sellTotalGrams.toFixed(2)}g</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('saleValue', lang)}</span><span>{currency}{sellTotalValue.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('remainingAfter', lang)}</span><span>{Math.max(0, store.sellingProduct.amount - sellTotalGrams).toFixed(2)}g</span></div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>{sellProfit >= 0 ? t('profit', lang) : t('loss', lang)}</span>
                    <span className={sellProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {currency}{Math.abs(sellProfit).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
              <div className="space-y-1">
                <Label className="text-xs">{t('notesLabel', lang)}</Label>
                <Input value={sellNote} onChange={(e) => setSellNote(e.target.value)} placeholder="Note (optional)" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => store.closeAllModals()}>{t('cancel', lang)}</Button>
            <Button onClick={handleSubmitSell} disabled={sellProduct.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
              <DollarSign className="size-3.5 mr-1" />{t('sell', lang)}
            </Button>
          </DialogFooter>
          {/* Dollar animation overlay */}
          {dollarEffects.map((effect) => (
            <div key={effect.id} className="absolute animate-dollar-float" style={{ left: `${effect.x}%`, top: `${effect.y}%` }}>
              <DollarSign className="size-6 text-emerald-400/80" />
            </div>
          ))}
        </DialogContent>
      </Dialog>

      {/* ═══ SESSION DIALOG ═══ */}
      <Dialog open={!!store.sessionProduct} onOpenChange={() => store.closeAllModals()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('session', lang)} — {store.sessionProduct?.name}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {store.sessionProduct && (
            <div className="space-y-4">
              {/* People */}
              <div className="space-y-1">
                <Label className="text-xs">{t('people', lang)}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setSessionPeople(p => Math.max(1, p - 1))}>-</Button>
                  <span className="text-lg font-bold w-8 text-center">{sessionPeople}</span>
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setSessionPeople(p => p + 1)}>+</Button>
                </div>
              </div>

              {/* Hits */}
              <div className="space-y-1">
                <Label className="text-xs">{t('hits', lang)}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSessionHits(h => Math.max(0, h - 1))}>-</Button>
                  <span className="text-lg font-bold w-8 text-center">{sessionHits}</span>
                  <Button variant="outline" size="sm" className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                    onClick={() => setSessionHits(h => h + 1)}>+1</Button>
                  <Button variant="outline" size="sm" onClick={() => setSessionHits(h => h + 5)}>+5</Button>
                </div>
              </div>

              {/* Timer */}
              <div className="space-y-1">
                <Label className="text-xs">{t('hitTimer', lang)}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold">{formatTimer(sessionTimerValue)}</span>
                  <Button variant="outline" size="sm" onClick={() => setSessionTimerRunning(!sessionTimerRunning)}>
                    {sessionTimerRunning ? <Pause className="size-3.5" /> : <Timer className="size-3.5" />}
                    {sessionTimerRunning ? t('pause', lang) : t('start', lang)}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSessionTimerRunning(false); setSessionTimerValue(0) }}>
                    <RotateCw className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Rotation */}
              {store.settings.sessionDefaults?.rotationEnabled && (
                <div className="space-y-1">
                  <Label className="text-xs">{t('rotation', lang)}</Label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: sessionPeople }).map((_, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i === sessionRotationIndex ? 'border-teal-400 bg-teal-500/20 text-teal-400' : 'border-muted-foreground/30'}`}>
                        {i + 1}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setSessionRotationIndex(i => (i + 1) % sessionPeople)}>
                      {t('nextHit', lang)}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bowl Calculator */}
              <Card className="p-3 bg-muted/50">
                <p className="text-xs font-medium mb-1">{t('bowlCalculator', lang)}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">{t('gramsPerBowl', lang)}</span><p className="font-medium">{store.settings.sessionDefaults?.defaultGramsPerBowl ?? 0.25}g</p></div>
                  <div><span className="text-muted-foreground">{t('totalBowls', lang)}</span><p className="font-medium">{Math.floor(store.sessionProduct.amount / (store.settings.sessionDefaults?.defaultGramsPerBowl ?? 0.25))}</p></div>
                  <div><span className="text-muted-foreground">{t('bowlsPerPerson', lang)}</span><p className="font-medium">{Math.floor(store.sessionProduct.amount / (store.settings.sessionDefaults?.defaultGramsPerBowl ?? 0.25) / sessionPeople)}</p></div>
                </div>
              </Card>

              {/* Session Notes */}
              <div className="space-y-1">
                <Label className="text-xs">{t('sessionNotes', lang)}</Label>
                <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder={t('sessionNotesPlaceholder', lang)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => store.closeAllModals()}>{t('cancel', lang)}</Button>
            <Button onClick={handleSubmitSession} disabled={createSession.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
              {t('finishSession', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SETTINGS SHEET ═══ */}
      <Sheet open={store.settingsOpen} onOpenChange={(open) => { if (!open) store.closeAllModals() }}>
        <SheetContent className="w-[400px] sm:max-w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('settings', lang)}</SheetTitle>
            <SheetDescription />
          </SheetHeader>
          <div className="mt-4">
            <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as 'personalization' | 'danger')}>
              <TabsList className="w-full">
                <TabsTrigger value="personalization" className="flex-1">{t('personalization', lang)}</TabsTrigger>
                <TabsTrigger value="danger" className="flex-1">{t('dangerZone', lang)}</TabsTrigger>
              </TabsList>

              <TabsContent value="personalization" className="space-y-4 mt-4">
                {/* Language */}
                <div className="space-y-1">
                  <Label className="text-xs">{t('language', lang)}</Label>
                  <Select value={store.settings.language} onValueChange={(v) => updateSettings.mutate({ language: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="space-y-1">
                  <Label className="text-xs">{t('theme', lang)}</Label>
                  <Select value={store.settings.theme} onValueChange={(v) => updateSettings.mutate({ theme: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{t('dark', lang)}</SelectItem>
                      <SelectItem value="light">{t('light', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div className="space-y-1">
                  <Label className="text-xs">{t('currency', lang)}</Label>
                  <Select value={store.settings.currency} onValueChange={(v) => updateSettings.mutate({ currency: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ USD</SelectItem>
                      <SelectItem value="€">€ EUR</SelectItem>
                      <SelectItem value="£">£ GBP</SelectItem>
                      <SelectItem value="¥">¥ JPY</SelectItem>
                      <SelectItem value="C$">C$ CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Decimal Precision */}
                <div className="space-y-1">
                  <Label className="text-xs">{t('decimalPrecision', lang)}</Label>
                  <Select value={String(store.settings.decimalPrecision)} onValueChange={(v) => updateSettings.mutate({ decimalPrecision: parseInt(v) })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Low Stock Threshold */}
                <div className="space-y-1">
                  <Label className="text-xs">{t('lowStockThreshold', lang)}</Label>
                  <Input type="number" step="0.5" value={store.settings.lowStockThreshold}
                    onChange={(e) => updateSettings.mutate({ lowStockThreshold: parseFloat(e.target.value) || 3 })} />
                  <p className="text-xs text-muted-foreground">{t('lowStockThresholdHint', lang)}</p>
                </div>

                {/* Show Timer MS */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">{t('showTimerMs', lang)}</Label>
                    <p className="text-xs text-muted-foreground">{t('showTimerMsHint', lang)}</p>
                  </div>
                  <Switch checked={store.settings.showTimerMs} onCheckedChange={(v) => updateSettings.mutate({ showTimerMs: v })} />
                </div>

                <Separator />

                {/* Session Defaults */}
                <p className="text-xs font-medium">{t('sessionDefaults', lang)}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('defaultAmount', lang)}</Label>
                    <Input type="number" step="0.1"
                      value={store.settings.sessionDefaults?.defaultAmount ?? 0.5}
                      onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultAmount: parseFloat(e.target.value) || 0.5 } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('defaultPeople', lang)}</Label>
                    <Input type="number" step="1"
                      value={store.settings.sessionDefaults?.defaultPeople ?? 2}
                      onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultPeople: parseInt(e.target.value) || 2 } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('defaultHitTimer', lang)}</Label>
                    <Input type="number" step="1"
                      value={store.settings.sessionDefaults?.defaultHitTimer ?? 10}
                      onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultHitTimer: parseInt(e.target.value) || 10 } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('defaultGramsPerBowl', lang)}</Label>
                    <Input type="number" step="0.05"
                      value={store.settings.sessionDefaults?.defaultGramsPerBowl ?? 0.25}
                      onChange={(e) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, defaultGramsPerBowl: parseFloat(e.target.value) || 0.25 } })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('rotationEnabled', lang)}</Label>
                  <Switch checked={store.settings.sessionDefaults?.rotationEnabled ?? false}
                    onCheckedChange={(v) => updateSettings.mutate({ sessionDefaults: { ...store.settings.sessionDefaults, rotationEnabled: v } })} />
                </div>
              </TabsContent>

              <TabsContent value="danger" className="space-y-4 mt-4">
                {/* Backup */}
                <div className="space-y-2">
                  <p className="text-xs font-medium">{t('dataBackup', lang)}</p>
                  <p className="text-xs text-muted-foreground">{t('dataBackupHint', lang)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportJson}>
                      <Download className="size-3 mr-1" />{t('exportData', lang)}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCsv}>
                      <Download className="size-3 mr-1" />{t('exportCsv', lang)}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCopyBackup}>
                      <Copy className="size-3 mr-1" />{t('copyToClipboard', lang)}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleImportBackup('replace')}>
                      <Upload className="size-3 mr-1" />{t('importData', lang)}
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs w-full" onClick={() => handleImportBackup('merge')}>
                    <Upload className="size-3 mr-1" />{t('importMerge', lang)}
                  </Button>
                  <p className="text-xs text-muted-foreground">{t('importMergeHint', lang)}</p>
                </div>

                <Separator />

                {/* PIN Lock */}
                <div className="space-y-2">
                  <p className="text-xs font-medium">{t('pinLock', lang)}</p>
                  <p className="text-xs text-muted-foreground">{t('pinLockHint', lang)}</p>
                  {!showPinSetup ? (
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                      onClick={() => setShowPinSetup(true)}>
                      {store.settings.pinEnabled ? <Unlock className="size-3 mr-1" /> : <Lock className="size-3 mr-1" />}
                      {store.settings.pinEnabled ? t('disablePin', lang) : t('enablePin', lang)}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input type="password" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder={t('enterPin', lang)} className="h-9" />
                      <Input type="password" maxLength={6} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                        placeholder={t('enterCurrentPin', lang)} className="h-9" />
                      {pinInput && pinInput.length < 4 && <p className="text-xs text-destructive">{t('pinLengthError', lang)}</p>}
                      {pinInput && pinConfirm && pinInput !== pinConfirm && <p className="text-xs text-destructive">{t('pinMismatch', lang)}</p>}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowPinSetup(false); setPinInput(''); setPinConfirm('') }}>
                          {t('cancel', lang)}
                        </Button>
                        <Button size="sm" disabled={pinInput.length < 4 || pinInput !== pinConfirm}
                          onClick={() => {
                            if (store.settings.pinEnabled) {
                              updateSettings.mutate({ pinEnabled: false, pinHash: '' })
                            } else {
                              updateSettings.mutate({ pinEnabled: true, pinHash: pinInput })
                            }
                            setShowPinSetup(false); setPinInput(''); setPinConfirm('')
                          }}>
                          {store.settings.pinEnabled ? t('disablePin', lang) : t('enablePin', lang)}
                        </Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure', lang)}</AlertDialogTitle>
            <AlertDialogDescription>{t('thisActionCannot', lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteProduct.mutate(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══ PRODUCT CARD — Grid Layout ═══════════════════════════════════════════
function ProductCardGrid({ product: p, lang, currency, onEdit, onConsume, onSell, onSession, onFavorite, onDelete }: {
  product: Product; lang: string; currency: string;
  onEdit: () => void; onConsume: () => void; onSell: () => void; onSession: () => void; onFavorite: () => void; onDelete: () => void;
}) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg cursor-pointer" onClick={onEdit}>
      {p.picture && (
        <div className="w-full h-28 overflow-hidden">
          <img src={p.picture} alt={p.name} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{p.name}</h3>
            {p.brand && <p className="text-[10px] text-muted-foreground truncate">{p.brand}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onFavorite() }}
            className="shrink-0 transition-transform hover:scale-125">
            <Heart className={`size-3.5 ${p.favorite ? 'fill-red-400 text-red-400' : 'text-muted-foreground/40'}`} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getTypeColor(p.type)}`}>
            {p.type}
          </Badge>
          {p.thc > 0 && <span className="text-[9px] text-muted-foreground">{p.thc}%</span>}
          {p.cbd > 0 && <span className="text-[9px] text-muted-foreground">{t('cbd', lang)} {p.cbd}%</span>}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-medium">{p.amount.toFixed(1)}g</span>
          {p.price > 0 && <span className="text-[10px] text-muted-foreground">{currency}{p.price.toFixed(0)}</span>}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <StarRating value={p.rating} readonly />
          <span className="text-[9px] text-muted-foreground">{formatRelativeTime(p.lastConsumed, lang)}</span>
        </div>
        <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1 px-0" onClick={onConsume}>
            <Flame className="size-2.5 mr-0.5" />{t('consume', lang)}
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1 px-0" onClick={onSession}>
            <Users className="size-2.5 mr-0.5" />{t('session', lang)}
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1 px-0" onClick={onSell}>
            <DollarSign className="size-2.5 mr-0.5" />{t('sell', lang)}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><MoreVertical className="size-2.5" /></Button>
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

// ═══ PRODUCT CARD — List Layout ═══════════════════════════════════════════
function ProductCardList({ product: p, lang, currency, onEdit, onConsume, onSell, onSession, onFavorite, onDelete }: {
  product: Product; lang: string; currency: string;
  onEdit: () => void; onConsume: () => void; onSell: () => void; onSession: () => void; onFavorite: () => void; onDelete: () => void;
}) {
  return (
    <Card className="p-2.5 flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-shadow" onClick={onEdit}>
      {p.picture ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <img src={p.picture} alt={p.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Leaf className="size-4 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-sm truncate">{p.name}</h3>
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getTypeColor(p.type)}`}>{p.type}</Badge>
          <button onClick={(e) => { e.stopPropagation(); onFavorite() }} className="shrink-0">
            <Heart className={`size-3 ${p.favorite ? 'fill-red-400 text-red-400' : 'text-muted-foreground/40'}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {p.brand && <span className="text-[10px] text-muted-foreground">{p.brand}</span>}
          {p.thc > 0 && <span className="text-[10px] text-muted-foreground">{p.thc}%</span>}
          <span className="text-[10px] font-medium">{p.amount.toFixed(1)}g</span>
          {p.price > 0 && <span className="text-[10px] text-muted-foreground">{currency}{p.price.toFixed(0)}</span>}
          <StarRating value={p.rating} readonly />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={onConsume}>
          <Flame className="size-2.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={onSession}>
          <Users className="size-2.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={onSell}>
          <DollarSign className="size-2.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><MoreVertical className="size-2.5" /></Button>
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

// ═══ PRODUCT CARD — Compact Layout ═══════════════════════════════════════
function ProductCardCompact({ product: p, lang, currency, onEdit, onConsume, onSession, onFavorite }: {
  product: Product; lang: string; currency: string;
  onEdit: () => void; onConsume: () => void; onSession: () => void; onFavorite: () => void;
}) {
  return (
    <Card className="p-2 cursor-pointer hover:shadow-md transition-shadow" onClick={onEdit}>
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-[10px] font-semibold truncate">{p.name}</h3>
        <button onClick={(e) => { e.stopPropagation(); onFavorite() }}>
          <Heart className={`size-2.5 ${p.favorite ? 'fill-red-400 text-red-400' : 'text-muted-foreground/30'}`} />
        </button>
      </div>
      <Badge variant="outline" className={`text-[8px] px-1 py-0 mb-0.5 ${getTypeColor(p.type)}`}>{p.type}</Badge>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium">{p.amount.toFixed(1)}g</span>
        <StarRating value={p.rating} readonly />
      </div>
      <div className="flex items-center gap-0.5 mt-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="h-5 text-[8px] flex-1 px-0" onClick={onConsume}>
          <Flame className="size-2" />
        </Button>
        <Button size="sm" variant="outline" className="h-5 text-[8px] flex-1 px-0" onClick={onSession}>
          <Users className="size-2" />
        </Button>
      </div>
    </Card>
  )
}
