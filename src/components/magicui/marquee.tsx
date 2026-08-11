import { useRef, useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const anim = el.animate(
      vertical
        ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }]
        : [{ transform: 'translateX(0)' }, { transform: `translateX(${reverse ? '' : '-'}50%)` }],
      { duration: 24000, iterations: Infinity, easing: 'linear' }
    );
    if (pauseOnHover) {
      const onEnter = () => anim.pause();
      const onLeave = () => anim.play();
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        anim.cancel();
      };
    }
    return () => anim.cancel();
  }, [reverse, pauseOnHover, vertical]);

  return (
    <div className={cn('group flex overflow-hidden [--duration:24s]', vertical && 'max-h-full flex-col', className)}>
      {Array.from({ length: repeat }, (_, i) => (
        <div
          ref={i === 0 ? trackRef : undefined}
          key={i}
          className={cn(
            'flex shrink-0 items-center justify-around gap-4 [animation-play-state:running]',
            vertical ? 'flex-col min-h-full' : 'min-w-full'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}