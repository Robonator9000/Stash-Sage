import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Product } from '../types';
import { Package, Scale, Flame, Star, Percent, DollarSign, Clock } from 'lucide-react';

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

  const lastConsumedDate = products.reduce<Date | null>((latest, p) => {
    if (!p.lastConsumed) return latest;
    const d = new Date(p.lastConsumed);
    return !latest || d.getTime() > latest.getTime() ? d : latest;
  }, null);
  const lastConsumedStr = lastConsumedDate
    ? (() => {
        const diffMs = Date.now() - lastConsumedDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return t('minutesAgo', settings.language).replace('{n}', diffMins.toString());
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return t('hoursAgo', settings.language).replace('{n}', diffHours.toString());
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 30) return t('daysAgo', settings.language).replace('{n}', diffDays.toString());
        const diffMonths = Math.floor(diffDays / 30);
        return t('monthsAgo', settings.language).replace('{n}', diffMonths.toString());
      })()
    : '—';

  const dp = settings.decimalPrecision;
  const statItems = [
    { key: 'totalProducts' as const, visible: stats.totalProducts, icon: Package, label: t('totalProducts', settings.language), value: totalProducts.toString(), suffix: '' },
    { key: 'totalAmount' as const, visible: stats.totalAmount, icon: Scale, label: t('totalAmount', settings.language), value: formatPrecision(totalAmount, dp), suffix: 'g' },
    { key: 'totalSessions' as const, visible: stats.totalSessions, icon: Flame, label: t('totalSessions', settings.language), value: totalSessions.toString(), suffix: '' },
    { key: 'averageRating' as const, visible: stats.averageRating, icon: Star, label: t('averageRating', settings.language), value: formatPrecision(averageRating, dp), suffix: '/5' },
    { key: 'averageTHC' as const, visible: stats.averageTHC, icon: Percent, label: t('averageTHC', settings.language), value: formatPrecision(averageTHC, dp), suffix: '%' },
    { key: 'totalValue' as const, visible: stats.totalValue, icon: DollarSign, label: t('totalValue', settings.language), value: settings.currency + formatPrecision(totalValue, dp), suffix: '' },
    { key: 'lastConsumed' as const, visible: stats.lastConsumed, icon: Clock, label: t('lastConsumed', settings.language), value: lastConsumedStr, suffix: '' },
  ];

  const visibleStats = statItems.filter(s => s.visible);

  if (visibleStats.length === 0) return null;

  return (
    <div className={`rounded-2xl transition-all ${
      isDark
        ? 'bg-midnight/80 border border-edge'
        : 'bg-white border border-gray-200'
    }`}>
      <div className="flex flex-wrap gap-px">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className={`flex-1 min-w-[100px] p-3 text-center transition-all hover:scale-[1.02] ${
                isDark
                  ? 'hover:bg-surface/60'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                isDark ? 'bg-cyanx/10' : 'bg-cyan-50'
              }`}>
                <Icon className={`w-4 h-4 ${isDark ? 'text-cyanx' : 'text-cyan-600'}`} />
              </div>
              <div className={`text-xl font-bold tracking-tight ${
                isDark ? 'text-frost' : 'text-gray-900'
              }`}>
                {stat.value}{stat.suffix}
              </div>
              <div className={`text-xs mt-0.5 ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
