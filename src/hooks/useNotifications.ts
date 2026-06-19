import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';
import { supabase } from '../utils/supabase';
import { playNotificationSound } from '../utils/sounds';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          const userIds = [...new Set(data.map(n => n.actor_id))];
          supabase.from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', userIds)
            .then(({ data: profiles }) => {
              const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
              setNotifications(data.map(n => ({
                ...n,
                actor: {
                  username: profileMap.get(n.actor_id)?.display_name || 'Unknown',
                  avatar_url: profileMap.get(n.actor_id)?.avatar_url,
                },
              })));
              setLoading(false);
            }).then(undefined, () => {
              setNotifications(data.map(n => ({
                ...n,
                actor: { username: 'Unknown', avatar_url: null },
              })));
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });

    const channel = supabase.channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          try {
            const newNotif = payload.new as any;
            const { data: profiles } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newNotif.actor_id)
              .single();
            setNotifications(prev => [{
              ...newNotif,
              actor: {
                username: profiles?.display_name || 'Unknown',
                avatar_url: profiles?.avatar_url,
              },
            }, ...prev]);
            playNotificationSound();
          } catch {} // SWALLOW
        })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime notification channel error');
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id).then(undefined, console.error);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false).then(undefined, console.error);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [userId]);

  return { notifications, unreadCount, loading, markRead, markAllRead };
}