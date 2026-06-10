import { Plus } from 'lucide-react';
import { t } from '../utils/translations';
import { useSettings } from '../utils/useSettings';

interface EmptyStateProps {
  isDark?: boolean;
  hasProducts: boolean;
  onAddProduct: () => void;
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1.5 5.5-4 7-9 10z" />
      <path d="M10.7 20.7c1.1-2.1 2.3-4.5 2.3-7.7" />
    </svg>
  );
}

export function EmptyState({ isDark = true, hasProducts, onAddProduct }: EmptyStateProps) {
  const { settings } = useSettings();
  const lang = settings.language;

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 ${
      isDark ? 'text-mist' : 'text-gray-500'
    }`}>
      <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 ${
        isDark ? 'bg-emera/10 border border-emera/20' : 'bg-emerald-50 border border-emerald-100'
      }`}>
        <LeafIcon className={`w-14 h-14 ${isDark ? 'text-emera' : 'text-emerald-400'}`} />
      </div>

      {!hasProducts ? (
        <>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-frost' : 'text-gray-900'}`}>
            {t('noProductsYet', lang)}
          </h3>
          <p className={`text-center mb-8 max-w-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {t('addFirstProductHint', lang)}
          </p>
          <button
            onClick={onAddProduct}
            aria-label={t('addProduct', lang)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-[0.97] ${
              isDark
                ? 'bg-gradient-to-r from-cyanx to-emera text-white hover:from-cyanx-dark hover:to-emera-dark'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            {t('addProduct', lang)}
          </button>
        </>
      ) : (
        <>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-frost' : 'text-gray-900'}`}>
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
