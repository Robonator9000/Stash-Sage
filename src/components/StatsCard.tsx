import { useState, useMemo, memo } from 'react';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Product, Session } from '../types';
import { SimpleGrid, Text, Group, Stack, Box, Paper, UnstyledButton } from '@mantine/core';
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
  IconChevronDown,
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
    { key: 'cleanStreak', icon: IconCalendarDue, label: 'Clean Streak', value: computed.cleanStreakDays.toString(), suffix: computed.cleanStreakDays === 1 ? 'day' : 'days', color: 'green' },
    { key: 'consumptionRate', icon: IconTrendingDown, label: t('consumptionRate', settings.language), value: formatPrecision(computed.consumptionRate, dp), suffix: t('perDay', settings.language), color: 'red' },
    { key: 'weeklyCost', icon: IconCurrencyDollar, label: 'Est. Weekly Cost', value: settings.currency + formatPrecision(computed.weeklyCost, dp), suffix: '', color: 'orange' },
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

  const [showMore, setShowMore] = useState(false);

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

  const primaryColors: Record<string, string[]> = {
    green: ['#10b981', '#06b6d4'],
    red: ['#ef4444', '#f59e0b'],
    orange: ['#f59e0b', '#06b6d4'],
  };

  return (
    <Stack gap="sm">
      {/* Primary — large health stats */}
      {primaryStats.length > 0 && (
        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            const isCleanStreak = stat.key === 'cleanStreak';
            return (
              <NeonGradientCard key={stat.key} borderColors={primaryColors[stat.color] || NEON_BORDER_COLORS[stat.color]} borderRadius={16} className="h-full">
                <Box p="md" style={{ minHeight: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Group gap={6} mb={6}>
                    <Icon size={20} stroke={1.5} style={{ color: `var(--mantine-color-${stat.color}-4)` }} />
                    <Text size="xs" fw={700} tt="uppercase" style={{ color: isDark ? '#fff' : '#000', letterSpacing: 0.5 }}>{stat.label}</Text>
                  </Group>
                  <Text fw={800} size="28px" style={{ lineHeight: 1.1, color: isCleanStreak && computed.cleanStreakDays > 0 ? 'var(--mantine-color-green-5)' : 'inherit' }}>
                    {renderValue(stat)}
                  </Text>
                </Box>
              </NeonGradientCard>
            );
          })}
        </SimpleGrid>
      )}

      {/* Secondary — medium stats */}
      {secondaryStats.length > 0 && (
        <SimpleGrid cols={{ base: 2, xs: 4 }} spacing="sm">
          {secondaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Paper key={stat.key} radius="md" withBorder p="sm" style={{ background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-white)' }}>
                <Group gap={4} mb={4}>
                  <Icon size={14} stroke={1.5} style={{ color: `var(--mantine-color-${stat.color}-4)` }} />
                  <Text size="xs" fw={600} style={{ color: isDark ? '#cbd5e1' : '#475569' }}>{stat.label}</Text>
                </Group>
                <Text fw={700} size="md" style={{ lineHeight: 1.2, color: isDark ? '#fff' : '#000' }}>
                  {renderValue(stat)}
                </Text>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      {/* Tertiary — collapsible less-important stats */}
      {tertiaryStats.length > 0 && (
        <>
          <UnstyledButton onClick={() => setShowMore(!showMore)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: isDark ? '#cbd5e1' : '#475569', padding: '2px 4px' }}>
            <IconChevronDown size={14} style={{ transform: showMore ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            {showMore ? 'Show Less' : 'Show More Stats'}
          </UnstyledButton>
          {showMore && (
            <SimpleGrid cols={{ base: 3, xs: 5 }} spacing="xs">
              {tertiaryStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Paper key={stat.key} radius="sm" withBorder p="xs" style={{ background: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)' }}>
                    <Group gap={4} mb={2}>
                      <Icon size={12} stroke={1.5} style={{ color: `var(--mantine-color-${stat.color}-4)`, opacity: 0.7 }} />
                      <Text size="10px" fw={600} style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{stat.label}</Text>
                    </Group>
                    <Text fw={600} size="sm" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                      {renderValue(stat)}
                    </Text>
                  </Paper>
                );
              })}
            </SimpleGrid>
          )}
        </>
      )}
    </Stack>
  );
});
