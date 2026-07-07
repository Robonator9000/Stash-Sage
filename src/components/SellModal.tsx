import { useState } from 'react';
import { Product } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { X, DollarSign, Package, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { t } from '../utils/translations';

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
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const lang = settings.language;

  const [selectedPortion, setSelectedPortion] = useState<number | null>(null);
  const [customPortion, setCustomPortion] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [pricePerPortion, setPricePerPortion] = useState('');
  const [quickSellGrams, setQuickSellGrams] = useState('');
  const [quickSellPortions, setQuickSellPortions] = useState('');

  const portionGrams = selectedPortion !== null ? selectedPortion : (parseFloat(customPortion) || 0);
  const numberOfPortions = portionGrams > 0 ? Math.floor(product.amount / portionGrams) : 0;
  const portionPrice = parseFloat(pricePerPortion) || 0;
  const totalSaleValue = numberOfPortions * portionPrice;
  const profit = totalSaleValue - product.price;

  const handleSell = () => {
    const grams = parseFloat(quickSellGrams);
    const portions = parseInt(quickSellPortions) || 0;
    const total = grams * portions;
    if (grams > 0 && portions > 0 && total <= product.amount) {
      onSell(roundToHundredth(total));
    }
  };

  const quickSellTotal = (parseFloat(quickSellGrams) || 0) * (parseInt(quickSellPortions) || 0);
  const canQuickSell = (parseFloat(quickSellGrams) || 0) > 0 && (parseInt(quickSellPortions) || 0) > 0 && quickSellTotal <= product.amount;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${isVisible ? 'bg-black/10 backdrop-blur-[2px]' : 'bg-black/0'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('sell', lang)} ${product.name}`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border-2 shadow-2xl transition-all duration-200 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('sell', lang)} {product.name}</h2>
            <div className={`flex items-center gap-3 text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <span>{t('amount', lang)}: {formatPrecision(product.amount, settings.decimalPrecision)}g</span>
              {product.price > 0 && <span>{t('paid', lang)}: {settings.currency}{formatPrecision(product.price, 2)}</span>}
            </div>
          </div>
          <button onClick={handleClose} aria-label={t('cancel', lang)} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Divide into portions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('divideIntoPortions', lang)}</label>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {PORTION_SIZES.map((p) => {
                const disabled = p.grams > product.amount;
                return (
                  <button key={p.grams} onClick={() => { if (!disabled) { setSelectedPortion(p.grams); setCustomPortion(''); setShowCustom(false); } }} disabled={disabled}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${disabled ? isDark ? 'text-slate-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed' : selectedPortion === p.grams ? isDark ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border-2 border-cyan-500/30' : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >{p.label}</button>
                );
              })}
              <button onClick={() => { setShowCustom(!showCustom); setSelectedPortion(null); setCustomPortion(''); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${showCustom ? isDark ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border-2 border-cyan-500/30' : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              ><Plus className="w-3.5 h-3.5" /><span>{t('custom', lang)}</span></button>
            </div>
            {showCustom && (
              <div className="flex items-center gap-2 mb-1">
                <input type="number" value={customPortion} onChange={(e) => { setCustomPortion(e.target.value); setSelectedPortion(null); }} placeholder={t('grams', lang)} min="0" step="0.1" autoFocus
                  className={`flex-1 px-3 py-2 rounded-xl border-2 outline-none text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'}`} />
              </div>
            )}
          </div>

          {/* Price per portion (only if portions selected) */}
          {portionGrams > 0 && (
            <div className={`p-4 rounded-xl border-2 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('pricePerPortion', lang)}</label>
              </div>
              <input type="number" value={pricePerPortion} onChange={(e) => setPricePerPortion(e.target.value)} placeholder={`${settings.currency}0.00`} min="0" step="0.01"
                className={`w-full px-3 py-2 rounded-xl border-2 outline-none text-sm mb-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'}`} />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('portions', lang)}:</span><span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{numberOfPortions}</span></div>
                <div className="flex justify-between text-sm"><span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('perPortion', lang)}:</span><span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrecision(portionGrams, settings.decimalPrecision)}g</span></div>
                <div className="flex justify-between text-sm"><span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('saleValue', lang)}:</span><span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{settings.currency}{formatPrecision(totalSaleValue, 2)}</span></div>
                {product.price > 0 && (
                  <div className={`flex justify-between text-sm pt-1.5 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{profit >= 0 ? t('profit', lang) : t('loss', lang)}:</span>
                    <span className={`font-bold flex items-center gap-1 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('quickSell', lang)}</label>
            <div className="mb-3">
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('gramsPerPortion', lang)}</span>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => { const cur = parseFloat(quickSellGrams) || 0; const next = Math.max(0, Math.round((cur - 0.5) * 10) / 10); setQuickSellGrams(next > 0 ? String(next) : ''); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>−</button>
                <input type="number" value={quickSellGrams} onChange={(e) => setQuickSellGrams(e.target.value)} placeholder="0" min="0" step="0.1"
                  className={`flex-1 px-3 py-2 rounded-xl border-2 outline-none text-sm text-center font-medium ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'}`} />
                <button onClick={() => { const cur = parseFloat(quickSellGrams) || 0; setQuickSellGrams(String(Math.round((cur + 0.5) * 10) / 10)); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${isDark ? 'bg-emera text-white hover:bg-emera-dark' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>+</button>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0.5, 1, 2, 3.5, 7].map((amt) => (
                  <button key={amt} onClick={() => setQuickSellGrams(String(amt))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>+{amt}g</button>
                ))}
              </div>
            </div>
            <div>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('numberOfPortions', lang)}</span>
              <input type="number" value={quickSellPortions} onChange={(e) => setQuickSellPortions(e.target.value)} placeholder="0" min="0" step="1"
                className={`w-full px-3 py-2 rounded-xl border-2 outline-none text-sm mt-1 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'}`} />
            </div>
            <div className={`p-3 rounded-xl mt-3 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('totalToSell', lang)}:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrecision(quickSellTotal, settings.decimalPrecision)}g</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('remainingAfter', lang)}:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrecision(Math.max(0, roundToHundredth(product.amount - quickSellTotal)), settings.decimalPrecision)}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 p-5 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <button onClick={handleClose} className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t('cancel', lang)}</button>
          <button onClick={handleSell} disabled={!canQuickSell} aria-label={t('sell', lang)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${canQuickSell ? isDark ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400' : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500' : 'bg-slate-700 cursor-not-allowed'}`}>
            <DollarSign className="w-4 h-4" />{t('sell', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
