import { Product, SortOption, FilterType } from '../types';

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format amount in grams
export function formatAmount(amount: number): string {
  return `${amount.toFixed(2)}g`;
}

// Round to hundredths
export function roundToHundredth(num: number): number {
  return Math.round(num * 100) / 100;
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Parse dates in product
export function parseProductDates(product: Product): Product {
  return {
    ...product,
    createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
    updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    lastConsumed: product.lastConsumed ? new Date(product.lastConsumed) : undefined,
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
    p.type.toLowerCase().includes(q)
  );
}

// Sort products
export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];
  
  const favoritesFirst = (arr: Product[]) => {
    const favs = arr.filter(p => p.favorite).sort((a, b) => a.name.localeCompare(b.name));
    const rest = arr.filter(p => !p.favorite);
    return [...favs, ...rest];
  };

  switch (sortBy) {
    case 'newest': {
      const byDate = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return favoritesFirst(byDate);
    }
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'thc':
      return sorted.sort((a, b) => (b.thc || 0) - (a.thc || 0));
    case 'amount':
      return sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    case 'price':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'favorites':
      return favoritesFirst(sorted);
    default:
      return sorted;
  }
}

// Strain type badge colors
export function getStrainColor(strainType: string): string {
  switch (strainType.toLowerCase()) {
    case 'indica':
      return 'bg-purple-500/20 text-purple-400';
    case 'sativa':
      return 'bg-amber-500/20 text-amber-400';
    case 'hybrid':
      return 'bg-emerald-500/20 text-emerald-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
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
      return products.filter((p) => p.type.toLowerCase() === filterBy.toLowerCase());
  }
}