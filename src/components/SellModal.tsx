import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { useSettings } from '../utils/useSettings';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { X, DollarSign, Package, TrendingUp, TrendingDown } from 'lucide-react';

interface SellModalProps {
  product: Product;
  onSell: (amount: number) => void;
  onClose: () => void;
  isDark?: boolean;
}

const PORTION_SIZES = [
  { label: '0.5g', grams: 0.5 },
  { label: '1g', grams: 1 },
  { label: '2g', grams: 2 },
  { label: '3.5g (\u215B oz)', grams: 3.5 },
  { label: '5g', grams: 5 },
  { label: '7g (\u00BC oz)', grams: 7 },
  { label: '14g (\u00BD oz)', grams: 14 },
  { label: '28g (1 oz)', grams: 28 },
  { label: '56g (2 oz)', grams: 56 },
  { label: '112g (\u00BC lb)', grams: 112 },
  { label: '224g (\u00BD lb)', grams: 224 },
  { label: '453.6g (1 lb)', grams: 453.592 },
];

export function SellModal({ product, onSell, onClose, isDark = true }: SellModalProps) {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(false);

  const [selectedPortion, setSelectedPortion] = useState<number | null>(null);
  const [customPortion, setCustomPortion] = useState('');
  const [pricePerPortion, setPricePerPortion] = useState('');
  const [quickSellGrams, setQuickSellGrams] = useState('');
  const [quickSellPortions, setQuickSellPortions] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const availablePortions = useMemo(
    () => PORTION_SIZES.filter((p) => p.grams <= product.amount),
    [product.amount]
  );

  const portionGrams = selectedPortion !== null ? selectedPortion : (parseFloat(customPortion) || 0);
  const numberOfPortions = portionGrams > 0 ? Math.floor(product.amount / portionGrams) : 0;
  const portionPrice = parseFloat(pricePerPortion) || 0;
  const totalSaleValue = numberOfPortions * portionPrice;
  const profit = totalSaleValue - product.price;

  const handleSell = () => {
    const grams = parseFloat(quickSellGrams);
    if (grams > 0 && grams <= product.amount) {
      onSell(roundToHundredth(grams));
    }
  };

  const canQuickSell = parseFloat(quickSellGrams) > 0 && parseFloat(quickSellGrams) <= product.amount;

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
              Sell {product.name}
            </h2>
            <div className={`flex items-center gap-3 text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <span>Available: {formatPrecision(product.amount, settings.decimalPrecision)}g</span>
              {product.price > 0 && <span>Paid: {settings.currency}{formatPrecision(product.price, 2)}</span>}
            </div>
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
          {/* Divide into portions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Divide into Portions
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {availablePortions.map((p) => (
                <button
                  key={p.grams}
                  onClick={() => { setSelectedPortion(p.grams); setCustomPortion(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPortion === p.grams
                      ? isDark
                        ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/30'
                        : 'bg-cyan-50 text-cyan-600 border-2 border-cyan-500/30'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Custom:</span>
              <input
                type="number"
                value={customPortion}
                onChange={(e) => { setCustomPortion(e.target.value); setSelectedPortion(null); }}
                placeholder="grams"
                min="0"
                step="0.1"
                className={`flex-1 px-3 py-2 rounded-xl border-2 outline-none text-sm ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* Pricing & Profit */}
          {portionGrams > 0 && (
            <div className={`p-4 rounded-xl border-2 ${
              isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Price per Portion
                </label>
              </div>
              <input
                type="number"
                value={pricePerPortion}
                onChange={(e) => setPricePerPortion(e.target.value)}
                placeholder={`${settings.currency}0.00`}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 rounded-xl border-2 outline-none text-sm mb-3 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                }`}
              />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Portions:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{numberOfPortions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Per portion:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatPrecision(portionGrams, settings.decimalPrecision)}g
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Sale value:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {settings.currency}{formatPrecision(totalSaleValue, 2)}
                  </span>
                </div>
                {product.price > 0 && (
                  <div className={`flex justify-between text-sm pt-1.5 border-t ${
                    isDark ? 'border-slate-700' : 'border-gray-200'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                      {profit >= 0 ? 'Profit' : 'Loss'}:
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${
                      profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {profit >= 0 ? '+' : ''}{settings.currency}{formatPrecision(profit, 2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Sell */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Quick Sell
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Grams to sell</span>
                <input
                  type="number"
                  value={quickSellGrams}
                  onChange={(e) => setQuickSellGrams(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className={`w-full px-3 py-2 rounded-xl border-2 outline-none text-sm mt-1 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  }`}
                />
              </div>
              <div>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Number of portions</span>
                <input
                  type="number"
                  value={quickSellPortions}
                  onChange={(e) => setQuickSellPortions(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className={`w-full px-3 py-2 rounded-xl border-2 outline-none text-sm mt-1 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Remaining after:
                </span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatPrecision(Math.max(0, roundToHundredth(product.amount - (parseFloat(quickSellGrams) || 0))), settings.decimalPrecision)}g
                </span>
              </div>
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
            onClick={handleSell}
            disabled={!canQuickSell}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              canQuickSell
                ? isDark
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500'
                : 'bg-slate-700 cursor-not-allowed'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Sell
          </button>
        </div>
      </div>
    </div>
  );
}
