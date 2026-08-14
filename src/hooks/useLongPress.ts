import { useRef, useState, useCallback } from 'react';

interface LongPressOptions {
  threshold?: number;
  onClick?: () => void;
  onLongPress: () => void;
}

export function useLongPress({ threshold = 500, onClick, onLongPress }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggeredRef.current = false;
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      setIsPressing(false);
      onLongPress();
    }, threshold);
  }, [threshold, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const finish = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    clear();
    if (!triggeredRef.current) {
      onClick?.();
    }
    triggeredRef.current = false;
  }, [clear, onClick]);

  const cancel = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    clear();
    triggeredRef.current = false;
  }, [clear]);

  return {
    isPressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: finish,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: finish,
      onTouchCancel: cancel,
      onClick: (e: React.SyntheticEvent) => { e.stopPropagation(); },
      onContextMenu: (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); },
    },
  };
}
