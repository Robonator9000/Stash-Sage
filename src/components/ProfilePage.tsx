import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { FollowButton } from './FollowButton';
import { PostCard } from './PostCard';
import type { Post, Product } from '../types';

interface ProfileData {
  display_name: string;
  avatar_url?: string;
  location?: string;
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const lang = settings.language;
  const isDark = settings.theme === 'dark';
  const currentUserId = user?.id || '';

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'products'>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    Promise.all([
      supabase.from('profiles').select('display_name, avatar_url, location').eq('user_id', userId).maybeSingle(),
      supabase.from('posts').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      currentUserId ? supabase.from('follows').select('following_id').eq('follower_id', currentUserId).eq('following_id', userId).maybeSingle() : { data: null },
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]).then(([profileRes, postsRes, productsRes, followRes, followersRes, followingRes]) => {
      if (profileRes.data) {
        setProfileData(profileRes.data);
      }
      setPostCount(postsRes.count || 0);
      setUserPosts(postsRes.data || []);
      setUserProducts(productsRes.data || []);
      setIsFollowing(!!followRes.data);
      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
      setLoading(false);
    });
  }, [userId, currentUserId]);

  async function handleFollow() {
    if (!currentUserId || !userId) return;
    const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
    if (!error) {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      await supabase.from('notifications').insert({ user_id: userId, type: 'follow', actor_id: currentUserId });
    }
  }

  async function handleUnfollow() {
    if (!currentUserId || !userId) return;
    const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
    if (!error) {
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    }
  }

  async function handleLike(postId: string) {
    const { error } = await supabase.from('post_likes').insert({ user_id: currentUserId, post_id: postId });
    if (!error) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: true, likes_count: (p.likes_count ?? 0) + 1 } : p));
      const post = userPosts.find(p => p.id === postId);
      if (post && post.user_id !== currentUserId) {
        await supabase.from('notifications').insert({ user_id: post.user_id, type: 'like', actor_id: currentUserId, post_id: postId });
      }
    }
  }

  async function handleUnlike(postId: string) {
    const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUserId).eq('post_id', postId);
    if (!error) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: false, likes_count: Math.max(0, (p.likes_count ?? 1) - 1) } : p));
    }
  }

  async function handleDelete(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUserId);
    if (!error) {
      setUserPosts(prev => prev.filter(p => p.id !== postId));
      setPostCount(prev => Math.max(0, prev - 1));
    }
  }

  async function handleEdit(postId: string, content: string) {
    const { error } = await supabase.from('posts').update({ content }).eq('id', postId).eq('user_id', currentUserId);
    if (!error) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, content } : p));
    }
  }

  const isOwnProfile = currentUserId === userId;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`h-32 rounded-2xl animate-pulse ${isDark ? 'bg-surface/50' : 'bg-gray-200'}`} />
        <div className={`h-48 rounded-2xl animate-pulse ${isDark ? 'bg-surface/50' : 'bg-gray-200'}`} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('back', lang)}
      </button>

      <div className={`p-6 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${profileData.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
            {profileData.avatar_url ? (
              <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-display font-bold text-2xl">
                {(profileData.display_name?.[0] || '?').toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-display font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>
              {profileData.display_name || 'Unknown'}
            </h1>
            {profileData.location && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                {profileData.location}
              </p>
            )}
            <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
              <span><strong className={isDark ? 'text-frost' : 'text-gray-800'}>{postCount}</strong> {t('posts', lang)}</span>
              <span><strong className={isDark ? 'text-frost' : 'text-gray-800'}>{followerCount}</strong> {t('followers', lang)}</span>
              <span><strong className={isDark ? 'text-frost' : 'text-gray-800'}>{followingCount}</strong> {t('followedBy', lang)}</span>
            </div>
            {!isOwnProfile && currentUserId && (
              <div className="mt-3">
                <FollowButton
                  userId={userId!}
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                  isDark={isDark}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div role="tablist" className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        {(['posts', 'products'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
              activeTab === tab
                ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'posts' ? t('posts', lang) : t('products', lang)}
          </button>
        ))}
      </div>

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 && (
            <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>No posts yet</p>
            </div>
          )}
          {userPosts.map(post => (
            <PostCard
              key={post.id}
              post={{ ...post, author: { username: profileData.display_name, avatar_url: profileData.avatar_url } }}
              isDark={isDark}
              lang={lang}
              currentUserId={currentUserId}
              username={profileData.display_name}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onDelete={isOwnProfile ? handleDelete : undefined}
              onEdit={isOwnProfile ? handleEdit : undefined}
            />
          ))}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-3">
          {userProducts.length === 0 && (
            <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>No products yet</p>
            </div>
          )}
          {userProducts.map((product: Product) => (
            <div key={product.id} className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {product.picture && (
                  <img src={product.picture} alt="" className="w-12 h-12 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>{product.name}</h3>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                    <span>{product.strain}</span>
                    <span>·</span>
                    <span>{product.thc}% THC</span>
                    <span>·</span>
                    <span>{product.amount}g</span>
                  </div>
                </div>
                <div className={`text-right text-sm font-medium ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                  ${product.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
