'use client';

import { useEffect, useRef, useState } from 'react';

interface CapWidgetProps {
  onSuccess: (token: string) => void;
  disabled?: boolean;
}

export function CapWidget({ onSuccess, disabled = false }: CapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (disabled || isLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@cap.js/widget@0.1.56';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.remove();
    };
  }, [disabled, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || solved) return;

    // Initialize the Cap widget
    const handleSolve = (e: CustomEvent) => {
      const token = e.detail?.token;
      if (token) {
        setSolved(true);
        onSuccess(token);
      }
    };

    containerRef.current.addEventListener('cap:solved', handleSolve as EventListener);
    
    (window as any).Cap?.init?.(containerRef.current, {
      apiEndpoint: '/api/cap/challenge',
      scope: 'auth',
      instrumentation: true,
    });

    return () => {
      containerRef.current?.removeEventListener('cap:solved', handleSolve as EventListener);
    };
  }, [isLoaded, solved, onSuccess]);

  return (
    <div ref={containerRef} className="w-full">
      {!isLoaded && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {disabled ? 'Enter to verify bot protection...' : 'Loading CAPTCHA...'}
        </p>
      )}
    </div>
  );
}