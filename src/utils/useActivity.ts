import { useState, useCallback } from 'react';
import { safeSetItem } from './helpers';

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

export function useActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITY_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map(parseActivityDates);
    } catch {
      return [];
    }
  });

  const addEntry = useCallback((entry: ActivityEntry) => {
    setEntries((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      safeSetItem(ACTIVITY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
    safeSetItem(ACTIVITY_KEY, JSON.stringify([]));
  }, []);

  return { entries, addEntry, clearEntries };
}
