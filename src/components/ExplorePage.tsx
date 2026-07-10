import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { TrendsWidget } from './TrendsWidget';
import { WhoToFollow } from './WhoToFollow';

export function ExplorePage({ isDark, currentUserId, onViewProfile, onHashtagClick }: {
  isDark: boolean; currentUserId: string;
  onViewProfile?: (uid: string) => void;
  onHashtagClick?: (tag: string) => void;
}) {
  const [recentPosts, setRecentPosts] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    supabase.from('posts').select('id', { count: 'exact', head: true }).then(({ count }) => setRecentPosts(count || 0));
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).then(({ count }) => setActiveUsers(count || 0));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className={`p-5 rounded-2xl backdrop-blur-sm ${isDark ? 'bg-surface/40 border border-edge' : 'bg-white/70 border border-gray-200'}`}>
        <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-frost' : 'text-gray-800'}`}>Explore</h2>
        <p className={`text-sm ${isDark ? 'text-muted' : 'text-gray-500'}`}>Discover what's happening</p>
        <div className="flex gap-4 mt-3">
          <div className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-50'}`}>
            <p className={`text-lg font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>{recentPosts}</p>
            <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>Posts</p>
          </div>
          <div className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-50'}`}>
            <p className={`text-lg font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>{activeUsers}</p>
            <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>Users</p>
          </div>
        </div>
      </div>
      <TrendsWidget isDark={isDark} activeHashtag={null} onHashtagClick={onHashtagClick || (() => {})} />
      <WhoToFollow isDark={isDark} currentUserId={currentUserId} onViewProfile={onViewProfile || (() => {})} />
    </div>
  );
}
