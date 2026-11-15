import { describe, it, expect } from 'vitest';
import type { Product } from '../src/types';
import { mergeProducts } from '../src/utils/productSync';

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

describe('mergeProducts', () => {
  it('returns cloud items when local is empty', () => {
    const cloud = [makeProduct({ id: 'a' }), makeProduct({ id: 'b' })];
    const merged = mergeProducts([], cloud, new Set());
    expect(merged.map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  it('returns local items when cloud is empty', () => {
    const local = [makeProduct({ id: 'a' })];
    const merged = mergeProducts(local, [], new Set());
    expect(merged.map((p) => p.id)).toEqual(['a']);
  });

  it('unions ids present on only one side', () => {
    const local = [makeProduct({ id: 'local-only' })];
    const cloud = [makeProduct({ id: 'cloud-only' })];
    const merged = mergeProducts(local, cloud, new Set());
    expect(merged.map((p) => p.id).sort()).toEqual(['cloud-only', 'local-only']);
  });

  it('prefers the newer local record on conflict (offline edit wins)', () => {
    const local = [makeProduct({ id: 'x', amount: 5, updatedAt: new Date('2026-06-01T00:00:00Z') })];
    const cloud = [makeProduct({ id: 'x', amount: 10, updatedAt: new Date('2026-01-01T00:00:00Z') })];
    const merged = mergeProducts(local, cloud, new Set());
    expect(merged).toHaveLength(1);
    expect(merged[0].amount).toBe(5);
  });

  it('prefers the newer cloud record on conflict', () => {
    const local = [makeProduct({ id: 'x', amount: 5, updatedAt: new Date('2026-01-01T00:00:00Z') })];
    const cloud = [makeProduct({ id: 'x', amount: 10, updatedAt: new Date('2026-06-01T00:00:00Z') })];
    const merged = mergeProducts(local, cloud, new Set());
    expect(merged[0].amount).toBe(10);
  });

  it('drops tombstoned ids from the result (no resurrection)', () => {
    const local = [makeProduct({ id: 'keep' }), makeProduct({ id: 'deleted' })];
    const cloud = [makeProduct({ id: 'keep' }), makeProduct({ id: 'deleted' })];
    const merged = mergeProducts(local, cloud, new Set(['deleted']));
    expect(merged.map((p) => p.id)).toEqual(['keep']);
  });

  it('does not mutate its inputs', () => {
    const local = [makeProduct({ id: 'a' })];
    const cloud = [makeProduct({ id: 'b' })];
    mergeProducts(local, cloud, new Set());
    expect(local.map((p) => p.id)).toEqual(['a']);
    expect(cloud.map((p) => p.id)).toEqual(['b']);
  });

  it('handles both empty', () => {
    expect(mergeProducts([], [], new Set())).toEqual([]);
  });
});