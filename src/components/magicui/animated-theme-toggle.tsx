import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export function AnimatedThemeToggle({ isDark, onToggle, className }: AnimatedThemeToggleProps) {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-9 w-16 items-center rounded-full border border-edge/60 bg-surface/80 p-1 shadow-inner backdrop-blur transition-colors duration-300',
        'hover:border-cyanx/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyanx/40',
        className
      )}
    >
      {/* gradient glow behind knob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-60 blur-[2px] transition-opacity"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(6,182,212,0.25), rgba(16,185,129,0.25))'
            : 'linear-gradient(90deg, rgba(245,158,11,0.25), rgba(239,17,135,0.2))',
        }}
      />
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg',
          isDark
            ? 'ml-auto bg-gradient-to-br from-cyanx to-emera'
            : 'mr-auto bg-gradient-to-br from-amberx to-brand'
        )}
      >
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="text-white dark:text-[#0b1120]"
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </motion.span>
      </motion.div>
    </button>
  );
}

export default AnimatedThemeToggle;