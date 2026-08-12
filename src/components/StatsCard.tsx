import { useState, useMemo, memo } from 'react';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Product, Session } from '../types';
import { SimpleGrid, Text, Group } from '@mantine/core';
import {
  IconPackage,
  IconScale,
  IconFlame,
  IconStar,
  IconPercentage,
  IconCurrencyDollar,
  IconClock,
  IconTrendingDown,
  IconCalendarDue,
} from '@tabler/icons-react';
import { NeonGradientCard, NumberTicker } from './magicui';

const NEON_BORDER_COLORS: Record<string, string[]> = {
  blue: ['#06b6d4', '#13eeef'],
  cyan: ['#06b6d4', '#13eeef'],
  orange: ['#f59e0b', '#06b6d4'],
  yellow: ['#f59e0b', '#13eeef'],
  grape: ['#10b981', '#06b6d4'],
  teal: ['#10b981', '#13eeef'],
  green: ['#10b981', '#06b6d4'],
  gray: ['#06b6d4', '#10b981'],
  red: ['#f59e0b', '#06b6d4'],
  violet: ['#10b981', '#06b6d4'],
};

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
    let projectedRunOut = '\u2014';
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
    if (!lastConsumedDate) return '\u2014';
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
    { key: 'totalProducts' as const, visible: stats.totalProducts, icon: IconPackage, label: t('totalProducts', settings.language), value: computed.totalProducts.toString(), suffix: '', color: 'blue' },
    { key: 'totalAmount' as const, visible: stats.totalAmount, icon: IconScale, label: t('totalAmount', settings.language), value: formatPrecision(computed.totalAmount, dp), suffix: 'g', color: 'cyan' },
    { key: 'totalSessions' as const, visible: stats.totalSessions, icon: IconFlame, label: t('totalSessions', settings.language), value: computed.totalSessions.toString(), suffix: '', color: 'orange' },
    { key: 'averageRating' as const, visible: stats.averageRating, icon: IconStar, label: t('averageRating', settings.language), value: formatPrecision(computed.averageRating, dp), suffix: '/5', color: 'yellow' },
    { key: 'averageTHC' as const, visible: stats.averageTHC, icon: IconPercentage, label: t('averageTHC', settings.language), value: formatPrecision(computed.averageTHC, dp), suffix: '%', color: 'grape' },
    { key: 'totalValue' as const, visible: stats.totalValue, icon: IconCurrencyDollar, label: t('totalValue', settings.language), value: settings.currency + formatPrecision(computed.totalValue, dp), suffix: '', color: 'teal' },
    { key: 'pricePerGram' as const, visible: stats.pricePerGram && computed.totalAmount > 0, icon: IconCurrencyDollar, label: t('pricePerGram', settings.language), value: settings.currency + formatPrecision(computed.pricePerGram, dp), suffix: '/g', color: 'green' },
    { key: 'lastConsumed' as const, visible: stats.lastConsumed, icon: IconClock, label: t('lastConsumed', settings.language), value: lastConsumedStr, suffix: '', color: 'gray' },
    { key: 'consumptionRate' as const, visible: stats.consumptionRate && computed.consumptionRate > 0, icon: IconTrendingDown, label: t('consumptionRate', settings.language), value: formatPrecision(computed.consumptionRate, dp), suffix: t('perDay', settings.language), color: 'red' },
    { key: 'projectedRunOut' as const, visible: stats.projectedRunOut && computed.projectedRunOut !== '\u2014', icon: IconCalendarDue, label: t('projectedRunOut', settings.language), value: computed.projectedRunOut, suffix: t('days', settings.language), color: 'violet' },
  ], [computed, stats, dp, lastConsumedStr, settings.language, settings.currency]);

  const visibleStats = statItems.filter(s => s.visible);

  if (visibleStats.length === 0) return null;

  const handleContextMenu = (statKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    toggleStatVisibility(statKey as keyof typeof stats);
    setHiddenHint(statKey);
    setTimeout(() => setHiddenHint(null), 2000);
  };

  const renderValue = (stat: { value: string; suffix: string }) => {
    const currency = settings.currency;
    let prefix = '';
    let numeric = stat.value;
    if (currency && numeric.startsWith(currency)) {
      prefix = currency;
      numeric = numeric.slice(currency.length);
    }
    const num = Number(numeric);
    if (numeric !== '' && isFinite(num)) {
      const decimals = numeric.includes('.') ? numeric.split('.')[1].length : 0;
      return <NumberTicker value={num} decimals={decimals} prefix={prefix} suffix={stat.suffix} />;
    }
    return <>{stat.value}{stat.suffix}</>;
  };

  return (
    <div style={{ position: 'relative' }}>
      {hiddenHint && (
        <Text size="xs" style={{
          position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, padding: '4px 12px', borderRadius: 8,
          background: isDark ? '#1e293b' : '#fff',
          color: isDark ? '#22d3ee' : '#0891b2',
          border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          whiteSpace: 'nowrap',
        }}>
          {t('statHiddenHint', settings.language)}
        </Text>
      )}
      <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="sm">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="h-full"
              onContextMenu={(e) => handleContextMenu(stat.key, e)}
              title={t('rightClickToHide', settings.language)}
              style={{
                cursor: 'context-menu',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(1.02)';
                el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(1)';
                el.style.boxShadow = 'none';
              }}
            >
              <NeonGradientCard borderColors={NEON_BORDER_COLORS[stat.color]} borderRadius={12} className="h-full">
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={600} style={{ color: isDark ? '#fff' : '#000' }}>{stat.label}</Text>
                  <Icon size={18} stroke={1.5} style={{ color: `var(--mantine-color-${stat.color}-4)` }} />
                </Group>
                <Text fw={700} size="lg" style={{ lineHeight: 1.2, color: 'var(--mantine-color-slate-1)' }}>
                  {renderValue(stat)}
                </Text>
              </NeonGradientCard>
            </div>
          );
        })}
      </SimpleGrid>
    </div>
  );
});
