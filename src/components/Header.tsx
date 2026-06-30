import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { useProducts } from '../utils/useProducts';
import { searchProducts, formatPrecision } from '../utils/helpers';
import { t } from '../utils/translations';
import { LogoIcon } from './LogoIcon';
import { NotificationBell } from './NotificationBell';
import { useConversations } from '../hooks/useConversations';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setIsAddModalOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setSettingsDefaultTab: (tab: 'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security') => void;
  setStashSection: (section: 'products' | 'dashboard' | 'history') => void;
  setShowChat: (v: boolean) => void;
}

export function Header({ searchQuery, setSearchQuery, setIsAddModalOpen, setIsSettingsOpen, setSettingsDefaultTab, setStashSection, setShowChat }: HeaderProps) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { products } = useProducts();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isDark = settings.theme === 'dark';
  const lang = settings.language;

  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const currentUserId = user?.id;
  const { conversations } = useConversations(currentUserId);
  const unreadCount = useMemo(() =>
    conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  [conversations]);

  const previewProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchProducts(products, searchQuery).slice(0, 5);
  }, [products, searchQuery]);

  const setActiveTab = (tab: 'stash' | 'community' | 'marketplace' | 'admin') => {
    setSearchParams(prev => { prev.set('tab', tab); return prev; }, { replace: true });
  };

  const handleViewProfile = (uid: string) => {
    navigate(`/profile/${uid}`);
  };

  return (
    <header className={`sticky top-0 z-50 ${isDark ? 'bg-[#0b1120]/80' : 'bg-[#e2e8f0]/80'} backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <h1 className="m-0">
          <button
            onClick={() => { setActiveTab('stash'); setStashSection('products'); }}
            className="font-display text-2xl font-extrabold hover:opacity-80 transition-opacity shrink-0 flex items-center gap-1.5"
          >
            <LogoIcon className="w-8 h-8" />
            <span className="bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent font-display font-extrabold text-xl tracking-tight">STASH</span>
          </button>
        </h1>

        <div className="relative flex-1 max-w-xl mx-auto">
          <div className="relative">
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-muted' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchPreview(true); }}
              onFocus={() => setShowSearchPreview(true)}
              onBlur={() => setTimeout(() => setShowSearchPreview(false), 200)}
              placeholder={t('searchPlaceholder', lang)}
              data-coach="search"
              className={`w-full pl-10 pr-4 py-1.5 rounded-xl text-sm border transition-all outline-none
                ${isDark
                  ? 'bg-midnight/80 border border-edge text-white placeholder-muted focus:border-cyan-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400'}`}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearchPreview(false); }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}
              >
                &times;
              </button>
            )}
          </div>
          {showSearchPreview && searchQuery.trim() && previewProducts.length > 0 && (
            <div className={`absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl border overflow-hidden z-50
              ${isDark ? 'bg-midnight/80 border border-edge' : 'bg-white border-gray-200'}`}>
              {previewProducts.map(p => (
                <button
                  key={p.id}
                  onMouseDown={() => { setSearchQuery(p.name); setShowSearchPreview(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                    ${isDark ? 'hover:bg-midnight text-white' : 'hover:bg-gray-50 text-gray-900'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className="flex-1 text-left">
                    <span className="font-medium">{p.name}</span>
                    {p.strain && <span className={`ml-2 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{p.strain}</span>}
                  </div>
                  <span className={isDark ? 'text-muted' : 'text-gray-400'}>{formatPrecision(p.amount, settings.decimalPrecision)}g</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            data-coach="add-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('addProduct', lang)}
          </button>
          {user && <NotificationBell isDark={isDark} lang={lang} onViewProfile={handleViewProfile} />}
          {user && (
            <button
              onClick={() => setShowChat(true)}
              className={`p-1.5 rounded-xl relative ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              {unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-cyan-500 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </button>
          )}
          <button
            onClick={() => { setSettingsDefaultTab('profile'); setIsSettingsOpen(true); }}
            className={`p-1.5 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
          >
            {user ? (
              settings.profile?.avatar_url ? (
                <div className="w-7 h-7 rounded-lg overflow-hidden">
                  <img src={settings.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyanx to-emera flex items-center justify-center">
                  <span className="text-white font-display font-bold text-xs">
                    {settings.profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyanx to-emera flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
          </button>
          <button
            onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark', themeAuto: false })}
            className={`p-2 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
