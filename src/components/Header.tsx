import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { useProducts } from '../utils/useProducts';
import { supabase } from '../utils/supabase';
import { searchProducts, timeAgo } from '../utils/helpers';
import { t } from '../utils/translations';
import { LogoIcon } from './LogoIcon';
import { NotificationBell } from './NotificationBell';

interface UserRow { user_id: string; display_name: string; avatar_url: string | null; }
interface PostRow { id: string; content: string; created_at: string; user_id: string; }
interface ListingRow { id: string; title: string; price: number; image_url: string | null; }

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setIsAddModalOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setSettingsDefaultTab: (tab: 'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security') => void;
  setStashSection: (section: 'products' | 'dashboard' | 'history') => void;
}

export function Header({ searchQuery, setSearchQuery, setIsAddModalOpen, setIsSettingsOpen, setSettingsDefaultTab, setStashSection }: HeaderProps) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { products } = useProducts();
  const [, setSearchParams] = useSearchParams();
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [allListings, setAllListings] = useState<ListingRow[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('user_id, display_name, avatar_url').limit(100).then(({ data }) => { if (data) setAllUsers(data); }).then(undefined, () => {});
    supabase.from('posts').select('id, content, created_at, user_id').order('created_at', { ascending: false }).limit(100).then(({ data }) => { if (data) setAllPosts(data); }).then(undefined, () => {});
    supabase.from('marketplace_listings').select('id, title, price, image_url').eq('status', 'active').order('created_at', { ascending: false }).limit(100).then(({ data }) => { if (data) setAllListings(data); }).then(undefined, () => {});
  }, []);

  const isDark = settings.theme === 'dark';
  const lang = settings.language;

  const [showSearchPreview, setShowSearchPreview] = useState(false);

  const q = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!q) return { products: [], users: [], posts: [], listings: [] };
    return {
      products: searchProducts(products, searchQuery).slice(0, 5),
      users: allUsers.filter(u => u.display_name?.toLowerCase().includes(q)).slice(0, 5),
      posts: allPosts.filter(p => p.content?.toLowerCase().includes(q)).slice(0, 5),
      listings: allListings.filter(l => l.title?.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [q, searchQuery, products, allUsers, allPosts, allListings]);

  const showDropdown = showSearchPreview && q && (searchResults.products.length > 0 || searchResults.users.length > 0 || searchResults.posts.length > 0 || searchResults.listings.length > 0);

  const setActiveTab = (tab: 'stash' | 'community' | 'marketplace' | 'admin') => {
    setSearchParams(prev => { prev.set('tab', tab); return prev; }, { replace: true });
  };

  const handleViewProfile = (uid: string) => {
    setSearchParams(prev => { prev.set('tab', 'community'); prev.set('profile', uid); return prev; }, { replace: true });
    setShowSearchPreview(false);
  };

  function handleResultClick() {
    setShowSearchPreview(false);
  }

  return (
    <header className={`sticky top-0 z-50 ${isDark ? 'bg-[#0b1120]/80' : 'bg-[#e2e8f0]/80'} backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <button
          onClick={() => { setActiveTab('stash'); setStashSection('products'); }}
          className="flex items-center gap-1.5 shrink-0"
        >
          <LogoIcon className="w-7 h-7" />
          <span className="bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent font-display font-extrabold text-lg tracking-tight">STASH</span>
        </button>

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
          {showDropdown && (
            <div className={`absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl border overflow-hidden z-50 max-h-96 overflow-y-auto ${isDark ? 'bg-midnight border border-edge' : 'bg-white border-gray-200'}`}>
              {searchResults.products.length > 0 && (
                <div>
                  <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-muted bg-[#0b1120]' : 'text-gray-400 bg-gray-50'}`}>Products</div>
                  {searchResults.products.map(p => (
                    <button key={p.id} onMouseDown={() => { setSearchQuery(p.name); handleResultClick(); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'hover:bg-[#0b1120] text-white' : 'hover:bg-gray-50 text-gray-900'}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${p.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="font-medium truncate">{p.name}</span>
                      {p.strain && <span className={`text-xs ml-auto shrink-0 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{p.strain}</span>}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.users.length > 0 && (
                <div>
                  <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-muted bg-[#0b1120]' : 'text-gray-400 bg-gray-50'}`}>Users</div>
                    {searchResults.users.map(u => (
                    <button key={u.user_id} onMouseDown={() => { handleViewProfile(u.user_id); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'hover:bg-[#0b1120] text-white' : 'hover:bg-gray-50 text-gray-900'}`}>
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyanx to-emera flex items-center justify-center"><span className="text-white text-[10px] font-bold">{(u.display_name?.[0] || '?').toUpperCase()}</span></div>}
                      <span className="truncate">{u.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.posts.length > 0 && (
                <div>
                  <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-muted bg-[#0b1120]' : 'text-gray-400 bg-gray-50'}`}>Posts</div>
                  {searchResults.posts.map(p => (
                    <button key={p.id} onMouseDown={() => { setSearchParams(prev => { prev.set('tab', 'community'); return prev; }, { replace: true }); handleResultClick(); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'hover:bg-[#0b1120] text-white' : 'hover:bg-gray-50 text-gray-900'}`}>
                      <span className="truncate text-xs">{p.content?.slice(0, 80)}</span>
                      <span className={`text-[10px] shrink-0 ml-auto ${isDark ? 'text-muted' : 'text-gray-400'}`}>{timeAgo(p.created_at, lang)}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.listings.length > 0 && (
                <div>
                  <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-muted bg-[#0b1120]' : 'text-gray-400 bg-gray-50'}`}>Listings</div>
                  {searchResults.listings.map(l => (
                    <button key={l.id} onMouseDown={() => { setSearchParams(prev => { prev.set('tab', 'marketplace'); return prev; }, { replace: true }); handleResultClick(); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'hover:bg-[#0b1120] text-white' : 'hover:bg-gray-50 text-gray-900'}`}>
                      {l.image_url ? <img src={l.image_url} alt="" className="w-6 h-6 rounded object-cover" /> : <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><span className="text-white text-[10px] font-bold">$</span></div>}
                      <span className="truncate flex-1">{l.title}</span>
                      <span className={`text-xs font-semibold shrink-0 ${isDark ? 'text-emera' : 'text-emerald-600'}`}>${l.price}</span>
                    </button>
                  ))}
                </div>
              )}
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
