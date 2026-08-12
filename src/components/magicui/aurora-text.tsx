import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface AuroraTextProps {
  children?: ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
  paused?: boolean;
}

/** magicui AuroraText: shimmering gradient text. Accepts `paused` to freeze animation (e.g. behind fullscreen modals). */
export function AuroraText({
  children,
  className,
  colors = ['#06b6d4', '#13eeef', '#10b981', '#a855f7', '#f59e0b', '#06b6d4'],
  speed = 1,
  paused = false,
}: AuroraTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const animation = el.animate(
      [
        { backgroundPosition: '0% 50%' },
        { backgroundPosition: '100% 50%' },
        { backgroundPosition: '0% 50%' },
      ],
      { duration: Math.max(1, 6 * (1 / Math.max(0.1, speed))) * 1000, iterations: Infinity, easing: 'linear' }
    );
    setActive(true);
    return () => animation.cancel();
  }, [speed, colors.length]);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const animations = el.getAnimations();
    for (const a of animations) {
      if (paused) a.pause();
      else a.play();
    }
    setActive(!paused);
  }, [paused]);

  const style: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    animationPlayState: paused ? 'paused' : 'running',
  };

  return (
    <span
      ref={spanRef}
      aria-hidden={active ? undefined : true}
      className={cn('inline-block bg-clip-text text-transparent', className)}
      style={style}
    >
      {children}
    </span>
  );
}

export default AuroraText;