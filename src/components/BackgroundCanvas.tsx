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

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface BackgroundCanvasProps {
  isDark: boolean;
}

function smoothNoiseTile(size: number, octaves: number): ImageData {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const cx = c.getContext('2d')!;

  const layers: ImageData[] = [];

  for (let o = 0; o < octaves; o++) {
    const cellSize = Math.max(2, size >> (o + 1));
    const cols = Math.ceil(size / cellSize) + 1;
    const rows = Math.ceil(size / cellSize) + 1;
    const grid: number[][] = [];
    for (let y = 0; y < rows; y++) {
      grid[y] = [];
      for (let x = 0; x < cols; x++) {
        grid[y][x] = Math.random();
      }
    }

    const img = cx.createImageData(size, size);
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const gx = px / cellSize;
        const gy = py / cellSize;
        const ix = Math.floor(gx);
        const iy = Math.floor(gy);
        const fx = gx - ix;
        const fy = gy - iy;

        const smoothstep = (t: number) => t * t * (3 - 2 * t);
        const sx = smoothstep(fx);
        const sy = smoothstep(fy);

        const v00 = grid[iy][ix];
        const v10 = grid[iy][Math.min(ix + 1, cols - 1)];
        const v01 = grid[Math.min(iy + 1, rows - 1)][ix];
        const v11 = grid[Math.min(iy + 1, rows - 1)][Math.min(ix + 1, cols - 1)];

        const top = v00 + (v10 - v00) * sx;
        const bot = v01 + (v11 - v01) * sx;
        const v = top + (bot - top) * sy;

        const idx = (py * size + px) * 4;
        const val = Math.floor(v * 255);
        img.data[idx] = val;
        img.data[idx + 1] = val;
        img.data[idx + 2] = val;
        img.data[idx + 3] = 255;
      }
    }
    layers.push(img);
  }

  const out = cx.createImageData(size, size);
  for (let i = 0; i < out.data.length; i += 4) {
    let sum = 0;
    let weightSum = 0;
    for (let o = 0; o < octaves; o++) {
      const w = 1 / (o + 1);
      sum += layers[o].data[i] * w;
      weightSum += w;
    }
    const v = Math.floor(sum / weightSum);
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }
  return out;
}

export function BackgroundCanvas({ isDark }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileSize = 64;
    const noiseData = smoothNoiseTile(tileSize, 3);
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = tileSize;
    noiseCanvas.height = tileSize;
    const nc = noiseCanvas.getContext('2d')!;
    nc.putImageData(noiseData, 0, 0);
    const noisePattern = ctx.createPattern(noiseCanvas, 'repeat')!;

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

    const moteCount = Math.max(8, Math.floor((canvas.width * canvas.height) / 80000));
    const motes: DustMote[] = [];
    for (let i = 0; i < moteCount; i++) {
      motes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -(0.02 + Math.random() * 0.04),
        size: 3 + Math.random() * 8,
        alpha: Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
      });
    }

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

      // Dust motes — hazy out-of-focus specks like lens dust
      for (const m of motes) {
        m.x += m.vx + Math.sin(frame * 0.001 + m.phase) * 0.05;
        m.y += m.vy;
        const breathe = Math.sin(frame * 0.005 + m.phase) * 0.5 + 0.5;
        const currentAlpha = m.alpha * breathe;

        if (m.y < -20) {
          m.y = canvas.height + 20;
          m.x = Math.random() * canvas.width;
        }
        if (m.x < -20) m.x = canvas.width + 20;
        if (m.x > canvas.width + 20) m.x = -20;

        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
        if (isDark) {
          grad.addColorStop(0, `rgba(200,210,220,${currentAlpha})`);
          grad.addColorStop(0.5, `rgba(180,190,200,${currentAlpha * 0.4})`);
        } else {
          grad.addColorStop(0, `rgba(60,60,60,${currentAlpha})`);
          grad.addColorStop(0.5, `rgba(80,80,80,${currentAlpha * 0.3})`);
        }
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(m.x - m.size, m.y - m.size, m.size * 2, m.size * 2);
      }

      // Fractal noise overlay — organic surface texture
      ctx.save();
      ctx.globalAlpha = isDark ? 0.035 : 0.025;
      ctx.fillStyle = noisePattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Vignette — natural edge darkening
      const vigGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.25,
        canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.75,
      );
      vigGrad.addColorStop(0, 'transparent');
      vigGrad.addColorStop(0.5, 'transparent');
      vigGrad.addColorStop(1, isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
