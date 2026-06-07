import { useState, useEffect } from 'react';
import { Product, Settings } from '../types';
import { useSettings } from '../utils/useSettings';
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
  const [isVisible, setIsVisible] = useState(false);
  const [people, setPeople] = useState(settings.sessionDefaults.defaultPeople);
  const [amount, setAmount] = useState(settings.sessionDefaults.defaultAmount);
  const [startSession, setStartSession] = useState(false);
  const [consumedAt, setConsumedAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

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
        isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`w-full max-w-sm rounded-2xl border-2 shadow-2xl transition-all duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Consume {product.name}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Available: {formatPrecision(product.amount, settings.decimalPrecision)}g
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition-all ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Amount */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Amount (grams)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustAmount(-0.1)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                  isDark 
                    ? 'bg-slate-800 text-white hover:bg-slate-700' 
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
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-center font-bold outline-none ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                }`}
              />
              <button
                onClick={() => adjustAmount(0.1)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                  isDark 
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500' 
                    : 'bg-cyan-500 text-white hover:bg-cyan-400'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(prev => roundToHundredth(prev + amt))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  +{amt}g
                </button>
              ))}
            </div>
          </div>

          {/* Start Session Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
            isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <Play className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Start Session
                </span>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Track hits with timer
                </p>
              </div>
            </div>
            <button
              onClick={() => setStartSession(!startSession)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                startSession 
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' 
                  : isDark ? 'bg-slate-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                startSession ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* People — only shown when start session is on */}
          {startSession && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users className="w-4 h-4 inline mr-1" />
                People
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPeople(Math.max(1, people - 1))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    isDark 
                      ? 'bg-slate-800 text-white hover:bg-slate-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className={`flex-1 text-center text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {people}
                </span>
                <button
                  onClick={() => setPeople(people + 1)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    isDark 
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500' 
                      : 'bg-cyan-500 text-white hover:bg-cyan-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Consumption Time */}
          <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${
            isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('setConsumptionTime', settings.language)}
            </span>
            <input
              type="datetime-local"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              className={`text-xs border-0 bg-transparent outline-none ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            />
          </div>

          {/* Remaining After */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Remaining after:
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatPrecision(Math.max(0, roundToHundredth(product.amount - amount)), settings.decimalPrecision)}g
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 p-5 border-t ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <button
            onClick={handleClose}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConsume}
            disabled={amount <= 0}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              amount > 0
                ? isDark 
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400' 
                    : 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:from-cyan-500 hover:to-emerald-500'
                : 'bg-slate-700 cursor-not-allowed'
            }`}
          >
            {startSession ? 'Start Session' : 'Consume'}
          </button>
        </div>
      </div>
    </div>
  );
}