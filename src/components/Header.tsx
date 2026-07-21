import { useState, useMemo, useEffect, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { useProducts } from '../utils/useProducts';
import { supabase } from '../utils/supabase';
import { searchProducts, timeAgo } from '../utils/helpers';
import { t } from '../utils/translations';
import { LogoIcon } from './LogoIcon';
import { NotificationBell } from './NotificationBell';
import { ActionIcon, Button, Group, Avatar } from '@mantine/core';
import { IconSun, IconMoon, IconSearch, IconPlus, IconUser } from '@tabler/icons-react';

interface UserRow { user_id: string; display_name: string; username?: string; avatar_url: string | null; }
interface PostRow { id: string; content: string; created_at: string; user_id: string; }
interface ListingRow { id: string; title: string; price: number; image_url: string | null; }

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setIsAddModalOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setSettingsDefaultTab: (tab: 'profile' | 'preferences' | 'session' | 'budget' | 'data' | 'security') => void;
  setStashSection: (section: 'products' | 'dashboard') => void;
}

export const Header = memo(function Header({ searchQuery, setSearchQuery, setIsAddModalOpen, setIsSettingsOpen, setSettingsDefaultTab, setStashSection }: HeaderProps) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { products } = useProducts();
  const [, setSearchParams] = useSearchParams();
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [allListings, setAllListings] = useState<ListingRow[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').limit(100).then(({ data }) => { if (data) setAllUsers(data); }).then(undefined, () => {});
    supabase.from('posts').select('id, content, created_at, user_id').order('created_at', { ascending: false }).limit(100).then(({ data }) => { if (data) setAllPosts(data); }).then(undefined, () => {});
    supabase.from('marketplace_listings').select('id, title, price, image_url').eq('status', 'active').order('created_at', { ascending: false }).limit(100).then(({ data }) => { if (data) setAllListings(data); }).then(undefined, () => {});
  }, []);

  const isDark = settings.theme === 'dark';
  const lang = settings.language;

  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const q = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!q) return { products: [], users: [], posts: [], listings: [] };
    return {
      products: searchProducts(products, searchQuery).slice(0, 5),
      users: allUsers.filter(u => u.display_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)).slice(0, 5),
      posts: allPosts.filter(p => p.content?.toLowerCase().includes(q)).slice(0, 5),
      listings: allListings.filter(l => l.title?.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [q, searchQuery, products, allUsers, allPosts, allListings]);

  const showDropdown = showSearchPreview && q && (searchResults.products.length > 0 || searchResults.users.length > 0 || searchResults.posts.length > 0 || searchResults.listings.length > 0);

  const setActiveTab = (tab: 'stash' | 'community' | 'marketplace' | 'admin') => {
    setSearchParams(prev => { prev.set('tab', tab); return prev; }, { replace: true });
  };

  const handleViewProfile = (uid: string) => {
    supabase.from('profiles').select('username').eq('user_id', uid).maybeSingle().then(({ data }) => {
      setSearchParams(prev => { prev.set('tab', 'community'); prev.set('user', data?.username || uid); return prev; }, { replace: true });
      setShowSearchPreview(false);
    });
  };

  function handleResultClick() {
    setShowSearchPreview(false);
  }

  return (
    <header className={`sticky top-0 z-[60] ${isDark ? 'bg-[#0b1120]/80' : 'bg-[#e2e8f0]/80'} backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <button
          onClick={() => { setActiveTab('stash'); setStashSection('products'); }}
          className="flex items-center gap-1.5 shrink-0"
        >
          <LogoIcon className="w-7 h-7" />
          <span className="bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent font-display font-extrabold text-lg tracking-tight">STASH</span>
        </button>

        <div className="relative flex-1 max-w-xl mx-auto hidden sm:block">
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
                      <div className="min-w-0">
                        <span className="truncate block">{u.display_name}</span>
                        {u.username && <span className={`text-[10px] ${isDark ? 'text-muted' : 'text-gray-400'}`}>@{u.username}</span>}
                      </div>
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

        <Group gap="xs" style={{ flexShrink: 0 }}>
          <ActionIcon variant="subtle" className="sm:hidden" onClick={() => setMobileSearchOpen(s => !s)} aria-label="Search">
            <IconSearch size={18} />
          </ActionIcon>

          <Button
            leftSection={<IconPlus size={16} />}
            size="sm"
            variant="gradient"
            gradient={{ from: 'cyan', to: 'emerald' }}
            onClick={() => setIsAddModalOpen(true)}
            visibleFrom="sm"
          >
            {t('addProduct', lang)}
          </Button>

          {user && <NotificationBell isDark={isDark} lang={lang} onViewProfile={handleViewProfile} />}

          <ActionIcon
            variant="subtle"
            size="md"
            onClick={() => { setSettingsDefaultTab('profile'); setIsSettingsOpen(true); }}
            aria-label="Profile"
          >
            {user ? (
              <Avatar src={settings.profile?.avatar_url} alt="" size={24} radius="sm">
                {settings.profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </Avatar>
            ) : (
              <IconUser size={18} />
            )}
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            size="md"
            onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark', themeAuto: false })}
            aria-label="Toggle color scheme"
            visibleFrom="sm"
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      </div>
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchPreview(true); }}
              autoFocus
              placeholder={t('searchPlaceholder', lang)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border transition-all outline-none
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
        </div>
      )}
    </header>
  );
});
