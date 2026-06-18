import { memo } from 'react';
import { Settings } from '../types';
import { ActivityEntry } from '../utils/useActivity';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';

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

function formatActivityDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const HistoryTab = memo(function HistoryTab({
  filteredHistory, isDark, lang, settings, historyFilterType, historyDateFilter,
  expandedNotes, onFilterTypeChange, onDateFilterChange, onClearHistory, onToggleNote,
}: HistoryTabProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>
          {t('filterByType', lang)}
        </span>
        <select value={historyFilterType} onChange={(e) => onFilterTypeChange(e.target.value)}
          className={`text-sm rounded-lg px-2 py-1 border-0 outline-none transition-colors ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          <option value="all">{t('allTypes', lang)}</option>
          <option value="consume">Consume</option>
          <option value="sell">Sell</option>
          <option value="session">Session</option>
          <option value="add">Add</option>
          <option value="delete">Delete</option>
          <option value="edit">Edit</option>
        </select>
        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>
          {t('filterByDate', lang)}
        </span>
        <select value={historyDateFilter} onChange={(e) => onDateFilterChange(e.target.value)}
          className={`text-sm rounded-lg px-2 py-1 border-0 outline-none transition-colors ${isDark ? 'bg-midnight text-mist border-border' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          <option value="all">{t('allDates', lang)}</option>
          <option value="7d">{t('last7days', lang)}</option>
          <option value="30d">{t('last30days', lang)}</option>
          <option value="90d">{t('last90days', lang)}</option>
        </select>
        {filteredHistory.length > 0 && (
          <button onClick={onClearHistory}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: isDark ? '#f87171' : '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)' }}>
            {t('clearHistory', lang)}
          </button>
        )}
      </div>
      {filteredHistory.length > 0 ? (
        <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-midnight/80' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-midnight text-muted' : 'bg-gray-50 text-gray-400'}`}>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-left">{t('notesLabel', lang)}</th>
                  <th className="px-4 py-3 text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDark ? 'var(--border)' : '#e5e7eb' }}>
                {filteredHistory.map((entry) => (
                  <tr key={entry.id} className={`transition-colors ${isDark ? 'hover:bg-midnight' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                        ${entry.type === 'add' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : ''}
                        ${entry.type === 'delete' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : ''}
                        ${entry.type === 'edit' ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}
                        ${entry.type === 'consume' ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600') : ''}
                        ${entry.type === 'sell' ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') : ''}
                        ${entry.type === 'session' ? (isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : ''}
                      `}>
                        {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{entry.productName}</td>
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-mist' : 'text-gray-600'}`}>
                      {entry.amount != null ? `${formatPrecision(entry.amount, settings.decimalPrecision)}g` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-mist' : 'text-gray-600'}`}>
                      {entry.price != null ? formatCurrency(entry.price, settings.currency) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-left text-xs max-w-[200px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {entry.notes ? (
                        <button onClick={() => onToggleNote(entry.id)}
                          className={`text-left ${expandedNotes.has(entry.id) ? '' : 'truncate block w-full'} hover:${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
                          title={expandedNotes.has(entry.id) ? 'Collapse' : 'Click to expand'}>
                          {entry.notes}
                        </button>
                      ) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      {formatActivityDate(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-midnight/80 text-muted' : 'bg-white text-gray-400'}`}>
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{t('noActivities', lang)}</p>
        </div>
      )}
    </div>
  );
});
