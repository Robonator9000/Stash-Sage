import { useState, useEffect } from 'react';
import { Product } from '../types';
import { roundToHundredth } from '../utils/helpers';
import { X, Flame, Minus, Plus } from 'lucide-react';

interface ConsumeModalProps {
  product: Product;
  onConsume: (amount: number) => void;
  onClose: () => void;
  isDark?: boolean;
}

export function ConsumeModal({ product, onConsume, onClose, isDark = true }: ConsumeModalProps) {
  const [amount, setAmount] = useState(0.5);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleConsume = () => {
    const roundedAmount = roundToHundredth(amount);
    onConsume(roundedAmount);
    handleClose();
  };

  const quickAmounts = [0.1, 0.25, 0.5, 1, 2];

  const adjustAmount = (delta: number) => {
    setAmount(prev => Math.max(0.01, roundToHundredth(prev + delta)));
  };

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
              Available: {product.amount.toFixed(2)}g
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
        <div className="p-5 space-y-4">
          {/* Quick Amounts */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Quick Select (grams)
            </label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  onClick={() => setAmount(qa)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                    amount === qa
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {qa}g
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Custom Amount (grams)
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustAmount(-0.1)}
                className={`p-3 rounded-xl transition-all ${
                  isDark 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-center font-bold text-lg transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                } outline-none`}
              />
              <button
                onClick={() => adjustAmount(0.1)}
                className={`p-3 rounded-xl transition-all ${
                  isDark 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Remaining After */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Remaining after:
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.max(0, roundToHundredth(product.amount - amount)).toFixed(2)}g
              </span>
            </div>
          </div>

          {/* Consume Button */}
          <button
            onClick={handleConsume}
            disabled={amount <= 0}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              amount > 0
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400'
                : 'bg-slate-700 cursor-not-allowed'
            }`}
          >
            <Flame className="w-5 h-5" />
            Consume {roundToHundredth(amount).toFixed(2)}g
          </button>
        </div>
      </div>
    </div>
  );
}