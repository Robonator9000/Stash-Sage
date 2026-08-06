import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Box, Text, Button, Paper, Stack, Group } from '@mantine/core';
import { IconHash, IconTrendingUp } from '@tabler/icons-react';

const TRENDING_CACHE_TTL = 60 * 1000;
let cachedTrendingTags: string[] | null = null;
let cachedTrendingAt = 0;

interface TrendsWidgetProps {
  isDark: boolean;
  activeHashtag?: string | null;
  onHashtagClick?: (tag: string) => void;
}

export function TrendsWidget({ isDark, activeHashtag, onHashtagClick }: TrendsWidgetProps) {
  const [tags, setTags] = useState<string[]>(cachedTrendingTags || []);

  useEffect(() => {
    const now = Date.now();
    if (cachedTrendingTags && now - cachedTrendingAt < TRENDING_CACHE_TTL) {
      setTags(cachedTrendingTags);
      return;
    }
    supabase.from('post_hashtags').select('tag, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach(h => { counts[h.tag] = (counts[h.tag] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
        cachedTrendingTags = sorted;
        cachedTrendingAt = Date.now();
        setTags(sorted);
      });
  }, []);

  if (tags.length === 0) return null;

  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : '#fff';
  const borderColor = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';
  const headerText = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const textColor = isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-6)';
  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-5)';
  const hoverBg = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)';
  const activeColor = isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)';

  return (
    <Paper
      radius="md"
      style={{ background: cardBg, border: `1px solid ${borderColor}`, overflow: 'hidden' }}
    >
      <Box px="md" py="sm" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <Group gap={6} wrap="nowrap">
          <IconTrendingUp size={16} style={{ color: activeColor }} />
          <Text fw={700} size="sm" style={{ color: headerText }}>
            Trends for you
          </Text>
        </Group>
      </Box>
      <Stack gap={4} p="xs">
        {tags.map(tag => {
          const isActive = activeHashtag === tag;
          return (
            <Button
              key={tag}
              fullWidth
              variant="subtle"
              onClick={() => onHashtagClick?.(tag)}
              style={{ height: 'auto', justifyContent: 'flex-start', padding: '4px 8px' }}
              styles={{
                label: { width: '100%', justifyContent: 'flex-start' },
                root: {
                  borderRadius: 'var(--mantine-radius-md)',
                  background: isActive ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                  '&:hover': { background: isActive ? 'rgba(34, 211, 238, 0.2)' : hoverBg },
                },
              }}
            >
              <Stack gap={0} style={{ width: '100%' }}>
                <Text size="xs" fw={500} style={{ color: isActive ? activeColor : mutedColor }}>
                  Trending
                </Text>
                <Group gap={4} wrap="nowrap">
                  <IconHash size={14} style={{ color: isActive ? activeColor : textColor }} />
                  <Text fw={600} size="sm" style={{ color: isActive ? activeColor : textColor }}>
                    {tag}
                  </Text>
                </Group>
              </Stack>
            </Button>
          );
        })}
      </Stack>
    </Paper>
  );
}