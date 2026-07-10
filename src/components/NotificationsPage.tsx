import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { timeAgo } from '../utils/helpers';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  created_at: string;
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  post_id?: string;
  post_content?: string;
}

export function NotificationsPage({ isDark, currentUserId, onViewProfile }: {
  isDark: boolean; currentUserId: string;
  onViewProfile?: (uid: string) => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;
    Promise.all([
      supabase.from('post_likes').select('id, user_id, post_id, created_at').eq('post_id', '').limit(0),
      supabase.from('follows').select('follower_id, created_at').eq('following_id', currentUserId).order('created_at', { ascending: false }).limit(20),
    ]).then(async ([, followsRes]) => {
      const items: Notification[] = [];
      const followerIds = [...new Set((followsRes.data || []).map(f => f.follower_id))];
      if (followerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', followerIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        for (const f of (followsRes.data || [])) {
          const profile = profileMap.get(f.follower_id);
          items.push({ id: `follow-${f.follower_id}`, type: 'follow', created_at: f.created_at, actor_id: f.follower_id, actor_name: profile?.display_name || 'Someone', actor_avatar: profile?.avatar_url });
        }
      }
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(items);
      setLoading(false);
    });
  }, [currentUserId]);

  if (loading) return <div className={`text-center py-16 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>Loading...</div>;
  if (notifications.length === 0) return <div className={`text-center py-16 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No notifications yet</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {notifications.map(n => (
        <div key={n.id} className={`p-4 rounded-2xl backdrop-blur-sm ${isDark ? 'bg-surface/40 border border-edge' : 'bg-white/70 border border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <button onClick={() => onViewProfile?.(n.actor_id)}
              className={`w-9 h-9 rounded-xl shrink-0 overflow-hidden ${n.actor_avatar ? '' : 'bg-gradient-to-br from-cyanx to-emera flex items-center justify-center'}`}>
              {n.actor_avatar ? <img src={n.actor_avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-sm">{(n.actor_name[0] || '?').toUpperCase()}</span>}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-600'}`}>
                <button onClick={() => onViewProfile?.(n.actor_id)} className={`font-bold hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>{n.actor_name}</button>
                {n.type === 'follow' && ' followed you'}
                {n.type === 'like' && ' liked your post'}
                {n.type === 'comment' && ' commented on your post'}
              </p>
              <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{timeAgo(n.created_at, 'en')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
