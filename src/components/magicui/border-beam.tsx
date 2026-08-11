import { cn } from '../../lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  anchor?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 6,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = '#06b6d4',
  colorTo = '#10b981',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      style={
        {
          '--beam-size': `${size}px`,
          '--beam-duration': `${duration}s`,
          '--beam-anchor': `${anchor}%`,
          '--beam-width': `${borderWidth}px`,
          '--beam-color-from': colorFrom,
          '--beam-color-to': colorTo,
          '--beam-delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--beam-width)*1px)_solid_transparent]',
        '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]',
        'before:bg-[linear-gradient(90deg,var(--beam-color-from),var(--beam-color-to),transparent)]',
        'before:content-[""] before:size-full before:[animation:border-beam_var(--beam-duration)_linear_infinite]',
        'before:[animation-delay:var(--beam-delay)]',
        className
      )}
    />
  );
}