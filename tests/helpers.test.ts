import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Product } from '../src/types';
import {
  roundToHundredth,
  formatPrecision,
  formatCurrency,
  searchProducts,
  sortProducts,
  filterProducts,
  parseProductDates,
  getContactUrl,
} from '../src/utils/helpers';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'OG Kush',
    strain: 'OG',
    type: 'indica',
    thc: 20,
    cbd: 1,
    amount: 10,
    price: 10,
    rating: 4,
    consumptionCount: 0,
    favorite: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('roundToHundredth', () => {
  it('rounds to two decimals', () => {
    expect(roundToHundredth(1.236)).toBe(1.24);
    expect(roundToHundredth(0.1 + 0.2)).toBe(0.3);
    expect(roundToHundredth(5)).toBe(5);
  });
});

describe('formatPrecision', () => {
  it('formats with the requested precision', () => {
    expect(formatPrecision(1.239, 2)).toBe('1.24');
    expect(formatPrecision(1.2, 0)).toBe('1');
    expect(formatPrecision(1.2, 3)).toBe('1.200');
  });
});

describe('formatCurrency', () => {
  it('formats supported currencies', () => {
    expect(formatCurrency(10, 'USD')).toBe('$10.00');
    expect(formatCurrency(10, 'EUR')).toBe('€10.00');
    expect(formatCurrency(10, 'GBP')).toBe('£10.00');
    expect(formatCurrency(10, 'CAD')).toBe('C$10.00');
  });
  it('uses zero decimals for JPY', () => {
    expect(formatCurrency(10, 'JPY')).toBe('¥10');
  });
  it('falls back to USD symbol for unknown currencies', () => {
    expect(formatCurrency(10, 'XYZ')).toBe('$10.00');
  });
});

describe('searchProducts', () => {
  const items = [
    makeProduct({ id: '1', name: 'OG Kush', strain: 'OG', brand: 'GreenCo', tags: ' earthy', effects: 'relaxed', type: 'indica' }),
    makeProduct({ id: '2', name: 'Blue Dream', strain: 'Blue', brand: 'OtherCo', type: 'sativa' }),
  ];

  it('returns everything for an empty query', () => {
    expect(searchProducts(items, '   ')).toHaveLength(2);
  });
  it('matches name, case-insensitively', () => {
    expect(searchProducts(items, 'dream').map((p) => p.id)).toEqual(['2']);
  });
  it('matches strain', () => {
    expect(searchProducts(items, 'og').map((p) => p.id)).toEqual(['1']);
  });
  it('matches brand', () => {
    expect(searchProducts(items, 'greenco').map((p) => p.id)).toEqual(['1']);
  });
  it('matches effects', () => {
    expect(searchProducts(items, 'relaxed').map((p) => p.id)).toEqual(['1']);
  });
});

describe('sortProducts', () => {
  it('always floats favorites to the top regardless of sort', () => {
    const items = [
      makeProduct({ id: 'a', name: 'Alpha', favorite: true, createdAt: new Date('2026-01-01T00:00:00Z') }),
      makeProduct({ id: 'b', name: 'Beta', favorite: false, createdAt: new Date('2026-03-01T00:00:00Z') }),
    ];
    expect(sortProducts(items, 'newest').map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('sorts non-favorites by newest first', () => {
    const items = [
      makeProduct({ id: 'a', createdAt: new Date('2026-01-01T00:00:00Z') }),
      makeProduct({ id: 'b', createdAt: new Date('2026-03-01T00:00:00Z') }),
      makeProduct({ id: 'c', createdAt: new Date('2026-02-01T00:00:00Z') }),
    ];
    expect(sortProducts(items, 'newest').map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by amount descending', () => {
    const items = [
      makeProduct({ id: 'a', amount: 1 }),
      makeProduct({ id: 'b', amount: 9 }),
    ];
    expect(sortProducts(items, 'amount').map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the input array', () => {
    const items = [makeProduct({ id: 'a' }), makeProduct({ id: 'b' })];
    const copy = [...items];
    sortProducts(items, 'name');
    expect(items).toEqual(copy);
  });
});

describe('filterProducts', () => {
  const items = [
    makeProduct({ id: 'in', amount: 5, favorite: true, type: 'indica', brand: 'GreenCo' }),
    makeProduct({ id: 'low', amount: 1, favorite: false, type: 'sativa', brand: 'OtherCo' }),
    makeProduct({ id: 'out', amount: 0, favorite: false, type: 'hybrid', brand: 'GreenCo' }),
  ];

  it('all returns everything', () => {
    expect(filterProducts(items, 'all')).toHaveLength(3);
  });
  it('favorites', () => {
    expect(filterProducts(items, 'favorites').map((p) => p.id)).toEqual(['in']);
  });
  it('inStock (amount > 0)', () => {
    expect(filterProducts(items, 'inStock').map((p) => p.id).sort()).toEqual(['in', 'low']);
  });
  it('lowStock (0 < amount < 2)', () => {
    expect(filterProducts(items, 'lowStock').map((p) => p.id)).toEqual(['low']);
  });
  it('outOfStock (amount <= 0)', () => {
    expect(filterProducts(items, 'outOfStock').map((p) => p.id)).toEqual(['out']);
  });
  it('by brand prefix', () => {
    expect(filterProducts(items, 'brand:greenco').map((p) => p.id).sort()).toEqual(['in', 'out']);
  });
  it('by type', () => {
    expect(filterProducts(items, 'sativa').map((p) => p.id)).toEqual(['low']);
  });
});

describe('parseProductDates', () => {
  it('parses ISO date strings into Date objects', () => {
    const raw = { ...makeProduct(), createdAt: '2026-01-01T00:00:00Z' } as unknown as Product;
    const parsed = parseProductDates(raw);
    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(parsed.createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
  it('falls back to a valid date for unparseable input', () => {
    const raw = { ...makeProduct(), createdAt: 'not-a-date' } as unknown as Product;
    const parsed = parseProductDates(raw);
    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(Number.isNaN(parsed.createdAt.getTime())).toBe(false);
  });
});

describe('getContactUrl', () => {
  it('builds mailto for email', () => {
    expect(getContactUrl('email', 'a@b.com')).toBe('mailto:a@b.com');
  });
  it('strips non-digits for phone', () => {
    expect(getContactUrl('phone', '+1 (555) 123-4567')).toBe('tel:+15551234567');
  });
  it('strips leading @ for telegram', () => {
    expect(getContactUrl('telegram', '@foo')).toBe('https://t.me/foo');
  });
  it('builds wa.me for valid whatsapp numbers', () => {
    expect(getContactUrl('whatsapp', '+15551234567')).toBe('https://wa.me/+15551234567');
  });
  it('returns null for invalid whatsapp numbers', () => {
    expect(getContactUrl('whatsapp', 'abc')).toBeNull();
  });
  it('returns null for unsupported platforms', () => {
    expect(getContactUrl('signal', 'x')).toBeNull();
  });
});