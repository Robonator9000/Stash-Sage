import { useState, useEffect, useCallback } from 'react';
import { safeSetItem } from './helpers';
import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';

const ACTIVITY_KEY = 'weed-activity';
const MAX_ENTRIES = 500;

export interface ActivityEntry {
  id: string;
  type: 'consume' | 'sell' | 'session' | 'add' | 'delete' | 'edit';
  productId: string;
  productName: string;
  amount?: number;
  notes?: string;
  price?: number;
  timestamp: Date;
}

function parseActivityDates(entry: ActivityEntry): ActivityEntry {
  return {
    ...entry,
    timestamp: new Date(entry.timestamp),
  };
}

interface DbEntry {
  id: string; type: string; product_id: string | null;
  product_name: string | null; amount: number | null;
  price: number | null; notes: string | null; timestamp: string;
}

function toCamel(db: DbEntry): ActivityEntry {
  return {
    id: db.id, type: db.type as ActivityEntry['type'],
    productId: db.product_id || '', productName: db.product_name || '',
    amount: db.amount ?? undefined, price: db.price ?? undefined,
    notes: db.notes || undefined, timestamp: new Date(db.timestamp),
  };
}

function toSnake(e: ActivityEntry) {
  return {
    type: e.type, product_id: e.productId || null,
    product_name: e.productName || null, amount: e.amount ?? null,
    price: e.price ?? null, notes: e.notes || null,
    timestamp: e.timestamp.toISOString(),
  };
}

const $ids = new Set<string>();

export function useActivity() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITY_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map(parseActivityDates);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const id = user.id;
    $ids.forEach(x => { if (x !== id) $ids.delete(x); });
    $ids.add(id);
    supabase.from('activity_entries').select('*').eq('user_id', id).order('timestamp', { ascending: false }).limit(MAX_ENTRIES)
      .then(({ data }) => {
        if (cancelled || !data || !$ids.has(id)) return;
        const mapped = data.map(toCamel);
        setEntries(mapped);
        safeSetItem(ACTIVITY_KEY, JSON.stringify(mapped));
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const addEntry = useCallback((entry: ActivityEntry) => {
    setEntries((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      safeSetItem(ACTIVITY_KEY, JSON.stringify(updated));
      return updated;
    });
    if (user) {
      supabase.from('activity_entries').insert({ id: entry.id, user_id: user.id, ...toSnake(entry) }).then(undefined, console.error);
    }
  }, [user]);

  const clearEntries = useCallback(() => {
    setEntries([]);
    safeSetItem(ACTIVITY_KEY, JSON.stringify([]));
    if (user) {
      supabase.from('activity_entries').delete().eq('user_id', user.id).then(undefined, console.error);
    }
  }, [user]);

  return { entries, addEntry, clearEntries };
}
