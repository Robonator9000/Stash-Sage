import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { t } from '../utils/translations';

interface ToastProps {
  message: string;
  onClose: () => void;
  onRefresh: () => void;
  isDark?: boolean;
  language?: string;
}

export function Toast({ message, onClose, onRefresh, isDark = true, language = 'en' }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div 
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-2xl transition-all duration-200 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <RefreshCw className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {message}
      </span>
      <button
        onClick={onRefresh}
        className="px-3 py-1 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400 transition-all"
      >
        {t('refresh', language)}
      </button>
      <button
        onClick={handleClose}
        className={`p-1 rounded-lg transition-colors ${
          isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}