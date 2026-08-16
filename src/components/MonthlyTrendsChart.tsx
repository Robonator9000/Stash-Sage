import { useMemo } from 'react';
import { Area, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Paper, Text, Group, Stack, Badge } from '@mantine/core';
import { ShineBorder, AnimatedGradientText } from './magicui';
import { t } from '../utils/translations';
import { formatPrecision } from '../utils/helpers';

interface MonthlyTrendsChartProps {
  consumptionByMonth: { month: string; amount: number }[];
  isDark: boolean;
  lang: string;
}

export function MonthlyTrendsChart({ consumptionByMonth, isDark, lang }: MonthlyTrendsChartProps) {
  const chartData = useMemo(() => {
    if (consumptionByMonth.length === 0) return [];

    // Compute 3-month rolling average
    const data = consumptionByMonth.map((d, i) => {
      const window = consumptionByMonth.slice(Math.max(0, i - 2), i + 1);
      const avg = window.reduce((sum, w) => sum + w.amount, 0) / window.length;
      return {
        month: d.month,
        amount: Math.round(d.amount * 100) / 100,
        avg: Math.round(avg * 100) / 100,
      };
    });
    return data;
  }, [consumptionByMonth]);

  const trendStats = useMemo(() => {
    if (chartData.length < 2) return { changePct: 0, direction: 'flat' as 'up' | 'down' | 'flat' };
    const recent = chartData.slice(-3).reduce((s, d) => s + d.amount, 0) / Math.min(3, chartData.length);
    const previous = chartData.slice(-6, -3).reduce((s, d) => s + d.amount, 0) / Math.min(3, chartData.slice(-6, -3).length || 1);
    if (previous === 0) return { changePct: recent > 0 ? 100 : 0, direction: recent > 0 ? 'up' as const : 'flat' as const };
    const changePct = Math.round(((recent - previous) / previous) * 100);
    return { changePct, direction: changePct > 2 ? 'up' as const : changePct < -2 ? 'down' as const : 'flat' as const };
  }, [chartData]);

  const totalThisYear = chartData.reduce((s, d) => s + d.amount, 0);

  if (chartData.length === 0) {
    return (
      <ShineBorder borderRadius={12} color={['#06b6d4', '#13eeef', '#8b5cf6']}>
        <Paper p="lg" radius="md" withBorder h="100%" className="flex flex-col" style={{ background: isDark ? 'rgba(10, 17, 32, 0.8)' : '#fff' }}>
          <AnimatedGradientText colors="linear-gradient(120deg, #06b6d4, #8b5cf6)" className="text-sm font-semibold" animationSpeed={8}>
            {t('monthlyUsage', lang)}
          </AnimatedGradientText>
          <Text size="sm" c="dimmed" className="flex-1 flex items-center justify-center">{t('noDataYet', lang)}</Text>
        </Paper>
      </ShineBorder>
    );
  }

  const trendColor = trendStats.direction === 'down' ? '#10b981' : trendStats.direction === 'up' ? '#f59e0b' : '#94a3b8';
  const trendIcon = trendStats.direction === 'down' ? '↓' : trendStats.direction === 'up' ? '↑' : '→';

  return (
    <ShineBorder borderRadius={12} color={['#06b6d4', '#13eeef', '#8b5cf6']}>
      <Paper p="lg" radius="md" withBorder h="100%" className="flex flex-col" style={{ background: isDark ? 'rgba(10, 17, 32, 0.8)' : '#fff' }}>
        <Group justify="space-between" align="flex-start" mb="sm">
          <Stack gap={2}>
            <AnimatedGradientText colors="linear-gradient(120deg, #06b6d4, #8b5cf6)" className="text-sm font-semibold" animationSpeed={8}>
              {t('monthlyUsage', lang)}
            </AnimatedGradientText>
            <Text size="xs" c="dimmed">{t('monthlyUsageHint', lang)}</Text>
          </Stack>
          <Badge
            size="sm"
            variant="light"
            color={trendStats.direction === 'down' ? 'emerald' : trendStats.direction === 'up' ? 'orange' : 'gray'}
            style={{ textTransform: 'none' }}
          >
            {trendIcon} {Math.abs(trendStats.changePct)}%
          </Badge>
        </Group>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="avgGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: isDark ? '#9db0c7' : '#64748b', fontSize: 11 }} axisLine={{ stroke: isDark ? '#1e293b' : '#e5e7eb' }} tickLine={false} />
            <YAxis tick={{ fill: isDark ? '#9db0c7' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#111827' : '#fff',
                border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                borderRadius: '12px',
                color: isDark ? '#e2e8f0' : '#0f172a',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'amount') return [`${formatPrecision(Number(value), 1)}g`, t('monthlyUsage', lang)];
                if (name === 'avg') return [`${formatPrecision(Number(value), 1)}g`, `${t('weeklyAvg', lang)} (3mo)`];
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#usageGradient)"
              dot={{ fill: '#06b6d4', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="url(#avgGradient)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
          </ResponsiveContainer>
        </div>

        <Group justify="space-between" mt="xs" gap="xs">
          <Group gap={4}>
            <span style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: '#06b6d4' }} />
            <Text size="xs" c="dimmed">{t('monthlyUsage', lang)}</Text>
            <span style={{ width: 12, height: 2, borderRadius: 2, backgroundColor: '#8b5cf6', marginLeft: 8, borderTop: '2px dashed #8b5cf6' }} />
            <Text size="xs" c="dimmed">{t('weeklyAvg', lang)}</Text>
          </Group>
          <Group gap={4}>
            <Text size="xs" c="dimmed">Total:</Text>
            <Text size="xs" fw={600} c={trendColor}>{formatPrecision(totalThisYear, 1)}g</Text>
          </Group>
        </Group>
      </Paper>
    </ShineBorder>
  );
}
