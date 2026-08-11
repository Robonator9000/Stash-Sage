import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedGradientTextProps {
  children?: ReactNode;
  className?: string;
  colors?: string;
  lightColors?: string;
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function AnimatedGradientText({
  children,
  className,
  colors = 'linear-gradient(120deg, #06b6d4, #10b981, #13eeef, #06b6d4)',
  lightColors = 'linear-gradient(120deg, #0e7490, #047857, #0e7490)',
  animationSpeed = 6,
  showBorder = false,
}: AnimatedGradientTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeColors = isDark ? colors : lightColors;

  useEffect(() => {
    if (!spanRef.current) return;
    spanRef.current.animate(
      [
        { backgroundPosition: '0% 50%' },
        { backgroundPosition: '100% 50%' },
        { backgroundPosition: '0% 50%' },
      ],
      { duration: animationSpeed * 1000, iterations: Infinity, easing: 'linear' }
    );
  }, [animationSpeed]);

  return (
    <span
      ref={spanRef}
      className={cn(
        'relative mx-auto block max-w-fit bg-cover bg-center bg-no-repeat py-[0.2em] text-transparent [background-clip:text] [background-size:300%_100%]',
        showBorder && 'm-2 border-b border-mist/30 pb-2',
        className
      )}
      style={{ backgroundImage: activeColors as string }}
    >
      {children}
    </span>
  );
}