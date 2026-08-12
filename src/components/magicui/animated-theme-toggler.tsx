import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type Theme = 'light' | 'dark';

interface AnimatedThemeTogglerProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  className?: string;
  /** Duration of the clip-path animation in ms */
  duration?: number;
  /** Shape of the reveal animation */
  variant?: 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon' | 'rectangle' | 'star';
  /** Whether to reveal from the center of the screen */
  fromCenter?: boolean;
}

const clipPaths: Record<NonNullable<AnimatedThemeTogglerProps['variant']>, string> = {
  circle: 'circle(0% at 50% 50%)',
  square: 'inset(50% 50% 50% 50%)',
  triangle: 'polygon(50% 50%, 50% 50%, 50% 50%)',
  diamond: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
  hexagon: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)',
  rectangle: 'inset(50% 0% 50% 0%)',
  star: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)',
};

export function AnimatedThemeToggler({
  theme,
  onThemeChange,
  className,
  duration = 500,
  variant = 'circle',
}: AnimatedThemeTogglerProps) {
  const handleClick = () => {
    if (typeof document.startViewTransition === 'function') {
      const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
      const root = document.documentElement;
      const clipPath = clipPaths[variant];
      root.dataset.magicuiThemeVt = 'active';
      const durationVar = root.style.getPropertyValue('--magicui-theme-toggle-vt-duration');
      root.style.setProperty(
        '--magicui-theme-toggle-vt-duration',
        durationVar || `${duration}ms`
      );
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          root.classList.toggle('dark', newTheme === 'dark');
          root.setAttribute('data-mantine-color-scheme', newTheme);
          root.style.colorScheme = newTheme;
          onThemeChange(newTheme);
        });
      });
      transition.finished.then(() => {
        root.classList.remove('magicui-theme-toggle-active');
        root.dataset.magicuiThemeVt = '';
      });
      const invertedClip = root.style.getPropertyValue('--magicui-theme-toggle-inverted-clip-path');
      root.style.setProperty(
        '--magicui-theme-toggle-clip-path',
        invertedClip || clipPath
      );
    } else {
      const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
      const root = document.documentElement;
      root.classList.toggle('dark', newTheme === 'dark');
      root.setAttribute('data-mantine-color-scheme', newTheme);
      root.style.colorScheme = newTheme;
      onThemeChange(newTheme);
    }
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-9 w-16 items-center rounded-full border border-edge/60 bg-surface/80 p-1 shadow-inner backdrop-blur transition-colors duration-300',
        'hover:border-cyanx/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyanx/40',
        className
      )}
    >
      {/* gradient glow behind knob */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-60 blur-[2px] transition-opacity"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(6,182,212,0.25), rgba(16,185,129,0.25))'
            : 'linear-gradient(90deg, rgba(245,158,11,0.25), rgba(239,17,135,0.2))',
        }}
      />
      <span
        className={cn(
          'relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg transition-all duration-300',
          isDark
            ? 'ml-auto bg-gradient-to-br from-cyanx to-emera text-white'
            : 'mr-auto bg-gradient-to-br from-amberx to-rose-500 text-white'
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}

export default AnimatedThemeToggler;
