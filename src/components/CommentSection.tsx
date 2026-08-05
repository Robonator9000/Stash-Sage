import { useState, useEffect, useCallback, memo } from 'react';
import type { PostComment } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { Box, Text, Group, Avatar, UnstyledButton, ActionIcon, TextInput, Skeleton, Stack, Loader } from '@mantine/core';
import { IconHeart, IconTrash, IconSend, IconX } from '@tabler/icons-react';

interface CommentSectionProps {
  postId: string;
  postUserId: string;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  onComment?: (userId: string, postId: string) => void;
}

const avatarGradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';

const CommentItem = memo(function CommentItem({ comment, depth = 0, isDark, lang, currentUserId, onReply, onDelete, onLike, onUnlike }: {
  comment: PostComment; depth?: number; isDark: boolean; lang: string; currentUserId: string;
  onReply: (id: string, username: string) => void; onDelete: (id: string) => void;
  onLike: (id: string) => Promise<void>; onUnlike: (id: string) => Promise<void>;
}) {
  const isOwner = comment.user_id === currentUserId;
  const liked = comment.liked_by_me ?? false;
  const likesCount = comment.likes_count ?? 0;
  const [liking, setLiking] = useState(false);

  async function handleToggleLike() {
    if (liking) return;
    setLiking(true);
    try {
      if (liked) { await onUnlike(comment.id); } else { await onLike(comment.id); }
    } finally { setLiking(false); }
  }

  return (
    <div role="listitem" style={{ marginLeft: depth > 0 ? 24 : 0, marginTop: depth > 0 ? 8 : 12 }}>
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <Avatar size={24} radius="md" color="cyan" style={{ backgroundImage: avatarGradient, flexShrink: 0 }}>
          {(comment.author?.username?.[0] || '?').toUpperCase()}
        </Avatar>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" align="center">
            <Text fw={700} size="xs" style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>
              {comment.author?.username || 'Unknown'}
            </Text>
            <Text size="xs" c="dimmed">
              {timeAgo(comment.created_at, lang)}
            </Text>
          </Group>
          <Text size="sm" style={{ color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-7)' }}>
            {comment.content}
          </Text>
          <Group gap="sm" mt={4}>
            <UnstyledButton
              onClick={handleToggleLike}
              disabled={liking}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: liked ? 'var(--mantine-color-orange-6)' : (isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)') }}
            >
              <IconHeart size={14} fill={liked ? 'currentColor' : 'none'} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </UnstyledButton>
            {depth < 2 && (
              <UnstyledButton
                onClick={() => onReply(comment.id, comment.author?.username || 'Unknown')}
                style={{ fontSize: 12, fontWeight: 500, color: isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)' }}
              >
                {t('reply', lang)}
              </UnstyledButton>
            )}
            {isOwner && (
              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(comment.id)} aria-label="Delete comment">
                <IconTrash size={14} />
              </ActionIcon>
            )}
          </Group>
        </Box>
      </Group>
      {comment.replies && comment.replies.length > 0 && (
        <div role="list">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} isDark={isDark} lang={lang} currentUserId={currentUserId}
              onReply={onReply} onDelete={onDelete} onLike={onLike} onUnlike={onUnlike} />
          ))}
        </div>
      )}
    </div>
  );
});

export function CommentSection({ postId, postUserId, isDark, lang, currentUserId, username, onComment }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const buildThread = useCallback((flat: PostComment[]): PostComment[] => {
    const map = new Map<string, PostComment>();
    const roots: PostComment[] = [];
    for (const c of flat) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of flat) {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const commentIds = data.map(c => c.id);

    const [profilesResult, likesResult, myLikesResult] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
      supabase.from('comment_likes').select('comment_id').in('comment_id', commentIds),
      currentUserId ? supabase.from('comment_likes').select('comment_id').eq('user_id', currentUserId).in('comment_id', commentIds) : { data: [] },
    ]);

    const profileMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));

    const likesCountMap = new Map<string, number>();
    for (const like of (likesResult.data || [])) {
      likesCountMap.set(like.comment_id, (likesCountMap.get(like.comment_id) || 0) + 1);
    }

    const myLikesSet = new Set((myLikesResult.data || []).map(l => l.comment_id));

    const enriched = data.map(c => ({
      ...c,
      author: {
        username: profileMap.get(c.user_id)?.display_name || 'Unknown',
        avatar_url: profileMap.get(c.user_id)?.avatar_url,
      },
      likes_count: likesCountMap.get(c.id) || 0,
      liked_by_me: myLikesSet.has(c.id),
    }));

    setComments(buildThread(enriched));
    setLoading(false);
  }, [postId, buildThread, currentUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit() {
    const trimmed = newComment.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const { data, error: insertError } = await supabase.from('post_comments').insert({
      user_id: currentUserId,
      post_id: postId,
      content: trimmed,
      parent_id: replyingTo?.id || null,
    }).select('*').single();

    if (insertError || !data) {
      setSubmitting(false);
      setError(insertError?.message || 'Failed to post comment');
      return;
    }

    setNewComment('');
    setReplyingTo(null);
    setSubmitting(false);
    onComment?.(postUserId, postId);
    fetchComments();
  }

  async function handleDelete(commentId: string) {
    const { error: delError } = await supabase.from('post_comments').delete().eq('id', commentId).eq('user_id', currentUserId);
    if (delError) {
      setError(delError.message);
      return;
    }
    fetchComments();
  }

  async function handleLikeComment(commentId: string) {
    await supabase.from('comment_likes').insert({ user_id: currentUserId, comment_id: commentId }).then(undefined, () => {});
    setComments(prev => {
      const updateLikes = (cmts: PostComment[]): PostComment[] =>
        cmts.map(c => c.id === commentId ? { ...c, likes_count: (c.likes_count ?? 0) + 1, liked_by_me: true } : { ...c, replies: c.replies ? updateLikes(c.replies) : c.replies });
      return updateLikes(prev);
    });
  }

  async function handleUnlikeComment(commentId: string) {
    await supabase.from('comment_likes').delete().eq('user_id', currentUserId).eq('comment_id', commentId).then(undefined, () => {});
    setComments(prev => {
      const updateLikes = (cmts: PostComment[]): PostComment[] =>
        cmts.map(c => c.id === commentId ? { ...c, likes_count: Math.max(0, (c.likes_count ?? 1) - 1), liked_by_me: false } : { ...c, replies: c.replies ? updateLikes(c.replies) : c.replies });
      return updateLikes(prev);
    });
  }

  return (
    <Box id={`comment-section-${postId}`} mt="sm" pt="xs" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}` }}>
      {loading && (
        <Stack gap="sm">
          {[1, 2].map(i => (
            <Group align="flex-start" gap="sm" wrap="nowrap" key={i}>
              <Skeleton width={24} height={24} radius="md" />
              <Box style={{ flex: 1 }}>
                <Skeleton height={10} width={64} radius="md" mb={4} />
                <Skeleton height={10} width="75%" radius="md" />
              </Box>
            </Group>
          ))}
        </Stack>
      )}

      {error && (
        <Text size="xs" c="red">{error}</Text>
      )}

      {!loading && !error && comments.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="sm">
          {t('writeComment', lang)}
        </Text>
      )}

      <div role="list">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} isDark={isDark} lang={lang} currentUserId={currentUserId}
            onReply={(id, username) => setReplyingTo({ id, username })} onDelete={handleDelete}
            onLike={handleLikeComment} onUnlike={handleUnlikeComment} />
        ))}
      </div>

      {replyingTo && (
        <Group gap="sm" mt="xs" px="sm" py={4} style={{ borderRadius: 'var(--mantine-radius-md)', background: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-1)' }}>
          <Text size="xs" style={{ color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-6)' }}>
            {t('replyTo', lang)} <span style={{ fontWeight: 600 }}>{replyingTo.username}</span>
          </Text>
          <UnstyledButton onClick={() => setReplyingTo(null)} style={{ marginLeft: 'auto' }} aria-label="Cancel reply">
            <IconX size={12} />
          </UnstyledButton>
        </Group>
      )}

      <Group gap="sm" mt="sm" wrap="nowrap">
        <Avatar size={24} radius="md" color="cyan" style={{ backgroundImage: avatarGradient, flexShrink: 0 }}>
          {(username[0] || '?').toUpperCase()}
        </Avatar>
        <TextInput
          id="comment-input"
          name="comment"
          value={newComment}
          onChange={e => setNewComment(e.target.value.slice(0, 500))}
          placeholder={replyingTo ? `${t('replyTo', lang)} ${replyingTo.username}...` : t('writeComment', lang)}
          style={{ flex: 1 }}
          radius="md"
        />
        <ActionIcon
          variant="gradient"
          gradient={{ from: 'cyan', to: 'emerald' }}
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          aria-label="Submit comment"
          size="lg"
        >
          {submitting ? <Loader size={16} /> : <IconSend size={16} />}
        </ActionIcon>
      </Group>
    </Box>
  );
}