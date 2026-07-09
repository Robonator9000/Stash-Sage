import { Product, Settings } from '../types';
import { parseProductDates } from './helpers';

export const EXPORT_VERSION = 1;

export interface StashExportData {
  version: number;
  exportedAt: string;
  products: Product[];
  settings?: Settings;
}

export interface ImportResult {
  products: Product[];
  settings?: Settings;
}

function isValidProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.strain === 'string' &&
    typeof p.type === 'string' &&
    typeof p.amount === 'number' &&
    typeof p.favorite === 'boolean'
  );
}

function normalizeProducts(raw: unknown[]): Product[] {
  return raw.filter(isValidProduct).map(parseProductDates);
}

// Merge imported products into an existing list, deduping by stable product id.
// Imported products take precedence over existing ones with the same id.
export function mergeImportProducts(existing: Product[], imported: Product[]): Product[] {
  const byId = new Map<string, Product>();
  for (const p of existing) {
    if (p && typeof p.id === 'string') byId.set(p.id, p);
  }
  for (const p of imported) {
    if (p && typeof p.id === 'string') byId.set(p.id, p);
  }
  return Array.from(byId.values());
}

export function createExportData(products: Product[], settings?: Settings): StashExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    products,
    settings,
  };
}

export function downloadExport(data: StashExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stash-tracker-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseImportData(content: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file. Please select a valid Stash Tracker backup.');
  }

  if (Array.isArray(parsed)) {
    const products = normalizeProducts(parsed);
    if (products.length === 0) {
      throw new Error('No valid products found in the file.');
    }
    return { products };
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Unrecognized backup format.');
  }

  const data = parsed as Record<string, unknown>;

  if (!Array.isArray(data.products)) {
    throw new Error('Backup file is missing a products list.');
  }

  const products = normalizeProducts(data.products);
  if (products.length === 0) {
    throw new Error('No valid products found in the backup file.');
  }

  const settings = data.settings && typeof data.settings === 'object'
    ? (data.settings as Settings)
    : undefined;

  return { products, settings };
}

export function downloadCsvExport(products: Product[]): void {
  const headers = [
    'Name', 'Strain', 'Type', 'THC%', 'CBD%', 'Amount (g)',
    'Price ($)', 'Rating', 'Brand', 'Favorite', 'Notes',
    'Consumption Count', 'Created', 'Updated',
  ];

  const rows = products.map((p) => [
    escapeCsv(p.name),
    escapeCsv(p.strain),
    escapeCsv(p.type),
    p.thc,
    p.cbd,
    p.amount,
    p.price,
    p.rating,
    escapeCsv(p.brand || ''),
    p.favorite ? 'Yes' : 'No',
    escapeCsv(p.notes || ''),
    p.consumptionCount || 0,
    p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '',
    p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stash-tracker-export-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function copyExportToClipboard(data: StashExportData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  return navigator.clipboard.writeText(json);
}
