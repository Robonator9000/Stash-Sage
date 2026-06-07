import { useState, useCallback } from 'react';
import { Session } from '../types';

const SESSIONS_KEY = 'weed-sessions';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addSession = useCallback((session: Session) => {
    setSessions((prev) => {
      const updated = [session, ...prev];
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { sessions, addSession };
}
