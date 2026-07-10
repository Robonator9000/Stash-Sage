import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { useProducts } from '../utils/useProducts';
import { SocialFeed } from './SocialFeed';
import { ProfilePage } from './ProfilePage';
import { TrendsWidget } from './TrendsWidget';
import { WhoToFollow } from './WhoToFollow';
import { SearchWidget } from './SearchWidget';
import type { Profile } from '../types';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function CommunityPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDark = settings.theme === 'dark';
  const [communityProfile, setCommunityProfile] = useState<Profile | undefined>(undefined);
  const profileUser = searchParams.get('user');
  const postParam = searchParams.get('post');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [resolvingProfile, setResolvingProfile] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

  useEffect(() => {
    if (!profileUser) { setProfileUserId(null); return; }
    const isUuid = /^[0-9a-f-]{36}$/i.test(profileUser);
    if (isUuid) {
      setProfileUserId(profileUser);
      return;
    }
    setResolvingProfile(true);
    supabase.from('profiles').select('*').eq('username', profileUser).maybeSingle().then(({ data, error }) => {
      if (!error && data?.user_id) {
        setProfileUserId(data.user_id);
      } else {
        setProfileUserId(null);
      }
      setResolvingProfile(false);
    });
  }, [profileUser]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setCommunityProfile({
          username: data.username || data.display_name || user.email?.split('@')[0] || 'User',
          displayName: data.display_name || data.username || user.email?.split('@')[0] || 'User',
          bio: data.bio || '',
          joinedAt: user.created_at,
          avatar_url: data.avatar_url,
          banner_url: data.banner_url,
          contacts: [],
          location: data.location,
        });
      } else {
        setCommunityProfile({
          username: user.email?.split('@')[0] || 'User',
          displayName: user.email?.split('@')[0] || 'User',
          bio: '',
          joinedAt: user.created_at,
          contacts: [],
        });
      }
    });
  }, [user]);

  const handleViewPost = useCallback((postId: string) => {
    setSearchParams(prev => { prev.set('post', postId); return prev; }, { replace: true });
  }, [setSearchParams]);

  const handleClosePost = useCallback(() => {
    setSearchParams(prev => { prev.delete('post'); return prev; }, { replace: true });
  }, [setSearchParams]);

  const handleHashtagClick = useCallback((tag: string) => {
    setActiveHashtag(prev => prev === tag ? null : tag);
  }, []);

  if (!user) {
    return (
      <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>Sign in to access the community</p>
      </div>
    );
  }

  if (profileUser && profileUserId) {
    return <ProfilePage userId={profileUserId} onBack={() => {
      setSearchParams(prev => { prev.delete('user'); return prev; }, { replace: true });
    }} />;
  }

  if (profileUser && !resolvingProfile && !profileUserId) {
    return (
      <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm font-medium ${isDark ? 'text-mist' : 'text-gray-500'}`}>User not found</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-muted' : 'text-gray-400'}`}>No profile exists for @{profileUser}</p>
        <button
          onClick={() => setSearchParams(prev => { prev.delete('user'); return prev; }, { replace: true })}
          className={`mt-4 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${isDark ? 'border-edge text-mist hover:bg-surface' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Back to community
        </button>
      </div>
    );
  }

  if (profileUser && resolvingProfile) {
    return (
      <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-center">
          <svg className={`w-6 h-6 animate-spin ${isDark ? 'text-muted' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 lg:gap-6 max-w-5xl mx-auto">
      <div className="flex-1 min-w-0 max-w-2xl">
        <SocialFeed
          isDark={isDark}
          lang={settings.language}
          currentUserId={user.id}
          username={communityProfile?.username || user.email?.split('@')[0] || 'User'}
          products={products}
          profile={communityProfile}
          viewPostId={postParam}
          onViewPost={handleViewPost}
          onClosePost={handleClosePost}
          onViewProfile={(uid) => {
            supabase.from('profiles').select('username').eq('user_id', uid).maybeSingle().then(({ data }) => {
              setSearchParams(prev => { prev.set('user', data?.username || uid); return prev; }, { replace: true });
            });
          }}
        />
      </div>
      <div className="hidden lg:block w-80 shrink-0 space-y-4">
        <SearchWidget isDark={isDark} onViewProfile={(uid) => {
          supabase.from('profiles').select('username').eq('user_id', uid).maybeSingle().then(({ data }) => {
            setSearchParams(prev => { prev.set('user', data?.username || uid); return prev; }, { replace: true });
          });
        }} onViewPost={handleViewPost} />
        <TrendsWidget isDark={isDark} activeHashtag={activeHashtag} onHashtagClick={handleHashtagClick} />
        <WhoToFollow isDark={isDark} currentUserId={user.id} onViewProfile={(uid) => {
          supabase.from('profiles').select('username').eq('user_id', uid).maybeSingle().then(({ data }) => {
            setSearchParams(prev => { prev.set('user', data?.username || uid); return prev; }, { replace: true });
          });
        }} />
      </div>
    </div>
  );
}
