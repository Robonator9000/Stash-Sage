import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { Paper, Group, Text, ActionIcon, Avatar, ScrollArea, Loader, UnstyledButton, Box } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';

interface NotificationBellProps {
  isDark: boolean;
  lang: string;
  onViewProfile?: (userId: string) => void;
}

export function NotificationBell({ isDark, lang, onViewProfile }: NotificationBellProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const headerFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const bodyFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const hoverBg = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)';
  const panelBg = isDark ? 'var(--mantine-color-dark-8)' : '#fff';
  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const unreadRowBg = isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.08)';

  return (
    <Box ref={ref} style={{ position: 'relative' }}>
      <ActionIcon
        onClick={() => setOpen(!open)}
        variant="subtle"
        color="gray"
        size="lg"
        radius="md"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <Paper
            radius="xl"
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              height: 18,
              minWidth: 18,
              padding: '0 3px',
              background: 'linear-gradient(90deg, var(--mantine-color-cyan-6), var(--mantine-color-emerald-6))',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Paper>
        )}
      </ActionIcon>

      {open && (
        <Paper
          radius="md"
          withBorder
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 320,
            maxWidth: '80vw',
            maxHeight: 384,
            overflow: 'hidden',
            zIndex: 50,
            background: panelBg,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          <Group px="md" py="sm" justify="space-between" wrap="nowrap" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <Text size="sm" fw={700} style={{ color: headerFg }}>Notifications</Text>
            {unreadCount > 0 && (
              <UnstyledButton
                onClick={markAllRead}
                aria-label="Mark all notifications as read"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--mantine-color-cyan-6)' }}
              >
                Mark all read
              </UnstyledButton>
            )}
          </Group>

          <ScrollArea style={{ height: 320 }} type="auto">
            {loading && (
              <Group justify="center" p="xl">
                <Loader size="sm" color="cyan" />
              </Group>
            )}

            {!loading && notifications.length === 0 && (
              <Text ta="center" size="sm" p="xl" style={{ color: muted }}>
                No notifications yet
              </Text>
            )}

            {notifications.map(n => (
              <UnstyledButton
                key={n.id}
                onClick={() => { markRead(n.id); onViewProfile?.(n.actor_id); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  background: !n.read ? unreadRowBg : 'transparent',
                  color: bodyFg,
                  borderBottom: `1px solid ${borderColor}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : unreadRowBg; }}
              >
                {n.actor?.avatar_url ? (
                  <Avatar src={n.actor.avatar_url} alt={n.actor?.username || 'User'} radius="md" size={32} />
                ) : (
                  <Avatar radius="md" size={32} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
                    {(n.actor?.username?.[0] || '?').toUpperCase()}
                  </Avatar>
                )}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" style={{ color: bodyFg }}>
                    {n.type === 'like' && <><span style={{ fontWeight: 600 }}>{n.actor?.username}</span> liked your post</>}
                    {n.type === 'comment' && <><span style={{ fontWeight: 600 }}>{n.actor?.username}</span> commented on your post</>}
                    {n.type === 'follow' && <><span style={{ fontWeight: 600 }}>{n.actor?.username}</span> followed you</>}
                    {n.type === 'new_listing' && <><span style={{ fontWeight: 600 }}>{n.actor?.username}</span> listed <span style={{ fontWeight: 500 }}>{n.listing_title || 'something'}</span> for sale</>}
                    {n.type === 'listing_sold' && <><span style={{ fontWeight: 600 }}>{n.actor?.username}</span> marked <span style={{ fontWeight: 500 }}>{n.listing_title || 'a listing'}</span> as sold</>}
                  </Text>
                  <Text size="xs" style={{ marginTop: 2, color: muted }}>
                    {timeAgo(n.created_at, lang)}
                  </Text>
                </Box>
                {!n.read && (
                  <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mantine-color-cyan-6)', flexShrink: 0, marginTop: 6 }} />
                )}
              </UnstyledButton>
            ))}
          </ScrollArea>
        </Paper>
      )}
    </Box>
  );
}