import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatsCard } from './StatsCard';
import { CalendarHeatmap } from './CalendarHeatmap';
import { Product, Session, Settings } from '../types';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';
import { Paper, SimpleGrid, Text, Group, Box, Stack } from '@mantine/core';

const DASHBOARD_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

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

export function DashboardTab({ products, sessions, isDark, lang, settings, typeDistribution, consumptionByMonth, topStrains, spendingByType, totalValue }: DashboardTabProps) {
  return (
    <Stack gap="md">
      <StatsCard products={products} sessions={sessions} isDark={isDark} />
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Paper p="lg" radius="md" withBorder style={{ background: isDark ? 'rgba(10, 17, 32, 0.8)' : '#fff' }}>
          <Text size="sm" fw={600} mb="sm" style={{ color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' }}>
            {t('stockOverview', lang)}
          </Text>
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {typeDistribution.map((_, idx) => (
                    <Cell key={idx} fill={DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e2e8f0' : '#0f172a' }}
                  formatter={(value: any) => [`${formatPrecision(Number(value), 1)}g`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Text ta="center" py="xl" c="dimmed">{t('noProductsYet', lang)}</Text>
          )}
          <Group gap="sm" mt="md" wrap="wrap">
            {typeDistribution.map((item, idx) => (
              <Group key={item.name} gap={6} align="center">
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length] }} />
                <Text size="xs" c="dimmed">{item.name}</Text>
              </Group>
            ))}
          </Group>
        </Paper>
        <Paper p="lg" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#fff' }}>
          <Text size="sm" fw={600} mb="sm" style={{ color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' }}>
            {t('consumptionTrend', lang)}
          </Text>
          {consumptionByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={consumptionByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e2e8f0' : '#0f172a' }}
                  formatter={(value: any) => [`${formatPrecision(Number(value), 1)}g`, '']} />
                <Bar dataKey="amount" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Text ta="center" py="xl" c="dimmed">{t('noSessions', lang)}</Text>
          )}
        </Paper>
        <Paper p="lg" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#fff' }}>
          <Text size="sm" fw={600} mb="sm" style={{ color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' }}>
            {t('topStrains', lang)}
          </Text>
          {topStrains.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topStrains} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                <XAxis type="number" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} domain={[0, 5]} />
                <YAxis dataKey="name" type="category" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} width={75} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e2e8f0' : '#0f172a' }}
                  formatter={(value: any) => [Number(value).toFixed(1), t('rating', lang)]} />
                <Bar dataKey="rating" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Text ta="center" py="xl" c="dimmed">{t('noProductsYet', lang)}</Text>
          )}
        </Paper>
        <Paper p="lg" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#fff' }}>
          <Text size="sm" fw={600} mb="sm" style={{ color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' }}>
            {t('totalSpent', lang)}
          </Text>
          {spendingByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={spendingByType}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e2e8f0' : '#0f172a' }}
                  formatter={(value: any) => [formatCurrency(Number(value), settings.currency), '']} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Text ta="center" py="xl" c="dimmed">{t('noProductsYet', lang)}</Text>
          )}
        </Paper>
      </SimpleGrid>
      <CalendarHeatmap sessions={sessions} isDark={isDark} lang={lang} />
      {settings.budgetLimit > 0 && (
        <Paper p="lg" radius="md" withBorder mb="md" style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#fff' }}>
          <Group justify="space-between" mb="sm">
            <Text size="sm" fw={600} style={{ color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' }}>
              {t('budgetLimit', lang)} ({settings.budgetPeriod})
            </Text>
            <Text size="sm" c="dimmed">
              {formatCurrency(totalValue, settings.currency)} / {formatCurrency(settings.budgetLimit, settings.currency)}
            </Text>
          </Group>
          <Box style={{ width: '100%', height: 8, borderRadius: '9999px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#e5e7eb' }}>
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
        </Paper>
      )}
    </Stack>
  );
}