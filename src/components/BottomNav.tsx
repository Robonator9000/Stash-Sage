import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  activeTab: 'stash' | 'community' | 'marketplace' | 'admin';
  onTabChange: (tab: 'stash' | 'community' | 'marketplace' | 'admin') => void;
  isDark: boolean;
  lang: string;
}

const tabs = [
  { id: 'stash' as const, labelKey: 'stash' as const, icon: 'M12 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6m-8 0H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2m-8 0V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12' },
  { id: 'community' as const, labelKey: 'community' as const, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'marketplace' as const, labelKey: 'marketplace' as const, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
] as const;

function getLabel(labelKey: string, lang: string) {
  const map: Record<string, Record<string, string>> = {
    stash: { en: 'Stash', es: 'Alijo', fr: 'Stock', de: 'Vorrat', pt: 'Estoque' },
    community: { en: 'Community', es: 'Comunidad', fr: 'Communauté', de: 'Community', pt: 'Comunidade' },
    marketplace: { en: 'Market', es: 'Mercado', fr: 'Marché', de: 'Markt', pt: 'Market' },
  };
  return map[labelKey]?.[lang] || map[labelKey]?.en || labelKey;
}

export function BottomNav({ activeTab, onTabChange, isDark, lang }: BottomNavProps) {
  const { isAdmin } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1 backdrop-blur-lg border-t
      bg-white/90 border-gray-200 dark:bg-slate-900/90 dark:border-slate-700/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl text-xs font-medium transition-all
            ${activeTab === tab.id
              ? isDark ? 'text-cyan-400' : 'text-cyan-600'
              : isDark ? 'text-mist' : 'text-gray-500'
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === tab.id ? 2 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
          </svg>
          <span>{getLabel(tab.labelKey, lang)}</span>
        </button>
      ))}
      {isAdmin && (
        <button
          onClick={() => onTabChange('admin')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl text-xs font-medium transition-all
            ${activeTab === 'admin'
              ? isDark ? 'text-cyan-400' : 'text-cyan-600'
              : isDark ? 'text-mist' : 'text-gray-500'
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'admin' ? 2 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>Admin</span>
        </button>
      )}
    </nav>
  );
}
