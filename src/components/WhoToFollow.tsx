import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Paper, Stack, Group, Text, Box, Button, Avatar, ActionIcon } from '@mantine/core';
import { IconUserPlus } from '@tabler/icons-react';

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

  const cardBg = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255,255,255,0.7)';
  const borderColor = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';
  const headerText = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const frostText = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-5)';
  const gradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';
  const accentColor = isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)';

  return (
    <Paper
      radius="md"
      style={{ background: cardBg, border: `1px solid ${borderColor}`, overflow: 'hidden' }}
    >
      <Box px="md" py="sm" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <Group gap={6} wrap="nowrap">
          <IconUserPlus size={16} style={{ color: accentColor }} />
          <Text fw={700} size="sm" style={{ color: headerText }}>
            Who to follow
          </Text>
        </Group>
      </Box>
      <Stack gap={4} p="xs">
        {suggestions.map(u => (
          <Group key={u.user_id} gap="sm" wrap="nowrap" p="xs" style={{ alignItems: 'center' }}>
            <ActionIcon
              variant="subtle"
              radius="md"
              size={32}
              onClick={() => onViewProfile?.(u.user_id)}
              style={{ padding: 0, overflow: 'hidden', background: u.avatar_url ? 'transparent' : gradient }}
            >
              <Avatar
                src={u.avatar_url || undefined}
                radius="md"
                size={32}
                color="cyan"
                style={{ background: 'transparent', fontWeight: 700, fontSize: 12, color: '#fff' }}
              >
                {(u.display_name?.[0] || u.username?.[0] || '?').toUpperCase()}
              </Avatar>
            </ActionIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Button
                variant="subtle"
                onClick={() => onViewProfile?.(u.user_id)}
                style={{ height: 'auto', padding: 0, marginBottom: -2 }}
                styles={{ label: { display: 'block', width: '100%' } }}
              >
                <Text size="sm" fw={600} truncate style={{ color: frostText }}>
                  {u.display_name || u.username}
                </Text>
              </Button>
              <Text size="xs" truncate style={{ color: mutedColor }}>
                @{u.username}
              </Text>
            </Box>
            <FollowButtonSmall userId={u.user_id} currentUserId={currentUserId} isDark={isDark} />
          </Group>
        ))}
      </Stack>
    </Paper>
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

  const gradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      size="xs"
      radius="md"
      style={{
        opacity: loading ? 0.5 : 1,
        background: isFollowing ? 'transparent' : gradient,
        color: isFollowing
          ? isDark ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-gray-6)'
          : '#fff',
        border: isFollowing
          ? `1px solid ${isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)'}`
          : 'none',
      }}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}