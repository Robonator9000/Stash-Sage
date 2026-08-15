import { useMemo, useState } from 'react';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { Session } from '../types';
import { t } from '../utils/translations';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeatmapProps {
  sessions: Session[];
  isDark?: boolean;
  lang?: string;
}

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function CalendarHeatmap({ sessions, isDark = true, lang = 'en' }: CalendarHeatmapProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { weeks, maxAmount } = useMemo(() => {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);
    const endDate = yearEnd < today ? yearEnd : today;
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(yearStart);
    startDate.setHours(0, 0, 0, 0);

    const dayMap = new Map<string, number>();
    sessions.forEach((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) || 0) + s.amount);
    });

    let max = 0;
    const grid: { date: Date; amount: number }[][] = [];
    let currentWeek: { date: Date; amount: number }[] = [];

    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() - (startDay - i));
      currentWeek.push({ date: d, amount: 0 });
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const amount = dayMap.get(key) || 0;
      if (amount > max) max = amount;

      const dateCopy = new Date(d);
      currentWeek.push({ date: dateCopy, amount });

      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(), amount: 0 });
      }
      grid.push(currentWeek);
    }

    return { weeks: grid, maxAmount: max };
  }, [sessions, selectedYear]);

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const midIdx = Math.floor(week.length / 2);
      const m = week[midIdx].date.getMonth();
      if (m !== lastMonth) {
        labels.push({ index: wi, label: MONTHS[m] });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const getColor = (intensity: number) => {
    if (intensity === 0) return isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)';
    if (intensity === 1) return isDark ? 'rgba(6, 78, 59, 0.6)' : 'var(--mantine-color-emerald-4)';
    if (intensity === 2) return isDark ? 'var(--mantine-color-emerald-7)' : 'var(--mantine-color-emerald-4)';
    if (intensity === 3) return isDark ? 'var(--mantine-color-emerald-5)' : 'var(--mantine-color-emerald-5)';
    return isDark ? 'var(--mantine-color-emerald-4)' : 'var(--mantine-color-emerald-6)';
  };

  const labelColor = isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-4)';

  return (
    <Paper
      p="lg"
      pos="relative"
      h="100%"
      style={{
        border: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
        background: isDark ? 'rgba(10, 17, 32, 0.8)' : '#fff',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" fw={600} c={isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-dark-9)'}>
            {t('activity', lang)}
          </Text>
          <Group gap="xs">
            <Box
              component="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              style={{
                padding: '4px',
                borderRadius: 'var(--mantine-radius-md)',
                color: isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)',
                cursor: 'pointer',
                transition: 'background-color 150ms ease, color 150ms ease',
                '&:hover': { background: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)' },
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Box>
            <Text size="xs" fw={500} px="sm" c={isDark ? 'var(--mantine-color-dark-1)' : 'var(--mantine-color-gray-6)'}>
              {selectedYear}
            </Text>
            <Box
              component="button"
              onClick={() => setSelectedYear((y) => Math.min(y + 1, currentYear))}
              disabled={selectedYear >= currentYear}
              style={{
                padding: '4px',
                borderRadius: 'var(--mantine-radius-md)',
                color: isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)',
                cursor: selectedYear >= currentYear ? 'not-allowed' : 'pointer',
                opacity: selectedYear >= currentYear ? 0.3 : 1,
                transition: 'background-color 150ms ease, color 150ms ease',
                '&:hover': selectedYear >= currentYear
                  ? undefined
                  : { background: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)' },
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Box>
          </Group>
        </Group>

        <Box style={{ display: 'flex', marginLeft: 32, marginBottom: 4, overflow: 'hidden' }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((l) => l.index === wi);
            return (
              <Box
                key={wi}
                style={{
                  width: `${100 / weeks.length}%`,
                  visibility: label ? 'visible' : 'hidden',
                  fontSize: 10,
                  lineHeight: 1,
                  flexShrink: 0,
                  color: labelColor,
                }}
              >
                {label?.label || ''}
              </Box>
            );
          })}
        </Box>

        <Box style={{ display: 'flex', gap: 2 }}>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
            {DAYS.map((day, i) => (
              <Box
                key={i}
                style={{
                  fontSize: 10,
                  lineHeight: 1,
                  height: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 4,
                  width: 24,
                  color: labelColor,
                }}
              >
                {day}
              </Box>
            ))}
          </Box>

          <Box style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
            {weeks.map((week, wi) => (
              <Box key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day, di) => (
                  <Box
                    key={di}
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: 'var(--mantine-radius-sm)',
                      background: getColor(getIntensity(day.amount, maxAmount)),
                    }}
                    title={
                      day.amount > 0
                        ? `${day.date.toLocaleDateString()}: ${day.amount.toFixed(1)}g`
                        : day.date.toLocaleDateString()
                    }
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        <Group justify="flex-end" gap="xs">
          <Text size="xs" c={labelColor}>
            {t('less', lang)}
          </Text>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: 'var(--mantine-radius-sm)',
                background: getColor(i),
              }}
            />
          ))}
          <Text size="xs" c={labelColor}>
            {t('more', lang)}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}