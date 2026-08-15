import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatsCard } from './StatsCard';
import { CalendarHeatmap } from './CalendarHeatmap';
import { TBreakTracker } from './TBreakTracker';
import { MonthlyTrendsChart } from './MonthlyTrendsChart';
import { Product, Session, Settings } from '../types';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';
import { Paper, Text, Group, Box, SegmentedControl, Badge } from '@mantine/core';
import { ShineBorder, NeonGradientCard, BlurFade, AnimatedGradientText } from './magicui';
import { IconArrowUpRight, IconArrowDownRight, IconMinus } from '@tabler/icons-react';

const DASHBOARD_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

type RangeKey = 'all' | '30d' | '7d' | 'today';

interface DashboardTabProps {
  products: Product[];
  sessions: Session[];
  isDark: boolean;
  lang: string;
  settings: Settings;
  typeDistribution: { name: string; value: number }[];
  consumptionByMonth: { month: string; amount: number }[];
  topStrains: Product[];
  spendingByType: { name: string; value: number }[];
  totalValue: number;
}

const tooltipStyle = (isDark: boolean) => ({
  backgroundColor: isDark ? '#111827' : '#fff',
  border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
  borderRadius: '12px',
  color: isDark ? '#e2e8f0' : '#0f172a',
});

function ChartCard({
  isDark,
  title,
  gradient,
  children,
}: {
  isDark: boolean;
  title: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <Paper p="sm" radius="md" withBorder h="100%" style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#fff' }}>
      <AnimatedGradientText colors={gradient} className="mx-0 mb-1 text-sm font-semibold" animationSpeed={8}>
        {title}
      </AnimatedGradientText>
      {children}
    </Paper>
  );
}

function inRange(date: Date, range: RangeKey, now: Date): boolean {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === 'today') return date >= start;
  if (range === '7d') {
    start.setDate(start.getDate() - 6);
    return date >= start;
  }
  if (range === '30d') {
    start.setDate(start.getDate() - 29);
    return date >= start;
  }
  return true;
}

export function DashboardTab({ products, sessions, isDark, lang, settings, typeDistribution, consumptionByMonth, topStrains, spendingByType, totalValue }: DashboardTabProps) {
  const [range, setRange] = useState<RangeKey>('all');
  const now = new Date();

  const filteredSessions = useMemo(() => {
    if (range === 'all') return sessions;
    return sessions.filter((s) => inRange(new Date(s.date), range, now));
  }, [sessions, range]);

  const rangeLabel = useMemo(() => {
    if (range === 'today') return t('rangeToday', lang);
    if (range === '7d') return t('range7d', lang);
    if (range === '30d') return t('range30d', lang);
    return t('rangeAll', lang);
  }, [range, lang]);

  const periodComparison = useMemo(() => {
    if (range === 'all') return null;
    const current = filteredSessions.reduce((sum, s) => sum + s.amount, 0);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (range === '7d') start.setDate(start.getDate() - 6);
    else if (range === '30d') start.setDate(start.getDate() - 29);
    const windowMs = now.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - windowMs);
    const previous = sessions
      .filter((s) => {
        const d = new Date(s.date);
        return d >= prevStart && d <= prevEnd;
      })
      .reduce((sum, s) => sum + s.amount, 0);
    if (previous === 0) return current > 0 ? { pct: null, up: true } : null;
    const pct = ((current - previous) / previous) * 100;
    return { pct, up: pct >= 0 };
  }, [filteredSessions, sessions, range, now]);

  const rangeConsumption = useMemo(() => filteredSessions.reduce((sum, s) => sum + s.amount, 0), [filteredSessions]);

  const rangeByMonth = useMemo(() => {
    if (range === 'all') return consumptionByMonth;
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + s.amount);
    });
    const labels: Record<string, string> = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
      '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
    };
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, amount]) => {
      const [, m] = key.split('-');
      return { month: labels[m] || m, amount };
    });
  }, [filteredSessions, range, consumptionByMonth]);

  return (
    <BlurFade>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {/* Range selector row */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-5">
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <SegmentedControl
              size="xs"
              value={range}
              onChange={(v) => setRange(v as RangeKey)}
              color="cyan"
              data={[
                { value: 'all', label: t('rangeAll', lang) },
                { value: '30d', label: t('range30d', lang) },
                { value: '7d', label: t('range7d', lang) },
                { value: 'today', label: t('rangeToday', lang) },
              ]}
            />
            <Group gap="xs" align="center">
              {periodComparison && (
                <Badge
                  size="sm"
                  radius="md"
                  color={periodComparison.pct === null ? 'gray' : periodComparison.up ? 'orange' : 'green'}
                  leftSection={
                    periodComparison.pct === null ? (
                      <IconMinus size={12} />
                    ) : periodComparison.up ? (
                      <IconArrowUpRight size={12} />
                    ) : (
                      <IconArrowDownRight size={12} />
                    )
                  }
                >
                  {periodComparison.pct === null
                    ? t('rangeVsPrev', lang).replace('{pct}', '—')
                    : t('rangeVsPrev', lang).replace('{pct}', `${Math.abs(periodComparison.pct).toFixed(0)}%`)}
                </Badge>
              )}
              <Badge size="sm" radius="md" variant="light" color="cyan">
                {t('rangeConsumed', lang)}: {formatPrecision(rangeConsumption, settings.decimalPrecision)}g
              </Badge>
            </Group>
          </Group>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-5">
          <StatsCard products={products} sessions={filteredSessions} isDark={isDark} rangeLabel={rangeLabel} />
        </div>

        <div className="col-span-1 lg:col-span-2">
          <TBreakTracker products={products} sessions={sessions} isDark={isDark} />
        </div>

        <ShineBorder borderRadius={12} color={['#06b6d4', '#13eeef', '#10b981']} className="col-span-1 sm:col-span-1 lg:col-span-3">
          <ChartCard isDark={isDark} title={t('stockOverview', lang)} gradient="linear-gradient(120deg, #06b6d4, #13eeef)">
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {typeDistribution.map((_, idx) => (
                      <Cell key={idx} fill={DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle(isDark)}
                    formatter={(value: any) => [`${formatPrecision(Number(value), 1)}g`, '']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text ta="center" py="xl" c="dimmed">{t('noProductsYet', lang)}</Text>
            )}
            <Group gap="sm" mt="xs" wrap="wrap" justify="center">
              {typeDistribution.map((item, idx) => (
                <Group key={item.name} gap={6} align="center">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length] }} />
                  <Text size="xs" c="dimmed">{item.name}</Text>
                </Group>
              ))}
            </Group>
          </ChartCard>
        </ShineBorder>

        <ShineBorder borderRadius={12} color={['#10b981', '#06b6d4']} className="col-span-1 sm:col-span-1 lg:col-span-2">
          <ChartCard isDark={isDark} title={t('topStrains', lang)} gradient="linear-gradient(120deg, #10b981, #06b6d4)">
            {topStrains.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topStrains} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                  <XAxis type="number" tick={{ fill: isDark ? '#9db0c7' : '#64748b', fontSize: 12 }} domain={[0, 5]} />
                  <YAxis dataKey="name" type="category" tick={{ fill: isDark ? '#9db0c7' : '#64748b', fontSize: 12 }} width={75} />
                  <Tooltip contentStyle={tooltipStyle(isDark)}
                    formatter={(value: any) => [Number(value).toFixed(1), t('rating', lang)]} />
                  <Bar dataKey="rating" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text ta="center" py="xl" c="dimmed">{t('noProductsYet', lang)}</Text>
            )}
          </ChartCard>
        </ShineBorder>

        <ShineBorder borderRadius={12} color={['#f59e0b', '#13eeef']} className="col-span-1 sm:col-span-2 lg:col-span-3">
          <ChartCard isDark={isDark} title={t('totalSpent', lang)} gradient="linear-gradient(120deg, #f59e0b, #13eeef)">
            {spendingByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={spendingByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#9db0c7' : '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: isDark ? '#9db0c7' : '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle(isDark)}
                    formatter={(value: any) => [formatCurrency(Number(value), settings.currency), '']} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text ta="center" py="xl" c="dimmed">{t('noProductsYet', lang)}</Text>
            )}
          </ChartCard>
        </ShineBorder>

        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <CalendarHeatmap sessions={filteredSessions} isDark={isDark} lang={lang} />
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <MonthlyTrendsChart consumptionByMonth={rangeByMonth} isDark={isDark} lang={lang} />
        </div>

        {settings.budgetLimit > 0 && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-5">
            <NeonGradientCard borderColors={['#06b6d4', '#10b981', '#13eeef']} borderRadius={12}>
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={600} style={{ color: 'var(--mantine-color-white)' }}>
                  {t('budgetLimit', lang)} ({settings.budgetPeriod})
                </Text>
                <Text size="sm" style={{ color: 'var(--mantine-color-slate-4)' }}>
                  {formatCurrency(totalValue, settings.currency)} / {formatCurrency(settings.budgetLimit, settings.currency)}
                </Text>
              </Group>
              <Box style={{ width: '100%', height: 8, borderRadius: '9999px', overflow: 'hidden', backgroundColor: '#1e293b' }}>
                <Box style={{
                  height: '100%',
                  borderRadius: '9999px',
                  width: `${Math.min(100, (totalValue / settings.budgetLimit) * 100)}%`,
                  background: totalValue > settings.budgetLimit
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : totalValue > settings.budgetLimit * 0.8
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'linear-gradient(90deg, #10b981, #059669)',
                }} />
              </Box>
            </NeonGradientCard>
          </div>
        )}
      </div>
    </BlurFade>
  );
}