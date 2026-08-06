import { useState, useEffect, useCallback, memo } from 'react';
import type { Post, MarketplaceListing } from '../types';
import { supabase } from '../utils/supabase';
import { showToast } from './Toast';
import { Paper, Group, Stack, Text, Button, ActionIcon, Avatar, Badge, TextInput, SimpleGrid, Modal, UnstyledButton, Box } from '@mantine/core';
import { IconChartBar, IconUsers, IconShoppingCart, IconMessageCircle, IconStar, IconSettings, IconUser, IconLock, IconCheck, IconTrash, IconSearch, IconX, IconAlertTriangle } from '@tabler/icons-react';

interface AdminUser {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  role?: string;
  is_banned?: boolean;
  created_at: string;
}

interface AdminPost extends Post {
  author_name?: string;
  author_username?: string;
}

interface AdminListing extends MarketplaceListing {
  author_name?: string;
  author_username?: string;
}

interface AdminComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_username?: string;
}

interface AdminReview {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  author_name?: string;
  author_username?: string;
  listing_title?: string;
}

type AdminTab = 'overview' | 'users' | 'listings' | 'posts' | 'comments' | 'reviews';

interface AdminDashboardProps {
  isDark: boolean;
  currentUserId: string;
  onViewProfile?: (userId: string) => void;
}

export const AdminDashboard = memo(function AdminDashboard({ isDark, currentUserId, onViewProfile }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [confirm, setConfirm] = useState<{ kind: string; id: string; label: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  }, []);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setPosts([]); return; }
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, {
      name: p.display_name || p.username || 'Unknown',
      username: p.username || p.display_name || 'Unknown',
    }]));
    setPosts(data.map(p => ({
      ...p,
      author_name: profileMap.get(p.user_id)?.name || 'Unknown',
      author_username: profileMap.get(p.user_id)?.username || 'Unknown',
    })));
  }, []);

  const fetchListings = useCallback(async () => {
    const { data } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setListings([]); return; }
    const userIds = [...new Set(data.map(l => l.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, {
      name: p.display_name || p.username || 'Unknown',
      username: p.username || p.display_name || 'Unknown',
    }]));
    setListings(data.map(l => ({
      ...l,
      author_name: profileMap.get(l.user_id)?.name || 'Unknown',
      author_username: profileMap.get(l.user_id)?.username || 'Unknown',
    })));
  }, []);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase.from('post_comments').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setComments([]); return; }
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, {
      name: p.display_name || p.username || 'Unknown',
      username: p.username || p.display_name || 'Unknown',
    }]));
    setComments(data.map(c => ({
      ...c,
      author_name: profileMap.get(c.user_id)?.name || 'Unknown',
      author_username: profileMap.get(c.user_id)?.username || 'Unknown',
    })));
  }, []);

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase.from('listing_reviews').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setReviews([]); return; }
    const userIds = [...new Set(data.map(r => r.user_id))];
    const listingIds = [...new Set(data.map(r => r.listing_id))];
    const [{ data: profiles }, { data: listingsData }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, username').in('user_id', userIds),
      supabase.from('marketplace_listings').select('id, title').in('id', listingIds),
    ]);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, {
      name: p.display_name || p.username || 'Unknown',
      username: p.username || p.display_name || 'Unknown',
    }]));
    const listingMap = new Map((listingsData || []).map(l => [l.id, l.title]));
    setReviews(data.map(r => ({
      ...r,
      author_name: profileMap.get(r.user_id)?.name || 'Unknown',
      author_username: profileMap.get(r.user_id)?.username || 'Unknown',
      listing_title: listingMap.get(r.listing_id) || 'Unknown',
    })));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === 'users') fetchUsers().then(() => setLoading(false));
    else if (tab === 'posts') fetchPosts().then(() => setLoading(false));
    else if (tab === 'listings') fetchListings().then(() => setLoading(false));
    else if (tab === 'comments') fetchComments().then(() => setLoading(false));
    else if (tab === 'reviews') fetchReviews().then(() => setLoading(false));
    else setLoading(false);
  }, [tab, fetchUsers, fetchPosts, fetchListings, fetchComments, fetchReviews]);

  const handleSetRole = useCallback(async (userId: string, role: string) => {
    const { error } = await supabase.rpc('admin_set_role', { target_id: userId, new_role: role });
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role } : u));
    showToast({ id: 'role-set', title: '', body: `Role set to ${role}` });
  }, []);

  const handleSetBan = useCallback(async (userId: string, banned: boolean) => {
    const { error } = await supabase.rpc('admin_set_ban', { target_id: userId, banned });
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_banned: banned } : u));
    showToast({ id: 'ban-set', title: '', body: banned ? 'User banned' : 'User unbanned' });
  }, []);

  // --- Profile navigation resolved by username (mirrors CommunityPage) ---
  const handleViewUserByUsername = useCallback(async (username: string) => {
    if (!onViewProfile) return;
    if (/^[0-9a-f-]{36}$/i.test(username)) {
      onViewProfile(username);
      return;
    }
    const { data } = await supabase.from('profiles').select('user_id, username').eq('username', username).maybeSingle();
    if (data?.user_id) {
      onViewProfile(data.user_id);
    } else {
      const { data: byDisplay } = await supabase.from('profiles').select('user_id, username').eq('display_name', username).maybeSingle();
      onViewProfile(byDisplay?.user_id || username);
    }
  }, [onViewProfile]);

  // --- Listings: no removable status column exists in the type -> hard delete behind confirm dialog ---
  const handleDeleteListing = useCallback(async (listingId: string) => {
    const { error } = await supabase.from('marketplace_listings').delete().eq('id', listingId);
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setListings(prev => prev.filter(l => l.id !== listingId));
    showToast({ id: 'listing-deleted', title: '', body: 'Listing deleted' });
  }, []);

  // --- Posts: no status column exists -> hard delete behind confirm dialog ---
  const handleDeletePost = useCallback(async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setPosts(prev => prev.filter(p => p.id !== postId));
    showToast({ id: 'post-deleted', title: '', body: 'Post deleted' });
  }, []);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setComments(prev => prev.filter(c => c.id !== commentId));
    showToast({ id: 'comment-deleted', title: '', body: 'Comment deleted' });
  }, []);

  const handleDeleteReview = useCallback(async (reviewId: string) => {
    const { error } = await supabase.from('listing_reviews').delete().eq('id', reviewId);
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    showToast({ id: 'review-deleted', title: '', body: 'Review deleted' });
  }, []);

  const confirmAction = useCallback(() => {
    if (!confirm) return;
    if (confirm.kind === 'post') handleDeletePost(confirm.id);
    else if (confirm.kind === 'listing') handleDeleteListing(confirm.id);
    else if (confirm.kind === 'comment') handleDeleteComment(confirm.id);
    else if (confirm.kind === 'review') handleDeleteReview(confirm.id);
    setConfirm(null);
  }, [confirm, handleDeletePost, handleDeleteComment, handleDeleteReview]);

  const filteredUsers = users.filter(u =>
    !userSearch.trim() ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalListingValue = listings.reduce((sum, l) => sum + (l.price || 0), 0);

  interface TabDef {
    id: AdminTab;
    label: string;
    icon: typeof IconChartBar;
    count?: number;
  }
  const tabs: TabDef[] = [
    { id: 'overview', label: 'Overview', icon: IconChartBar },
    { id: 'users', label: 'Users', icon: IconUsers, count: users.length },
    { id: 'listings', label: 'Listings', icon: IconShoppingCart, count: listings.length },
    { id: 'posts', label: 'Posts', icon: IconMessageCircle, count: posts.length },
    { id: 'comments', label: 'Comments', icon: IconMessageCircle, count: comments.length },
    { id: 'reviews', label: 'Reviews', icon: IconStar, count: reviews.length },
  ];

  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : '#fff';
  const mutedText = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const bodyText = isDark ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-gray-7)';
  const frostText = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-9)';
  const amber = isDark ? 'var(--mantine-color-yellow-4)' : 'var(--mantine-color-yellow-6)';
  const green = isDark ? 'var(--mantine-color-green-4)' : 'var(--mantine-color-green-6)';
  const red = isDark ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-red-6)';
  const borderColor = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';

  return (
    <Stack gap="md">
      <Paper p={4} radius="md" style={{ backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <UnstyledButton
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-selected={active ? 'true' : 'false'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                background: active ? '#0b1120' : 'transparent',
                color: active ? 'var(--mantine-color-cyan-4)' : (isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)'),
              }}
            >
              <Icon size={14} stroke={1.5} />
              {t.label}
              {t.count !== undefined && (
                <span style={{ fontSize: 12, marginLeft: 2, color: active ? 'var(--mantine-color-cyan-4)' : mutedText }}>
                  ({t.count})
                </span>
              )}
            </UnstyledButton>
          );
        })}
      </Paper>

      {loading && (
        <Text ta="center" py="xl" size="sm" c="dimmed">Loading...</Text>
      )}

      {!loading && tab === 'overview' && (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
          <Paper p="md" radius="md" withBorder style={{ background: cardBg }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>{users.length}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Users</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder style={{ background: cardBg }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>{listings.length}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Listings</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder style={{ background: cardBg }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>{listings.filter(l => l.status === 'sold').length}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Sold listings</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder style={{ background: cardBg }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>{posts.length}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Posts</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder style={{ background: cardBg }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>{comments.length}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Comments</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder style={{ background: cardBg }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>{reviews.length}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Reviews</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder style={{ background: cardBg, gridColumn: 'span 2 / span 3' }}>
            <Text size="xl" fw={700} style={{ color: frostText }}>${totalListingValue.toLocaleString()}</Text>
            <Text size="xs" tt="uppercase" c="dimmed" lts={1}>Active listing value</Text>
          </Paper>
        </SimpleGrid>
      )}

      {!loading && tab === 'users' && (
        <Stack gap="sm">
          <TextInput
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder="Search by username or display name..."
            aria-label="Search users"
            leftSection={<IconSearch size={16} />}
            rightSection={userSearch ? (
              <ActionIcon variant="subtle" onClick={() => setUserSearch('')} aria-label="Clear search">
                <IconX size={16} />
              </ActionIcon>
            ) : undefined}
          />
          <Paper radius="md" withBorder style={{ background: cardBg, overflow: 'hidden' }}>
            <Group px="md" py="xs" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: mutedText, background: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)' }} wrap="nowrap">
              <Text style={{ flex: 1 }}>User</Text>
              <Text ta="center" w={90}>Role</Text>
              <Text ta="center" w={80}>Status</Text>
              <Text ta="right" w={110}>Actions</Text>
            </Group>
            {filteredUsers.map(u => (
              <Group
                key={u.user_id}
                px="sm"
                py="sm"
                align="center"
                wrap="nowrap"
                style={{ borderTop: `1px solid ${borderColor}`, fontSize: 14 }}
              >
                <Group gap="md" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
                  <Group gap={8} style={{ minWidth: 0 }} wrap="nowrap">
                    <UnstyledButton onClick={() => handleViewUserByUsername(u.username || u.user_id)} style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: frostText }}>
                      @{u.username || 'unknown'}
                    </UnstyledButton>
                    {u.display_name && u.display_name !== u.username && (
                      <Text size="xs" c="dimmed" truncate style={{ maxWidth: 140 }}>{u.display_name}</Text>
                    )}
                    {u.user_id === currentUserId && (
                      <Badge variant="filled" color="cyan" size="xs">you</Badge>
                    )}
                  </Group>
                </Group>
                <Group gap={4} style={{ width: 90 }} wrap="nowrap">
                  {u.role === 'admin' ? (
                    <span style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, color: amber }}>
                    <IconSettings size={12} /> Admin
                  </span>
                  ) : (
                    <Text size="xs" c="dimmed" style={{ fontSize: 12 }}>User</Text>
                  )}
                </Group>
                <Box style={{ width: 80, display: 'flex', justifyContent: 'center' }}>
                  {u.is_banned ? (
                    <span style={{ fontSize: 12, fontWeight: 500, display: 'flex', gap: 4, alignItems: 'center', color: red }}>
                    <IconLock size={12} /> Banned
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: green, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <IconCheck size={12} /> Active
                  </span>
                )}
              </Box>
              <Group gap={4} justify="flex-end" style={{ width: 110, flexShrink: 0 }} wrap="nowrap">
                {u.user_id !== currentUserId && (
                  <>
                    {u.role === 'admin' ? (
                      <ActionIcon variant="subtle" color="yellow" title="Demote to user" onClick={() => handleSetRole(u.user_id, 'user')}>
                        <IconUser size={16} />
                      </ActionIcon>
                    ) : (
                      <ActionIcon variant="subtle" color="yellow" title="Promote to admin" onClick={() => handleSetRole(u.user_id, 'admin')}>
                        <IconSettings size={16} />
                      </ActionIcon>
                    )}
                    {u.is_banned ? (
                      <ActionIcon variant="subtle" color="green" title="Unban user" onClick={() => handleSetBan(u.user_id, false)}>
                        <IconCheck size={16} />
                      </ActionIcon>
                    ) : (
                      <ActionIcon variant="subtle" color="red" title="Ban user" onClick={() => handleSetBan(u.user_id, true)}>
                        <IconLock size={16} />
                      </ActionIcon>
                    )}
                  </>
                )}
              </Group>
            </Group>
            ))}
            {filteredUsers.length === 0 && (
              <Text ta="center" py="xl" size="sm" c="dimmed">
                {userSearch ? 'No users found' : 'No users yet'}
              </Text>
            )}
          </Paper>
        </Stack>
      )}

      {!loading && tab === 'posts' && (
        <Stack gap="md">
          {posts.length === 0 ? (
            <Text ta="center" py="xl" size="sm" c="dimmed">No posts yet</Text>
          ) : (
            posts.map(p => (
              <Paper key={p.id} p="md" radius="md" withBorder style={{ background: cardBg, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar radius="sm" size={32} color="cyan">{(p.author_username || p.author_name)?.[0]?.toUpperCase() || '?'}</Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb={4} align="baseline" wrap="nowrap">
                    <UnstyledButton onClick={() => handleViewUserByUsername(p.author_username || p.user_id)} style={{ fontSize: 12, fontWeight: 600, color: frostText }}>
                      @{p.author_username || p.author_name}
                    </UnstyledButton>
                    {p.author_name && p.author_name !== p.author_username && (
                      <Text size="xs" c="dimmed">{p.author_name}</Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {new Date(p.created_at).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Text size="sm" style={{ color: bodyText, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</Text>
                </Box>
                <ActionIcon variant="subtle" color="red" title="Delete post" onClick={() => setConfirm({ kind: 'post', id: p.id, label: 'delete this post' })} style={{ flexShrink: 0 }}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Paper>
            ))
          )}
        </Stack>
      )}

      {!loading && tab === 'comments' && (
        <Stack gap="md">
          {comments.length === 0 ? (
            <Text ta="center" py="xl" size="sm" c="dimmed">No comments yet</Text>
          ) : (
            comments.map(c => (
              <Paper key={c.id} p="md" radius="md" withBorder style={{ background: cardBg, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar radius="sm" size={40} color="gray">{(c.author_username || c.author_name)?.[0]?.toUpperCase() || '?'}</Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb={4} align="baseline" wrap="nowrap">
                    <UnstyledButton onClick={() => handleViewUserByUsername(c.author_username || c.user_id)} style={{ fontSize: 12, fontWeight: 600, color: frostText }}>
                      @{c.author_username || c.author_name}
                    </UnstyledButton>
                    {c.author_name && c.author_name !== c.author_username && (
                      <Text size="xs" c="dimmed">{c.author_name}</Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {new Date(c.created_at).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Text size="sm" style={{ color: bodyText, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.content}</Text>
                </Box>
                <ActionIcon variant="subtle" color="red" title="Delete comment" onClick={() => setConfirm({ kind: 'comment', id: c.id, label: 'delete this comment' })} style={{ flexShrink: 0 }}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Paper>
            ))
          )}
        </Stack>
      )}

      {!loading && tab === 'listings' && (
        <Stack gap="sm">
          {listings.length === 0 ? (
            <Text ta="center" py="xl" size="sm" c="dimmed">No listings yet</Text>
          ) : (
            listings.map(l => (
              <Paper key={l.id} p="md" radius="md" withBorder style={{ background: cardBg, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar radius="sm" size={40} color="gray">{(l.author_username || l.author_name)?.[0]?.toUpperCase() || '?'}</Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb={4} align="baseline" wrap="wrap">
                    <UnstyledButton onClick={() => handleViewUserByUsername(l.author_username || l.user_id)} style={{ fontSize: 12, fontWeight: 600, color: frostText }}>
                      @{l.author_username || l.author_name}
                    </UnstyledButton>
                    {l.author_name && l.author_name !== l.author_username && (
                      <Text size="xs" c="dimmed">{l.author_name}</Text>
                    )}
                    <Text size="xs" style={{ fontWeight: 500, color: amber }}>${l.price}</Text>
                    <Badge size="xs" radius="sm" style={{ background: 'transparent' }} color={l.status === 'active' ? 'green' : 'gray'}>
                      {l.status}
                    </Badge>
                  </Group>
                  <Text size="sm" fw={500} truncate style={{ color: frostText }}>{l.title}</Text>
                  <Text size="xs" c="dimmed">{new Date(l.created_at).toLocaleDateString()}</Text>
                </Box>
                <ActionIcon variant="subtle" color="red" title="Delete listing" onClick={() => setConfirm({ kind: 'listing', id: l.id, label: 'delete this listing' })} style={{ flexShrink: 0 }}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Paper>
            ))
          )}
        </Stack>
      )}

      {!loading && tab === 'reviews' && (
        <Stack gap="sm">
          {reviews.length === 0 ? (
            <Text ta="center" py="xl" size="sm" c="dimmed">No reviews yet</Text>
          ) : (
            reviews.map(r => (
              <Paper key={r.id} p="md" radius="md" withBorder style={{ background: cardBg, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar radius="sm" size={40} color="gray">{(r.author_username || r.author_name)?.[0]?.toUpperCase() || '?'}</Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb={4} align="baseline" wrap="wrap">
                    <UnstyledButton onClick={() => handleViewUserByUsername(r.author_username || r.user_id)} style={{ fontSize: 12, fontWeight: 600, color: frostText }}>
                      @{r.author_username || r.author_name}
                    </UnstyledButton>
                    {r.author_name && r.author_name !== r.author_username && (
                      <Text size="xs" c="dimmed">{r.author_name}</Text>
                    )}
                    <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: amber }}>
                      <IconStar size={12} /> {r.rating}/5
                    </span>
                    <Text size="xs" c="dimmed">on {r.listing_title}</Text>
                  </Group>
                  <Text size="sm" style={{ color: bodyText, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.comment}</Text>
                </Box>
                <ActionIcon variant="subtle" color="red" title="Delete review" onClick={() => setConfirm({ kind: 'review', id: r.id, label: 'delete this review' })} style={{ flexShrink: 0 }}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Paper>
            ))
          )}
        </Stack>
      )}

      <Modal
        opened={!!confirm}
        onClose={() => setConfirm(null)}
        title={(
          <Group gap="xs" align="center">
            <IconAlertTriangle size={20} style={{ color: red }} />
            <Text size="sm" style={{ color: frostText }}>Confirm action</Text>
          </Group>
        )}
        centered
      >
        <Stack gap="md">
          <Text size="sm" style={{ color: bodyText }}>Are you sure you want to {confirm?.label}? This cannot be undone.</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" size="sm" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button size="sm" color="red" onClick={confirmAction}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
});