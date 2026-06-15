import { Plus, Minus } from 'lucide-react';

interface AmountStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  isDark?: boolean;
  label?: string;
  precision?: number;
  suffix?: string;
}

export function AmountStepper({ value, onChange, min = 0.01, max = Infinity, step = 0.1, isDark = true, label, precision: _precision, suffix: _suffix }: AmountStepperProps) {
  const adjust = (delta: number) => {
    onChange(Math.max(min, Math.min(max, Math.round((value + delta) * 100) / 100)));
  };

  return (
    <div>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-mist' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => adjust(-step)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
            isDark ? 'bg-surface text-mist hover:bg-surface-light hover:text-frost' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseFloat(e.target.value) || 0)))}
          step={step}
          min={min}
          className={`flex-1 text-center text-lg font-bold rounded-xl py-2.5 outline-none transition-colors ${
            isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-500'
          }`}
        />
        <button
          onClick={() => adjust(step)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
            isDark ? 'bg-surface text-mist hover:bg-surface-light hover:text-frost' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
