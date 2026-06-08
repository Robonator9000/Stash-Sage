import { useState } from 'react';
import { Product } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { X, Users, Minus, Plus, Play } from 'lucide-react';
import { t } from '../utils/translations';

interface ConsumeModalProps {
  product: Product;
  onConsume: (amount: number, startSession: boolean, people: number, consumedAt?: Date) => void;
  onClose: () => void;
  isDark?: boolean;
}

export function ConsumeModal({ product, onConsume, onClose, isDark = true }: ConsumeModalProps) {
  const { settings } = useSettings();
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const [people, setPeople] = useState(settings.sessionDefaults.defaultPeople);
  const [amount, setAmount] = useState(settings.sessionDefaults.defaultAmount);
  const [startSession, setStartSession] = useState(false);
  const [consumedAt, setConsumedAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  });

  const lang = settings.language;

  const handleConsume = () => {
    onConsume(roundToHundredth(amount), startSession, people, new Date(consumedAt));
  };

  const adjustAmount = (delta: number) => {
    setAmount(prev => Math.max(0.01, roundToHundredth(prev + delta)));
  };

  const quickAmounts = [0.1, 0.25, 0.5, 1, 2];

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
        isVisible ? 'bg-deep/85 backdrop-blur-sm' : 'bg-deep/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('consume', lang)} ${product.name}`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl transition-all duration-200 ${
          isDark
            ? 'bg-surface border-edge'
            : 'bg-white border-gray-200'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-5 border-b ${
          isDark ? 'border-edge' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>
              {t('consume', lang)} {product.name}
            </h2>
            <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
              {t('amount', lang)}: {formatPrecision(product.amount, settings.decimalPrecision)}g
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label={t('cancel', lang)}
            className={`p-2 rounded-xl transition-all ${
              isDark ? 'hover:bg-surface text-mist hover:text-frost' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-mist' : 'text-gray-700'}`}>
              {t('amount', lang)} ({t('grams', lang)})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustAmount(-0.1)}
                aria-label={`${t('amount', lang)} -0.1`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                  isDark
                    ? 'bg-surface text-mist hover:bg-surface-light hover:text-frost'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.1"
                aria-label={t('amount', lang)}
                className={`flex-1 px-4 py-3 rounded-xl border text-center font-bold outline-none transition-all ${
                  isDark
                    ? 'bg-midnight border-edge text-frost focus:border-cyanx/50'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500'
                }`}
              />
              <button
                onClick={() => adjustAmount(0.1)}
                aria-label={`${t('amount', lang)} +0.1`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                  isDark
                    ? 'bg-emera text-white hover:bg-emera-dark'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mt-3">
                  {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(prev => roundToHundredth(Math.min(product.amount, prev + amt)))}
                  aria-label={`+${amt}g`}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-surface text-mist hover:bg-surface-light'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  +{amt}g
                </button>
              ))}
            </div>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-xl ${
            isDark ? 'bg-midnight border border-edge' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <Play className={`w-5 h-5 ${isDark ? 'text-emera' : 'text-emerald-600'}`} />
              <div>
                <span className={`font-medium ${isDark ? 'text-frost' : 'text-gray-900'}`}>
                  {t('session', lang)}
                </span>
                <p className={`text-xs ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                  {t('sessionDefaults', lang)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setStartSession(!startSession)}
              aria-label={startSession ? t('cancel', lang) : t('start', lang)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                startSession
                  ? 'bg-emera'
                  : isDark ? 'bg-surface' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                startSession ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {startSession && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-mist' : 'text-gray-700'}`}>
                <Users className="w-4 h-4 inline mr-1" />
                {t('people', lang)}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPeople(Math.max(1, people - 1))}
                  aria-label={`${t('people', lang)} -1`}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    isDark
                      ? 'bg-surface text-mist hover:bg-surface-light hover:text-frost'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className={`flex-1 text-center text-xl font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>
                  {people}
                </span>
                <button
                  onClick={() => setPeople(people + 1)}
                  aria-label={`${t('people', lang)} +1`}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    isDark
                      ? 'bg-emera text-white hover:bg-emera-dark'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between p-3 rounded-xl ${
            isDark ? 'bg-midnight border border-edge' : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className={`text-sm ${isDark ? 'text-mist' : 'text-gray-700'}`}>
              {t('setConsumptionTime', lang)}
            </span>
            <input
              type="datetime-local"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              aria-label={t('setConsumptionTime', lang)}
              className={`text-xs border-0 bg-transparent outline-none ${
                isDark ? 'text-mist' : 'text-gray-500'
              }`}
            />
          </div>

          <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                {t('amount', lang)}:
              </span>
              <span className={`font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>
                {formatPrecision(Math.max(0, product.amount - amount), settings.decimalPrecision)}g
              </span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-5 border-t ${
          isDark ? 'border-edge' : 'border-gray-200'
        }`}>
          <button
            onClick={handleClose}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isDark
                ? 'bg-midnight text-mist hover:bg-surface hover:text-frost'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleConsume}
            disabled={amount <= 0}
            aria-label={startSession ? t('session', lang) : t('consume', lang)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all active:scale-[0.97] ${
              amount > 0
                ? isDark
                    ? 'bg-emera text-white hover:bg-emera-dark'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                : isDark ? 'bg-surface text-haze cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {startSession ? t('session', lang) : t('consume', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
