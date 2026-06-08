import { useState, useCallback } from 'react';
import { Session } from '../types';

const SESSIONS_KEY = 'weed-sessions';

function parseSessionDates(session: Session): Session {
  return {
    ...session,
    date: session.date ? new Date(session.date) : new Date(),
  };
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map(parseSessionDates);
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
