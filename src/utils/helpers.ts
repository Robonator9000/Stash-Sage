import { Product, SortOption, FilterType } from '../types';
import { t } from './translations';

// Generate unique ID
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn('localStorage quota exceeded for key:', key);
    } else {
      console.warn('localStorage write failed for key:', key, e);
    }
    return false;
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Hash a PIN using SHA-256 (replaces insecure btoa)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Round to hundredths
export function roundToHundredth(num: number): number {
  return Math.round(num * 100) / 100;
}

// Format number with variable precision
export function formatPrecision(value: number, precision: number = 2): string {
  return value.toFixed(precision);
}

// Format currency with symbol
export function formatCurrency(value: number, currency: string): string {
  if (currency === 'EUR') return `€${value.toFixed(2)}`;
  if (currency === 'GBP') return `£${value.toFixed(2)}`;
  if (currency === 'JPY') return `¥${value.toFixed(0)}`;
  if (currency === 'CAD') return `C$${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
}

// Format date
export function formatDate(date: Date | string, lang: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('today', lang);
  if (diffDays === 1) return t('yesterday', lang);
  if (diffDays < 7) return t('daysAgo', lang).replace('{n}', String(diffDays));
  if (diffDays < 30) return t('weeksAgo', lang).replace('{n}', String(Math.floor(diffDays / 7)));
  if (diffDays < 365) return t('monthsAgo', lang).replace('{n}', String(Math.floor(diffDays / 30)));
  return t('yearsAgo', lang).replace('{n}', String(Math.floor(diffDays / 365)));
}

function tryParseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value as string | number | Date);
  return isNaN(d.getTime()) ? undefined : d;
}

// Parse dates in product
export function parseProductDates(product: Product): Product {
  return {
    ...product,
    createdAt: tryParseDate(product.createdAt) || new Date(),
    updatedAt: tryParseDate(product.updatedAt) || new Date(),
    lastConsumed: tryParseDate(product.lastConsumed),
    purchasedAt: tryParseDate(product.purchasedAt),
  };
}

// Search products
export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;

  const q = query.toLowerCase();
  return products.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.strain.toLowerCase().includes(q) ||
    (p.brand && p.brand.toLowerCase().includes(q)) ||
    (p.notes && p.notes.toLowerCase().includes(q)) ||
    (p.tags && p.tags.toLowerCase().includes(q)) ||
    (p.effects && p.effects.toLowerCase().includes(q)) ||
    p.type.toLowerCase().includes(q)
  );
}

// Sort products — favorites always first
export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];

  const favoritesFirst = (arr: Product[]) => {
    const favs = arr.filter(p => p.favorite).sort((a, b) => a.name.localeCompare(b.name));
    const rest = arr.filter(p => !p.favorite);
    return [...favs, ...rest];
  };

  switch (sortBy) {
    case 'newest':
      return favoritesFirst(sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    case 'oldest':
      return favoritesFirst(sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    case 'name':
      return favoritesFirst(sorted.sort((a, b) => a.name.localeCompare(b.name)));
    case 'rating':
      return favoritesFirst(sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
    case 'thc':
      return favoritesFirst(sorted.sort((a, b) => (b.thc || 0) - (a.thc || 0)));
    case 'amount':
      return favoritesFirst(sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0)));
    case 'price':
      return favoritesFirst(sorted.sort((a, b) => (b.price || 0) - (a.price || 0)));
    case 'favorites':
      return favoritesFirst(sorted);
    default:
      return sorted;
  }
}

// Filter products
export function filterProducts(products: Product[], filterBy: FilterType): Product[] {
  switch (filterBy) {
    case 'all':
      return products;
    case 'favorites':
      return products.filter((p) => p.favorite);
    case 'inStock':
      return products.filter((p) => p.amount > 0);
    case 'lowStock':
      return products.filter((p) => p.amount > 0 && p.amount < 2);
    case 'outOfStock':
      return products.filter((p) => p.amount <= 0);
    default:
      if (filterBy.startsWith('brand:')) {
        const brand = filterBy.slice(6).toLowerCase();
        return products.filter((p) => p.brand && p.brand.toLowerCase() === brand);
      }
      return products.filter((p) => p.type.toLowerCase() === filterBy.toLowerCase());
  }
}

export function getContactUrl(platform: string, value: string): string | null {
  switch (platform) {
    case 'email': return `mailto:${value}`;
    case 'phone': return `tel:${value.replace(/[^+\d]/g, '')}`;
    case 'discord': return `https://discord.com/users/${value}`;
    case 'telegram': return `https://t.me/${value.replace(/^@+/, '')}`;
    case 'instagram': return `https://instagram.com/${value.replace(/^@+/, '')}`;
    case 'snapchat': return `https://snapchat.com/add/${value.replace(/^@+/, '')}`;
    case 'whatsapp': {
      const cleaned = value.replace(/[^+\d]/g, '');
      if (/^\+\d{7,15}$/.test(cleaned)) return `https://wa.me/${cleaned}`;
      return null;
    }
    case 'signal': return null;
    default: return null;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return t('minutesAgo', lang).replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('hoursAgo', lang).replace('{n}', String(hours));
  const d = new Date(dateStr);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(lang, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}
