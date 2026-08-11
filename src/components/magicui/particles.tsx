import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
  colors?: string[];
  size?: [number, number];
  move?: [number, number];
  opacity?: [number, number];
  speed?: number | [number, number];
  pauseOnHover?: boolean;
}

export function Particles({
  className,
  quantity = 60,
  color = '#06b6d4',
  colors,
  size = [1, 2],
  move = [-8, 8],
  opacity = [0.15, 0.6],
  speed = [0.5, 2],
  pauseOnHover = true,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rand = ([min, max]: [number, number]) => min + Math.random() * (max - min);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const parts = Array.from({ length: quantity }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: rand(move as [number, number]),
      vy: rand(move as [number, number]),
      size: rand(size as [number, number]),
      color: colors?.[Math.floor(Math.random() * colors.length)] ?? color,
      alpha: rand(opacity as [number, number]),
      speed: typeof speed === 'number' ? speed : rand(speed as [number, number]),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (!hoverRef.current) {
          p.x += p.vx * p.speed;
          p.y += p.vy * p.speed;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onEnter = () => { hoverRef.current = pauseOnHover; };
    const onLeave = () => { hoverRef.current = false; };
    canvas.addEventListener('mouseenter', onEnter);
    canvas.addEventListener('mouseleave', onLeave);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mouseenter', onEnter);
      canvas.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [quantity, color, colors, size, move, opacity, speed, pauseOnHover]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    />
  );
}