import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatsCard } from './StatsCard';
import { CalendarHeatmap } from './CalendarHeatmap';
import { Product, Session, Settings } from '../types';
import { t } from '../utils/translations';
import { formatPrecision, formatCurrency } from '../utils/helpers';

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
    <div>
      <div className="mb-6">
        <StatsCard products={products} sessions={sessions} isDark={isDark} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('stockOverview', lang)}
          </h3>
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
            <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('noProductsYet', lang)}</div>
          )}
          <div className="flex flex-wrap gap-3 mt-4">
            {typeDistribution.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DASHBOARD_COLORS[idx % DASHBOARD_COLORS.length] }} />
                <span className={isDark ? 'text-muted' : 'text-gray-500'}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('consumptionTrend', lang)}
          </h3>
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
            <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('noSessions', lang)}</div>
          )}
        </div>
        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('topStrains', lang)}
          </h3>
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
            <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('noProductsYet', lang)}</div>
          )}
        </div>
        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('totalSpent', lang)}
          </h3>
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
            <div className={`text-center py-12 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('noProductsYet', lang)}</div>
          )}
        </div>
      </div>
      <div className="mb-6">
        <CalendarHeatmap sessions={sessions} isDark={isDark} lang={lang} />
      </div>
      {settings.budgetLimit > 0 && (
        <div className={`rounded-2xl p-5 border mb-6 ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('budgetLimit', lang)} ({settings.budgetPeriod})
            </span>
            <span className={`text-sm ${isDark ? 'text-muted' : 'text-gray-500'}`}>
              {formatCurrency(totalValue, settings.currency)} / {formatCurrency(settings.budgetLimit, settings.currency)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#1e293b' : '#e5e7eb' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.min(100, (totalValue / settings.budgetLimit) * 100)}%`,
              background: totalValue > settings.budgetLimit
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : totalValue > settings.budgetLimit * 0.8
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #10b981, #059669)',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
