import { useEffect, useRef, type CSSProperties, type SVGProps } from 'react';
import { cn } from '../../lib/utils';

interface GridPatternProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  squares?: Array<[x: number, y: number]>;
  strokeDasharray?: string;
  className?: string;
  maxOpacity?: number;
  duration?: number;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = '0',
  squares,
  className,
  maxOpacity = 0.35,
  duration = 4,
  ...props
}: GridPatternProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const anim = svg.animate(
      [
        { opacity: 0.25, offset: 0 },
        { opacity: maxOpacity, offset: 0.5 },
        { opacity: 0.25, offset: 1 },
      ],
      { duration: duration * 1000, iterations: Infinity, easing: 'ease-in-out' }
    );
    return () => anim.cancel();
  }, [maxOpacity, duration]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full fill-cyanx/10 stroke-cyanx/20',
        className
      )}
      {...props}
    >
      <defs>
        <pattern id="mgu-grid" width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M ${width / 2} 0 V ${height} M 0 ${height / 2} H ${width}`} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill="url(#mgu-grid)" />
      {squares?.map(([sx, sy]) => (
        <rect
          key={`${sx}-${sy}`}
          width={width - 1}
          height={height - 1}
          x={sx * width + 1}
          y={sy * height + 1}
          fill="url(#mgu-grid)"
          strokeDasharray={strokeDasharray}
          style={{ opacity: 0.5 }}
        />
      ))}
    </svg>
  );
}

interface InteractiveGridPatternProps {
  className?: string;
  cellSize?: number;
  colors?: string[];
  baseOpacity?: number;
  style?: CSSProperties;
}

/** Full-screen colourful interactive grid background (mouse-reactive). */
export function InteractiveGridBackground({
  className,
  cellSize = 48,
  colors = ['#06b6d4', '#10b981', '#13eeef', '#EF1187'],
  baseOpacity = 0.12,
  style,
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--gx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--gy', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={
        {
          '--gx': '50%',
          '--gy': '50%',
          backgroundImage: [
            `radial-gradient(circle at center, ${colors.map((c) => `${c}22`).join(',')}, transparent 70%)`,
          ].join(','),
          ...style,
        } as CSSProperties
      }
    >
      {/* dot matrix */}
      <div
        className="absolute inset-0 opacity-[var(--mgu-dot-opacity)]"
        style={
          {
            backgroundImage: `radial-gradient(circle, ${colors[0]}66 1.2px, transparent 1.2px)`,
            backgroundSize: `${cellSize}px ${cellSize}px`,
            WebkitMaskImage:
              'radial-gradient(ellipse 120% 120% at var(--gx, 50%) var(--gy, 50%), black 20%, transparent 70%)',
            maskImage:
              'radial-gradient(ellipse 120% 120% at var(--gx, 50%) var(--gy, 50%), black 20%, transparent 70%)',
            '--mgu-dot-opacity': baseOpacity,
          } as CSSProperties
        }
      />
    </div>
  );
}
