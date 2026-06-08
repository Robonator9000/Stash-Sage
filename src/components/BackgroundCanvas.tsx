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
        radius: Math.max(canvas.width, canvas.height) * (0.3 + Math.random() * 0.25),
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
        alpha: 0.08 + Math.random() * 0.25,
        hue: isDark
          ? 170 + Math.random() * 50
          : 150 + Math.random() * 50,
      });
    }

    const accentFrom = isDark ? 'rgba(6, 182, 212,' : 'rgba(6, 182, 212,';
    const accentMid = isDark ? 'rgba(16, 185, 129,' : 'rgba(16, 185, 129,';
    const accentTo = isDark ? 'rgba(56, 189, 248,' : 'rgba(14, 165, 233,';

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
        grad.addColorStop(0, `${accentFrom} 0.05)`);
        grad.addColorStop(0.4, `${accentMid} 0.025)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const extraGrad = ctx.createRadialGradient(
        canvas.width * (0.5 + Math.sin(frame * 0.004) * 0.15),
        canvas.height * (0.5 + Math.cos(frame * 0.005) * 0.15),
        0,
        canvas.width * (0.5 + Math.sin(frame * 0.004) * 0.15),
        canvas.height * (0.5 + Math.cos(frame * 0.005) * 0.15),
        Math.max(canvas.width, canvas.height) * 0.6,
      );
      extraGrad.addColorStop(0, `${accentTo} 0.03)`);
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
          ctx.fillStyle = `hsla(${p.hue}, 55%, 45%, ${p.alpha * 0.6})`;
        }
        ctx.fill();
      }

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
