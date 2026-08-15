import { memo, useState, useMemo, useCallback } from 'react';
import { Settings } from '../types';
import { ActivityEntry } from '../utils/useActivity';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';
import { Paper, Badge, Group, Text, Button, Select, Checkbox, ActionIcon, Box, Stack, SimpleGrid, ThemeIcon, Divider } from '@mantine/core';
import { IconTrash, IconX, IconPlus, IconEdit, IconFlame, IconCurrencyDollar, IconUsers, IconTimeline, IconCalendarStats, IconScale } from '@tabler/icons-react';
import { NeonGradientCard } from './magicui';

interface HistoryTabProps {
  filteredHistory: ActivityEntry[];
  isDark: boolean;
  lang: string;
  settings: Settings;
  historyFilterType: string;
  historyDateFilter: string;
  expandedNotes: Set<string>;
  onFilterTypeChange: (v: string) => void;
  onDateFilterChange: (v: string) => void;
  onClearHistory: () => void;
  onToggleNote: (id: string) => void;
}

function formatActivityDate(date: Date, lang: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t('now', lang);
  if (diffMins < 60) return t('minutesAgo', lang).replace('{n}', String(diffMins));
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return t('hoursAgo', lang).replace('{n}', String(diffHrs));
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return t('yesterday', lang);
  if (diffDays < 30) return t('daysAgo', lang).replace('{n}', String(diffDays));
  if (diffDays < 365) return t('monthsAgo', lang).replace('{n}', String(Math.floor(diffDays / 30)));
  return t('yearsAgo', lang).replace('{n}', String(Math.floor(diffDays / 365)));
}

const TYPE_META: Record<string, { icon: typeof IconPlus; color: string; label: string }> = {
  add: { icon: IconPlus, color: 'green', label: 'add' },
  delete: { icon: IconTrash, color: 'red', label: 'delete' },
  edit: { icon: IconEdit, color: 'blue', label: 'edit' },
  consume: { icon: IconFlame, color: 'orange', label: 'consume' },
  sell: { icon: IconCurrencyDollar, color: 'violet', label: 'sell' },
  session: { icon: IconUsers, color: 'cyan', label: 'session' },
};

const TYPE_OPTIONS = ['consume', 'sell', 'session', 'add', 'delete', 'edit'];

function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

export const HistoryTab = memo(function HistoryTab({
  filteredHistory, isDark, lang, settings, historyFilterType, historyDateFilter,
  expandedNotes, onFilterTypeChange, onDateFilterChange, onClearHistory, onToggleNote,
}: HistoryTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === filteredHistory.length) return new Set();
      return new Set(filteredHistory.map(e => e.id));
    });
  }, [filteredHistory]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size > 0) onClearHistory();
    clearSelection();
  }, [selectedIds, onClearHistory, clearSelection]);

  const summary = useMemo(() => {
    let totalGrams = 0;
    let totalValue = 0;
    let sessionCount = 0;
    for (const e of filteredHistory) {
      if (e.type === 'consume' || e.type === 'session') totalGrams += e.amount || 0;
      if (e.type === 'sell') totalValue += e.price || 0;
      if (e.type === 'session') sessionCount++;
    }
    return { totalGrams, totalValue, sessionCount, entryCount: filteredHistory.length };
  }, [filteredHistory]);

  const grouped = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    for (const e of filteredHistory) {
      const g = getDateGroup(e.timestamp);
      (groups[g] = groups[g] || []).push(e);
    }
    return Object.entries(groups);
  }, [filteredHistory]);

  const mutedColor = isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)';

  return (
    <div>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="md">
        <NeonGradientCard borderColors={['#06b6d4', '#13eeef']} borderRadius={12} className="h-full">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} style={{ color: isDark ? '#fff' : '#000' }}>{t('history', lang)}</Text>
            <IconTimeline size={16} style={{ color: '#06b6d4' }} />
          </Group>
          <Text fw={800} size="xl" style={{ lineHeight: 1.2, color: isDark ? '#fff' : '#000' }}>{summary.entryCount}</Text>
        </NeonGradientCard>
        <NeonGradientCard borderColors={['#f59e0b', '#06b6d4']} borderRadius={12} className="h-full">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} style={{ color: isDark ? '#fff' : '#000' }}>Consumed</Text>
            <IconScale size={16} style={{ color: '#f59e0b' }} />
          </Group>
          <Text fw={800} size="xl" style={{ lineHeight: 1.2, color: isDark ? '#fff' : '#000' }}>{formatPrecision(summary.totalGrams, settings.decimalPrecision)}g</Text>
        </NeonGradientCard>
        <NeonGradientCard borderColors={['#10b981', '#06b6d4']} borderRadius={12} className="h-full">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} style={{ color: isDark ? '#fff' : '#000' }}>{t('totalSessions', lang)}</Text>
            <IconUsers size={16} style={{ color: '#10b981' }} />
          </Group>
          <Text fw={800} size="xl" style={{ lineHeight: 1.2, color: isDark ? '#fff' : '#000' }}>{summary.sessionCount}</Text>
        </NeonGradientCard>
        <NeonGradientCard borderColors={['#8b5cf6', '#13eeef']} borderRadius={12} className="h-full">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} style={{ color: isDark ? '#fff' : '#000' }}>Sold Value</Text>
            <IconCurrencyDollar size={16} style={{ color: '#8b5cf6' }} />
          </Group>
          <Text fw={800} size="xl" style={{ lineHeight: 1.2, color: isDark ? '#fff' : '#000' }}>{formatCurrency(summary.totalValue, settings.currency)}</Text>
        </NeonGradientCard>
      </SimpleGrid>

      <Group mb="md" gap="sm" wrap="wrap" align="center">
        <Select
          value={historyFilterType}
          onChange={(v) => onFilterTypeChange(v || 'all')}
          data={[
            { value: 'all', label: t('allTypes', lang) },
            ...TYPE_OPTIONS.map(type => ({ value: type, label: t(TYPE_META[type].label, lang) })),
          ]}
          size="xs"
          w={150}
        />
        <Select
          value={historyDateFilter}
          onChange={(v) => onDateFilterChange(v || 'all')}
          data={[
            { value: 'all', label: t('allDates', lang) },
            { value: '7d', label: t('last7days', lang) },
            { value: '30d', label: t('last30days', lang) },
            { value: '90d', label: t('last90days', lang) },
          ]}
          size="xs"
          w={150}
        />
        {filteredHistory.length > 0 && (
          <Button size="xs" color="red" variant="light" onClick={onClearHistory} ml="auto" leftSection={<IconTrash size={14} />}>
            {t('clearHistory', lang)}
          </Button>
        )}
      </Group>

      {selectedIds.size > 0 && (
        <Paper p="sm" mb="sm" radius="md" withBorder style={{
          background: isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.05)',
          borderColor: 'rgba(6,182,212,0.3)',
        }}>
          <Group justify="space-between">
            <Text size="sm" fw={600} style={{ color: isDark ? '#fff' : '#000' }}>{t('itemsSelected', lang).replace('{count}', String(selectedIds.size))}</Text>
            <Group gap="sm">
              <Button size="xs" color="red" variant="light" onClick={handleBulkDelete} leftSection={<IconTrash size={14} />}>
                {t('deleteSelected', lang)}
              </Button>
              <ActionIcon variant="subtle" size="sm" onClick={clearSelection}>
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>
      )}

      {filteredHistory.length > 0 ? (
        <Stack gap="md">
          <Group justify="space-between" px={2}>
            <Checkbox
              checked={selectedIds.size === filteredHistory.length && filteredHistory.length > 0}
              indeterminate={selectedIds.size > 0 && selectedIds.size < filteredHistory.length}
              onChange={toggleAll}
              label={`${filteredHistory.length} ${t('history', lang)}`}
              size="xs"
            />
          </Group>

          {grouped.map(([groupLabel, entries]) => (
            <Box key={groupLabel}>
              <Group gap="sm" mb="xs" align="center">
                <ThemeIcon size="sm" variant="light" color="cyan" radius="md">
                  <IconCalendarStats size={14} />
                </ThemeIcon>
                <Text size="sm" fw={700} style={{ color: isDark ? '#fff' : '#000' }}>{groupLabel}</Text>
                <Badge size="xs" variant="light" color="cyan" radius="sm">{entries.length}</Badge>
                <Divider style={{ flex: 1 }} opacity={0.3} />
              </Group>

              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gridAutoFlow: 'dense',
                }}
              >
                {entries.map((entry) => {
                  const meta = TYPE_META[entry.type] || TYPE_META.edit;
                  const TypeIcon = meta.icon;
                  const isSelected = selectedIds.has(entry.id);
                  const isExpanded = expandedNotes.has(entry.id);

                  return (
                    <Paper
                      key={entry.id}
                      radius="md"
                      withBorder
                      p="sm"
                      style={{
                        minWidth: 0,
                        background: isSelected
                          ? (isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.06)')
                          : (isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-white)'),
                        borderColor: isSelected ? 'rgba(6,182,212,0.4)' : 'var(--mantine-color-dark-5)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                      onClick={() => toggleRow(entry.id)}
                    >
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(entry.id)}
                          onClick={e => e.stopPropagation()}
                          aria-label={entry.productName}
                          mt={2}
                        />
                        <Box
                          w={34}
                          h={34}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            borderRadius: 10,
                            background: isDark ? `rgba(6,182,212,0.12)` : `rgba(6,182,212,0.08)`,
                          }}
                        >
                          <TypeIcon size={18} style={{ color: `var(--mantine-color-${meta.color}-${isDark ? 4 : 7})` }} />
                        </Box>

                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Group justify="space-between" wrap="nowrap" gap="xs">
                            <Text size="sm" fw={600} truncate style={{ minWidth: 0, color: isDark ? '#fff' : '#000' }}>
                              {entry.productName || '\u2014'}
                            </Text>
                            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                              {formatActivityDate(entry.timestamp, lang)}
                            </Text>
                          </Group>

                          <Group gap={6} wrap="nowrap" mt={3}>
                            <Badge color={meta.color} variant="light" size="sm" radius="sm" styles={{ label: { textTransform: 'capitalize' } }}>
                              {t(meta.label, lang)}
                            </Badge>
                            {entry.amount != null && (
                              <Text size="xs" style={{ color: mutedColor, whiteSpace: 'nowrap' }}>
                                {formatPrecision(entry.amount, settings.decimalPrecision)}g
                              </Text>
                            )}
                            {entry.price != null && (
                              <Text size="xs" style={{ color: mutedColor, whiteSpace: 'nowrap' }}>
                                {formatCurrency(entry.price, settings.currency)}
                              </Text>
                            )}
                          </Group>
                        </Box>
                      </Group>

                      {entry.notes && (
                        <Text
                          size="xs"
                          style={{ cursor: 'pointer', color: mutedColor }}
                          onClick={(e) => { e.stopPropagation(); onToggleNote(entry.id); }}
                          lineClamp={isExpanded ? undefined : 1}
                        >
                          {entry.notes}
                        </Text>
                      )}
                    </Paper>
                  );
                })}
              </div>
            </Box>
          ))}
        </Stack>
      ) : (
        <Stack align="center" py={48} gap={12}>
          <ThemeIcon size={56} radius="xl" variant="light" color="cyan">
            <IconTimeline size={28} />
          </ThemeIcon>
          <Text ta="center" c="dimmed" size="sm">
            {t('noActivities', lang)}
          </Text>
        </Stack>
      )}
    </div>
  );
});
