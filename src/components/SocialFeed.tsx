import { useState, useEffect, useRef, useCallback } from 'react';
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
}

const PAGE_SIZE = 10;

export function SocialFeed({ isDark, lang, currentUserId, username, products, profile }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

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
        username: profileMap.get(p.user_id)?.display_name || 'Unknown',
        avatar_url: profileMap.get(p.user_id)?.avatar_url,
      },
      likes_count: likesCountMap.get(p.id) || 0,
      liked_by_me: userLikesSet.has(p.id),
      comments_count: commentsCountMap.get(p.id) || 0,
      is_following: followingSet.has(p.user_id),
    }));
  }, [currentUserId]);

  const fetchPosts = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (fetchError) {
      setError(fetchError.message);
      return [];
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      return [];
    }

    if (data.length < PAGE_SIZE) setHasMore(false);
    return enrichPosts(data);
  }, [enrichPosts]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    pageRef.current = 0;
    setHasMore(true);

    fetchPosts(0).then(enriched => {
      setPosts(enriched);
      setLoading(false);
    });

    const channel = supabase.channel('social-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        const newPost = payload.new as any;
        if (newPost.user_id === currentUserId) return;
        const enriched = await enrichPosts([newPost]);
        setPosts(prev => [enriched[0], ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts, enrichPosts, currentUserId]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;

        fetchPosts(nextPage).then(enriched => {
          setPosts(prev => [...prev, ...enriched]);
          setLoadingMore(false);
        });
      }
    }, { rootMargin: '400px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPosts]);

  async function handleCreatePost(content: string, productId?: string, productName?: string) {
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
  }

  async function handleLike(postId: string) {
    const { error: insertError } = await supabase.from('post_likes').insert({
      user_id: currentUserId,
      post_id: postId,
    });
    if (insertError) {
      showToast({ id: 'like-error', title: t('somethingWentWrong', lang), body: insertError.message });
      return;
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: true, likes_count: (p.likes_count ?? 0) + 1 } : p));
  }

  async function handleUnlike(postId: string) {
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
  }

  async function handleDelete(postId: string) {
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
  }

  async function handleFollow(userId: string) {
    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
    setPosts(prev => prev.map(p => p.user_id === userId ? { ...p, is_following: true } : p));
  }

  async function handleUnfollow(userId: string) {
    await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
    setPosts(prev => prev.map(p => p.user_id === userId ? { ...p, is_following: false } : p));
  }

  const showCreatePostCard = !!profile;

  return (
    <div className="max-w-lg mx-auto mt-4 space-y-4">
      {showCreatePostCard && (
        <CreatePostCard
          isDark={isDark}
          lang={lang}
          username={username}
          products={products}
          onSubmit={handleCreatePost}
        />
      )}

      {loading && (
        <div className="space-y-4">
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

      {!loading && !error && posts.length === 0 && (
        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {t('noPostsYet', lang)}
          </p>
        </div>
      )}

        {posts.map(post => (
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
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
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
