import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { IconArrowRight } from '@tabler/icons-react';

interface InteractiveHoverButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  gradient?: string;
  textColor?: string;
  darkTextColor?: string;
}

/** magicui-style button: a dot swells into the brand gradient and reveals an arrow on hover. */
export const InteractiveHoverButton = forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(
  (
    {
      children,
      className,
      icon,
      gradient = 'linear-gradient(90deg, var(--mantine-color-cyan-6), var(--mantine-color-emerald-6))',
      textColor = 'text-slate-700',
      darkTextColor = 'dark:text-slate-100',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 pl-4 pr-3 text-center text-sm font-semibold',
          'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900',
          textColor,
          darkTextColor,
          'transition-colors duration-300 hover:border-transparent',
          className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-left scale-[0.25] rounded-full opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
          style={{ background: gradient, willChange: 'transform, opacity' }}
        />
        <span className="relative z-10 flex items-center gap-2 transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-6 group-hover:opacity-0" style={{ willChange: 'transform, opacity' }}>
          {children}
        </span>
        <span
          className="absolute top-0 z-10 flex h-full w-full items-center justify-center gap-2 text-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          style={{ willChange: 'opacity' }}
        >
          {children}
          {icon ?? <IconArrowRight size={16} />}
        </span>
      </button>
    );
  }
);

InteractiveHoverButton.displayName = 'InteractiveHoverButton';

export default InteractiveHoverButton;