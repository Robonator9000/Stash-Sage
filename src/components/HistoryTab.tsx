import { memo, useState, useCallback } from 'react';
import { Settings } from '../types';
import { ActivityEntry } from '../utils/useActivity';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';
import { Card, Badge, Group, Text, Button, Select, Checkbox, ActionIcon, Box, Stack } from '@mantine/core';
import { IconTrash, IconX, IconPlus, IconEdit, IconFlame, IconCurrencyDollar, IconUsers, IconTimeline, IconChevronDown } from '@tabler/icons-react';

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

  const mutedColor = isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)';
  const cardBg = isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-white)';
  const borderColor = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';

  return (
    <div>
      <Group mb="md" gap="sm" wrap="wrap">
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
          <Button size="xs" color="red" variant="light" onClick={onClearHistory} ml="auto">
            {t('clearHistory', lang)}
          </Button>
        )}
      </Group>

      {selectedIds.size > 0 && (
        <Group mb="sm" p="xs" style={{
          borderRadius: 'var(--mantine-radius-md)',
          background: `var(--mantine-color-blue-${isDark ? 9 : 0})`,
          border: `1px solid var(--mantine-color-blue-${isDark ? 8 : 2})`,
        }}>
          <Text size="sm" fw={500}>{t('itemsSelected', lang).replace('{count}', String(selectedIds.size))}</Text>
          <Button size="xs" color="red" variant="light" onClick={handleBulkDelete} leftSection={<IconTrash size={14} />}>
            {t('deleteSelected', lang)}
          </Button>
          <ActionIcon variant="subtle" size="sm" onClick={clearSelection} ml="auto">
            <IconX size={14} />
          </ActionIcon>
        </Group>
      )}

      {filteredHistory.length > 0 ? (
        <Stack gap="sm">
          <Group justify="space-between" px={2}>
            <Checkbox
              checked={selectedIds.size === filteredHistory.length && filteredHistory.length > 0}
              indeterminate={selectedIds.size > 0 && selectedIds.size < filteredHistory.length}
              onChange={toggleAll}
              label={`${filteredHistory.length} ${t('history', lang)}`}
              size="xs"
            />
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={clearSelection}
              disabled={selectedIds.size === 0}
              aria-label={t('close', lang)}
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>

          {filteredHistory.map((entry) => {
            const meta = TYPE_META[entry.type] || TYPE_META.edit;
            const TypeIcon = meta.icon;
            const isSelected = selectedIds.has(entry.id);
            const isExpanded = expandedNotes.has(entry.id);

            return (
              <Card
                key={entry.id}
                radius="md"
                withBorder
                style={{
                  background: isSelected ? `var(--mantine-color-blue-${isDark ? 9 : 0})` : cardBg,
                  borderColor: isSelected ? `var(--mantine-color-blue-${isDark ? 7 : 3})` : borderColor,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => toggleRow(entry.id)}
                padding="sm"
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
                      borderRadius: 'var(--mantine-radius-md)',
                      background: `var(--mantine-color-${meta.color}-${isDark ? 9 : 1})`,
                    }}
                  >
                    <TypeIcon size={18} color={`var(--mantine-color-${meta.color}-${isDark ? 4 : 7})`} />
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Text size="sm" fw={600} truncate style={{ minWidth: 0 }}>
                        {entry.productName || '\u2014'}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                        {formatActivityDate(entry.timestamp, lang)}
                      </Text>
                    </Group>

                    <Group justify="space-between" wrap="nowrap" gap="xs" mt={2}>
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Badge color={meta.color} variant="light" size="sm" radius="sm" styles={{ label: { textTransform: 'capitalize' } }}>
                          {t(meta.label, lang)}
                        </Badge>
                        {entry.amount != null && (
                          <Text size="xs" c={mutedColor} style={{ whiteSpace: 'nowrap' }}>
                            {formatPrecision(entry.amount, settings.decimalPrecision)}g
                          </Text>
                        )}
                        {entry.price != null && (
                          <Text size="xs" c={mutedColor} style={{ whiteSpace: 'nowrap' }}>
                            {formatCurrency(entry.price, settings.currency)}
                          </Text>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }} title={entry.timestamp.toLocaleString()}>
                        {entry.timestamp.toLocaleDateString(lang === 'en' ? 'en-US' : lang, { month: 'short', day: 'numeric' })}
                      </Text>
                    </Group>

                    {entry.notes && (
                      <Box mt="xs">
                        <Group gap={4} align="center">
                          <IconChevronDown
                            size={14}
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: mutedColor }}
                          />
                          <Text
                            size="xs"
                            c={mutedColor}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); onToggleNote(entry.id); }}
                            lineClamp={isExpanded ? undefined : 1}
                          >
                            {entry.notes}
                          </Text>
                        </Group>
                      </Box>
                    )}
                  </Box>
                </Group>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Stack align="center" py={40} gap={8}>
          <IconTimeline size={36} color={mutedColor} />
          <Text ta="center" c="dimmed" size="sm">
            {t('noActivities', lang)}
          </Text>
        </Stack>
      )}
    </div>
  );
});
