import { useState, useEffect } from 'react';
import type { Post } from '../types';
import { supabase } from '../utils/supabase';
import { PostCard } from './PostCard';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface UserProfileModalProps {
  userId: string;
  isDark: boolean;
  lang: string;
  onBack?: () => void;
}

export function UserProfileModal({ userId, isDark, lang, onBack }: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string; avatar_url?: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      const [profileRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      ]);

      if (profileRes.error) setError(profileRes.error.message);
      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.error) setError(prev => prev ? prev + '; ' + postsRes.error.message : postsRes.error.message);
      if (postsRes.data) {
        const enriched = postsRes.data.map(p => ({
          ...p,
          author: { username: profileRes.data?.display_name || 'User', avatar_url: profileRes.data?.avatar_url },
          likes_count: 0,
          liked_by_me: false,
          comments_count: 0,
        }));
        setPosts(enriched);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const username = profile?.display_name || 'User';
  const initial = username[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        {onBack && (
          <button onClick={onBack} className={`p-2 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${profile?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-display font-bold text-lg">{initial}</span>
          )}
        </div>
        <div>
          <h2 className={`font-display font-bold text-lg ${isDark ? 'text-frost' : 'text-gray-800'}`}>{username}</h2>
          <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{posts.length} posts</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-4 rounded-2xl animate-pulse ${isDark ? 'bg-surface/50' : 'bg-gray-50'}`}>
                <div className={`h-3 w-24 rounded ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className={`h-3 w-full rounded mt-2 ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-500 border border-red-200'}`}>
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            No posts yet
          </div>
        )}

        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isDark={isDark}
            lang={lang}
            currentUserId={currentUser?.id || ''}
            username={currentUser?.email || 'User'}
            onLike={async () => {}}
            onUnlike={async () => {}}
          />
        ))}
      </div>
    </div>
  );
}