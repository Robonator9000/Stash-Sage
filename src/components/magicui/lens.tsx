import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface LensProps {
  children: ReactNode;
  className?: string;
  lensSize?: number;
  isStatic?: boolean;
  largeRadius?: number;
}

export function Lens({
  children,
  className,
  lensSize = 170,
  isStatic = false,
  largeRadius = 120,
}: LensProps) {
  const mx = useMotionValue(200);
  const my = useMotionValue(200);
  const springConfig = { stiffness: 150, damping: 25, mass: 0.4 };
  const mxSpring = useSpring(mx, springConfig);
  const mySpring = useSpring(my, springConfig);
  const rotateX = useTransform(mySpring, [-0.5, 0.5], [-largeRadius * 0.05, largeRadius * 0.11]);
  const rotateY = useTransform(mxSpring, [-0.5, 0.5], [-largeRadius * 0.11, largeRadius * 0.05]);
  const left = useTransform(mxSpring, [0, 1], [lensSize, 2000]);
  const top = useTransform(mySpring, [0, 1], [lensSize, 2000]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <div
      className={cn('relative overflow-hidden', isStatic && 'cursor-none select-none', className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div className="h-full w-full" style={{ rotateX: isStatic ? 0 : rotateX, rotateY: isStatic ? 0 : rotateY }}>
        {children}
      </motion.div>
      {!isStatic && (
        <motion.div
          className="pointer-events-none absolute z-10 rounded-full border border-cyanx/40"
          style={{ left, top, width: lensSize, height: lensSize, translateX: '-50%', translateY: '-50%' }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.18),transparent_60%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-1 rounded-full border border-emera/30"
            style={{ boxShadow: '0 0 24px rgba(6,182,212,0.25)' }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default Lens;