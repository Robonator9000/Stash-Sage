import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface NeonGradientCardProps {
  children: ReactNode;
  className?: string;
  borderColors?: string[];
  borderRadius?: number;
  borderWidth?: number;
  glowIntensity?: number;
  style?: CSSProperties;
}

export function NeonGradientCard({
  children,
  className,
  borderColors = ['#06b6d4', '#10b981', '#13eeef'],
  borderRadius = 16,
  borderWidth = 1.5,
  glowIntensity = 0.18,
}: NeonGradientCardProps) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const apply = () => {
      const { left, top } = el.getBoundingClientRect();
      el.style.setProperty('--nx', `${0}px`);
      el.style.setProperty('--ny', `${0}px`);
      const items = el.querySelectorAll<HTMLElement>('[data-mgu-hover]');
      items.forEach((it) => {
        const r = it.getBoundingClientRect();
        const cx = r.left - left + r.width / 2;
        const cy = r.top - top + r.height / 2;
        it.style.setProperty('--spot-x', `${cx}px`);
        it.style.setProperty('--spot-y', `${cy}px`);
      });
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn('group relative isolate', className)}
      style={
        {
          '--border-radius': `${borderRadius}px`,
          '--border-width': `${borderWidth}px`,
          '--glow': `${glowIntensity}`,
          borderRadius: 'var(--border-radius)',
        } as CSSProperties
      }
    >
      <div aria-hidden="true" className="pointer-events-none absolute -inset-px z-[-1] rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from var(--nc-angle,0deg) at 30% 20%, ${borderColors.join(', ')}, transparent 40%)`,
          filter: 'blur(6px)',
          opacity: hovered ? glowIntensity : 0,
        }}
      />
      <div className="relative h-full w-full overflow-hidden rounded-[inherit] p-px backdrop-blur-sm"
        style={{ background: 'var(--surface-alt)' }}
      >
        <div className="absolute inset-0 rounded-[inherit] p-px" style={{ background: `linear-gradient(${borderColors.join(', ')})` }} />
        <div className="relative h-full w-full rounded-[calc(var(--border-radius)-1px)] p-4" style={{ background: 'var(--surface)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default NeonGradientCard;