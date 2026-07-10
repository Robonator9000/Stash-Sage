import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type TabId = 'stash' | 'community' | 'marketplace' | 'admin' | 'notifications' | 'bookmarks' | 'history';

interface LeftSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDark: boolean;
  lang: string;
  onSettings: () => void;
  currentUserId: string;
  username: string;
  viewingUser: string | null;
  onDashboard: () => void;
}

const tabsConfig = [
  { id: 'stash' as const, label: 'Stash', icon: 'M12 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6m-8 0H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2m-8 0V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12' },
  { id: 'history' as const, label: 'History', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'community' as const, label: 'Community', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'marketplace' as const, label: 'Market', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'notifications' as const, label: 'Notifications', icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
  { id: 'bookmarks' as const, label: 'Bookmarks', icon: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z' },
] as const;

export function LeftSidebar({ activeTab, onTabChange, isDark, onSettings, currentUserId, username, viewingUser, onDashboard }: LeftSidebarProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleTabClick(tab: TabId | 'profile') {
    if (tab === 'profile') {
      navigate('/?tab=community&user=' + encodeURIComponent(username || currentUserId));
      return;
    }
    onTabChange(tab);
  }

  return (
    <nav className="w-14 xl:w-56 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
      <div className="flex flex-col gap-0.5">
        {tabsConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id && !(tab.id === 'community' && viewingUser)
                ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                : isDark ? 'text-mist hover:bg-midnight hover:text-frost' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span className="hidden xl:inline">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => handleTabClick('profile')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'community' && viewingUser
              ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
              : isDark ? 'text-mist hover:bg-midnight hover:text-frost' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="hidden xl:inline">Profile</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === 'admin'
                ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                : isDark ? 'text-mist hover:bg-midnight hover:text-frost' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="hidden xl:inline">Admin</span>
          </button>
        )}
        <button
          onClick={onDashboard}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isDark ? 'text-mist hover:bg-midnight hover:text-frost' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span className="hidden xl:inline">Dashboard</span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200/20">
        <button
          onClick={onSettings}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full
            ${isDark ? 'text-mist hover:bg-midnight hover:text-frost' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden xl:inline">Settings</span>
        </button>
      </div>
    </nav>
  );
}
