import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MobileSheet } from './MobileSheet';
import { 
  Home, Users, Store, Bell, 
  Settings, Clock, Grid, MoreHorizontal, 
  Search, User, MessageSquare
} from 'lucide-react';

type PrimaryTabId = 'stash' | 'community' | 'marketplace' | 'notifications' | 'profile';
type SecondaryTabId = 'history' | 'messages' | 'explore' | 'dashboard' | 'admin';

const primaryTabs: { id: PrimaryTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'stash', label: 'Stash', icon: <Home className="w-6 h-6" /> },
  { id: 'community', label: 'Community', icon: <Users className="w-6 h-6" /> },
  { id: 'marketplace', label: 'Market', icon: <Store className="w-6 h-6" /> },
  { id: 'notifications', label: 'Alerts', icon: <Bell className="w-6 h-6" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

const secondaryTabs: { id: SecondaryTabId; label: string; icon: React.ReactNode; requiresAuth?: boolean }[] = [
  { id: 'history', label: 'History', icon: <Clock className="w-6 h-6" />, requiresAuth: true },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-6 h-6" />, requiresAuth: true },
  { id: 'explore', label: 'Explore', icon: <Search className="w-6 h-6" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <Grid className="w-6 h-6" />, requiresAuth: true },
  { id: 'admin', label: 'Admin', icon: <Settings className="w-6 h-6" />, requiresAuth: true },
];

interface BottomNavProps {
  isDark: boolean;
}

export function BottomNav({ isDark }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeTab = new URLSearchParams(location.search).get('tab') as PrimaryTabId | null;

  const handleTabClick = (tabId: PrimaryTabId | SecondaryTabId) => {
    if (tabId === 'profile') {
      navigate('/?tab=community');
      return;
    }
    if (tabId === 'dashboard') {
      navigate('/?tab=dashboard');
      return;
    }
    if (tabId === 'admin') {
      navigate('/?tab=admin');
      return;
    }
    if (tabId === 'history') {
      navigate('/?tab=history');
      return;
    }
    if (tabId === 'messages') {
      // Messages handled by MessagePopup
      navigate('/?tab=community');
      return;
    }
    if (tabId === 'explore') {
      navigate('/?tab=community');
      return;
    }
    navigate(`/?tab=${tabId}`);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                    : isDark ? 'text-slate-500' : 'text-gray-500'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="block">{tab.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
              isDark ? 'text-slate-500' : 'text-gray-500'
            }`}
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      <MobileSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        isDark={isDark}
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">Other</p>
          {secondaryTabs
            .filter(tab => {
              if (tab.requiresAuth && !user) return false;
              if (tab.id === 'admin' && !isAdmin) return false;
              return true;
            })
            .map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
        </div>
      </MobileSheet>
    </>
  );
}