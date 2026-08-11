import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedGradientTextProps {
  children?: ReactNode;
  className?: string;
  colors?: string;
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function AnimatedGradientText({
  children,
  className,
  colors = 'linear-gradient(120deg, #06b6d4, #10b981, #13eeef, #06b6d4)',
  animationSpeed = 6,
  showBorder = false,
}: AnimatedGradientTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

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
      style={{ backgroundImage: colors as string }}
    >
      {children}
    </span>
  );
}