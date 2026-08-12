import { type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedCircularProgressBarProps {
  value?: number;
  max?: number;
  min?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export function AnimatedCircularProgressBar({
  value = 0,
  max = 100,
  min = 0,
  gaugePrimaryColor = '#06b6d4',
  gaugeSecondaryColor = 'rgba(255,255,255,0.1)',
  className,
  style,
  children,
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * 40;
  const pct = Math.max(0, Math.min(100, ((value - min) / Math.max(1, max - min)) * 100));
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn('relative flex size-40 items-center justify-center', className)}
      style={style}
    >
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          stroke={gaugeSecondaryColor}
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          stroke={gaugePrimaryColor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default AnimatedCircularProgressBar;
