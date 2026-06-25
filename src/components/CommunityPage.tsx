import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { useProducts } from '../utils/useProducts';
import { SocialFeed } from './SocialFeed';
import type { Profile } from '../types';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';

export function CommunityPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { products } = useProducts();
  const navigate = useNavigate();
  const lang = settings.language;
  const isDark = settings.theme === 'dark';
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, avatar_url, location').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile({
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

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back', lang)}
      </button>

      <Suspense fallback={
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-full rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      }>
        <SocialFeed
          isDark={isDark}
          lang={lang}
          currentUserId={user.id}
          username={profile?.username || user.email?.split('@')[0] || 'User'}
          products={products}
          profile={profile}
          onViewProfile={(userId) => navigate(`/profile/${userId}`)}
        />
      </Suspense>
    </div>
  );
}
