import { useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/helpers';
import { t } from '../utils/translations';
import { useSystemNotifications, type SystemNotification } from '../utils/systemNotifications';
import { Paper, Text, Group, Avatar, UnstyledButton, Stack, Loader, Box, ScrollArea } from '@mantine/core';
import {
  IconHeart, IconMessageCircle, IconUserPlus, IconAt, IconTag,
  IconShoppingCart, IconBellOff, IconFlame, IconCurrencyDollar, IconAlertTriangle, IconUsers,
} from '@tabler/icons-react';

type UnifiedNotification =
  | { source: 'server'; n: (ReturnType<typeof useNotifications>)['notifications'][number] }
  | { source: 'system'; n: SystemNotification };

export function NotificationsPage({ isDark, currentUserId, lang, onViewProfile, onOpenPost }: {
  isDark: boolean; currentUserId: string; lang: string;
  onViewProfile?: (uid: string) => void;
  onOpenPost?: (postId: string) => void;
}) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(currentUserId);
  const system = useSystemNotifications();

  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const nameFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)';
  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const unreadBg = 'rgba(6,182,212,0.08)';

  const systemIcon = (type: SystemNotification['type']) => {
    const props = { size: 16 };
    switch (type) {
      case 'low_stock': return <IconAlertTriangle {...props} color="#fbbf24" />;
      case 'budget': return <IconCurrencyDollar {...props} color="#f87171" />;
      case 'sold': return <IconShoppingCart {...props} color="#34d399" />;
      case 'session': return <IconUsers {...props} color="#22d3ee" />;
      default: return <IconFlame {...props} color="#fb923c" />;
    }
  };

  const serverIcon = (type: string) => {
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

  const all: UnifiedNotification[] = useMemo(() => [
    ...notifications.map(n => ({ source: 'server' as const, n })),
    ...system.notifications.map(n => ({ source: 'system' as const, n })),
  ].sort((a, b) => new Date(b.n.created_at).getTime() - new Date(a.n.created_at).getTime()), [notifications, system.notifications]);

  const totalUnread = unreadCount + system.unreadCount;

  const groups = useMemo(() => {
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const map = new Map<string, UnifiedNotification[]>();
    for (const item of all) {
      const d = new Date(item.n.created_at);
      let label: string;
      if (isSameDay(d, now)) label = t('today', lang);
      else if (isSameDay(d, yesterday)) label = t('yesterday', lang);
      else label = d.toLocaleDateString(lang === 'en' ? 'en-US' : lang, { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    return [...map.entries()];
  }, [all, lang]);

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

  const systemBody = (n: SystemNotification) => {
    let out = t(n.bodyKey, lang);
    for (const [k, v] of Object.entries(n.bodyParams || {})) out = out.replace(`{${k}}`, v);
    return out;
  };

  return (
    <Stack mx="auto" style={{ maxWidth: 672 }} gap="sm">
      <Group justify="space-between" px="sm" wrap="nowrap">
        <Text size="sm" fw={700} style={{ color: muted }}>
          {all.length > 0 ? t('notificationsCount', lang).replace('{n}', String(all.length)) : t('notifications', lang)}
        </Text>
        {totalUnread > 0 && (
          <UnstyledButton
            onClick={() => { markAllRead(); system.markAllRead(); }}
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

      {!loading && all.length === 0 && (
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
            <IconBellOff size={30} style={{ color: isDark ? '#22d3ee' : '#0e7490' }} />
          </Box>
          <Text size="md" fw={600} style={{ color: nameFg }}>{t('noNotificationsYet', lang)}</Text>
          <Text size="sm" mt={4} style={{ color: muted }}>{t('noNotificationsHint', lang)}</Text>
        </Box>
      )}

      {!loading && all.length > 0 && (
        <ScrollArea.Autosize mah="60vh" type="auto">
          {groups.map(([label, items]) => (
            <Box key={label} mb="md">
              <Text size="xs" fw={600} mb={6} px="sm" style={{ color: muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
              <Stack gap={6}>
                {items.map(item => item.source === 'server' ? (
                  <Paper
                    key={item.n.id}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      background: item.n.read ? cardBg : unreadBg,
                      backdropFilter: 'blur(4px)',
                      borderColor,
                      cursor: item.n.post_id && onOpenPost ? 'pointer' : undefined,
                    }}
                    onClick={item.n.post_id && onOpenPost ? () => { markRead(item.n.id); onOpenPost(item.n.post_id!); } : undefined}
                  >
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      <UnstyledButton
                        onClick={(e) => { e.stopPropagation(); markRead(item.n.id); onViewProfile?.(item.n.actor_id); }}
                        aria-label={item.n.actor?.username || t('someone', lang)}
                      >
                        {item.n.actor?.avatar_url ? (
                          <Avatar src={item.n.actor.avatar_url} alt={item.n.actor?.username || t('someone', lang)} radius="md" size={36} />
                        ) : (
                          <Avatar radius="md" size={36} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
                            {(item.n.actor?.username?.[0] || '?').toUpperCase()}
                          </Avatar>
                        )}
                      </UnstyledButton>
                      <Group gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" style={{ color: muted }}>
                          <UnstyledButton
                            onClick={(e) => { e.stopPropagation(); markRead(item.n.id); onViewProfile?.(item.n.actor_id); }}
                            style={{ fontWeight: 700, color: nameFg }}
                          >
                            {item.n.actor?.username || t('someone', lang)}
                          </UnstyledButton>{' '}{renderText(item.n)}
                        </Text>
                        <Group gap={6}>
                          <Group gap={4} style={{ color: muted }}>
                            {serverIcon(item.n.type)}
                            <Text size="xs" style={{ color: muted }}>{timeAgo(item.n.created_at, lang)}</Text>
                          </Group>
                          {!item.n.read && <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mantine-color-cyan-6)', flexShrink: 0 }} />}
                        </Group>
                      </Group>
                    </Group>
                  </Paper>
                ) : (
                  <Paper
                    key={item.n.id}
                    p="sm"
                    radius="md"
                    withBorder
                    onClick={() => system.markRead(item.n.id)}
                    style={{ background: item.n.read ? cardBg : unreadBg, backdropFilter: 'blur(4px)', borderColor }}
                  >
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      <Box
                        w={36}
                        h={36}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          borderRadius: 'var(--mantine-radius-md)',
                          background: isDark ? 'rgba(6,182,212,0.12)' : 'var(--mantine-color-cyan-1)',
                        }}
                      >
                        {systemIcon(item.n.type)}
                      </Box>
                      <Group gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={600} style={{ color: nameFg }}>
                          {t(item.n.titleKey, lang)}
                          <Text component="span" size="sm" fw={400} style={{ color: muted }}> — {systemBody(item.n)}</Text>
                        </Text>
                        <Group gap={6}>
                          <Text size="xs" style={{ color: muted }}>{timeAgo(item.n.created_at, lang)}</Text>
                          {!item.n.read && <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mantine-color-cyan-6)', flexShrink: 0 }} />}
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
