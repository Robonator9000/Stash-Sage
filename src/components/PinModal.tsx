import { useState, useRef, useEffect } from 'react';
import { t } from '../utils/translations';
import { hashPin } from '../utils/helpers';
import { Lock } from 'lucide-react';

interface PinModalProps {
  pinHash: string;
  onSuccess: () => void;
  isDark?: boolean;
  language: string;
}

export function PinModal({ pinHash, onSuccess, isDark = true, language }: PinModalProps) {
  const [pinValue, setPinValue] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    inputRef.current?.focus();
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const hash = await hashPin(pinValue);
      if (hash === pinHash) {
        onSuccess();
      } else {
        setError(t('pinMismatch', language));
        setPinValue('');
      }
    } catch {
      setError(t('pinMismatch', language));
      setPinValue('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[200] p-4 transition-all duration-200 ${
      isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
    }`}>
      <div className={`w-full max-w-sm rounded-2xl border-2 shadow-2xl p-6 transition-all duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'
          }`}>
            <Lock className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('pinPrompt', language)}
          </h2>
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pinValue}
          onChange={(e) => {
            setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="G求 G求 G求 G求 G求 G求"
          aria-label={t('enterPin', language)}
          className={`w-full px-4 py-4 rounded-xl border-2 text-center text-2xl tracking-[0.5em] font-mono outline-none mb-4 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-600'
              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
          }`}
        />

        {error && (
          <p className={`text-sm font-medium text-center mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={pinValue.length < 4 || isVerifying}
          aria-label={t('unlock', language)}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            pinValue.length >= 4 && !isVerifying
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400'
              : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isVerifying ? '...' : t('unlock', language)}
        </button>
      </div>
    </div>
  );
}
