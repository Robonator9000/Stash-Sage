import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}

export function MobileSheet({ isOpen, onClose, title, isDark, children }: MobileSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          visible ? 'bg-black/50' : 'bg-transparent'
        }`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-h-[90vh] rounded-t-2xl shadow-2xl transition-transform duration-200 ${
          isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white border-t border-gray-200'
        } ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}