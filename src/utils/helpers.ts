import { Product, SortOption, FilterType } from '../types';

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Round to hundredths
export function roundToHundredth(num: number): number {
  return Math.round(num * 100) / 100;
}

// Format number with variable precision
export function formatPrecision(value: number, precision: number = 2): string {
  return value.toFixed(precision);
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
      return products.filter((p) => p.type.toLowerCase() === filterBy.toLowerCase());
  }
}
