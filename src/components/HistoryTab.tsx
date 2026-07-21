import { memo, useState, useCallback } from 'react';
import { Settings } from '../types';
import { ActivityEntry } from '../utils/useActivity';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';
import { Table, Badge, ScrollArea, Group, Text, Button, Select, Checkbox, ActionIcon } from '@mantine/core';
import { IconTrash, IconX } from '@tabler/icons-react';

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
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return t('minutesAgo', lang).replace('{n}', String(diffMins));
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return t('hoursAgo', lang).replace('{n}', String(diffHrs));
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return t('daysAgo', lang).replace('{n}', '1');
  if (diffDays < 30) return t('daysAgo', lang).replace('{n}', String(diffDays));
  if (diffDays < 365) return t('monthsAgo', lang).replace('{n}', String(Math.floor(diffDays / 30)));
  return t('monthsAgo', lang).replace('{n}', String(Math.floor(diffDays / 365)));
}

const typeColors: Record<string, string> = {
  add: 'green',
  delete: 'red',
  edit: 'blue',
  consume: 'orange',
  sell: 'violet',
  session: 'cyan',
};

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

  return (
    <div>
      <Group mb="md" gap="sm" wrap="wrap">
        <Select
          value={historyFilterType}
          onChange={(v) => onFilterTypeChange(v || 'all')}
          data={[
            { value: 'all', label: t('allTypes', lang) },
            { value: 'consume', label: 'Consume' },
            { value: 'sell', label: 'Sell' },
            { value: 'session', label: 'Session' },
            { value: 'add', label: 'Add' },
            { value: 'delete', label: 'Delete' },
            { value: 'edit', label: 'Edit' },
          ]}
          size="xs"
          w={140}
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
          w={140}
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
          <Text size="sm" fw={500}>{selectedIds.size} selected</Text>
          <Button size="xs" color="red" variant="light" onClick={handleBulkDelete} leftSection={<IconTrash size={14} />}>
            Delete selected
          </Button>
          <ActionIcon variant="subtle" size="sm" onClick={clearSelection} ml="auto">
            <IconX size={14} />
          </ActionIcon>
        </Group>
      )}

      {filteredHistory.length > 0 ? (
        <ScrollArea>
          <Table miw={750} verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>
                  <Checkbox
                    checked={selectedIds.size === filteredHistory.length && filteredHistory.length > 0}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredHistory.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </Table.Th>
                <Table.Th>{t('strainType', lang)}</Table.Th>
                <Table.Th>{t('products', lang)}</Table.Th>
                <Table.Th ta="right">{t('amount', lang)}</Table.Th>
                <Table.Th ta="right">{t('priceLabel', lang)}</Table.Th>
                <Table.Th>{t('notesLabel', lang)}</Table.Th>
                <Table.Th ta="right">When</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredHistory.map((entry) => (
                <Table.Tr
                  key={entry.id}
                  style={{
                    background: selectedIds.has(entry.id) ? `var(--mantine-color-blue-${isDark ? 9 : 0})` : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleRow(entry.id)}
                >
                  <Table.Td onClick={e => e.stopPropagation()} w={40}>
                    <Checkbox
                      checked={selectedIds.has(entry.id)}
                      onChange={() => toggleRow(entry.id)}
                      aria-label={`Select ${entry.productName}`}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Badge color={typeColors[entry.type] || 'gray'} variant="light" size="sm">
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{entry.productName}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm">{entry.amount != null ? `${formatPrecision(entry.amount, settings.decimalPrecision)}g` : '—'}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm">{entry.price != null ? formatCurrency(entry.price, settings.currency) : '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    {entry.notes ? (
                      <Text
                        size="xs"
                        style={{ maxWidth: 200, cursor: 'pointer' }}
                        onClick={() => onToggleNote(entry.id)}
                        lineClamp={expandedNotes.has(entry.id) ? undefined : 1}
                      >
                        {entry.notes}
                      </Text>
                    ) : (
                      <Text size="xs" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="xs" c="dimmed">{formatActivityDate(entry.timestamp, lang)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      ) : (
        <Text ta="center" py={40} c="dimmed" size="sm">
          {t('noActivities', lang)}
        </Text>
      )}
    </div>
  );
});
