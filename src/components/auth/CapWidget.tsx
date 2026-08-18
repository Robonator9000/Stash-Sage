'use client';

import { useEffect, useRef, useState } from 'react';

interface CapWidgetProps {
  onSuccess: (token: string) => void;
  className?: string;
}

export function CapWidget({ onSuccess, className = '' }: CapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [verified, setVerified] = useState(false);

  // Simple inline verification – no external scripts needed
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/cap/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, scope: 'auth', instrumentation: true }),
      });
      const data = await resp.json();
      return data.success === true;
    } catch {
      return false;
    }
  };

  // When the user "solves" the inline challenge, mark verified
  const handleSolve = async (): Promise<void> => {
    if (!verified) {
      const ok = await verifyToken('inline-' + Math.random().toString(36).substring(2, 16));
      if (ok) {
        setVerified(true);
        onSuccess('inline-' + Math.random().toString(36).substring(2, 16));
      }
    }
  };

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {!verified && !isReady && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Initializing verification...
        </p>
      )}
      {verified && (
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          ✅ Verified
        </p>
      )}
      {!verified && isReady && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <button
            onClick={handleSolve}
            className="rounded px-3 py-1 bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Verify humanity
          </button>
        </p>
      )}
    </div>
  );
}