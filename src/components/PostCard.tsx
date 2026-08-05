import { useState, memo } from 'react';
import type { Post } from '../types';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { CommentSection } from './CommentSection';
import { FollowButton } from './FollowButton';
import { showToast } from './Toast';
import { ProductView } from './ProductView';
import { Paper, Text, Group, Avatar, UnstyledButton, Box, ActionIcon, Image, Textarea, Button, Modal } from '@mantine/core';
import {
  IconPin,
  IconHeart,
  IconMessageCircle,
  IconBookmark,
  IconRepeat,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconBuildingStore,
} from '@tabler/icons-react';

interface PostCardProps {
  post: Post;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  isFollowing?: boolean;
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onEdit?: (postId: string, content: string) => Promise<void>;
  onFollow?: (userId: string) => Promise<void>;
  onUnfollow?: (userId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
  onComment?: (userId: string, postId: string) => void;
  onHashtagClick?: (tag: string) => void;
  onBookmark?: (postId: string) => Promise<void>;
  onUnbookmark?: (postId: string) => Promise<void>;
  onQuote?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
}

function renderContent(text: string, isDark: boolean, onHashtagClick?: (tag: string) => void) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (/^#\w+$/.test(part)) {
      return (
        <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHashtagClick?.(part.slice(1).toLowerCase()); }}
          className="hover:underline"
          style={{ display: 'inline', fontWeight: 500, color: isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)' }}>
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function PostImages({ images }: { images: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const count = images.length;
  if (count === 0) return null;

  if (count === 1) {
    return (
      <Image src={images[0]} alt="" mt="sm" mb={4} radius="md" fit="cover" w="100%" style={{ maxHeight: 320 }} />
    );
  }

  return (
    <Box pos="relative" mt="sm" mb={4} style={{ overflow: 'hidden' }}>
      <Image src={images[currentIdx]} alt="" radius="md" fit="cover" w="100%" style={{ maxHeight: 320 }} />
      {count > 1 && (
        <>
          <ActionIcon
            variant="transparent"
            onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => prev === 0 ? count - 1 : prev - 1); }}
            aria-label="Previous image"
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon
            variant="transparent"
            onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev + 1) % count); }}
            aria-label="Next image"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {images.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === currentIdx ? 'white' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        </>
      )}
    </Box>
  );
}

function QuotedPost({ post, isDark, onHashtagClick }: { post: Post; isDark: boolean; onHashtagClick?: (tag: string) => void }) {
  const avatarGradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';
  return (
    <Paper p="sm" mt="sm" radius="md" withBorder
      style={{ background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' }}>
      <Group gap="xs" mb={4} align="center" wrap="nowrap">
        <Avatar size={20} radius="md" src={post.author?.avatar_url} style={{ backgroundImage: avatarGradient }}>
          {(post.author?.display_name?.[0] || post.author?.username?.[0] || '?').toUpperCase()}
        </Avatar>
        <Text size="xs" fw={700}>{post.author?.display_name || post.author?.username || 'Unknown'}</Text>
        <Text size="xs" c="dimmed">@{post.author?.username || 'user'}</Text>
        <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>{timeAgo(post.created_at, 'en')}</Text>
      </Group>
      <Text size="xs" style={{ whiteSpace: 'pre-wrap', color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-7)' }}>
        {renderContent(post.content, isDark, onHashtagClick)}
      </Text>
    </Paper>
  );
}

export const PostCard = memo(function PostCard({ post, isDark, lang, currentUserId, username, isFollowing, onLike, onUnlike, onDelete, onEdit, onFollow, onUnfollow, onViewProfile, onComment, onHashtagClick, onBookmark, onUnbookmark, onQuote, onPostClick }: PostCardProps) {
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const isOwner = post.user_id === currentUserId;
  const liked = post.liked_by_me ?? false;
  const likesCount = post.likes_count ?? 0;
  const bookmarked = post.bookmarked_by_me ?? false;

  const postImages = (post.images?.filter(Boolean)) || (post.image_url ? [post.image_url] : []);

  async function handleEdit() {
    if (!onEdit || !editContent.trim() || editSubmitting) return;
    setEditSubmitting(true);
    try {
      await onEdit(post.id, editContent.trim());
      setEditing(false);
      showToast({ id: 'post-edited', title: '', body: 'Post updated' });
    } catch {
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleLike() {
    setLiking(true);
    try {
      if (liked) {
        await onUnlike(post.id);
      } else {
        await onLike(post.id);
      }
    } finally {
      setLiking(false);
    }
  }

  async function handleToggleBookmark() {
    if (bookmarked) {
      await onUnbookmark?.(post.id);
    } else {
      await onBookmark?.(post.id);
    }
  }

  const avatarGradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';
  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      style={{
        background: post.pinned
          ? (isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.06)')
          : (isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)'),
        borderColor: post.pinned ? 'var(--mantine-color-cyan-7)' : undefined,
        backdropFilter: 'blur(4px)',
      }}
    >
      {post.pinned && (
        <Group gap={6} mb="xs" align="center" style={{ color: isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)' }}>
          <IconPin size={14} />
          <Text size="xs" fw={500}>{t('pinnedPost', lang)}</Text>
        </Group>
      )}
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <UnstyledButton onClick={() => onViewProfile?.(post.user_id)} aria-label={`View ${post.author?.username || 'user'}'s profile`}>
          <Avatar size={36} radius="md" src={post.author?.avatar_url} style={{ backgroundImage: avatarGradient, flexShrink: 0 }}>
            {(post.author?.display_name?.[0] || post.author?.username?.[0] || '?').toUpperCase()}
          </Avatar>
        </UnstyledButton>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={1} align="center" wrap="wrap">
            <UnstyledButton onClick={() => onViewProfile?.(post.user_id)} aria-label={`View ${post.author?.display_name || 'user'}'s profile`}>
              <Text fw={700} size="sm" className="hover:underline" style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>
                {post.author?.display_name || post.author?.username || 'Unknown'}
              </Text>
            </UnstyledButton>
            <Text size="xs" style={{ color: mutedColor }}>@{post.author?.username || 'user'}</Text>
            {onFollow && onUnfollow && (
              <FollowButton
                userId={post.user_id}
                currentUserId={currentUserId}
                isFollowing={isFollowing ?? false}
                isDark={isDark}
                onFollow={onFollow}
                onUnfollow={onUnfollow}
              />
            )}
            <Text size="xs" style={{ color: mutedColor }}>
              {timeAgo(post.created_at, lang)}
            </Text>
          </Group>

          {editing ? (
            <Box mb="sm">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value.slice(0, 500))}
                autoFocus
                minRows={3}
                maxLength={500}
              />
              <Group gap="sm" mt="xs">
                <Button
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'emerald' }}
                  size="xs"
                  onClick={handleEdit}
                  loading={editSubmitting}
                  disabled={!editContent.trim() || editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => { setEditing(false); setEditContent(post.content); }}
                >
                  Cancel
                </Button>
              </Group>
            </Box>
          ) : (
            <>
              <Text size="sm" mb="xs" style={{ whiteSpace: 'pre-wrap', color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-7)' }} onClick={() => onPostClick?.(post.id)}>
                {renderContent(post.content, isDark, onHashtagClick)}
              </Text>
              {postImages.length > 0 && <Box onClick={() => onPostClick?.(post.id)}><PostImages images={postImages} /></Box>}
              {post.quoted_post && <Box onClick={(e) => { e.stopPropagation(); onPostClick?.(post.quoted_post!.id); }}><QuotedPost post={post.quoted_post} isDark={isDark} onHashtagClick={onHashtagClick} /></Box>}
            </>
          )}

          {post.product_name && post.product_id && (
            <UnstyledButton onClick={() => setViewProductId(post.product_id!)} mb="sm"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: 'var(--mantine-radius-md)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-cyan-1)',
                color: isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)',
              }}>
              <IconBuildingStore size={14} />
              {post.product_name}
            </UnstyledButton>
          )}

          {viewProductId && (
            <ProductView productId={viewProductId} onClose={() => setViewProductId(null)} isDark={isDark} lang={lang} />
          )}

          <Group gap="sm">
            <UnstyledButton
              onClick={handleToggleLike}
              disabled={liking}
              aria-label={liked ? 'Unlike post' : 'Like post'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: liked ? 'var(--mantine-color-orange-6)' : mutedColor }}
            >
              <IconHeart size={20} fill={liked ? 'currentColor' : 'none'} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </UnstyledButton>

            <UnstyledButton
              onClick={() => setShowComments(!showComments)}
              aria-label="Toggle comments"
              aria-expanded={showComments}
              aria-controls={`comment-section-${post.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: showComments ? (isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)') : mutedColor }}
            >
              <IconMessageCircle size={18} />
              {(post.comments_count ?? 0) > 0 && <span>{post.comments_count}</span>}
            </UnstyledButton>

            {onBookmark && (
              <UnstyledButton
                onClick={handleToggleBookmark}
                aria-label={bookmarked ? t('bookmarked', lang) : t('bookmark', lang)}
                style={{ color: bookmarked ? (isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)') : mutedColor }}
              >
                <IconBookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
              </UnstyledButton>
            )}

            {onQuote && !isOwner && (
              <UnstyledButton
                onClick={() => onQuote(post.id)}
                aria-label={t('sharePost', lang)}
                style={{ color: mutedColor }}
              >
                <IconRepeat size={18} />
              </UnstyledButton>
            )}

            {isOwner && (
              <Group gap={6} ml="auto">
                {onEdit && (
                  <ActionIcon variant="subtle" onClick={() => { setEditing(true); setEditContent(post.content); }} aria-label="Edit post">
                    <IconEdit size={16} />
                  </ActionIcon>
                )}
                {onDelete && (
                  <ActionIcon variant="subtle" color="red" onClick={() => setShowConfirm(true)} aria-label="Delete post">
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>
            )}
          </Group>

          {showComments && (
            <CommentSection
              postId={post.id}
              postUserId={post.user_id}
              isDark={isDark}
              lang={lang}
              currentUserId={currentUserId}
              username={username}
              onComment={onComment}
            />
          )}
        </Box>
      </Group>

      <Modal opened={showConfirm} onClose={() => setShowConfirm(false)} title={t('confirmDeletePost', lang)} centered size="xs">
        <Group justify="flex-end" gap="sm">
          <Button color="red" onClick={async () => { await onDelete?.(post.id); setShowConfirm(false); }}>{t('delete', lang)}</Button>
          <Button variant="default" onClick={() => setShowConfirm(false)}>{t('cancel', lang)}</Button>
        </Group>
      </Modal>
    </Paper>
  );
});