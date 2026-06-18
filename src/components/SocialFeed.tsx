import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Post, Product, Profile } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { PostCard } from './PostCard';
import { CreatePostCard } from './CreatePostCard';
import { showToast } from './Toast';

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

export function SocialFeed({ isDark, lang, currentUserId, username, products, profile, onViewProfile }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'latest' | 'following' | 'trending'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const enrichPosts = useCallback(async (rawPosts: any[]): Promise<Post[]> => {
    if (rawPosts.length === 0) return [];

    const userIds = [...new Set(rawPosts.map(p => p.user_id))];
    const postIds = rawPosts.map(p => p.id);

    const [profilesResult, likesResult, followsResult, commentsResult] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
      supabase.from('post_likes').select('id, user_id, post_id').in('post_id', postIds),
      supabase.from('follows').select('following_id').eq('follower_id', currentUserId).in('following_id', userIds),
      supabase.from('post_comments').select('id, post_id').in('post_id', postIds),
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

    const followingSet = new Set((followsResult.data || []).map((f: any) => f.following_id));

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
    }));
  }, [currentUserId]);

  const fetchPosts = useCallback(async (page: number, sort?: string) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('posts').select('*');

    if (sort === 'trending') {
      query = query.order('created_at', { ascending: false }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
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
      return enriched.sort((a, b) => ((b.likes_count ?? 0) * 3 + (b.comments_count ?? 0) * 2) - ((a.likes_count ?? 0) * 3 + (a.comments_count ?? 0) * 2));
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

    const channel = supabase.channel('social-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        try {
          const newPost = payload.new as any;
          if (newPost.user_id === currentUserId) return;
          const enriched = await enrichPosts([newPost]);
          setPosts(prev => [enriched[0], ...prev]);
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
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .ilike('display_name', `%${searchQuery}%`)
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const notifyUser = useCallback(async (targetUserId: string, type: 'like' | 'comment' | 'follow', postId?: string) => {
    if (targetUserId === currentUserId) return;
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type,
      actor_id: currentUserId,
      post_id: postId || null,
    }).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
  }, [currentUserId]);

  const handleCreatePost = useCallback(async (content: string, productId?: string, productName?: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data, error: insertError } = await supabase.from('posts').insert({
        user_id: currentUserId,
        content,
        product_id: productId || null,
        product_name: productName || null,
      }).select('*').single();

      if (insertError || !data) {
        showToast({ id: 'post-error', title: t('somethingWentWrong', lang), body: insertError?.message || '' });
        return;
      }

      const enriched = await enrichPosts([data]);
      setPosts(prev => [enriched[0], ...prev]);
      showToast({ id: 'post-created', title: '', body: t('postCreated', lang) });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang, enrichPosts]);

  const handleEditPost = useCallback(async (postId: string, content: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.from('posts').update({ content }).eq('id', postId).eq('user_id', currentUserId);
      if (updateError) {
        showToast({ id: 'edit-error', title: t('somethingWentWrong', lang), body: updateError.message });
        return;
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

  const handleSearchSelect = useCallback((userId: string) => {
    onViewProfile?.(userId);
    setSearchQuery('');
    setSearchResults([]);
  }, [onViewProfile]);

  const showCreatePostCard = !!profile;

  const displayedPosts = useMemo(() =>
    feedFilter === 'following'
      ? posts.filter(p => p.is_following || p.user_id === currentUserId)
      : posts,
    [posts, feedFilter, currentUserId]
  );

  return (
    <div className="space-y-4">
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
        {(['latest', 'following', 'trending'] as const).map(f => (
          <button
            key={f}
            role="tab"
            aria-selected={feedFilter === f}
            onClick={() => setFeedFilter(f)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              feedFilter === f
                ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'latest' ? 'Latest' : f === 'following' ? 'Following' : 'Trending'}
          </button>
        ))}
      </div>

      {/* User search */}
      <div ref={searchRef} className="relative">
          <input
            id="user-search"
            name="user-search"
            type="text"
            aria-label="Search users"
            value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
            isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'
          }`}
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-edge' : 'border-gray-300'}`} />
          </div>
        )}
        {searchResults.length > 0 && (
          <div className={`absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl border overflow-hidden z-20 ${isDark ? 'bg-card border-edge' : 'bg-white border-gray-200'}`}>
            {searchResults.map(r => (
              <button
                key={r.user_id}
                onClick={() => handleSearchSelect(r.user_id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isDark ? 'hover:bg-surface text-frost' : 'hover:bg-gray-50 text-gray-800'}`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyanx to-emera">
                  <span className="text-white font-display font-bold text-xs">{(r.display_name?.[0] || '?').toUpperCase()}</span>
                </div>
                <span className="font-medium">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
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

      {!loading && !error && displayedPosts.length === 0 && (
        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {feedFilter === 'following' ? 'No posts from people you follow yet' : t('noPostsYet', lang)}
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
}