import { useState } from 'react';
import { Button } from '@mantine/core';
import { IconCheck, IconUserPlus } from '@tabler/icons-react';
import { t } from '../utils/translations';

interface FollowButtonProps {
  userId: string;
  currentUserId: string;
  isFollowing: boolean;
  isDark: boolean;
  lang?: string;
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
}

export function FollowButton({ userId, currentUserId, isFollowing, isDark, lang = 'en', onFollow, onUnfollow }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  if (userId === currentUserId) return null;

  async function handleClick() {
    setLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow(userId);
      } else {
        await onFollow(userId);
      }
    } finally {
      setLoading(false);
    }
  }

  const gradient = 'linear-gradient(135deg, var(--mantine-color-cyan-7), var(--mantine-color-emerald-7))';
  const followingBg = isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)';
  const followingColor = isDark ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-gray-6)';
  const followingBorder = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      size="xs"
      radius="md"
      aria-pressed={isFollowing}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      variant={isFollowing ? 'default' : 'filled'}
      style={{
        opacity: loading ? 0.5 : 1,
        ...(isFollowing
          ? { background: followingBg, color: followingColor, border: `1px solid ${followingBorder}` }
          : { background: gradient, color: '#fff' }),
      }}
      styles={isFollowing ? {
        root: {
          '&:hover': {
            background: followingBg,
            color: 'var(--mantine-color-red-4)',
            border: `1px solid ${isDark ? 'rgba(239,68,68,0.5)' : 'var(--mantine-color-red-3)'}`,
          },
        },
      } : undefined}
    >
      {loading ? '...' : isFollowing ? <><IconCheck size={12} /> {t('following', lang)}</> : <><IconUserPlus size={12} /> {t('follow', lang)}</>}
    </Button>
  );
}