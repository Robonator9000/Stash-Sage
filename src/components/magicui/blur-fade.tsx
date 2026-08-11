import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
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

const dirMap = {
  up: { y: -12 },
  down: { y: 12 },
  left: { x: -12 },
  right: { x: 12 },
};

export function BlurFade({
  children,
  className,
  delay = 0,
  inView = false,
  blur = '4px',
  direction = 'up',
  duration = 0.5,
  once = true,
}: BlurFadeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const offset = dirMap[direction] ?? {};

  return (
    <div className={cn('relative', className)}>
      {inView ? (
        <motion.div
          initial={{ opacity: 0, ...(offset as Record<string, number>), filter: `blur(${blur})` }}
          whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          viewport={{ once }}
          transition={{ delay, duration, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : (
        <AnimatePresence>
          {mounted && (
            <motion.div
              initial={{ opacity: 0, ...(offset as Record<string, number>), filter: `blur(${blur})` }}
              animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
              transition={{ delay, duration, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export function useBlurFade() {
  return BlurFade;
}

export default BlurFade;