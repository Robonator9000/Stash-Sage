import { useEffect, useRef, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  colors?: string[];
  vx?: number;
  vy?: number;
  style?: CSSProperties;
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  const int = parseInt(hex, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

interface Circle {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
  color: [number, number, number];
}

export function Particles({
  className,
  quantity = 70,
  staticity = 55,
  ease = 60,
  size = 0.4,
  refresh = false,
  color = '#06b6d4',
  colors,
  vx = 0,
  vy = 0,
  style,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const rafId = useRef<number | null>(null);
  const circles = useRef<Array<Circle> | null>(null);
  const mouse = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    context.current = canvas.getContext('2d');

    const initCanvas = (rescale = false) => {
      if (!canvas || !context.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      if (rescale && circles.current) {
        const old = sizeRef.current;
        if (old.w > 0 && old.h > 0 && w !== old.w && h !== old.h) {
          const sx = w / old.w;
          const sy = h / old.h;
          circles.current.forEach((circle) => {
            circle.x *= sx;
            circle.y *= sy;
            circle.dx *= sx;
            circle.dy *= sy;
          });
        }
      }
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    };
    initCanvas();

    const onResize = () => initCanvas(true);
    window.addEventListener('resize', onResize);

    if (circles.current === null || refresh) {
      circles.current = Array.from({ length: quantity }, () => ({
        x: Math.random() * sizeRef.current.w,
        y: Math.random() * sizeRef.current.h,
        translateX: 0,
        translateY: 0,
        size: Math.random() * 2.4 + Math.max(size, 1),
        alpha: 0,
        targetAlpha: Math.random() * 0.4 + 0.45,
        dx: (Math.random() - 0.5) / 2,
        dy: (Math.random() - 0.5) / 2,
        magnetism: 0.1 + Math.random() * 1.2,
        color: colors
          ? hexToRgb(colors[Math.floor(Math.random() * colors.length)])
          : hexToRgb(color),
      }));
    }

    const draw = () => {
      if (!canvas || !context.current) return;
      const { w, h } = sizeRef.current;
      context.current.clearRect(0, 0, w, h);

      circles.current!.forEach((circle) => {
        circle.x += circle.dx + (vx || 0);
        circle.y += circle.dy + (vy || 0);

        if (circle.x > w + 20) circle.x -= w + 40;
        if (circle.x < -20) circle.x += w + 40;
        if (circle.y > h + 20) circle.y -= h + 40;
        if (circle.y < -20) circle.y += h + 40;

        // Ease the current offset back toward its resting value.
        circle.translateX *= ease / 100;
        circle.translateY *= ease / 100;

        // Magnetic interaction with the pointer; strongest when close.
        const dx = mouse.current.x - circle.x;
        const dy = mouse.current.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const strength = distance < 1 ? 0 : (staticity / Math.max(1, distance * 2)) * circle.magnetism;

        circle.translateX += Math.abs(dx) > 0.01 && distance > 1 ? (dx / distance) * strength : 0;
        circle.translateY += Math.abs(dy) > 0.01 && distance > 1 ? (dy / distance) * strength : 0;

        // Fade particles in; near the pointer they bloom.
        circle.alpha += (circle.targetAlpha - circle.alpha) * 0.05;
        const proximity = Math.max(0, 1 - distance / Math.max(1, 160));
        const alpha = Math.min(0.95, circle.alpha + proximity * 0.3);

        context.current!.beginPath();
        context.current!.arc(
          circle.x + circle.translateX,
          circle.y + circle.translateY,
          circle.size,
          0,
          2 * Math.PI
        );
        context.current!.fillStyle = `rgba(${circle.color[0]}, ${circle.color[1]}, ${circle.color[2]}, ${alpha.toFixed(3)})`;
        context.current!.fill();
      });

      rafId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [quantity, staticity, ease, size, refresh, color, colors, vx, vy, dpr]);

  return (
    <div ref={containerRef} className={cn('pointer-events-none absolute inset-0', className)} style={style}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

export default Particles;