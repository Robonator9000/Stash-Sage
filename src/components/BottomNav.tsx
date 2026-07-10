import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type TabId = 'stash' | 'community' | 'marketplace' | 'admin' | 'notifications';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: TabId) => void;
  isDark: boolean;
  lang?: string;
}

const tabs = [
  { id: 'stash' as const, label: 'Stash', icon: 'M12 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6m-8 0H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2m-8 0V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12' },
  { id: 'community' as const, label: 'Community', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'marketplace' as const, label: 'Market', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'notifications' as const, label: 'Alerts', icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
  { id: 'profile' as const, label: 'Profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
];

export function BottomNav({ activeTab, onTabChange, isDark }: BottomNavProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleTabClick(tab: string) {
    if (tab === 'profile') {
      navigate('/?tab=community');
      return;
    }
    onTabChange(tab as TabId);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1 backdrop-blur-lg border-t
      bg-white/90 border-gray-200 dark:bg-slate-900/90 dark:border-slate-700/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl text-xs font-medium transition-all
            ${activeTab === tab.id
              ? isDark ? 'text-cyan-400' : 'text-cyan-600'
              : isDark ? 'text-mist' : 'text-gray-500'
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === tab.id ? 2 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
          </svg>
          <span>{tab.label}</span>
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
