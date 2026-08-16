import { useMemo, memo } from 'react';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Product, Session } from '../types';
import { SimpleGrid, Text, Group, Paper, Box } from '@mantine/core';
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
import { NumberTicker } from './magicui';

interface StatsCardProps {
  products: Product[];
  sessions: Session[];
  isDark?: boolean;
  rangeLabel?: string;
}

export const StatsCard = memo(function StatsCard({ products, sessions, isDark = true, rangeLabel }: StatsCardProps) {
  const { settings } = useSettings();

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

    const dailyCost = consumptionRate > 0 ? roundToHundredth(consumptionRate * pricePerGram) : 0;
    const weeklyCost = roundToHundredth(dailyCost * 7);
    const monthlyCost = roundToHundredth(dailyCost * 30);

    const lastDate = products.reduce<Date | null>((latest, p) => {
      if (!p.lastConsumed) return latest;
      const d = new Date(p.lastConsumed);
      return !latest || d.getTime() > latest.getTime() ? d : latest;
    }, null);
    const cleanStreakDays = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / 86400000) : 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const last30Consumed = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo).reduce((sum, s) => sum + Math.max(0, s.amount), 0);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
    const prev30Consumed = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).reduce((sum, s) => sum + Math.max(0, s.amount), 0);
    const trendDir = last30Consumed > prev30Consumed ? 'up' : last30Consumed < prev30Consumed ? 'down' : 'flat';

    return { totalProducts, totalAmount, totalSessions, averageRating, averageTHC, totalValue, pricePerGram, consumptionRate, projectedRunOut, weeklyCost, monthlyCost, cleanStreakDays, last30Consumed, trendDir };
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

  interface StatItem {
    key: string;
    icon: typeof IconPackage;
    label: string;
    value: string;
    suffix: string;
    color: string;
  }

  const primaryStats: StatItem[] = useMemo(() => [
    { key: 'cleanStreak', icon: IconCalendarDue, label: t('cleanStreak', settings.language), value: computed.cleanStreakDays.toString(), suffix: computed.cleanStreakDays === 1 ? t('unitDay', settings.language) : t('unitDays', settings.language), color: 'green' },
    { key: 'consumptionRate', icon: IconTrendingDown, label: t('consumptionRate', settings.language), value: formatPrecision(computed.consumptionRate, dp), suffix: t('perDay', settings.language), color: 'red' },
    { key: 'weeklyCost', icon: IconCurrencyDollar, label: t('estWeeklyCost', settings.language), value: settings.currency + formatPrecision(computed.weeklyCost, dp), suffix: '', color: 'orange' },
  ].filter(s => s.value !== '0' && s.value !== settings.currency + '0' && !(s.key === 'cleanStreak' && s.value === '0')), [computed, dp, settings.language, settings.currency]);

  const secondaryStats: StatItem[] = useMemo(() => [
    { key: 'totalAmount', icon: IconScale, label: t('totalAmount', settings.language), value: formatPrecision(computed.totalAmount, dp), suffix: 'g', color: 'cyan' },
    { key: 'totalSessions', icon: IconFlame, label: t('totalSessions', settings.language), value: computed.totalSessions.toString(), suffix: '', color: 'orange' },
    { key: 'lastConsumed', icon: IconClock, label: t('lastConsumed', settings.language), value: lastConsumedStr, suffix: '', color: 'gray' },
    { key: 'projectedRunOut', icon: IconCalendarDue, label: t('projectedRunOut', settings.language), value: computed.projectedRunOut, suffix: t('days', settings.language), color: 'violet' },
  ].filter(s => s.value !== '\u2014'), [computed, dp, lastConsumedStr, settings.language]);

  const tertiaryStats: StatItem[] = useMemo(() => [
    { key: 'totalProducts', icon: IconPackage, label: t('totalProducts', settings.language), value: computed.totalProducts.toString(), suffix: '', color: 'blue' },
    { key: 'averageRating', icon: IconStar, label: t('averageRating', settings.language), value: formatPrecision(computed.averageRating, dp), suffix: '/5', color: 'yellow' },
    { key: 'averageTHC', icon: IconPercentage, label: t('averageTHC', settings.language), value: formatPrecision(computed.averageTHC, dp), suffix: '%', color: 'grape' },
    { key: 'totalValue', icon: IconCurrencyDollar, label: t('totalValue', settings.language), value: settings.currency + formatPrecision(computed.totalValue, dp), suffix: '', color: 'teal' },
    { key: 'pricePerGram', icon: IconCurrencyDollar, label: t('pricePerGram', settings.language), value: computed.totalAmount > 0 ? settings.currency + formatPrecision(computed.pricePerGram, dp) : '', suffix: '/g', color: 'green' },
  ].filter(s => s.value !== '' && s.value !== '0' && s.value !== settings.currency + '0' && s.value !== '0.00/5'), [computed, dp, settings.language, settings.currency]);

  if (primaryStats.length === 0 && secondaryStats.length === 0) return null;

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

  const allStats = [...primaryStats, ...secondaryStats, ...tertiaryStats];

  if (allStats.length === 0) return null;

  return (
    <div>
      {rangeLabel && (
        <Text size="xs" fw={600} tt="uppercase" mb={6} c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-slate-6)'}>
          {rangeLabel}
        </Text>
      )}
      <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="sm" style={{ justifyItems: 'stretch' }}>
      {allStats.map((stat) => {
        const Icon = stat.icon;
        const isCleanStreak = stat.key === 'cleanStreak';
        const accentColor = isCleanStreak && computed.cleanStreakDays > 0
          ? 'var(--mantine-color-emerald-5)'
          : 'var(--mantine-color-cyan-5)';
        return (
          <Paper key={stat.key} radius="md" withBorder p="sm" className="h-full" style={{
            background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-white)',
            borderColor: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-3)',
            minHeight: 72,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'border-color 0.15s, transform 0.15s',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.borderColor = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-3)';
          }}>
            <Group gap={6} mb={4}>
              <Box
                w={24}
                h={24}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  borderRadius: 8,
                  background: isDark ? 'rgba(6,182,212,0.12)' : 'var(--mantine-color-cyan-1)',
                }}
              >
                <Icon size={14} stroke={1.5} style={{ color: accentColor }} />
              </Box>
              <Text size="xs" fw={600} style={{ color: isDark ? '#fff' : '#000', lineHeight: 1.2 }}>{stat.label}</Text>
            </Group>
            <Text fw={700} size="lg" style={{ lineHeight: 1.2, color: isCleanStreak && computed.cleanStreakDays > 0 ? 'var(--mantine-color-emerald-5)' : isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-slate-9)' }}>
              {renderValue(stat)}
            </Text>
          </Paper>
        );
      })}
    </SimpleGrid>
    </div>
  );
});
