import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  children: ReactNode;
  label?: string;
  maxWidth?: string;
}

export function ModalShell({ isOpen, onClose, isDark = true, children, label, maxWidth = 'max-w-sm' }: ModalShellProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
        isVisible ? 'bg-deep/85 backdrop-blur-sm' : 'bg-deep/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl border shadow-2xl transition-all duration-200 ${
          isDark ? 'bg-surface border-edge' : 'bg-white border-gray-200'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose, isDark = true }: { children: ReactNode; onClose: () => void; isDark?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-edge' : 'border-gray-200'}`}>
      <div>{children}</div>
      <button
        onClick={onClose}
        className={`p-2 rounded-xl transition-all ${
          isDark ? 'hover:bg-surface text-mist hover:text-frost' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
        }`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 space-y-5 ${className}`}>{children}</div>;
}
