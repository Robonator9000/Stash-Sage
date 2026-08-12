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
          'group relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 pl-6 pr-3 text-center text-sm font-semibold',
          'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900',
          textColor,
          darkTextColor,
          'transition-colors duration-300 hover:border-transparent',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"
            style={{ background: gradient }}
          />
          <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
            {children}
          </span>
        </div>
        <div
          className="absolute top-0 z-10 flex h-full w-full items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-12 group-hover:opacity-100"
          style={{ background: gradient }}
        >
          {children}
          {icon ?? <IconArrowRight size={16} />}
        </div>
      </button>
    );
  }
);

InteractiveHoverButton.displayName = 'InteractiveHoverButton';

export default InteractiveHoverButton;