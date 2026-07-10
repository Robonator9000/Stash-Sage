import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { FollowButton } from './FollowButton';
import { PostCard } from './PostCard';
import { MessageCircle, MapPin, ArrowLeft, Globe, Mail, Phone, Camera } from 'lucide-react';
import type { Post, Product } from '../types';

interface ProfileData {
  display_name: string;
  username?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  contacts?: string;
  location?: string;
}

interface ProfilePageProps {
  userId?: string;
  onBack?: () => void;
  onOpenChat?: (userId: string) => void;
}

export function ProfilePage({ userId: propUserId, onBack, onOpenChat }: ProfilePageProps = {}) {
  const params = useParams();
  const userId = propUserId || params.userId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
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
  const [isOnline, setIsOnline] = useState(false);
  const [productError, setProductError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from('profiles').select('display_name, username, avatar_url, banner_url, bio, contacts, location').eq('user_id', userId).maybeSingle(),
      supabase.from('posts').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('*').eq('user_id', userId).order('createdat', { ascending: false }).limit(50),
      currentUserId ? supabase.from('follows').select('following_id').eq('follower_id', currentUserId).eq('following_id', userId).maybeSingle() : { data: null },
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('profiles').select('last_seen').eq('user_id', userId).maybeSingle(),
    ]).then(([profileRes, postsRes, productsRes, followRes, followersRes, followingRes, lastSeenRes]) => {
      if (profileRes.data) setProfileData(profileRes.data);
      setPostCount(postsRes.count || 0);
      setUserPosts(postsRes.data || []);
      if (productsRes.error) {
        setProductError(productsRes.error.message);
        setUserProducts([]);
      } else {
        setProductError('');
        setUserProducts(productsRes.data || []);
      }
      setIsFollowing(!!followRes.data);
      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
      if (lastSeenRes?.data?.last_seen) {
        const diff = Date.now() - new Date(lastSeenRes.data.last_seen).getTime();
        setIsOnline(diff < 5 * 60 * 1000);
      }
      setLoading(false);
    });
  }, [userId, currentUserId]);

  async function handleFollow() {
    if (!currentUserId || !userId) return;
    const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
    if (!error) { setIsFollowing(true); setFollowerCount(prev => prev + 1); await supabase.from('notifications').insert({ user_id: userId, type: 'follow', actor_id: currentUserId }); }
  }

  async function handleUnfollow() {
    if (!currentUserId || !userId) return;
    const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
    if (!error) { setIsFollowing(false); setFollowerCount(prev => Math.max(0, prev - 1)); }
  }

  async function handleLike(postId: string) {
    const { error } = await supabase.from('post_likes').insert({ user_id: currentUserId, post_id: postId });
    if (!error) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: true, likes_count: (p.likes_count ?? 0) + 1 } : p));
      const post = userPosts.find(p => p.id === postId);
      if (post && post.user_id !== currentUserId) await supabase.from('notifications').insert({ user_id: post.user_id, type: 'like', actor_id: currentUserId, post_id: postId });
    }
  }

  async function handleUnlike(postId: string) {
    const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUserId).eq('post_id', postId);
    if (!error) setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: false, likes_count: Math.max(0, (p.likes_count ?? 1) - 1) } : p));
  }

  async function handleDelete(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUserId);
    if (!error) { setUserPosts(prev => prev.filter(p => p.id !== postId)); setPostCount(prev => Math.max(0, prev - 1)); }
  }

  async function handleEdit(postId: string, content: string) {
    const { error } = await supabase.from('posts').update({ content }).eq('id', postId).eq('user_id', currentUserId);
    if (!error) setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, content } : p));
  }

  async function handleMessage() {
    if (!currentUserId || !userId) return;
    const { data: existing } = await supabase.from('conversations').select('id').or(`and(buyer_id.eq.${currentUserId},seller_id.eq.${userId}),and(buyer_id.eq.${userId},seller_id.eq.${currentUserId})`).is('listing_id', null).maybeSingle();
    if (!existing) await supabase.from('conversations').insert({ buyer_id: currentUserId, seller_id: userId, listing_id: null }).then(undefined, () => {});
    if (onOpenChat) { onOpenChat(userId); } else { navigate('/?tab=community&openChat=' + encodeURIComponent(userId)); }
  }

  function contactIcon(platform: string) {
  switch (platform) {
    case 'phone': return <Phone className="w-3.5 h-3.5" />;
    case 'email': return <Mail className="w-3.5 h-3.5" />;
    case 'instagram':
    case 'snapchat': return <Camera className="w-3.5 h-3.5" />;
    case 'telegram':
    case 'signal':
    case 'discord':
    case 'whatsapp': return <MessageCircle className="w-3.5 h-3.5" />;
    default: return <Globe className="w-3.5 h-3.5" />;
  }
}

function parseContacts(raw: string | undefined): { platform: string; value: string }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

const isOwnProfile = currentUserId === userId;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className={`h-40 rounded-2xl animate-pulse ${isDark ? 'bg-surface/50' : 'bg-gray-200'}`} />
        <div className={`h-16 rounded-2xl animate-pulse ${isDark ? 'bg-surface/50' : 'bg-gray-200'}`} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl text-center"><p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>User not found</p></div>
    );
  }

  function handleBack() {
    if (onBack) { onBack(); } else { navigate('/?tab=community'); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={handleBack} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyanx/20 to-emera/20 text-cyanx hover:from-cyanx/30 hover:to-emera/30 transition-all">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      {/* Cover + Avatar */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'border border-edge' : 'border border-gray-200'}`}>
        <div className={`h-28 sm:h-36 relative ${profileData.banner_url ? '' : 'bg-gradient-to-r from-cyanx/40 via-emera/40 to-cyanx/20'}`}>
          {profileData.banner_url && (
            <img src={profileData.banner_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute -bottom-12 left-4 sm:left-6">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 ${isDark ? 'border-[#0b1120]' : 'border-white'} overflow-hidden ${profileData.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera flex items-center justify-center'}`}>
              {profileData.avatar_url ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-display font-bold text-3xl">{(profileData.display_name?.[0] || '?').toUpperCase()}</span>}
            </div>
          </div>
        </div>

        <div className={`pt-14 sm:pt-16 pb-4 px-4 sm:px-6 ${isDark ? 'bg-surface/30' : 'bg-white'}`}>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-bold truncate ${isDark ? 'text-frost' : 'text-gray-900'}`}>{profileData.display_name || 'Unknown'}</h1>
                {profileData.username && <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>@{profileData.username}</p>}
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-gray-500'}`} title={isOnline ? 'Online' : 'Offline'} />
              </div>
              {profileData.location && <p className={`flex items-center gap-1 text-xs mt-0.5 ${isDark ? 'text-muted' : 'text-gray-400'}`}><MapPin className="w-3 h-3" />{profileData.location}</p>}
            </div>
            {!isOwnProfile && currentUserId && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleMessage} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-cyanx/10 text-cyanx hover:bg-cyanx/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}>
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </button>
                <FollowButton userId={userId!} currentUserId={currentUserId} isFollowing={isFollowing} isDark={isDark} onFollow={handleFollow} onUnfollow={handleUnfollow} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 mt-3 text-sm">
            <span className={isDark ? 'text-muted' : 'text-gray-500'}><strong className={isDark ? 'text-frost' : 'text-gray-900'}>{postCount}</strong> {t('posts', lang)}</span>
            <span className={isDark ? 'text-muted' : 'text-gray-500'}><strong className={isDark ? 'text-frost' : 'text-gray-900'}>{followerCount}</strong> {t('followers', lang)}</span>
            <span className={isDark ? 'text-muted' : 'text-gray-500'}><strong className={isDark ? 'text-frost' : 'text-gray-900'}>{followingCount}</strong> {t('followedBy', lang)}</span>
          </div>
          {(profileData.bio || isOwnProfile) && (
            <p className={`text-sm mt-3 ${isDark ? 'text-mist' : 'text-gray-600'}`}>
              {profileData.bio || (isOwnProfile ? settings.profile?.bio || '' : '')}
            </p>
          )}
          {(parseContacts(profileData.contacts).length > 0 || (isOwnProfile && (settings.profile?.contacts || []).length > 0)) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(parseContacts(profileData.contacts).length > 0 ? parseContacts(profileData.contacts) : settings.profile?.contacts || []).map((c, i) => (
                <a key={i} href={c.platform === 'email' ? `mailto:${c.value}` : c.platform === 'phone' ? `tel:${c.value}` : undefined}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-cyanx/10 text-cyanx hover:bg-cyanx/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}>
                  {contactIcon(c.platform)}
                  {c.value}
                </a>
              ))}
            </div>
          )}
          {isOwnProfile && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-edge">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${isDark ? 'text-muted' : 'text-gray-500'}`}>
                  {settings.publicProducts ? 'Products visible to everyone' : 'Products hidden from others'}
                </span>
              </div>
              <button onClick={() => {
                updateSettings({ publicProducts: !settings.publicProducts });
                supabase.from('profiles').update({ public_products: !settings.publicProducts }).eq('user_id', currentUserId).then(undefined, () => {});
              }}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${settings.publicProducts ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : isDark ? 'bg-slate-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${settings.publicProducts ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        {(['posts', 'products'] as const).map(tab => (
          <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab ? isDark ? 'bg-surface text-frost shadow-sm' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'posts' ? t('posts', lang) : t('products', lang)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {userPosts.length === 0 ? <p className={`p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>No posts yet</p> : (
            userPosts.map(post => <PostCard key={post.id} post={{ ...post, author: { username: profileData.username || profileData.display_name, display_name: profileData.display_name, avatar_url: profileData.avatar_url } }} isDark={isDark} lang={lang} currentUserId={currentUserId} username={profileData.display_name} onLike={handleLike} onUnlike={handleUnlike} onDelete={isOwnProfile ? handleDelete : undefined} onEdit={isOwnProfile ? handleEdit : undefined} />)
          )}
        </div>
      )}

      {/* Products - compact grid */}
      {activeTab === 'products' && (
        <div>
          {productError && !isOwnProfile && (
            <p className={`mb-3 p-3 rounded-xl text-xs ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              This user's products are not publicly visible
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userProducts.length === 0 && !productError ? <p className={`col-span-full p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>No products yet</p> : null}
            {userProducts.length === 0 && productError ? <p className={`col-span-full p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>Products not available</p> : null}
            {userProducts.map((product: Product) => (
              <div key={product.id} className={`p-3 rounded-xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                {product.picture && <img src={product.picture} alt="" className="w-full h-20 rounded-lg object-cover mb-2" />}
                <p className={`text-xs font-medium truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>{product.name}</p>
                <div className={`text-[10px] ${isDark ? 'text-muted' : 'text-gray-400'}`}>{product.strain} · {product.thc}%</div>
                <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-emera' : 'text-emerald-600'}`}>${product.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}