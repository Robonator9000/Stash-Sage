import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedCircularProgressBarProps {
  value?: number;
  max?: number;
  min?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export function AnimatedCircularProgressBar({
  value = 0,
  max = 100,
  min = 0,
  gaugePrimaryColor = '#06b6d4',
  gaugeSecondaryColor = 'rgba(255,255,255,0.1)',
  className,
  style,
  children,
}: AnimatedCircularProgressBarProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 200,
  });
  const rotate = useTransform(springValue, [min, max], [0, 360]);

  useEffect(() => {
    motionValue.set(((value - min) / (max - min)) * 100);
  }, [value, min, max, motionValue]);

  return (
    <div
      className={cn('relative flex size-40 items-center justify-center', className)}
      style={style}
    >
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          strokeWidth="8"
          stroke={gaugeSecondaryColor}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          strokeWidth="8"
          stroke={gaugePrimaryColor}
          strokeLinecap="round"
          strokeDasharray="276.46"
          style={{ rotate, transformOrigin: '50% 50%' }}
          pathLength="100"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default AnimatedCircularProgressBar;
