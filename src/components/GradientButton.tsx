import { type ReactNode } from 'react';

interface GradientButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function GradientButton({ onClick, children, disabled = false, className = '', variant = 'primary', size = 'md' }: GradientButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2.5 text-sm';
  const gradient = variant === 'danger'
    ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
    : 'bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClass} rounded-xl font-medium text-white ${gradient} transition-all disabled:opacity-50 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}
