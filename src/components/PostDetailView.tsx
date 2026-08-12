import { useState, useEffect, memo } from 'react';
import type { Post } from '../types';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { CommentSection } from './CommentSection';
import { ProductView } from './ProductView';
import { Text, Group, Avatar, UnstyledButton, ActionIcon, Image, Box, Textarea, Button, Modal } from '@mantine/core';
import { setFullscreenOpen } from '../utils/fullscreen';
import { IconHeart, IconBookmark, IconEdit, IconTrash, IconChevronLeft, IconChevronRight, IconBuildingStore, IconArrowLeft } from '@tabler/icons-react';
import { Lens, InteractiveHoverButton } from './magicui';

interface PostDetailViewProps {
  post: Post;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  onClose: () => void;
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  onUnbookmark?: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onEdit?: (postId: string, content: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
  onHashtagClick?: (tag: string) => void;
  onComment?: (userId: string, postId: string) => void;
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

const avatarGradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';

function PostDetailImages({ images }: { images: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const count = images.length;
  if (count === 0) return null;
  if (count === 1) {
    return (
      <Lens lensSize={170} className="w-full rounded-md" largeRadius={160}>
        <Image src={images[0]} alt="" radius="md" fit="cover" w="100%" mb="md" style={{ maxHeight: 384 }} />
      </Lens>
    );
  }
  return (
    <Box pos="relative" mb="md" style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
      <Lens lensSize={170} className="w-full rounded-md" largeRadius={160}>
        <Image src={images[currentIdx]} alt="" radius="md" fit="cover" w="100%" style={{ maxHeight: 384 }} />
      </Lens>
      {count > 1 && (
        <>
          <ActionIcon variant="transparent" onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => prev === 0 ? count - 1 : prev - 1); }} aria-label="Previous image"
            size="lg" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <IconChevronLeft size={20} />
          </ActionIcon>
          <ActionIcon variant="transparent" onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev + 1) % count); }} aria-label="Next image"
            size="lg" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <IconChevronRight size={20} />
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

function QuotedPostDetail({ post, isDark, onHashtagClick }: { post: Post; isDark: boolean; onHashtagClick?: (tag: string) => void }) {
  return (
    <Box p="sm" mb="md" style={{ background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)', border: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}`, borderRadius: 'var(--mantine-radius-md)' }}>
      <Group gap="xs" mb={4} align="center" wrap="nowrap">
        <Avatar size={20} radius="md" src={post.author?.avatar_url} style={{ backgroundImage: avatarGradient }}>
          {(post.author?.display_name?.[0] || post.author?.username?.[0] || '?').toUpperCase()}
        </Avatar>
        <Text size="xs" fw={700} style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>{post.author?.display_name || post.author?.username || 'Unknown'}</Text>
        <Text size="xs" c="dimmed">@{post.author?.username || 'user'}</Text>
        <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>{timeAgo(post.created_at, 'en')}</Text>
      </Group>
      <Text size="xs" style={{ whiteSpace: 'pre-wrap', color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-7)' }}>{renderContent(post.content, isDark, onHashtagClick)}</Text>
    </Box>
  );
}

export const PostDetailView = memo(function PostDetailView({ post, isDark, lang, currentUserId, username, onClose, onLike, onUnlike, onBookmark, onUnbookmark, onDelete, onEdit, onViewProfile, onHashtagClick, onComment, onPostClick }: PostDetailViewProps) {
  const [currentPost, setCurrentPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const isOwner = currentPost.user_id === currentUserId;
  const liked = currentPost.liked_by_me ?? false;
  const likesCount = currentPost.likes_count ?? 0;
  const bookmarked = currentPost.bookmarked_by_me ?? false;
  const postImages = (currentPost.images?.filter(Boolean)) || (currentPost.image_url ? [currentPost.image_url] : []);

  useEffect(() => {
    setFullscreenOpen(true);
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      setFullscreenOpen(false);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleToggleLike() {
    setLiking(true);
    try {
      if (liked) { await onUnlike(currentPost.id); setCurrentPost(p => ({ ...p, liked_by_me: false, likes_count: Math.max(0, (p.likes_count ?? 1) - 1) })); }
      else { await onLike(currentPost.id); setCurrentPost(p => ({ ...p, liked_by_me: true, likes_count: (p.likes_count ?? 0) + 1 })); }
    } finally { setLiking(false); }
  }

  async function handleToggleBookmark() {
    if (bookmarked) { await onUnbookmark?.(currentPost.id); setCurrentPost(p => ({ ...p, bookmarked_by_me: false })); }
    else { await onBookmark?.(currentPost.id); setCurrentPost(p => ({ ...p, bookmarked_by_me: true })); }
  }

  async function handleEdit() {
    if (!onEdit || !editContent.trim() || editSubmitting) return;
    setEditSubmitting(true);
    try {
      await onEdit(currentPost.id, editContent.trim());
      setCurrentPost(p => ({ ...p, content: editContent.trim() }));
      setEditing(false);
    } finally { setEditSubmitting(false); }
  }

  async function handleDelete() {
    await onDelete?.(currentPost.id);
    onClose();
  }

  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/20 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-5xl mx-auto my-0 sm:my-4 min-h-screen sm:min-h-0" onClick={e => e.stopPropagation()}>
        <div className={`flex flex-col sm:flex-row w-full sm:rounded-xl overflow-hidden min-h-screen sm:min-h-[90vh] backdrop-blur-sm ${isDark ? 'bg-[#111827]' : 'bg-white/80'}`}>
          <div className="flex-1 max-w-full sm:max-w-[55%] flex flex-col border-r-0 sm:border-r overflow-y-auto" style={{ borderColor: 'var(--mantine-color-gray-8)' }}>
            <Group justify="flex-start" gap="sm" p="sm" style={{ position: 'sticky', top: 0, zIndex: 10, background: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
              <InteractiveHoverButton type="button" onClick={onClose} icon={<IconArrowLeft size={16} />}>Back</InteractiveHoverButton>
              <Text size="sm" fw={700} style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>Post</Text>
            </Group>

            <Box px="md" pb="sm">
              <Group align="flex-start" gap="sm" mb="sm" wrap="nowrap">
                <UnstyledButton onClick={() => onViewProfile?.(currentPost.user_id)} style={{ flexShrink: 0, overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
                  <Avatar size={40} radius="md" src={currentPost.author?.avatar_url} style={{ backgroundImage: avatarGradient }}>
                    {(currentPost.author?.display_name?.[0] || currentPost.author?.username?.[0] || '?').toUpperCase()}
                  </Avatar>
                </UnstyledButton>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <UnstyledButton onClick={() => onViewProfile?.(currentPost.user_id)}>
                    <Text fw={700} size="sm" className="hover:underline" style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>{currentPost.author?.display_name || currentPost.author?.username || 'Unknown'}</Text>
                  </UnstyledButton>
                  <Text size="xs" c="dimmed">@{currentPost.author?.username || 'user'}</Text>
                </Box>
              </Group>

              <Text size="sm" mb="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>
                {renderContent(currentPost.content, isDark, onHashtagClick)}
              </Text>

              {postImages.length > 0 && <PostDetailImages images={postImages} />}
              {currentPost.quoted_post && (
                <Box onClick={() => onPostClick?.(currentPost.quoted_post!.id)} style={{ cursor: 'pointer' }}>
                  <QuotedPostDetail post={currentPost.quoted_post} isDark={isDark} onHashtagClick={onHashtagClick} />
                </Box>
              )}

              {editing && (
                <Box mb="md">
                  <Textarea value={editContent} onChange={e => setEditContent(e.target.value.slice(0, 500))} autoFocus minRows={3} maxLength={500} />
                  <Group gap="sm" mt="xs">
                    <Button variant="gradient" gradient={{ from: 'cyan', to: 'emerald' }} onClick={handleEdit} disabled={!editContent.trim() || editSubmitting} size="xs">
                      {editSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="default" size="xs" onClick={() => { setEditing(false); setEditContent(post.content); }}>Cancel</Button>
                  </Group>
                </Box>
              )}

              {currentPost.product_name && currentPost.product_id && (
                <UnstyledButton onClick={() => setViewProductId(currentPost.product_id!)} mb="md"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--mantine-radius-md)', fontSize: 12, fontWeight: 500, background: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-cyan-1)', color: isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)' }}>
                  <IconBuildingStore size={14} />
                  {currentPost.product_name}
                </UnstyledButton>
              )}
              {viewProductId && <ProductView productId={viewProductId} onClose={() => setViewProductId(null)} isDark={isDark} lang={lang} />}

              <Box py="sm" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}` }}>
                <Text size="sm" c="dimmed">
                  {new Date(currentPost.created_at).toLocaleString(lang === 'en' ? 'en-US' : lang, { dateStyle: 'long', timeStyle: 'short' })}
                </Text>
              </Box>

              <Box py="sm" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}` }}>
                <Group gap="xl" style={{ fontSize: 14 }}>
                  <Text c="dimmed" component="span"><strong style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>{likesCount}</strong> Likes</Text>
                  <Text c="dimmed" component="span"><strong style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>{currentPost.comments_count ?? 0}</strong> Comments</Text>
                </Group>
              </Box>

              <Group justify="space-around" py="sm" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}`, borderBottom: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}` }}>
                <UnstyledButton onClick={handleToggleLike} disabled={liking} aria-label={liked ? 'Unlike' : 'Like'}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--mantine-radius-md)', fontSize: 14, fontWeight: 500, color: liked ? 'var(--mantine-color-orange-6)' : mutedColor }}>
                  <IconHeart size={20} fill={liked ? 'currentColor' : 'none'} />
                  Like
                </UnstyledButton>

                {onBookmark && (
                  <UnstyledButton onClick={handleToggleBookmark} aria-label={bookmarked ? t('bookmarked', lang) : t('bookmark', lang)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--mantine-radius-md)', fontSize: 14, fontWeight: 500, color: bookmarked ? (isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)') : mutedColor }}>
                    <IconBookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
                    {bookmarked ? t('bookmarked', lang) : t('bookmark', lang)}
                  </UnstyledButton>
                )}

                {isOwner && (
                  <>
                    {onEdit && !editing && (
                      <UnstyledButton onClick={() => setEditing(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--mantine-radius-md)', fontSize: 14, fontWeight: 500, color: mutedColor }}>
                        <IconEdit size={20} />
                        Edit
                      </UnstyledButton>
                    )}
                    {onDelete && !editing && (
                      <UnstyledButton onClick={() => setShowConfirm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--mantine-radius-md)', fontSize: 14, fontWeight: 500, color: isDark ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-red-7)' }}>
                        <IconTrash size={20} />
                        Delete
                      </UnstyledButton>
                    )}
                  </>
                )}
              </Group>
            </Box>
          </div>

          <div className="flex-1 max-w-full sm:max-w-[45%] flex flex-col overflow-y-auto">
            <Box p="sm" style={{ position: 'sticky', top: 0, zIndex: 10, background: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
              <Text size="sm" fw={700} style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>Replies</Text>
            </Box>
            <Box px="md" pb="md" style={{ flex: 1 }}>
              <CommentSection
                postId={currentPost.id}
                postUserId={currentPost.user_id}
                isDark={isDark}
                lang={lang}
                currentUserId={currentUserId}
                username={username}
                onComment={onComment}
              />
            </Box>
          </div>
        </div>
      </div>

      <Modal opened={showConfirm} onClose={() => setShowConfirm(false)} title={t('confirmDeletePost', lang)} centered size="xs">
        <Group justify="flex-end" gap="sm">
          <Button color="red" onClick={handleDelete}>{t('delete', lang)}</Button>
          <Button variant="default" onClick={() => setShowConfirm(false)}>{t('cancel', lang)}</Button>
        </Group>
      </Modal>
    </div>
  );
});