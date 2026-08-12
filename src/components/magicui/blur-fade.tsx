import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  inView?: boolean;
  blur?: string;
  translate?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  once?: boolean;
}

export function BlurFade({ children, className }: BlurFadeProps) {
  return <div className={cn('relative', className)}>{children}</div>;
}

export function useBlurFade() {
  return BlurFade;
}

export default BlurFade;
