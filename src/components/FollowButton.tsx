import { useState } from 'react';

interface FollowButtonProps {
  userId: string;
  currentUserId: string;
  isFollowing: boolean;
  isDark: boolean;
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
}

export function FollowButton({ userId, currentUserId, isFollowing, isDark, onFollow, onUnfollow }: FollowButtonProps) {
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

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
        loading ? 'opacity-50' : ''
      } ${
        isFollowing
          ? isDark
            ? 'bg-midnight text-mist border border-edge hover:border-red-500/50 hover:text-red-400'
            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-500'
          : 'bg-gradient-to-r from-cyanx to-emera text-white hover:from-cyanx-dark hover:to-emera-dark'
      }`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
