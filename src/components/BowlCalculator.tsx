import { useState, useEffect } from 'react';
import { Calculator, Users, Scale, Divide, RefreshCw, ArrowRight, X } from 'lucide-react';

interface BowlCalculatorProps {
  isDark?: boolean;
}

export function BowlCalculator({ isDark = true }: BowlCalculatorProps) {
  const [totalAmount, setTotalAmount] = useState<number>(1);
  const [unit, setUnit] = useState<'g' | 'oz'>('g');
  const [people, setPeople] = useState<number>(2);
  const [amountPerPerson, setAmountPerPerson] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);

  const calculateAmount = () => {
    if (people > 0 && totalAmount > 0) {
      const amount = totalAmount / people;
      setAmountPerPerson(amount);
      setShowResult(true);
    }
  };

  const resetCalculator = () => {
    setTotalAmount(1);
    setUnit('g');
    setPeople(2);
    setAmountPerPerson(0);
    setShowResult(false);
  };

  const formatAmount = (amount: number, u: 'g' | 'oz'): string => {
    if (u === 'oz') {
      // For ounces, show more decimal places for small amounts
      if (amount < 0.1) {
        return `${amount.toFixed(4)} oz`;
      }
      return `${amount.toFixed(3)} oz`;
    }
    // For grams, show 2 decimal places
    return `${amount.toFixed(2)} g`;
  };

  // Calculate grams equivalent for reference
  const getGramsEquivalent = (amount: number, u: 'g' | 'oz'): string => {
    if (u === 'oz') {
      const grams = amount * 28.3495;
      return `(${grams.toFixed(2)}g)`;
    }
    const oz = amount / 28.3495;
    return `(${oz.toFixed(3)} oz)`;
  };

  return (
    <div className="space-y-6">
      {/* Total Amount */}
      <div>
        <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Scale className="w-4 h-4" />
          Total Amount to Consume
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={totalAmount || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setTotalAmount(isNaN(val) ? 0 : val);
              setShowResult(false);
            }}
            className={`flex-1 px-4 py-3 rounded-xl border-2 text-lg font-semibold transition-colors ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white focus:border-violet-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'
            } outline-none`}
            min="0"
            step="0.1"
            placeholder="0"
          />
          <div className="grid grid-cols-2 gap-2">
            {(['g', 'oz'] as const).map((u) => (
              <button
                key={u}
                onClick={() => {
                  setUnit(u);
                  setShowResult(false);
                }}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                  unit === u
                    ? isDark 
                      ? 'bg-violet-500/20 border-violet-500 text-violet-400' 
                      : 'bg-violet-50 border-violet-500 text-violet-600'
                    : isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' 
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Number of People */}
      <div>
        <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Users className="w-4 h-4" />
          Number of People
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (people > 1) {
                setPeople(people - 1);
                setShowResult(false);
              }
            }}
            disabled={people <= 1}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${
              people > 1
                ? isDark 
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                : isDark 
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-600' 
                  : 'bg-gray-100/50 border-gray-200/50 text-gray-300'
            }`}
          >
            <span className="text-2xl font-bold">−</span>
          </button>
          <div className={`flex-1 text-center py-3 rounded-xl border-2 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {people}
            </span>
            <span className={`ml-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {people === 1 ? 'person' : 'people'}
            </span>
          </div>
          <button
            onClick={() => {
              if (people < 20) {
                setPeople(people + 1);
                setShowResult(false);
              }
            }}
            disabled={people >= 20}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${
              people < 20
                ? isDark 
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                : isDark 
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-600' 
                  : 'bg-gray-100/50 border-gray-200/50 text-gray-300'
            }`}
          >
            <span className="text-2xl font-bold">+</span>
          </button>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateAmount}
        disabled={totalAmount <= 0 || people <= 0}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          totalAmount > 0 && people > 0
            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-violet-500/25'
            : isDark 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Divide className="w-5 h-5" />
        Calculate Split
      </button>

      {/* Result */}
      {showResult && amountPerPerson > 0 && (
        <div className={`p-5 rounded-xl border-2 transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30' 
            : 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200'
        }`}>
          <div className="text-center">
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Each person gets
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatAmount(amountPerPerson, unit)}
              </span>
            </div>
            <div className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {getGramsEquivalent(amountPerPerson, unit)}
            </div>
            <div className={`mt-4 flex items-center justify-center gap-2 text-sm ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}>
              <span>{formatAmount(totalAmount, unit)}</span>
              <ArrowRight className="w-4 h-4" />
              <span>{people} {people === 1 ? 'person' : 'people'}</span>
              <ArrowRight className="w-4 h-4" />
              <span className={`font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                {formatAmount(amountPerPerson, unit)} each
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Quick Presets
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { amount: 0.5, label: '0.5g' },
            { amount: 1, label: '1g' },
            { amount: 2, label: '2g' },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setTotalAmount(preset.amount);
                setUnit('g');
                setShowResult(false);
              }}
              className={`py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                totalAmount === preset.amount && unit === 'g'
                  ? isDark 
                    ? 'bg-violet-500/20 border-violet-500 text-violet-400' 
                    : 'bg-violet-50 border-violet-500 text-violet-600'
                  : isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetCalculator}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
          isDark 
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <RefreshCw className="w-4 h-4" />
        Reset Calculator
      </button>
    </div>
  );
}