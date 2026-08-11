import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: string | string[];
  className?: string;
  children?: React.ReactNode;
}

export function ShineBorder({
  borderRadius = 14,
  borderWidth = 1,
  duration = 8,
  color = ['#06b6d4', '#10b981', '#13eeef'],
  className,
  children,
}: ShineBorderProps) {
  const colors = useMemo(() => (Array.isArray(color) ? color : [color]), [color]);
  const gradient = useMemo(
    () => `conic-gradient(from var(--sb-angle), ${colors.join(', ')})`,
    [colors]
  );
  return (
    <div
      style={
        {
          '--sb-radius': `${borderRadius}px`,
          '--sb-width': `${borderWidth}px`,
          '--sb-duration': `${duration}s`,
          '--sb-angle': '0deg',
          '--sb-gradient': gradient,
          '--tw-gradient-stops': undefined,
          borderRadius: 'var(--sb-radius)',
        } as CSSProperties
      }
      className={cn(
        'relative isolate',
        '[&>*]:rounded-[var(--sb-radius)]',
        'before:absolute before:-inset-px before:z-[-1] before:rounded-[inherit]',
        'before:content-[""] before:size-full before:bg-[var(--sb-gradient)]',
        'before:[animation:shine-border_var(--sb-duration)_linear_infinite]',
        'before:[background-blend-mode:normal]',
        className
      )}
    >
      {children}
    </div>
  );
}