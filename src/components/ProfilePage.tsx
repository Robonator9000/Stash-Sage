import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { FollowButton } from './FollowButton';
import { PostCard } from './PostCard';
import { Group, Stack, Text, Button, Paper, Avatar, Switch, Box, Skeleton } from '@mantine/core';
import { IconMessageCircle, IconMapPin, IconArrowLeft, IconGlobe, IconMail, IconPhone, IconCamera } from '@tabler/icons-react';
import { InteractiveHoverButton } from './magicui';
import type { Post, Product } from '../types';

interface ProfileData {
  display_name: string;
  username?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  contacts?: string;
  location?: string;
  created_at?: string;
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
      supabase.from('profiles').select('display_name, username, avatar_url, banner_url, bio, contacts, location, created_at').eq('user_id', userId).maybeSingle(),
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
    if (onOpenChat) { onOpenChat(userId); } else { navigate('/?tab=community&openChat=' + encodeURIComponent(userId)); }
    const { data: existing } = await supabase.from('conversations').select('id').or(`and(buyer_id.eq.${currentUserId},seller_id.eq.${userId}),and(buyer_id.eq.${userId},seller_id.eq.${currentUserId})`).is('listing_id', null).maybeSingle();
    if (!existing) await supabase.from('conversations').insert({ buyer_id: currentUserId, seller_id: userId, listing_id: null }).then(undefined, () => {});
  }

  function contactIcon(platform: string) {
    switch (platform) {
      case 'phone': return <IconPhone size={14} />;
      case 'email': return <IconMail size={14} />;
      case 'instagram':
      case 'snapchat': return <IconCamera size={14} />;
      case 'telegram':
      case 'signal':
      case 'discord':
      case 'whatsapp': return <IconMessageCircle size={14} />;
      default: return <IconGlobe size={14} />;
    }
  }

  function parseContacts(raw: string | undefined): { platform: string; value: string }[] {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  const isOwnProfile = currentUserId === userId;
  const primaryColor = 'var(--mantine-color-cyan-6)';
  const secondaryColor = 'var(--mantine-color-emerald-5)';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton height={160} radius="lg" />
        <Skeleton height={64} radius="lg" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <Text size="sm" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'}>User not found</Text>
      </div>
    );
  }

  function handleBack() {
    if (onBack) { onBack(); } else { navigate('/?tab=community'); }
  }

  const effectiveBannerUrl = profileData.banner_url || (userId === currentUserId ? settings.profile?.banner_url : undefined);
  const bannerBg = effectiveBannerUrl ? undefined : `linear-gradient(to right, ${primaryColor} 40%, ${secondaryColor} 40%, ${primaryColor} 20%)`;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <InteractiveHoverButton type="button" onClick={handleBack} icon={<IconArrowLeft size={16} />}>
        Back
      </InteractiveHoverButton>

      <Paper withBorder p={0} radius="lg" style={{ overflow: 'hidden', borderColor: isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-3)' }}>
        <Box style={{ height: isDark ? 112 : 112, position: 'relative', background: bannerBg, border: 'none' }}>
          {effectiveBannerUrl && (
            <img src={effectiveBannerUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <Box style={{ position: 'absolute', bottom: -48, left: 16 }}>
            <Avatar
              size={96}
              radius="lg"
              src={profileData.avatar_url || undefined}
              styles={{
                placeholder: { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` },
              }}
              style={{ border: `4px solid ${isDark ? '#0b1120' : '#ffffff'}` }}
            >
              {profileData.avatar_url ? undefined : (
                <Text fw={700} fz={28} c="var(--mantine-color-white)" style={{ fontFamily: 'inherit' }}>{(profileData.display_name?.[0] || '?').toUpperCase()}</Text>
              )}
            </Avatar>
          </Box>
        </Box>

        <Box p="md" pt={64} style={{ background: isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-white)' }}>
          <div className="flex items-start justify-between gap-3">
            <Box style={{ minWidth: 0 }}>
              <Group gap="sm" align="center">
                <Text fw={700} size="lg" c={isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-9)'} truncate>{profileData.display_name || 'Unknown'}</Text>
                {profileData.username && <Text size="xs" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>@{profileData.username}</Text>}
                <Box title={isOnline ? 'Online' : 'Offline'} style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isOnline ? 'var(--mantine-color-emerald-4)' : 'var(--mantine-color-gray-5)', boxShadow: isOnline ? '0 0 6px rgba(52,211,153,0.5)' : undefined }} />
              </Group>
              {profileData.location && (
                <Group gap={4} mt={2} align="center">
                  <IconMapPin size={12} color={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'} />
                  <Text size="xs" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>{profileData.location}</Text>
                </Group>
              )}
              {profileData.created_at && (
                <Text size="xs" mt={2} c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
                  {t('joinedOn', lang).replace('{date}', new Date(profileData.created_at).toLocaleDateString(lang, { month: 'short', year: 'numeric' }))}
                </Text>
              )}
            </Box>
            {!isOwnProfile && currentUserId && (
              <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                <Button size="xs" variant="light" color="cyan" leftSection={<IconMessageCircle size={14} />} onClick={handleMessage}>
                  Message
                </Button>
                <FollowButton userId={userId!} currentUserId={currentUserId} isFollowing={isFollowing} isDark={isDark} onFollow={handleFollow} onUnfollow={handleUnfollow} />
              </Group>
            )}
          </div>

          <Group gap="lg" mt="md" align="center">
            <Text size="sm" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}><strong style={{ color: isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-9)' }}>{postCount}</strong> {t('posts', lang)}</Text>
            <Text size="sm" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}><strong style={{ color: isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-9)' }}>{followerCount}</strong> {t('followers', lang)}</Text>
            <Text size="sm" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}><strong style={{ color: isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-9)' }}>{followingCount}</strong> {t('followedBy', lang)}</Text>
          </Group>
          {(profileData.bio || isOwnProfile) && (
            <Text size="sm" mt="md" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'}>
              {profileData.bio || (isOwnProfile ? settings.profile?.bio || '' : '')}
            </Text>
          )}
          {(parseContacts(profileData.contacts).length > 0 || (isOwnProfile && (settings.profile?.contacts || []).length > 0)) && (
            <Group gap="xs" mt="md">
              {(parseContacts(profileData.contacts).length > 0 ? parseContacts(profileData.contacts) : settings.profile?.contacts || []).map((c, i) => (
                <a key={i} href={c.platform === 'email' ? `mailto:${c.value}` : c.platform === 'phone' ? `tel:${c.value}` : undefined}>
                  <Button size="xs" variant="light" color="cyan" leftSection={contactIcon(c.platform)}>
                    {c.value}
                  </Button>
                </a>
              ))}
            </Group>
          )}
          {isOwnProfile && (
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-2)'}` }}>
              <Text size="xs" fw={500} c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
                {settings.publicProducts ? 'Products visible to everyone' : 'Products hidden from others'}
              </Text>
              <Switch
                checked={settings.publicProducts}
                onChange={(e) => {
                  const next = e.currentTarget.checked;
                  updateSettings({ publicProducts: next });
                  supabase.from('profiles').update({ public_products: next }).eq('user_id', currentUserId).then(undefined, () => {});
                }}
              />
            </div>
          )}
        </Box>
      </Paper>

      <div className="flex rounded-lg" style={{ background: isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)' }}>
        {(['posts', 'products'] as const).map(tab => (
          <Button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            variant={activeTab === tab ? 'light' : 'subtle'}
            color="cyan"
            fullWidth
            onClick={() => setActiveTab(tab)}
            styles={{ root: { textTransform: 'capitalize' } }}
          >
            {tab === 'posts' ? t('posts', lang) : t('products', lang)}
          </Button>
        ))}
      </div>

      {activeTab === 'posts' && (
        <Stack gap="sm">
          {userPosts.length === 0 ? <Text ta="center" size="sm" p="lg" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'}>No posts yet</Text> : (
            userPosts.map(post => <PostCard key={post.id} post={{ ...post, author: { username: profileData.username || profileData.display_name, display_name: profileData.display_name, avatar_url: profileData.avatar_url } }} isDark={isDark} lang={lang} currentUserId={currentUserId} username={profileData.display_name} onLike={handleLike} onUnlike={handleUnlike} onDelete={isOwnProfile ? handleDelete : undefined} onEdit={isOwnProfile ? handleEdit : undefined} />)
          )}
        </Stack>
      )}

      {activeTab === 'products' && (
        <div>
          {productError && !isOwnProfile && (
            <Text size="xs" c={isDark ? 'var(--mantine-color-amber-4)' : 'var(--mantine-color-amber-6)'} mb="sm" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)', background: isDark ? 'var(--mantine-color-amber-9)' : 'var(--mantine-color-amber-0)' }}>
              This user's products are not publicly visible
            </Text>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userProducts.length === 0 && !productError ? <Text ta="center" size="sm" p="lg" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'} style={{ gridColumn: '1 / -1' }}>No products yet</Text> : null}
            {userProducts.length === 0 && productError ? <Text ta="center" size="sm" p="lg" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'} style={{ gridColumn: '1 / -1' }}>Products not available</Text> : null}
            {userProducts.map((product: Product) => (
              <Paper key={product.id} withBorder p="sm" radius="lg" bg={isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-white)'}>
                {product.picture && <img src={product.picture} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: 80, borderRadius: 'var(--mantine-radius-md)', objectFit: 'cover', marginBottom: 8 }} />}
                <Text size="xs" fw={500} c={isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-8)'} truncate>{product.name}</Text>
                <Text fz={10} c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>{product.strain} · {product.thc}%</Text>
                <Text size="xs" fw={600} mt={4} c={isDark ? 'var(--mantine-color-emerald-5)' : 'var(--mantine-color-emerald-6)'}>{product.price}</Text>
              </Paper>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
