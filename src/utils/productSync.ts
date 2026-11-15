import type { Product } from '../types';

// ---------------------------------------------------------------------------
// Product sync: reconcile a local (offline-capable) product cache with the
// cloud snapshot without silently losing local edits.
//
// The previous behaviour replaced the local cache wholesale with the cloud
// snapshot on every login, so any edit made while offline was destroyed the
// moment the device reconnected. This module merges the two by `updatedAt`
// (last-write-wins per record) and honours a local tombstone set so a product
// deleted offline does not get resurrected by the cloud copy.
// ---------------------------------------------------------------------------

const OWNER_KEY = 'weed-products-owner';
const TOMBSTONE_KEY = 'weed-deleted-products';
const TOMBSTONE_CAP = 500;

export function getOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function setOwner(userId: string): void {
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    /* storage may be blocked */
  }
}

export function getTombstones(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

export function addTombstone(id: string): void {
  const current = getTombstones();
  if (current.has(id)) return;
  current.add(id);
  const capped = [...current].slice(-TOMBSTONE_CAP);
  try {
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(capped));
  } catch {
    /* storage may be blocked */
  }
}

function timeOf(p: Product): number {
  const t = new Date(p.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Merge local and cloud product lists.
 *
 * - Union by id.
 * - When an id exists in both, the record with the newer `updatedAt` wins.
 * - Ids present in `deleted` (tombstones) are removed from the result.
 *
 * Pure and side-effect free so it can be unit tested without a DOM.
 */
export function mergeProducts(local: Product[], cloud: Product[], deleted: Set<string>): Product[] {
  const byId = new Map<string, Product>();

  // Cloud is the baseline; local overrides only when strictly newer.
  for (const p of cloud) byId.set(p.id, p);
  for (const p of local) {
    const existing = byId.get(p.id);
    if (!existing || timeOf(p) > timeOf(existing)) {
      byId.set(p.id, p);
    }
  }

  const result: Product[] = [];
  for (const p of byId.values()) {
    if (!deleted.has(p.id)) result.push(p);
  }
  return result;
}