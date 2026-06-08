import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaSpeed: number;
  hue: number;
}

interface BackgroundCanvasProps {
  isDark: boolean;
}

export function BackgroundCanvas({ isDark }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
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

    const count = Math.min(40, Math.floor((canvas.width * canvas.height) / 20000));
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.2 + Math.random() * 0.4),
        size: 1.5 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.4,
        alphaSpeed: 0.002 + Math.random() * 0.005,
        hue: isDark
          ? 180 + Math.random() * 40
          : 160 + Math.random() * 40,
      });
    }
    particlesRef.current = particles;

    let frame = 0;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ambient gradient orbs
      const gradient1 = ctx.createRadialGradient(
        canvas.width * 0.2 + Math.sin(frame * 0.003) * 100,
        canvas.height * 0.3 + Math.cos(frame * 0.004) * 80,
        0,
        canvas.width * 0.2 + Math.sin(frame * 0.003) * 100,
        canvas.height * 0.3 + Math.cos(frame * 0.004) * 80,
        canvas.width * 0.5,
      );
      if (isDark) {
        gradient1.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
        gradient1.addColorStop(0.5, 'rgba(16, 185, 129, 0.02)');
        gradient1.addColorStop(1, 'transparent');
      } else {
        gradient1.addColorStop(0, 'rgba(6, 182, 212, 0.04)');
        gradient1.addColorStop(0.5, 'rgba(16, 185, 129, 0.02)');
        gradient1.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.8 + Math.cos(frame * 0.005) * 120,
        canvas.height * 0.6 + Math.sin(frame * 0.003) * 100,
        0,
        canvas.width * 0.8 + Math.cos(frame * 0.005) * 120,
        canvas.height * 0.6 + Math.sin(frame * 0.003) * 100,
        canvas.width * 0.4,
      );
      if (isDark) {
        gradient2.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
        gradient2.addColorStop(1, 'transparent');
      } else {
        gradient2.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
        gradient2.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += (Math.random() - 0.5) * p.alphaSpeed;
        p.alpha = Math.max(0.05, Math.min(0.5, p.alpha));

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.alpha})`;
        } else {
          ctx.fillStyle = `hsla(${p.hue}, 60%, 50%, ${p.alpha * 0.7})`;
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
