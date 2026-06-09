import { useEffect, useState, useCallback } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  variant?: 'danger' | 'info';
}

let toastListeners: ((t: ToastMessage) => void)[] = [];

export function showToast(toast: ToastMessage) {
  toastListeners.forEach((fn) => fn(toast));
}

interface ToastContainerProps {
  isDark?: boolean;
}

export function ToastContainer({ isDark = true }: ToastContainerProps) {
  const [toasts, setToasts] = useState<(ToastMessage & { leaving?: boolean })[]>([]);

  useEffect(() => {
    const handler = (t: ToastMessage) => {
      const id = t.id + '-' + Date.now();
      setToasts((prev) => [...prev, { ...t, id }]);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const last = toasts[toasts.length - 1];
    const timer = setTimeout(() => removeToast(last.id), 5000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const isInfo = toast.variant === 'info' || (!toast.variant && toast.action);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border-2 shadow-2xl max-w-sm transition-all duration-300 ${
              toast.leaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
            } ${
              isInfo
                ? isDark
                  ? 'bg-slate-800/90 border-slate-700/50 backdrop-blur-md'
                  : 'bg-white border-gray-200'
                : isDark
                  ? 'bg-red-900/90 border-red-700/50 backdrop-blur-md'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            {isInfo ? (
              <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`} />
            ) : (
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`} />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${isInfo ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-red-200' : 'text-red-800')}`}>
                {toast.title}
              </p>
              <p className={`text-xs mt-0.5 ${isInfo ? (isDark ? 'text-slate-400' : 'text-gray-500') : (isDark ? 'text-red-300/80' : 'text-red-600')}`}>
                {toast.body}
              </p>
              {toast.action && (
                <button
                  onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                  className={`mt-2 text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                      : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                  }`}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                isInfo
                  ? isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'
                  : isDark ? 'hover:bg-red-800 text-red-300' : 'hover:bg-red-100 text-red-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
