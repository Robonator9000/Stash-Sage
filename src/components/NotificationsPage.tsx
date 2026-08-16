import { useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/helpers';
import { t } from '../utils/translations';
import { Paper, Text, Group, Avatar, UnstyledButton, Stack, Loader, Box, ScrollArea } from '@mantine/core';
import {
  IconHeart, IconMessageCircle, IconUserPlus, IconAt, IconTag,
  IconShoppingCart, IconBellOff,
} from '@tabler/icons-react';

export function NotificationsPage({ isDark, currentUserId, lang, onViewProfile, onOpenPost }: {
  isDark: boolean; currentUserId: string; lang: string;
  onViewProfile?: (uid: string) => void;
  onOpenPost?: (postId: string) => void;
}) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(currentUserId);

  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const nameFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)';
  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const unreadBg = 'rgba(6,182,212,0.08)';

  const typeIcon = (type: string) => {
    const props = { size: 13, style: { flexShrink: 0 } };
    switch (type) {
      case 'like': return <IconHeart {...props} color="#fb7185" />;
      case 'comment': return <IconMessageCircle {...props} color="#22d3ee" />;
      case 'mention': return <IconAt {...props} color="#a78bfa" />;
      case 'new_listing': return <IconTag {...props} color="#fbbf24" />;
      case 'listing_sold': return <IconShoppingCart {...props} color="#34d399" />;
      default: return <IconUserPlus {...props} color="#34d399" />;
    }
  };

  const groups = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const map = new Map<string, typeof sorted>();
    for (const n of sorted) {
      const d = new Date(n.created_at);
      let label: string;
      if (isSameDay(d, now)) label = t('today', lang);
      else if (isSameDay(d, yesterday)) label = t('yesterday', lang);
      else label = d.toLocaleDateString(lang === 'en' ? 'en-US' : lang, { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return [...map.entries()];
  }, [notifications, lang]);

  const renderText = (n: (typeof notifications)[number]) => {
    switch (n.type) {
      case 'like': return t('notifLiked', lang);
      case 'comment': return t('notifCommented', lang);
      case 'new_listing': return t('notifListed', lang).replace('{title}', n.listing_title || t('notifSomething', lang));
      case 'listing_sold': return t('notifListingSold', lang).replace('{title}', n.listing_title || t('notifAListing', lang));
      case 'mention': return t('notifMentioned', lang);
      default: return t('notifFollowed', lang);
    }
  };

  return (
    <Stack mx="auto" style={{ maxWidth: 672 }} gap="sm">
      <Group justify="space-between" px="sm" wrap="nowrap">
        <Text size="sm" fw={700} style={{ color: muted }}>
          {notifications.length > 0 ? t('notificationsCount', lang).replace('{n}', String(notifications.length)) : t('notifications', lang)}
        </Text>
        {unreadCount > 0 && (
          <UnstyledButton
            onClick={markAllRead}
            style={{ fontSize: 12, fontWeight: 500, color: 'var(--mantine-color-cyan-6)' }}
          >
            {t('markAllRead', lang)}
          </UnstyledButton>
        )}
      </Group>

      {loading && (
        <Group justify="center" p="xl">
          <Loader size="sm" color="cyan" />
        </Group>
      )}

      {!loading && notifications.length === 0 && (
        <Box ta="center" style={{ padding: '48px 0' }}>
          <Box
            mb="md"
            mx="auto"
            w={72}
            h={72}
            style={{
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? 'rgba(6,182,212,0.1)' : 'var(--mantine-color-cyan-1)',
              border: `1px solid ${isDark ? 'rgba(6,182,212,0.25)' : 'var(--mantine-color-cyan-3)'}`,
            }}
          >
            <IconBellOff size={30} className={isDark ? 'text-cyan-4' : 'text-cyan-7'} style={{ color: isDark ? '#22d3ee' : '#0e7490' }} />
          </Box>
          <Text size="md" fw={600} style={{ color: nameFg }}>{t('noNotificationsYet', lang)}</Text>
          <Text size="sm" mt={4} style={{ color: muted }}>{t('noNotificationsHint', lang)}</Text>
        </Box>
      )}

      {!loading && notifications.length > 0 && (
        <ScrollArea.Autosize mah="60vh" type="auto">
          {groups.map(([label, items]) => (
            <Box key={label} mb="md">
              <Text size="xs" fw={600} mb={6} px="sm" style={{ color: muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
              <Stack gap={6}>
                {items.map(n => (
                  <Paper
                    key={n.id}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      background: n.read ? cardBg : unreadBg,
                      backdropFilter: 'blur(4px)',
                      borderColor,
                      cursor: n.post_id && onOpenPost ? 'pointer' : undefined,
                    }}
                    onClick={n.post_id && onOpenPost ? () => { markRead(n.id); onOpenPost(n.post_id!); } : undefined}
                  >
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      <UnstyledButton
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); onViewProfile?.(n.actor_id); }}
                        aria-label={n.actor?.username || t('someone', lang)}
                      >
                        {n.actor?.avatar_url ? (
                          <Avatar src={n.actor.avatar_url} alt={n.actor?.username || t('someone', lang)} radius="md" size={36} />
                        ) : (
                          <Avatar radius="md" size={36} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
                            {(n.actor?.username?.[0] || '?').toUpperCase()}
                          </Avatar>
                        )}
                      </UnstyledButton>
                      <Group gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" style={{ color: muted }}>
                          <UnstyledButton
                            onClick={(e) => { e.stopPropagation(); markRead(n.id); onViewProfile?.(n.actor_id); }}
                            style={{ fontWeight: 700, color: nameFg }}
                          >
                            {n.actor?.username || t('someone', lang)}
                          </UnstyledButton>{' '}{renderText(n)}
                        </Text>
                        <Group gap={6}>
                          <Group gap={4} style={{ color: muted }}>
                            {typeIcon(n.type)}
                            <Text size="xs" style={{ color: muted }}>{timeAgo(n.created_at, lang)}</Text>
                          </Group>
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
