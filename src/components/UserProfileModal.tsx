import { useState, useEffect } from 'react';
import type { Post, Product } from '../types';
import { supabase } from '../utils/supabase';
import { PostCard } from './PostCard';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/translations';
import { Group, Stack, Text, Button, Paper, ActionIcon, Box, Skeleton, Avatar } from '@mantine/core';
import { IconArrowLeft, IconPackage, IconMessageCircle } from '@tabler/icons-react';

interface UserProfileModalProps {
  userId: string;
  isDark: boolean;
  lang: string;
  onBack?: () => void;
}

export function UserProfileModal({ userId, isDark, lang, onBack }: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string; avatar_url?: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'posts' | 'products'>('posts');

  useEffect(() => {
    async function load() {
      setError(null);
      const [profileRes, postsRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('products').select('id, name, type, amount, price, rating, thc, cbd, favorite, createdat, updatedat, notes, consumptionCount, lastconsumed, purchasedAt, brand, tags, effects, picture, pictures').eq('user_id', userId).order('createdat', { ascending: false }).limit(20),
      ]);

      if (profileRes.error) setError(profileRes.error.message);
      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.error) setError(prev => prev ? prev + '; ' + postsRes.error.message : postsRes.error.message);
      if (postsRes.data) {
        const enriched = postsRes.data.map(p => ({
          ...p,
          author: { username: profileRes.data?.display_name || 'User', avatar_url: profileRes.data?.avatar_url },
          likes_count: 0,
          liked_by_me: false,
          comments_count: 0,
        }));
        setPosts(enriched);
      }
      if (productsRes.error) setError(prev => prev ? prev + '; ' + productsRes.error.message : productsRes.error.message);
      if (productsRes.data) {
        setProducts(productsRes.data as unknown as Product[]);
      }
      setLoading(false);
    }
    load().catch(e => { setError(e instanceof Error ? e.message : 'Failed to load profile'); setLoading(false); });
  }, [userId]);

  const username = profile?.display_name || 'User';
  const initial = username[0]?.toUpperCase() || '?';

  const primaryColor = isDark ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-cyan-5)';
  const secondaryColor = 'var(--mantine-color-emerald-5)';

  return (
    <Stack gap="md">
      <Paper withBorder p="sm" radius="lg" bg={isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-white)'}>
        <Group gap="sm">
          {onBack && (
            <ActionIcon
              variant="subtle"
              radius="lg"
              aria-label="Go back"
              color="gray"
              onClick={onBack}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
          )}
          <Avatar
            radius="lg"
            size={40}
            src={profile?.avatar_url || undefined}
            styles={{
              placeholder: {
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
              },
            }}
          >
            {profile?.avatar_url ? undefined : (
              <Text fw={700} size="lg" c="var(--mantine-color-white)" style={{ fontFamily: 'inherit' }}>{initial}</Text>
            )}
          </Avatar>
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} size="lg" c={isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-8)'} truncate style={{ fontFamily: 'inherit' }}>{username}</Text>
            <Text size="xs" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
              {posts.length} {t('posts', lang).toLowerCase()} &middot; {products.length} {t('products', lang).toLowerCase()}
            </Text>
          </Box>
        </Group>
      </Paper>

      <div role="tablist" className="flex gap-1 p-1 rounded-lg" style={{ background: isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)' }}>
        <Button
          role="tab"
          aria-selected={activeSection === 'posts'}
          variant={activeSection === 'posts' ? 'light' : 'subtle'}
          color="cyan"
          fullWidth
          style={{ flex: 1 }}
          leftSection={<IconMessageCircle size={16} />}
          onClick={() => setActiveSection('posts')}
        >
          {t('posts', lang)} ({posts.length})
        </Button>
        <Button
          role="tab"
          aria-selected={activeSection === 'products'}
          variant={activeSection === 'products' ? 'light' : 'subtle'}
          color="cyan"
          fullWidth
          style={{ flex: 1 }}
          leftSection={<IconPackage size={16} />}
          onClick={() => setActiveSection('products')}
        >
          {t('products', lang)} ({products.length})
        </Button>
      </div>

      {loading && (
          <Stack gap="md">
            {[1, 2, 3].map(i => (
              <Paper key={i} withBorder p="md" radius="lg" bg={isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-gray-0)'}>
                <Skeleton height={12} width={96} radius="sm" mb="sm" />
                <Skeleton height={12} radius="sm" />
              </Paper>
            ))}
          </Stack>
        )}

        {error && (
          <Paper radius="lg" p="md" ta="center" bg={isDark ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-red-0)'} withBorder style={{ borderColor: isDark ? 'var(--mantine-color-red-8)' : 'var(--mantine-color-red-2)' }}>
            <Text size="sm" c={isDark ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-red-5)'}>{error}</Text>
          </Paper>
        )}

        {!loading && !error && activeSection === 'posts' && posts.length === 0 && (
          <Text ta="center" size="sm" p="lg" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'}>
            {t('noPostsYet', lang)}
          </Text>
        )}

        {!loading && !error && activeSection === 'products' && products.length === 0 && (
          <Text ta="center" size="sm" p="lg" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'}>
            {t('noProductsYet', lang)}
          </Text>
        )}

        {activeSection === 'posts' && posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isDark={isDark}
            lang={lang}
            currentUserId={currentUser?.id || ''}
            username={currentUser?.email || 'User'}
            onLike={async (postId) => {
              const post = posts.find(p => p.id === postId);
              const { error } = await supabase.from('post_likes').insert({ user_id: currentUser?.id, post_id: postId });
              if (error) throw error;
              if (post && post.user_id !== currentUser?.id) {
                await supabase.from('notifications').insert({
                  user_id: post.user_id, type: 'like', actor_id: currentUser?.id, post_id: postId,
                }).then(undefined, () => {});
              }
            }}
            onUnlike={async (postId) => {
              const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUser?.id).eq('post_id', postId);
              if (error) throw error;
            }}
            onDelete={async (postId) => {
              await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser?.id);
              setPosts(prev => prev.filter(p => p.id !== postId));
            }}
            onEdit={async (postId, content) => {
              await supabase.from('posts').update({ content }).eq('id', postId).eq('user_id', currentUser?.id);
              setPosts(prev => prev.map(p => p.id === postId ? { ...p, content } : p));
            }}
            onViewProfile={(userId) => {
              if (userId !== userId) { /* already viewing this profile */ }
            }}
          />
        ))}

        {activeSection === 'products' && (
          <div className="grid grid-cols-1 gap-3">
            {products.map(product => (
              <Paper key={product.id} withBorder p="md" radius="lg" bg={isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-white)'}>
                <div className="flex items-start justify-between gap-3">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm" c={isDark ? 'var(--mantine-color-slate-1)' : 'var(--mantine-color-gray-9)'} truncate>{product.name}</Text>
                    <Text size="xs" mt={2} c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
                      {product.type} {product.thc ? `· ${product.thc}% THC` : ''}
                    </Text>
                  </Box>
                  <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Text fw={700} size="sm" c={isDark ? 'var(--mantine-color-emerald-5)' : 'var(--mantine-color-emerald-6)'}>{product.amount}g</Text>
                    {product.price > 0 && (
                      <Text size="xs" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>${product.price.toFixed(2)}</Text>
                    )}
                  </Box>
                </div>
                {product.rating > 0 && (
                  <Group gap={4} mt="sm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Text key={i} size="xs" c={i < Math.round(product.rating) ? 'var(--mantine-color-yellow-6)' : isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-3)'}>&#9733;</Text>
                    ))}
                    <Text size="xs" ml={4} c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>{product.rating.toFixed(1)}</Text>
                  </Group>
                )}
                {product.notes && (
                  <Text size="xs" mt="sm" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} lineClamp={2}>{product.notes}</Text>
                )}
              </Paper>
            ))}
          </div>
        )}
      </Stack>
  );
}