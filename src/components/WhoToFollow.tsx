import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface WhoToFollowProps {
  isDark: boolean;
  currentUserId: string;
  onViewProfile?: (userId: string) => void;
}

export function WhoToFollow({ isDark, currentUserId, onViewProfile }: WhoToFollowProps) {
  const [suggestions, setSuggestions] = useState<{ user_id: string; display_name: string; username: string; avatar_url?: string }[]>([]);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from('follows').select('following_id').eq('follower_id', currentUserId).then(({ data: following }) => {
      const followedIds = new Set((following || []).map(f => f.following_id));
      followedIds.add(currentUserId);
      supabase.from('profiles').select('user_id, display_name, username, avatar_url').limit(20).then(({ data: profiles }) => {
        if (!profiles) { return; }
        const filtered = profiles.filter(p => !followedIds.has(p.user_id)).slice(0, 3);
        setSuggestions(filtered);
      });
    });
  }, [currentUserId]);

  if (suggestions.length === 0) return null;

  return (
    <div className={`rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${isDark ? 'border-edge' : 'border-gray-200'}`}>
        <h3 className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>Who to follow</h3>
      </div>
      <div className="p-2 space-y-1">
        {suggestions.map(u => (
          <div key={u.user_id} className="flex items-center gap-3 px-3 py-2">
            <button onClick={() => onViewProfile?.(u.user_id)} className={`w-8 h-8 rounded-xl shrink-0 overflow-hidden ${u.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-display font-bold text-xs">{(u.display_name?.[0] || u.username?.[0] || '?').toUpperCase()}</span>}
            </button>
            <div className="flex-1 min-w-0">
              <button onClick={() => onViewProfile?.(u.user_id)} className={`text-sm font-semibold hover:underline block truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>{u.display_name || u.username}</button>
              <p className={`text-xs truncate ${isDark ? 'text-muted' : 'text-gray-400'}`}>@{u.username}</p>
            </div>
            <FollowButtonSmall userId={u.user_id} currentUserId={currentUserId} isDark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowButtonSmall({ userId, currentUserId, isDark }: { userId: string; currentUserId: string; isDark: boolean }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
      setIsFollowing(true);
    }
    setLoading(false);
  }

  return (
    <button onClick={handleToggle} disabled={loading}
      className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
        isFollowing
          ? isDark ? 'bg-midnight text-muted border border-edge' : 'bg-gray-100 text-gray-500 border border-gray-200'
          : 'text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark'
      }`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
