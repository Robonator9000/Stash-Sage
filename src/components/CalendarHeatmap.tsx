import { useMemo } from 'react';
import { Session } from '../types';
import { t } from '../utils/translations';

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
  const { weeks, maxAmount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

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

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
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
  }, [sessions]);

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
    if (intensity === 0) return isDark ? 'bg-slate-800' : 'bg-gray-100';
    if (intensity === 1) return isDark ? 'bg-emerald-900/60' : 'bg-emerald-200';
    if (intensity === 2) return isDark ? 'bg-emerald-700' : 'bg-emerald-400';
    if (intensity === 3) return isDark ? 'bg-emerald-500' : 'bg-emerald-500';
    return isDark ? 'bg-emerald-400' : 'bg-emerald-600';
  };

  return (
    <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('activity', lang)}
      </h3>

      {/* Month labels */}
      <div className="flex ml-8 mb-1 overflow-hidden">
        {weeks.map((_, wi) => {
          const label = monthLabels.find((l) => l.index === wi);
          return (
            <div
              key={wi}
              className={`text-[10px] leading-none flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
              style={{ width: `${100 / weeks.length}%`, visibility: label ? 'visible' : 'hidden' }}
            >
              {label?.label || ''}
            </div>
          );
        })}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((day, i) => (
            <div
              key={i}
              className={`text-[10px] leading-none h-[13px] flex items-center justify-end pr-1 ${
                isDark ? 'text-slate-500' : 'text-gray-400'
              }`}
              style={{ width: '24px' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[13px] h-[13px] rounded-sm ${getColor(getIntensity(day.amount, maxAmount))}`}
                  title={day.amount > 0 ? `${day.date.toLocaleDateString()}: ${day.amount.toFixed(1)}g` : day.date.toLocaleDateString()}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('less', lang)}</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-[13px] h-[13px] rounded-sm ${getColor(i)}`} />
        ))}
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('more', lang)}</span>
      </div>
    </div>
  );
}
