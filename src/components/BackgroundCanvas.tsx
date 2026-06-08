import { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

interface BackgroundCanvasProps {
  isDark: boolean;
}

export function BackgroundCanvas({ isDark }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dither noise tile — rendered once, tiled each frame
    const tileSize = 128;
    const tile = document.createElement('canvas');
    tile.width = tileSize;
    tile.height = tileSize;
    const tc = tile.getContext('2d')!;
    const td = tc.createImageData(tileSize, tileSize);
    for (let i = 0; i < td.data.length; i += 4) {
      const v = Math.floor(Math.random() * 256);
      td.data[i] = v;
      td.data[i + 1] = v;
      td.data[i + 2] = v;
      td.data[i + 3] = 255;
    }
    tc.putImageData(td, 0, 0);
    const pattern = ctx.createPattern(tile, 'repeat')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const orbCount = 3;
    const orbs: Orb[] = [];
    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.max(canvas.width, canvas.height) * (0.5 + Math.random() * 0.35),
      });
    }

    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 16000));
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.15 + Math.random() * 0.35),
        size: 1 + Math.random() * 2.5,
        alpha: isDark ? 0.08 + Math.random() * 0.25 : 0.15 + Math.random() * 0.3,
        hue: isDark
          ? 170 + Math.random() * 50
          : 150 + Math.random() * 50,
      });
    }

    // Multi-stop gradient colors that weave through hues to break up banding
    const orbStops = isDark
      ? [
          { pos: 0, r: 6, g: 182, b: 212, a: 0.08 },
          { pos: 0.12, r: 6, g: 182, b: 212, a: 0.06 },
          { pos: 0.25, r: 16, g: 185, b: 129, a: 0.04 },
          { pos: 0.4, r: 16, g: 185, b: 129, a: 0.03 },
          { pos: 0.55, r: 56, g: 189, b: 248, a: 0.02 },
          { pos: 0.75, r: 56, g: 189, b: 248, a: 0.01 },
        ]
      : [
          { pos: 0, r: 80, g: 140, b: 160, a: 0.15 },
          { pos: 0.12, r: 75, g: 138, b: 155, a: 0.12 },
          { pos: 0.25, r: 65, g: 140, b: 105, a: 0.08 },
          { pos: 0.4, r: 60, g: 135, b: 100, a: 0.06 },
          { pos: 0.55, r: 60, g: 125, b: 165, a: 0.04 },
          { pos: 0.75, r: 55, g: 120, b: 160, a: 0.02 },
        ];

    let frame = 0;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        orb.x += orb.vx + Math.sin(frame * 0.002 + orb.radius) * 0.3;
        orb.y += orb.vy + Math.cos(frame * 0.003 + orb.radius) * 0.3;
        orb.x = Math.max(orb.radius * 0.5, Math.min(canvas.width - orb.radius * 0.5, orb.x));
        orb.y = Math.max(orb.radius * 0.5, Math.min(canvas.height - orb.radius * 0.5, orb.y));

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        for (const stop of orbStops) {
          grad.addColorStop(stop.pos, `rgba(${stop.r},${stop.g},${stop.b},${stop.a})`);
        }
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Third orb pulses as extra depth layer
      const pulse = Math.sin(frame * 0.003) * 0.5 + 0.5;
      const ex = canvas.width * (0.5 + Math.sin(frame * 0.004) * 0.15);
      const ey = canvas.height * (0.5 + Math.cos(frame * 0.005) * 0.15);
      const extraGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, Math.max(canvas.width, canvas.height) * 0.6);
      if (isDark) {
        extraGrad.addColorStop(0, `rgba(56,189,248,${0.025 * pulse})`);
        extraGrad.addColorStop(0.3, `rgba(16,185,129,${0.015 * pulse})`);
      } else {
        extraGrad.addColorStop(0, `rgba(80,170,200,${0.05 * pulse})`);
        extraGrad.addColorStop(0.3, `rgba(60,150,120,${0.03 * pulse})`);
      }
      extraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = extraGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += (Math.random() - 0.5) * 0.003;
        p.alpha = Math.max(0.03, Math.min(0.35, p.alpha));

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.alpha})`;
        } else {
          ctx.fillStyle = `hsla(${p.hue}, 40%, 50%, ${p.alpha * 0.5})`;
        }
        ctx.fill();
      }

      // Dither overlay to break up gradient banding
      ctx.save();
      ctx.globalAlpha = isDark ? 0.025 : 0.018;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isDark]);

  return (
    <canvas
      id="bg-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
