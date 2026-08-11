import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className, delay = 0 }: AnimatedListProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {Array.isArray(children) ? children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: delay + i * 0.07, duration: 0.4, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      )) : children}
    </div>
  );
}

export default AnimatedList;

export { AnimatePresence };