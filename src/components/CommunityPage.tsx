import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { useProducts } from '../utils/useProducts';
import { SocialFeed } from './SocialFeed';
import { ProfilePage } from './ProfilePage';
import type { Profile } from '../types';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export function CommunityPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDark = settings.theme === 'dark';
  const [communityProfile, setCommunityProfile] = useState<Profile | undefined>(undefined);
  const profileUserId = searchParams.get('profile');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, avatar_url, location').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setCommunityProfile({
          username: data.display_name || user.email?.split('@')[0] || 'User',
          bio: '',
          joinedAt: user.created_at,
          avatar_url: data.avatar_url,
          location: data.location,
        });
      }
    });
  }, [user]);

  if (!user) {
    return (
      <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>Sign in to access the community</p>
      </div>
    );
  }

  if (profileUserId) {
    return <ProfilePage userId={profileUserId} onBack={() => {
      setSearchParams(prev => { prev.delete('profile'); return prev; }, { replace: true });
    }} />;
  }

  return (
    <SocialFeed
      isDark={isDark}
      lang={settings.language}
      currentUserId={user.id}
      username={communityProfile?.username || user.email?.split('@')[0] || 'User'}
      products={products}
      profile={communityProfile}
      onViewProfile={(uid) => {
        setSearchParams(prev => { prev.set('profile', uid); return prev; }, { replace: true });
      }}
    />
  );
}