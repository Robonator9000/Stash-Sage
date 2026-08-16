import { useEffect, useState, useCallback } from 'react';

// System notifications are local-only (localStorage) personal alerts — strain
// history, low stock, budget — layered on top of the server-side social
// notifications. They never touch Supabase, so no actor/RLS concerns.

export type SystemNotificationType = 'consumed' | 'session' | 'sold' | 'low_stock' | 'budget';

export interface SystemNotification {
  id: string;
  type: SystemNotificationType;
  /** Dedupe key: adding with an existing unread key replaces it (budget/low-stock re-alerts). */
  key?: string;
  /** Translation key for the title, e.g. 'lowStockAlert'. */
  titleKey: string;
  /** Translation key for the body with {name}/{amount}/{price} placeholders. */
  bodyKey: string;
  bodyParams?: Record<string, string>;
  created_at: string;
  read: boolean;
}

const SYSTEM_KEY = 'weed-system-notifications';
const MAX_ENTRIES = 30;

function load(): SystemNotification[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYSTEM_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type Listener = (n: SystemNotification[]) => void;
const listeners = new Set<Listener>();
let current: SystemNotification[] = load();

function commit(next: SystemNotification[]) {
  current = next.slice(0, MAX_ENTRIES);
  try { localStorage.setItem(SYSTEM_KEY, JSON.stringify(current)); } catch { /* storage may be blocked */ }
  listeners.forEach(l => l(current));
}

export function addSystemNotification(entry: Omit<SystemNotification, 'id' | 'created_at' | 'read'>): void {
  if (entry.key) {
    const existingIdx = current.findIndex(n => n.key === entry.key && !n.read);
    if (existingIdx >= 0) {
      const next = [...current];
      next[existingIdx] = { ...next[existingIdx], ...entry, created_at: new Date().toISOString() };
      commit(next);
      return;
    }
  }
  commit([{
    ...entry,
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    read: false,
  }, ...current]);
}

export function markSystemRead(id: string): void {
  commit(current.map(n => n.id === id ? { ...n, read: true } : n));
}

export function markAllSystemRead(): void {
  commit(current.map(n => ({ ...n, read: true })));
}

export function useSystemNotifications() {
  const [notifications, setNotifications] = useState<SystemNotification[]>(current);

  useEffect(() => {
    const listener: Listener = n => setNotifications(n);
    listeners.add(listener);
    setNotifications(current);
    return () => { listeners.delete(listener); };
  }, []);

  const markRead = useCallback((id: string) => markSystemRead(id), []);
  const markAllRead = useCallback(() => markAllSystemRead(), []);

  return { notifications, unreadCount: notifications.filter(n => !n.read).length, markRead, markAllRead };
}
