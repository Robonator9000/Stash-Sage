import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types';
import { safeSetItem } from './helpers';
import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

const SESSIONS_KEY = 'weed-sessions';

function parseSessionDates(session: Session): Session {
  return {
    ...session,
    date: session.date ? new Date(session.date) : new Date(),
  };
}

interface DbSession {
  id: string; product_id: string | null; product_name: string;
  amount: number; people: number; notes: string | null; date: string;
}

function toCamel(db: DbSession): Session {
  return {
    id: db.id, productId: db.product_id || '',
    productName: db.product_name, amount: db.amount, people: db.people,
    notes: db.notes || '', date: new Date(db.date),
    hitsCount: 0, bowlsPerPerson: 0,
  };
}

function toSnake(s: Session) {
  return {
    product_id: s.productId || null, product_name: s.productName,
    amount: s.amount, people: s.people, notes: s.notes || null,
    date: s.date.toISOString(),
  };
}

const $ids = new Set<string>();

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map(parseSessionDates);
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
    supabase.from('sessions').select('*').eq('user_id', id).order('date', { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data || !$ids.has(id)) return;
        const mapped = data.map(toCamel);
        setSessions(mapped);
        safeSetItem(SESSIONS_KEY, JSON.stringify(mapped));
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const addSession = useCallback((session: Session) => {
    setSessions((prev) => {
      const updated = [session, ...prev];
      safeSetItem(SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    });
    if (user) {
      supabase.from('sessions').insert({ id: session.id, user_id: user.id, ...toSnake(session) }).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
    }
  }, [user]);

  return { sessions, addSession };
}
