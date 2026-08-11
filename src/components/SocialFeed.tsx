import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import type { Post, Product, Profile } from '../types';
import { supabase, uploadPostImages } from '../utils/supabase';
import { t } from '../utils/translations';
import { PostCard } from './PostCard';
import { CreatePostCard } from './CreatePostCard';
import { PostDetailView } from './PostDetailView';
import { showToast } from './Toast';
import { SegmentedControl, Paper, Text, Group, UnstyledButton, ActionIcon, Textarea, Button, Loader, Skeleton, Stack, Box } from '@mantine/core';
import { IconBookmark, IconX } from '@tabler/icons-react';
import { getProfiles } from '../utils/profileCache';
import { BlurFade, ShineBorder, BorderBeam } from './magicui';
import { createPortal } from 'react-dom';

const TRENDING_CACHE_TTL = 60 * 1000;
let cachedTrendingTags: string[] | null = null;
let cachedTrendingAt = 0;

interface SocialFeedProps {
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  products: Product[];
  profile?: Profile;
  onViewProfile?: (userId: string) => void;
  viewPostId?: string | null;
  onViewPost?: (postId: string) => void;
  onClosePost?: () => void;
  activeHashtag?: string | null;
  onHashtagClick?: (tag: string) => void;
}

const PAGE_SIZE = 10;
let socialFeedChannelCounter = 0;

const feedOptions = [
  { value: 'latest' as const, label: 'Latest' },
  { value: 'following' as const, label: 'Following' },
  { value: 'trending' as const, label: 'Trending' },
  { value: 'bookmarked' as const, label: (<Group gap={4} wrap="nowrap"><IconBookmark size={12} />Bookmarked</Group>) },
];

export const SocialFeed = memo(function SocialFeed({ isDark, lang, currentUserId, username, products, profile, onViewProfile, viewPostId, onViewPost, onClosePost, activeHashtag: externalHashtag, onHashtagClick: externalHashtagClick }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'latest' | 'following' | 'trending' | 'bookmarked'>('latest');
  const [submitting, setSubmitting] = useState(false);
  const [activeHashtagInternal, setActiveHashtagInternal] = useState<string | null>(null);
  const activeHashtag = externalHashtag ?? activeHashtagInternal;
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [quotePostId, setQuotePostId] = useState<string | null>(null);
  const [quoteContent, setQuoteContent] = useState('');
  const pageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  const enrichPosts = useCallback(async (rawPosts: Post[]): Promise<Post[]> => {
    if (rawPosts.length === 0) return [];

    const userIds = [...new Set(rawPosts.map(p => p.user_id))];
    const postIds = rawPosts.map(p => p.id);
    const quoteIds = rawPosts.filter(p => p.quoted_post_id).map(p => p.quoted_post_id!);

    let quotePostMapTmp = new Map<string, Post>();
    const quoteUserIds: string[] = [];
    if (quoteIds.length > 0) {
      const { data: quotePosts } = await supabase.from('posts').select('*').in('id', quoteIds);
      if (quotePosts && quotePosts.length > 0) {
        quoteUserIds.push(...[...new Set(quotePosts.map(p => p.user_id))]);
        for (const qp of quotePosts) {
          quotePostMapTmp.set(qp.id, qp);
        }
      }
    }

    const [profileMap, likesResult, followsResult, commentsResult, bookmarksResult] = await Promise.all([
      getProfiles([...userIds, ...quoteUserIds]),
      supabase.from('post_likes').select('id, user_id, post_id').in('post_id', postIds),
      supabase.from('follows').select('following_id').eq('follower_id', currentUserId).in('following_id', userIds),
      supabase.from('post_comments').select('id, post_id').in('post_id', postIds),
      currentUserId ? supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds) : { data: [] },
    ]);
    const likesArray = likesResult.data || [];
    const likesCountMap = new Map<string, number>();
    const userLikesSet = new Set<string>();
    for (const like of likesArray) {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
      if (like.user_id === currentUserId) userLikesSet.add(like.post_id);
    }

    const commentsCountMap = new Map<string, number>();
    for (const c of (commentsResult.data || [])) {
      commentsCountMap.set(c.post_id, (commentsCountMap.get(c.post_id) || 0) + 1);
    }

    const followingSet = new Set((followsResult.data || []).map(f => f.following_id));
    const bookmarkSet = new Set((bookmarksResult.data || []).map(b => b.post_id));

    const quotePostMap = new Map<string, Post>();
    if (quoteIds.length > 0) {
      for (const [qid, qp] of quotePostMapTmp) {
        const qpProf = profileMap.get(qp.user_id);
        quotePostMap.set(qid, {
          ...qp,
          author: {
            username: qpProf?.username || 'User',
            display_name: qpProf?.display_name || 'User',
            avatar_url: qpProf?.avatar_url,
          },
        });
      }
    }

    return rawPosts.map(p => {
      const prof = profileMap.get(p.user_id);
      return {
      ...p,
      author: {
        username: prof?.username || 'User',
        display_name: prof?.display_name || 'User',
        avatar_url: prof?.avatar_url,
      },
      likes_count: likesCountMap.get(p.id) || 0,
      liked_by_me: userLikesSet.has(p.id),
      comments_count: commentsCountMap.get(p.id) || 0,
      is_following: followingSet.has(p.user_id),
      bookmarked_by_me: bookmarkSet.has(p.id),
      quoted_post: p.quoted_post_id ? quotePostMap.get(p.quoted_post_id) : undefined,
    };
  });
  }, [currentUserId]);

  const fetchPosts = useCallback(async (page: number, sort?: string) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('posts').select('*');

    if (sort === 'trending') {
      query = query.order('created_at', { ascending: false }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    } else if (sort === 'bookmarked') {
      if (!currentUserId) return [];
      const { data: bookmarks, count } = await supabase.from('bookmarks').select('post_id', { count: 'exact' }).eq('user_id', currentUserId).order('created_at', { ascending: false }).range(from, to);
      if (!bookmarks || bookmarks.length === 0) { setHasMore(false); return []; }
      const bIds = bookmarks.map(b => b.post_id);
      const { data } = await supabase.from('posts').select('*').in('id', bIds).order('created_at', { ascending: false });
      if (!data) return [];
      const remaining = (count ?? bookmarks.length) - (from + bookmarks.length);
      if (remaining <= 0) setHasMore(false);
      return enrichPosts(data);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error: fetchError } = await query.range(from, to);

    if (fetchError) {
      setError(fetchError.message);
      return [];
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      return [];
    }

    if (data.length < PAGE_SIZE) setHasMore(false);

    const enriched = await enrichPosts(data);

    if (sort === 'trending') {
      return enriched.sort((a, b) => {
        const now = Date.now();
        const aHours = (now - new Date(a.created_at).getTime()) / 3600000;
        const bHours = (now - new Date(b.created_at).getTime()) / 3600000;
        const aScore = ((a.likes_count ?? 0) * 3 + (a.comments_count ?? 0) * 2) / (1 + aHours / 24);
        const bScore = ((b.likes_count ?? 0) * 3 + (b.comments_count ?? 0) * 2) / (1 + bHours / 24);
        return bScore - aScore;
      });
    }

    return enriched;
  }, [enrichPosts]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    pageRef.current = 0;
    setHasMore(true);

    fetchPosts(0, feedFilter).then(enriched => {
      setPosts(enriched);
      setLoading(false);
    }).catch(console.error);

    socialFeedChannelCounter += 1;
    const id = socialFeedChannelCounter;
    const channel = supabase.channel(`social-feed-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        try {
          const newPost = payload.new as Post;
          if (newPost.user_id === currentUserId) return;
          const enriched = await enrichPosts([newPost]);
          setPosts(prev => {
            const next = [enriched[0], ...prev];
            const seen = new Set<string>();
            return next.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
          });
        } catch (e) { console.error('Realtime post error:', e); }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime social-feed channel error');
      });
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts, enrichPosts, currentUserId, feedFilter]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;

        fetchPosts(nextPage, feedFilter).then(enriched => {
          setPosts(prev => [...prev, ...enriched]);
          setLoadingMore(false);
        }).catch(console.error);
      }
    }, { rootMargin: '400px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPosts, feedFilter]);

  useEffect(() => {
    const now = Date.now();
    if (cachedTrendingTags && now - cachedTrendingAt < TRENDING_CACHE_TTL) {
      setTrendingTags(cachedTrendingTags);
      return;
    }
    supabase.from('post_hashtags').select('tag, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).then(({ data }) => {
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach(h => { counts[h.tag] = (counts[h.tag] || 0) + 1; });
      const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
      cachedTrendingTags = tags;
      cachedTrendingAt = Date.now();
      setTrendingTags(tags);
    });
  }, []);

  const notifyUser = useCallback(async (targetUserId: string, type: 'like' | 'comment' | 'follow' | 'mention', postId?: string) => {
    if (targetUserId === currentUserId) return;
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type,
      actor_id: currentUserId,
      post_id: postId || null,
    }).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
  }, [currentUserId]);

  const handleCreatePost = useCallback(async (content: string, productId?: string, productName?: string, imageFiles?: File[]) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let images: string[] | undefined;
      if (imageFiles && imageFiles.length > 0) {
        images = await uploadPostImages(currentUserId, imageFiles);
      }

      const { data, error: insertError } = await supabase.from('posts').insert({
        user_id: currentUserId,
        content,
        product_id: productId || null,
        product_name: productName || null,
        images: images || null,
      }).select('*').single();

      if (insertError || !data) {
        showToast({ id: 'post-error', title: t('somethingWentWrong', lang), body: insertError?.message || '' });
        return;
      }

      const tags = content.match(/#\w+/g);
      if (tags) {
        const uniqueTags = [...new Set(tags.map(t => t.toLowerCase()))];
        await supabase.from('post_hashtags').insert(uniqueTags.map(tag => ({ post_id: data.id, tag })));
      }

      const mentions = content.match(/@(\w+)/g);
      if (mentions) {
        const usernames = [...new Set(mentions.map(m => m.slice(1)))];
        const { data: mentionedUsers } = await supabase.from('profiles').select('user_id, username').in('username', usernames);
        if (mentionedUsers) {
          for (const u of mentionedUsers) {
            await supabase.from('mentions').insert({ post_id: data.id, user_id: u.user_id });
            notifyUser(u.user_id, 'mention', data.id);
          }
        }
      }

      const enriched = await enrichPosts([data]);
      setPosts(prev => [enriched[0], ...prev]);
      showToast({ id: 'post-created', title: '', body: t('postCreated', lang) });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang, enrichPosts, notifyUser]);

  const handleEditPost = useCallback(async (postId: string, content: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.from('posts').update({ content }).eq('id', postId).eq('user_id', currentUserId);
      if (updateError) {
        showToast({ id: 'edit-error', title: t('somethingWentWrong', lang), body: updateError.message });
        return;
      }
      await supabase.from('post_hashtags').delete().eq('post_id', postId);
      const tags = content.match(/#\w+/g);
      if (tags) {
        const uniqueTags = [...new Set(tags.map(t => t.toLowerCase()))];
        await supabase.from('post_hashtags').insert(uniqueTags.map(tag => ({ post_id: postId, tag })));
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content } : p));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang]);

  const handleLike = useCallback(async (postId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const post = posts.find(p => p.id === postId);
      const { error: insertError } = await supabase.from('post_likes').insert({
        user_id: currentUserId,
        post_id: postId,
      });
      if (insertError) {
        showToast({ id: 'like-error', title: t('somethingWentWrong', lang), body: insertError.message });
        return;
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: true, likes_count: (p.likes_count ?? 0) + 1 } : p));
      if (post) notifyUser(post.user_id, 'like', postId);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, posts, currentUserId, lang, notifyUser]);

  const handleUnlike = useCallback(async (postId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', postId);

      if (deleteError) {
        showToast({ id: 'unlike-error', title: t('somethingWentWrong', lang), body: deleteError.message });
        return;
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: false, likes_count: Math.max(0, (p.likes_count ?? 1) - 1) } : p));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang]);

  const handleDelete = useCallback(async (postId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUserId);

      if (deleteError) {
        showToast({ id: 'delete-error', title: t('somethingWentWrong', lang), body: deleteError.message });
        return;
      }
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast({ id: 'post-deleted', title: '', body: t('postDeleted', lang) });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang]);

  const handleFollow = useCallback(async (userId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
      if (error) {
        showToast({ id: 'follow-error', title: t('somethingWentWrong', lang), body: error.message });
        return;
      }
      setPosts(prev => prev.map(p => p.user_id === userId ? { ...p, is_following: true } : p));
      notifyUser(userId, 'follow');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, notifyUser, lang]);

  const handleUnfollow = useCallback(async (userId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
      if (error) {
        showToast({ id: 'unfollow-error', title: t('somethingWentWrong', lang), body: error.message });
        return;
      }
      setPosts(prev => prev.map(p => p.user_id === userId ? { ...p, is_following: false } : p));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang]);

  const handleComment = useCallback((userId: string, postId: string) => {
    notifyUser(userId, 'comment', postId);
  }, [notifyUser]);

  const handleBookmark = useCallback(async (postId: string) => {
    const { error } = await supabase.from('bookmarks').insert({ user_id: currentUserId, post_id: postId });
    if (error) {
      showToast({ id: 'bookmark-error', title: t('somethingWentWrong', lang), body: error.message });
      return;
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked_by_me: true } : p));
  }, [currentUserId, lang]);

  const handleUnbookmark = useCallback(async (postId: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', currentUserId).eq('post_id', postId);
    if (error) {
      showToast({ id: 'unbookmark-error', title: t('somethingWentWrong', lang), body: error.message });
      return;
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked_by_me: false } : p));
  }, [currentUserId, lang]);

  const handleQuote = useCallback((postId: string) => {
    setQuotePostId(postId);
  }, []);

  const handleQuotePost = useCallback(async (content: string) => {
    if (!quotePostId || submitting) return;
    setSubmitting(true);
    try {
      const { data, error: insertError } = await supabase.from('posts').insert({
        user_id: currentUserId,
        content,
        quoted_post_id: quotePostId,
      }).select('*').single();

      if (insertError || !data) {
        showToast({ id: 'quote-error', title: t('somethingWentWrong', lang), body: insertError?.message || '' });
        return;
      }

      const enriched = await enrichPosts([data]);
      setPosts(prev => [enriched[0], ...prev]);
      setQuotePostId(null);
      setQuoteContent('');
      showToast({ id: 'post-created', title: '', body: t('postCreated', lang) });
    } finally {
      setSubmitting(false);
    }
  }, [quotePostId, submitting, currentUserId, lang, enrichPosts]);

  const handleHashtagClick = useCallback((tag: string) => {
    if (externalHashtagClick) { externalHashtagClick(tag); return; }
    setActiveHashtagInternal(prev => prev === tag ? null : tag);
  }, [externalHashtagClick]);

  const handlePostClick = useCallback((postId: string) => {
    onViewPost?.(postId);
  }, [onViewPost]);

  const showCreatePostCard = !!currentUserId;

  const displayedPosts = useMemo(() => {
    let filtered = feedFilter === 'following'
      ? posts.filter(p => p.is_following || p.user_id === currentUserId)
      : posts;
    if (activeHashtag) {
      const lower = activeHashtag.toLowerCase();
      filtered = filtered.filter(p => {
        const tags = p.content.match(/#\w+/g);
        return tags?.some(t => t.toLowerCase() === `#${lower}`);
      });
    }
    return filtered;
  }, [posts, feedFilter, currentUserId, activeHashtag]);

  const quotePost = quotePostId ? posts.find(p => p.id === quotePostId) : null;
  const focusedPost = viewPostId ? posts.find(p => p.id === viewPostId) : null;

  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';

  return (
    <BlurFade>
      <Stack gap="md">

      {quotePostId && quotePost && (
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
          <Group justify="space-between" mb="sm">
            <Text size="sm" fw={500} style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>{t('sharePost', lang)}</Text>
            <ActionIcon variant="subtle" onClick={() => { setQuotePostId(null); setQuoteContent(''); }} aria-label="Close quote">
              <IconX size={16} />
            </ActionIcon>
          </Group>
          <Paper p="sm" radius="md" mb="sm" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' }}>
            <Group gap="sm" mb={4}>
              <Text size="xs" fw={700} style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>
                {quotePost.author?.username || 'Unknown'}
              </Text>
            </Group>
            <Text size="xs" style={{ whiteSpace: 'pre-wrap', color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-7)' }}>
              {quotePost.content}
            </Text>
          </Paper>
          <Textarea
            value={quoteContent}
            onChange={e => setQuoteContent(e.target.value.slice(0, 500))}
            placeholder={`${t('sharePost', lang)}...`}
            minRows={2}
            maxLength={500}
            mb="xs"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                if (quoteContent.trim()) handleQuotePost(quoteContent.trim());
              }
            }}
          />
          <Group justify="flex-end">
            <Button
              variant="gradient"
              gradient={{ from: 'cyan', to: 'emerald' }}
              size="xs"
              onClick={() => {
                if (quoteContent.trim()) handleQuotePost(quoteContent.trim());
              }}
            >
              {t('postButton', lang)}
            </Button>
          </Group>
        </Paper>
      )}

      {showCreatePostCard && (
        <Box pos="relative" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
          <BorderBeam size={140} borderWidth={1} colorFrom="#06b6d4" colorTo="#10b981" />
          <CreatePostCard
            isDark={isDark}
            lang={lang}
            displayName={profile?.displayName || username}
            currentUserId={currentUserId}
            products={products}
            avatarUrl={profile?.avatar_url}
            onSubmit={handleCreatePost}
            onViewProfile={onViewProfile}
          />
        </Box>
      )}

      <SegmentedControl
        value={feedFilter}
        onChange={(value) => setFeedFilter(value as 'latest' | 'following' | 'trending' | 'bookmarked')}
        data={feedOptions}
        fullWidth
        radius="md"
        size="sm"
      />

      {loading && (
        <div aria-busy="true" aria-label="Loading posts">
          <Stack gap="md">
            {[1, 2, 3].map(i => (
              <Paper key={i} p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
                <Group align="flex-start" gap="sm" wrap="nowrap">
                  <Skeleton width={36} height={36} radius="md" />
                  <Box style={{ flex: 1 }}>
                    <Skeleton height={12} width={96} radius="md" mb="sm" />
                    <Skeleton height={12} radius="md" mb="sm" />
                    <Skeleton height={12} width="75%" radius="md" />
                  </Box>
                </Group>
              </Paper>
            ))}
          </Stack>
        </div>
      )}

      {error && (
        <Paper p="md" radius="md" ta="center" withBorder style={{ background: isDark ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-red-1)' }}>
          <Text size="sm" c="red">{error}</Text>
        </Paper>
      )}

      {(trendingTags.length > 0 || activeHashtag) && (
        <Group gap="sm" wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {activeHashtag && (
            <UnstyledButton onClick={() => handleHashtagClick(activeHashtag)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--mantine-radius-md)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', background: 'var(--mantine-color-cyan-1)', color: 'var(--mantine-color-cyan-8)' }}>
              <IconX size={12} /> #{activeHashtag}
            </UnstyledButton>
          )}
          {trendingTags.map(tag => (
            <UnstyledButton key={tag} onClick={(e) => { e.stopPropagation(); handleHashtagClick(tag); }}
              style={{
                padding: '4px 10px', borderRadius: 'var(--mantine-radius-md)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                background: activeHashtag === tag ? 'var(--mantine-color-cyan-1)' : (isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-1)'),
                color: activeHashtag === tag ? 'var(--mantine-color-cyan-8)' : mutedColor,
              }}>
              #{tag}
            </UnstyledButton>
          ))}
        </Group>
      )}

      {!loading && !error && displayedPosts.length === 0 && (
        <Paper p="xl" radius="md" ta="center" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
          <Text size="sm" c="dimmed">
            {activeHashtag ? `No posts tagged #${activeHashtag}` : feedFilter === 'following' ? 'No posts from people you follow yet' : t('noPostsYet', lang)}
          </Text>
        </Paper>
      )}

      {displayedPosts.map(post => (
        <ShineBorder key={post.id} borderRadius={8} color={['#06b6d4', '#10b981']}>
          <PostCard
            post={post}
            isDark={isDark}
            lang={lang}
            currentUserId={currentUserId}
            username={username}
            isFollowing={post.is_following}
            onLike={handleLike}
            onUnlike={handleUnlike}
            onDelete={handleDelete}
            onEdit={handleEditPost}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onViewProfile={onViewProfile}
            onComment={handleComment}
            onHashtagClick={handleHashtagClick}
            onBookmark={handleBookmark}
            onUnbookmark={handleUnbookmark}
            onQuote={handleQuote}
            onPostClick={handlePostClick}
          />
        </ShineBorder>
      ))}

      {loadingMore && (
        <Group justify="center" py="md">
          <Loader size={24} color={mutedColor} />
        </Group>
      )}

      <div ref={observerRef} style={{ height: 16 }} />

      {focusedPost && createPortal(
        <PostDetailView
          post={focusedPost}
          isDark={isDark}
          lang={lang}
          currentUserId={currentUserId}
          username={username}
          onClose={() => onClosePost?.()}
          onLike={handleLike}
          onUnlike={handleUnlike}
          onBookmark={handleBookmark}
          onUnbookmark={handleUnbookmark}
          onDelete={handleDelete}
          onEdit={handleEditPost}
          onViewProfile={onViewProfile}
          onHashtagClick={handleHashtagClick}
          onComment={handleComment}
          onPostClick={handlePostClick}
        />
        , document.body)}
    </Stack>
  </BlurFade>
);
});