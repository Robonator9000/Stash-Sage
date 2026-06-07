import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-cyan-500 text-white hover:bg-cyan-400',
      outline: 'border-2 border-slate-700 bg-transparent hover:bg-slate-800',
      ghost: 'bg-transparent hover:bg-slate-800',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
