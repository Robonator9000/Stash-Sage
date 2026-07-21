import { memo } from 'react';
import { Settings } from '../types';
import { ActivityEntry } from '../utils/useActivity';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';
import { Table, Badge, ScrollArea, Group, Text, Button, Select } from '@mantine/core';

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
  filteredHistory, lang, settings, historyFilterType, historyDateFilter,
  expandedNotes, onFilterTypeChange, onDateFilterChange, onClearHistory, onToggleNote,
}: HistoryTabProps) {
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

      {filteredHistory.length > 0 ? (
        <ScrollArea>
          <Table miw={700} verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
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
                <Table.Tr key={entry.id}>
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
