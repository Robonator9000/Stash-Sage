import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import type { Post, Product, Profile } from '../types';
import { supabase, uploadPostImages } from '../utils/supabase';
import { t } from '../utils/translations';
import { PostCard } from './PostCard';
import { CreatePostCard } from './CreatePostCard';
import { showToast } from './Toast';
import { Bookmark, X } from 'lucide-react';

interface SocialFeedProps {
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  products: Product[];
  profile?: Profile;
  onViewProfile?: (userId: string) => void;
}

const PAGE_SIZE = 10;
let socialFeedChannelCounter = 0;

export const SocialFeed = memo(function SocialFeed({ isDark, lang, currentUserId, username, products, profile, onViewProfile }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'latest' | 'following' | 'trending' | 'bookmarked'>('latest');
  const [submitting, setSubmitting] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [quotePostId, setQuotePostId] = useState<string | null>(null);
  const pageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  const enrichPosts = useCallback(async (rawPosts: Post[]): Promise<Post[]> => {
    if (rawPosts.length === 0) return [];

    const userIds = [...new Set(rawPosts.map(p => p.user_id))];
    const postIds = rawPosts.map(p => p.id);
    const quoteIds = rawPosts.filter(p => p.quoted_post_id).map(p => p.quoted_post_id!);

    const [profilesResult, likesResult, followsResult, commentsResult, bookmarksResult] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
      supabase.from('post_likes').select('id, user_id, post_id').in('post_id', postIds),
      supabase.from('follows').select('following_id').eq('follower_id', currentUserId).in('following_id', userIds),
      supabase.from('post_comments').select('id, post_id').in('post_id', postIds),
      currentUserId ? supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds) : { data: [] },
    ]);

    const profileMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));
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

    let quotePostMap = new Map<string, Post>();
    if (quoteIds.length > 0) {
      const { data: quotePosts } = await supabase.from('posts').select('*').in('id', quoteIds);
      if (quotePosts && quotePosts.length > 0) {
        const quoteUserIds = [...new Set(quotePosts.map(p => p.user_id))];
        const { data: quoteProfiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', quoteUserIds);
        const qProfileMap = new Map((quoteProfiles || []).map(p => [p.user_id, p]));
        for (const qp of quotePosts) {
          quotePostMap.set(qp.id, {
            ...qp,
            author: {
              username: qProfileMap.get(qp.user_id)?.display_name || 'User',
              avatar_url: qProfileMap.get(qp.user_id)?.avatar_url,
            },
          });
        }
      }
    }

    return rawPosts.map(p => ({
      ...p,
      author: {
        username: profileMap.get(p.user_id)?.display_name || 'User',
        avatar_url: profileMap.get(p.user_id)?.avatar_url,
      },
      likes_count: likesCountMap.get(p.id) || 0,
      liked_by_me: userLikesSet.has(p.id),
      comments_count: commentsCountMap.get(p.id) || 0,
      is_following: followingSet.has(p.user_id),
      bookmarked_by_me: bookmarkSet.has(p.id),
      quoted_post: p.quoted_post_id ? quotePostMap.get(p.quoted_post_id) : undefined,
    }));
  }, [currentUserId]);

  const fetchPosts = useCallback(async (page: number, sort?: string) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('posts').select('*');

    if (debouncedPostSearch.trim()) {
      query = query.textSearch('search_vector', debouncedPostSearch.trim(), { config: 'english' });
    } else if (sort === 'trending') {
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

    if (!debouncedPostSearch.trim() && sort === 'trending') {
      return enriched.sort((a, b) => ((b.likes_count ?? 0) * 3 + (b.comments_count ?? 0) * 2) - ((a.likes_count ?? 0) * 3 + (a.comments_count ?? 0) * 2));
    }

    return enriched;
  }, [enrichPosts, debouncedPostSearch]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    pageRef.current = 0;
    setHasMore(true);

    fetchPosts(0, feedFilter).then(enriched => {
      setPosts(enriched);
      setLoading(false);
    }).catch(console.error);

    if (!debouncedPostSearch.trim()) {
      socialFeedChannelCounter += 1;
      const id = socialFeedChannelCounter;
      const channel = supabase.channel(`social-feed-${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
          try {
            const newPost = payload.new as Post;
            if (newPost.user_id === currentUserId) return;
            const enriched = await enrichPosts([newPost]);
            setPosts(prev => [enriched[0], ...prev]);
          } catch (e) { console.error('Realtime post error:', e); }
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') console.error('Realtime social-feed channel error');
        });
      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchPosts, enrichPosts, currentUserId, feedFilter, debouncedPostSearch]);

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
    supabase.from('post_hashtags').select('tag, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).then(({ data }) => {
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach(h => { counts[h.tag] = (counts[h.tag] || 0) + 1; });
      setTrendingTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]));
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
        const { data: mentionedUsers } = await supabase.from('profiles').select('user_id, display_name').in('display_name', usernames);
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
      showToast({ id: 'post-created', title: '', body: t('postCreated', lang) });
    } finally {
      setSubmitting(false);
    }
  }, [quotePostId, submitting, currentUserId, lang, enrichPosts]);

  const handleSearchSelect = useCallback((userId: string) => {
    onViewProfile?.(userId);
    setSearchQuery('');
    setSearchResults([]);
  }, [onViewProfile]);

  const handleHashtagClick = useCallback((tag: string) => {
    setActiveHashtag(prev => prev === tag ? null : tag);
  }, []);

  const showCreatePostCard = !!profile;

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

  return (
    <div className="space-y-4">
      {quotePostId && quotePost && (
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${isDark ? 'text-frost' : 'text-gray-800'}`}>{t('sharePost', lang)}</span>
            <button onClick={() => setQuotePostId(null)} className={isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={`p-3 rounded-xl border mb-3 ${isDark ? 'bg-midnight/50 border-edge' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-display font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                {quotePost.author?.username || 'Unknown'}
              </span>
            </div>
            <p className={`text-xs whitespace-pre-wrap ${isDark ? 'text-mist' : 'text-gray-600'}`}>
              {quotePost.content}
            </p>
          </div>
          <textarea
            value={quotePostId ? '' : ''}
            onChange={e => (e.target as HTMLTextAreaElement)}
            placeholder={`${t('sharePost', lang)}...`}
            className={`w-full text-sm px-3 py-2 rounded-xl outline-none resize-none mb-2 ${
              isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-500 placeholder-gray-400'
            }`}
            rows={2}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                const val = (e.target as HTMLTextAreaElement).value.trim();
                if (val) handleQuotePost(val);
              }
            }}
            id="quote-input"
          />
          <div className="flex justify-end">
            <button
              onClick={() => {
                const input = document.getElementById('quote-input') as HTMLTextAreaElement;
                if (input?.value.trim()) handleQuotePost(input.value.trim());
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark"
            >
              {t('postButton', lang)}
            </button>
          </div>
        </div>
      )}

      {showCreatePostCard && (
        <CreatePostCard
          isDark={isDark}
          lang={lang}
          username={username}
          products={products}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Feed filter */}
      <div role="tablist" className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        {(['latest', 'following', 'trending', 'bookmarked'] as const).map(f => (
          <button
            key={f}
            role="tab"
            aria-selected={feedFilter === f}
            onClick={() => setFeedFilter(f)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              feedFilter === f
                ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'bookmarked' && <Bookmark className={`w-3.5 h-3.5 ${feedFilter === f ? 'fill-current' : ''}`} />}
            {f === 'latest' ? 'Latest' : f === 'following' ? 'Following' : f === 'trending' ? 'Trending' : 'Bookmarked'}
          </button>
        ))}
      </div>

      {loading && (
        <div aria-busy="true" aria-label="Loading posts" className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-full rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-3/4 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-500 border border-red-200'}`}>
          {error}
        </div>
      )}

      {/* Trending hashtags */}
      {(trendingTags.length > 0 || activeHashtag) && (
        <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${isDark ? 'text-mist' : 'text-gray-600'}`}>
          {activeHashtag && (
            <button onClick={() => setActiveHashtag(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyanx/20 text-cyanx whitespace-nowrap">
              <X className="w-3 h-3" /> #{activeHashtag}
            </button>
          )}
          {trendingTags.map(tag => (
            <button key={tag} onClick={() => setActiveHashtag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeHashtag === tag
                  ? 'bg-cyanx/20 text-cyanx'
                  : isDark ? 'bg-midnight text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && displayedPosts.length === 0 && (
        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {activeHashtag ? `No posts tagged #${activeHashtag}` : debouncedPostSearch.trim() ? `No posts matching "${debouncedPostSearch}"` : feedFilter === 'following' ? 'No posts from people you follow yet' : t('noPostsYet', lang)}
          </p>
        </div>
      )}

      {displayedPosts.map(post => (
        <PostCard
          key={post.id}
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
        />
      ))}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <svg className={`w-6 h-6 animate-spin ${isDark ? 'text-muted' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      <div ref={observerRef} className="h-4" />
    </div>
  );
});
