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

  const format = (v: number) =>
    `${prefix}${v.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = format(value);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = value * eased;
          el.textContent = format(v);
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
      {format(value)}
    </span>
  );
}

export default NumberTicker;