import { useState, useRef, useEffect, useCallback } from 'react';
import { playSmokeSound, playSellSound } from '../utils/sounds';

// How long the celebration overlay stays on screen. Previously this magic
// number (and the setTimeout) was duplicated across five handlers with no
// cleanup on unmount.
const DURATION_MS = 2200;

export function useCelebration() {
  const [showSmoke, setShowSmoke] = useState(false);
  const [showDollar, setShowDollar] = useState(false);
  const smokeTimer = useRef<ReturnType<typeof setTimeout>>();
  const dollarTimer = useRef<ReturnType<typeof setTimeout>>();

  const celebrateSmoke = useCallback(() => {
    setShowSmoke(true);
    playSmokeSound();
    if (smokeTimer.current) clearTimeout(smokeTimer.current);
    smokeTimer.current = setTimeout(() => setShowSmoke(false), DURATION_MS);
  }, []);

  const celebrateDollar = useCallback(() => {
    setShowDollar(true);
    playSellSound();
    if (dollarTimer.current) clearTimeout(dollarTimer.current);
    dollarTimer.current = setTimeout(() => setShowDollar(false), DURATION_MS);
  }, []);

  // Clear any pending timers on unmount so no setState fires after teardown.
  useEffect(
    () => () => {
      if (smokeTimer.current) clearTimeout(smokeTimer.current);
      if (dollarTimer.current) clearTimeout(dollarTimer.current);
    },
    [],
  );

  return { showSmoke, showDollar, celebrateSmoke, celebrateDollar };
}