import { useState, useMemo, memo } from 'react';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Product, Session } from '../types';
import { Package, Scale, Flame, Star, Percent, DollarSign, Clock, TrendingDown, CalendarDays } from 'lucide-react';

interface StatsCardProps {
  products: Product[];
  sessions: Session[];
  isDark?: boolean;
}

export const StatsCard = memo(function StatsCard({ products, sessions, isDark = true }: StatsCardProps) {
  const { settings, toggleStatVisibility } = useSettings();
  const stats = settings.statsVisibility;
  const [hiddenHint, setHiddenHint] = useState<string | null>(null);

  const computed = useMemo(() => {
    const totalProducts = products.length;
    const totalAmount = roundToHundredth(products.reduce((sum, p) => sum + p.amount, 0));
    const totalSessions = products.reduce((sum, p) => sum + (p.consumptionCount || 0), 0);
    const rated = products.filter(p => p.rating > 0);
    const averageRating = rated.length > 0
      ? roundToHundredth(rated.reduce((sum, p) => sum + p.rating, 0) / rated.length)
      : 0;
    const thcProducts = products.filter(p => p.thc > 0);
    const averageTHC = thcProducts.length > 0
      ? roundToHundredth(thcProducts.reduce((sum, p) => sum + p.thc, 0) / thcProducts.length)
      : 0;
    const totalValue = roundToHundredth(products.reduce((sum, p) => sum + (p.price || 0) * p.amount, 0));
    const pricePerGram = totalAmount > 0 ? roundToHundredth(totalValue / totalAmount) : 0;

    let consumptionRate = 0;
    let projectedRunOut = '—';
    if (sessions.length > 0) {
      const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstSessionDate = new Date(sortedSessions[0].date);
      const daysDiff = Math.max(1, (Date.now() - firstSessionDate.getTime()) / 86400000);
      const totalConsumed = sessions.reduce((sum, s) => sum + Math.max(0, s.amount), 0);
      consumptionRate = roundToHundredth(totalConsumed / daysDiff);
      if (consumptionRate > 0 && totalAmount > 0) {
        projectedRunOut = Math.round(totalAmount / consumptionRate).toString();
      }
    }

    return { totalProducts, totalAmount, totalSessions, averageRating, averageTHC, totalValue, pricePerGram, consumptionRate, projectedRunOut };
  }, [products, sessions]);

  const lastConsumedStr = useMemo(() => {
    const lastConsumedDate = products.reduce<Date | null>((latest, p) => {
      if (!p.lastConsumed) return latest;
      const d = new Date(p.lastConsumed);
      return !latest || d.getTime() > latest.getTime() ? d : latest;
    }, null);
    if (!lastConsumedDate) return '—';
    const diffMs = Date.now() - lastConsumedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return t('minutesAgo', settings.language).replace('{n}', diffMins.toString());
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('hoursAgo', settings.language).replace('{n}', diffHours.toString());
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return t('daysAgo', settings.language).replace('{n}', diffDays.toString());
    const diffMonths = Math.floor(diffDays / 30);
    return t('monthsAgo', settings.language).replace('{n}', diffMonths.toString());
  }, [products, settings.language]);

  const dp = settings.decimalPrecision;
  const statItems = useMemo(() => [
    { key: 'totalProducts' as const, visible: stats.totalProducts, icon: Package, label: t('totalProducts', settings.language), value: computed.totalProducts.toString(), suffix: '' },
    { key: 'totalAmount' as const, visible: stats.totalAmount, icon: Scale, label: t('totalAmount', settings.language), value: formatPrecision(computed.totalAmount, dp), suffix: 'g' },
    { key: 'totalSessions' as const, visible: stats.totalSessions, icon: Flame, label: t('totalSessions', settings.language), value: computed.totalSessions.toString(), suffix: '' },
    { key: 'averageRating' as const, visible: stats.averageRating, icon: Star, label: t('averageRating', settings.language), value: formatPrecision(computed.averageRating, dp), suffix: '/5' },
    { key: 'averageTHC' as const, visible: stats.averageTHC, icon: Percent, label: t('averageTHC', settings.language), value: formatPrecision(computed.averageTHC, dp), suffix: '%' },
    { key: 'totalValue' as const, visible: stats.totalValue, icon: DollarSign, label: t('totalValue', settings.language), value: settings.currency + formatPrecision(computed.totalValue, dp), suffix: '' },
    { key: 'pricePerGram' as const, visible: stats.pricePerGram && computed.totalAmount > 0, icon: DollarSign, label: t('pricePerGram', settings.language), value: settings.currency + formatPrecision(computed.pricePerGram, dp), suffix: '/g' },
    { key: 'lastConsumed' as const, visible: stats.lastConsumed, icon: Clock, label: t('lastConsumed', settings.language), value: lastConsumedStr, suffix: '' },
    { key: 'consumptionRate' as const, visible: stats.consumptionRate && computed.consumptionRate > 0, icon: TrendingDown, label: t('consumptionRate', settings.language), value: formatPrecision(computed.consumptionRate, dp), suffix: t('perDay', settings.language) },
    { key: 'projectedRunOut' as const, visible: stats.projectedRunOut && computed.projectedRunOut !== '—', icon: CalendarDays, label: t('projectedRunOut', settings.language), value: computed.projectedRunOut, suffix: t('days', settings.language) },
  ], [computed, stats, dp, lastConsumedStr, settings.language, settings.currency]);

  const visibleStats = statItems.filter(s => s.visible);

  if (visibleStats.length === 0) return null;

  const handleContextMenu = (statKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    toggleStatVisibility(statKey as keyof typeof stats);
    setHiddenHint(statKey);
    setTimeout(() => setHiddenHint(null), 2000);
  };

  return (
    <div className={`relative rounded-2xl transition-all ${
      isDark
        ? 'bg-midnight/80 border border-edge'
        : 'bg-white border border-gray-200'
    }`}>
      {hiddenHint && (
        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
          isDark ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'bg-white text-cyan-600 border border-gray-200'
        }`}>
          {t('statHiddenHint', settings.language)}
        </div>
      )}
      <div className="flex flex-wrap gap-2 p-3">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              onContextMenu={(e) => handleContextMenu(stat.key, e)}
              title={t('rightClickToHide', settings.language)}
              className={`flex-1 min-w-[100px] p-3 rounded-xl text-center transition-all hover:scale-[1.02] cursor-context-menu ${
                isDark
                  ? 'bg-surface/40 hover:bg-surface/80 border border-transparent hover:border-edge'
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                isDark ? 'bg-cyanx/10' : 'bg-cyan-50'
              }`}>
                <Icon className={`w-4 h-4 ${isDark ? 'text-cyanx' : 'text-cyan-600'}`} />
              </div>
              <div className={`text-lg font-bold tracking-tight ${
                isDark ? 'text-frost' : 'text-gray-900'
              }`}>
                {stat.value}{stat.suffix}
              </div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
