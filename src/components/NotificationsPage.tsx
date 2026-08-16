import { useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/helpers';
import { Paper, Text, Group, Avatar, UnstyledButton, Stack, Loader, Box, ScrollArea } from '@mantine/core';

export function NotificationsPage({ isDark, currentUserId, lang, onViewProfile }: {
  isDark: boolean; currentUserId: string; lang: string;
  onViewProfile?: (uid: string) => void;
}) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(currentUserId);

  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const nameFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)';
  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const unreadBg = isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.08)';

  const groups = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const map = new Map<string, typeof sorted>();
    for (const n of sorted) {
      const d = new Date(n.created_at);
      const label = d.toLocaleDateString(lang === 'en' ? 'en-US' : lang, { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return [...map.entries()];
  }, [notifications, lang]);

  const renderText = (n: (typeof notifications)[number]) => {
    switch (n.type) {
      case 'like': return <>liked your post</>;
      case 'comment': return <>commented on your post</>;
      case 'new_listing': return <>listed <span style={{ fontWeight: 500 }}>{n.listing_title || 'something'}</span> for sale</>;
      case 'listing_sold': return <>marked <span style={{ fontWeight: 500 }}>{n.listing_title || 'a listing'}</span> as sold</>;
      case 'mention': return <>mentioned you</>;
      default: return <>followed you</>;
    }
  };

  return (
    <Stack mx="auto" style={{ maxWidth: 672 }} gap="sm">
      <Group justify="space-between" px="sm" wrap="nowrap">
        <Text size="sm" fw={700} style={{ color: muted }}>
          {notifications.length > 0 ? `${notifications.length} notifications` : 'Notifications'}
        </Text>
        {unreadCount > 0 && (
          <UnstyledButton
            onClick={markAllRead}
            style={{ fontSize: 12, fontWeight: 500, color: 'var(--mantine-color-cyan-6)' }}
          >
            Mark all read
          </UnstyledButton>
        )}
      </Group>

      {loading && (
        <Group justify="center" p="xl">
          <Loader size="sm" color="cyan" />
        </Group>
      )}

      {!loading && notifications.length === 0 && (
        <Box ta="center" style={{ padding: '64px 0' }}>
          <Text size="md" fw={600} style={{ color: nameFg }}>No notifications yet</Text>
          <Text size="sm" mt={4} style={{ color: muted }}>Likes, comments, and follows will show up here</Text>
        </Box>
      )}

      {!loading && notifications.length > 0 && (
        <ScrollArea.Autosize mah="60vh" type="auto">
          {groups.map(([label, items]) => (
            <Box key={label} mb="md">
              <Text size="xs" fw={600} mb={6} px="sm" style={{ color: muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
              <Stack gap={6}>
                {items.map(n => (
                  <Paper key={n.id} p="sm" radius="md" withBorder style={{ background: n.read ? cardBg : unreadBg, backdropFilter: 'blur(4px)', borderColor }}>
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      <UnstyledButton onClick={() => { markRead(n.id); onViewProfile?.(n.actor_id); }}>
                        {n.actor?.avatar_url ? (
                          <Avatar src={n.actor.avatar_url} alt={n.actor?.username || 'User'} radius="md" size={36} />
                        ) : (
                          <Avatar radius="md" size={36} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
                            {(n.actor?.username?.[0] || '?').toUpperCase()}
                          </Avatar>
                        )}
                      </UnstyledButton>
                      <Group gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" style={{ color: muted }}>
                          <UnstyledButton onClick={() => { markRead(n.id); onViewProfile?.(n.actor_id); }} style={{ fontWeight: 700, color: nameFg }}>{n.actor?.username || 'Someone'}</UnstyledButton>{' '}{renderText(n)}
                        </Text>
                        <Group gap={6}>
                          <Text size="xs" style={{ color: muted }}>{timeAgo(n.created_at, lang)}</Text>
                          {!n.read && <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mantine-color-cyan-6)', flexShrink: 0 }} />}
                        </Group>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ))}
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}