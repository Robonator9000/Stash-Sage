import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { roundToHundredth } from '../utils/helpers';
import { Product } from '../types';
import { Package, Scale, Flame, Star, Percent, DollarSign } from 'lucide-react';

interface StatsCardProps {
  products: Product[];
  isDark?: boolean;
}

export function StatsCard({ products, isDark = true }: StatsCardProps) {
  const { settings } = useSettings();
  const stats = settings.statsVisibility;

  const totalProducts = products.length;
  const totalAmount = roundToHundredth(products.reduce((sum, p) => sum + p.amount, 0));
  const totalSessions = products.reduce((sum, p) => sum + (p.consumptionCount || 0), 0);
  const averageRating = products.filter(p => p.rating > 0).length > 0
    ? roundToHundredth(products.filter(p => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) / products.filter(p => p.rating > 0).length)
    : 0;
  const averageTHC = products.filter(p => p.thc > 0).length > 0
    ? roundToHundredth(products.filter(p => p.thc > 0).reduce((sum, p) => sum + p.thc, 0) / products.filter(p => p.thc > 0).length)
    : 0;
  const totalValue = roundToHundredth(products.reduce((sum, p) => sum + (p.price || 0), 0));

  const statItems = [
    { key: 'totalProducts' as const, visible: stats.totalProducts, icon: Package, label: t('totalProducts', settings.language), value: totalProducts.toString(), suffix: '' },
    { key: 'totalAmount' as const, visible: stats.totalAmount, icon: Scale, label: t('totalAmount', settings.language), value: totalAmount.toFixed(2), suffix: 'g' },
    { key: 'totalSessions' as const, visible: stats.totalSessions, icon: Flame, label: t('totalSessions', settings.language), value: totalSessions.toString(), suffix: '' },
    { key: 'averageRating' as const, visible: stats.averageRating, icon: Star, label: t('averageRating', settings.language), value: averageRating.toFixed(2), suffix: '/5' },
    { key: 'averageTHC' as const, visible: stats.averageTHC, icon: Percent, label: t('averageTHC', settings.language), value: averageTHC.toFixed(2), suffix: '%' },
    { key: 'totalValue' as const, visible: stats.totalValue, icon: DollarSign, label: t('totalValue', settings.language), value: totalValue.toFixed(2), suffix: '' },
  ];

  const visibleStats = statItems.filter(s => s.visible);

  if (visibleStats.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all duration-500 ${
      isDark 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 transition-all duration-500">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className={`rounded-xl p-3 text-center transition-all ${
                isDark 
                  ? 'bg-slate-800/50 hover:bg-slate-800' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'
              }`}>
                <Icon className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}{stat.suffix}
              </div>
              <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}