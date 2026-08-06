import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { timeAgo } from '../utils/helpers';
import { Paper, Text, Group, Avatar, UnstyledButton, Stack } from '@mantine/core';

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

  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const nameFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)';

  if (loading) return <Text ta="center" style={{ padding: '64px 0', fontSize: 14, color: muted }}>Loading...</Text>;
  if (notifications.length === 0) return <Text ta="center" style={{ padding: '64px 0', fontSize: 14, color: muted }}>No notifications yet</Text>;

  return (
    <Stack mx="auto" style={{ maxWidth: 672 }} gap="sm">
      {notifications.map(n => (
        <Paper key={n.id} p="sm" radius="md" withBorder style={{ background: cardBg, backdropFilter: 'blur(4px)' }}>
          <Group align="flex-start" gap="sm" wrap="nowrap">
            <UnstyledButton onClick={() => onViewProfile?.(n.actor_id)}>
              {n.actor_avatar ? (
                <Avatar src={n.actor_avatar} radius="md" size={36} />
              ) : (
                <Avatar radius="md" size={36} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
                  {(n.actor_name[0] || '?').toUpperCase()}
                </Avatar>
              )}
            </UnstyledButton>
            <Group gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" style={{ color: muted }}>
                <UnstyledButton onClick={() => onViewProfile?.(n.actor_id)} style={{ fontWeight: 700, color: nameFg }} >{n.actor_name}</UnstyledButton>
                {n.type === 'follow' && ' followed you'}
                {n.type === 'like' && ' liked your post'}
                {n.type === 'comment' && ' commented on your post'}
              </Text>
              <Text size="xs" style={{ color: muted }}>{timeAgo(n.created_at, 'en')}</Text>
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}