import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface NumberTickerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function NumberTicker({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1200,
  className,
  style,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const from = 0;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = from + (value - from) * eased;
          el.textContent = `${prefix}${v.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}${suffix}`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, decimals, prefix, suffix, duration]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)} style={style}>
      {`${prefix}0${suffix}`}
    </span>
  );
}

export default NumberTicker;