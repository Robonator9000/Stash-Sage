import { Package, Plus } from 'lucide-react';
import { t } from '../utils/translations';
import { useSettings } from '../utils/useSettings';

interface EmptyStateProps {
  isDark?: boolean;
  hasProducts: boolean;
  onAddProduct: () => void;
}

export function EmptyState({ isDark = true, hasProducts, onAddProduct }: EmptyStateProps) {
  const { settings } = useSettings();
  const lang = settings.language;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${
      isDark ? 'text-slate-400' : 'text-gray-500'
    }`}>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
        isDark ? 'bg-slate-800' : 'bg-gray-100'
      }`}>
        <Package className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
      </div>
      
      {!hasProducts ? (
        <>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('noProductsYet', lang)}
          </h3>
          <p className="text-center mb-6 max-w-sm">
            {t('addFirstProductHint', lang)}
          </p>
          <button
            onClick={onAddProduct}
            aria-label={t('addProduct', lang)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400"
          >
            <Plus className="w-5 h-5" />
            {t('addProduct', lang)}
          </button>
        </>
      ) : (
        <>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('noProductsFound', lang)}
          </h3>
          <p className="text-center">
            {t('adjustSearchHint', lang)}
          </p>
        </>
      )}
    </div>
  );
}