import { useState, useEffect, useCallback, memo } from 'react';
import type { Post, MarketplaceListing } from '../types';
import { supabase } from '../utils/supabase';
import { showToast } from './Toast';
import { Shield, ShieldOff, Ban, CheckCircle, Trash2, Search, X, MessageSquare, Star, BarChart3, AlertTriangle } from 'lucide-react';

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
    icon: typeof Shield;
    count?: number;
  }
  const tabs: TabDef[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Shield, count: users.length },
    { id: 'listings', label: 'Listings', icon: Trash2, count: listings.length },
    { id: 'posts', label: 'Posts', icon: MessageSquare, count: posts.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
  ];

  const cardClass = isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200';
  const mutedText = isDark ? 'text-muted' : 'text-gray-400';
  const bodyText = isDark ? 'text-mist' : 'text-gray-600';
  const frostText = isDark ? 'text-frost' : 'text-gray-800';
  const hoverBtn = isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100';

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: isDark ? '#1a1a2e' : '#f3f4f6' }}>
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id as AdminTab)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.id
                ? isDark ? 'bg-[#0b1120] text-cyan-400' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && (
              <span className={`text-xs ml-0.5 ${tab === t.id ? (isDark ? 'text-cyan-400' : 'text-gray-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                ({t.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className={`text-center py-12 text-sm ${mutedText}`}>Loading...</div>
      )}

      {!loading && tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={`rounded-2xl p-4 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>{users.length}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Users</div>
          </div>
          <div className={`rounded-2xl p-4 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>{listings.length}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Listings</div>
          </div>
          <div className={`rounded-2xl p-4 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>{listings.filter(l => l.status === 'sold').length}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Sold listings</div>
          </div>
          <div className={`rounded-2xl p-4 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>{posts.length}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Posts</div>
          </div>
          <div className={`rounded-2xl p-4 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>{comments.length}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Comments</div>
          </div>
          <div className={`rounded-2xl p-4 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>{reviews.length}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Reviews</div>
          </div>
          <div className={`rounded-2xl p-4 col-span-2 sm:col-span-3 ${cardClass}`}>
            <div className={`text-2xl font-bold ${frostText}`}>${totalListingValue.toLocaleString()}</div>
            <div className={`text-xs uppercase tracking-wider ${mutedText}`}>Active listing value</div>
          </div>
        </div>
      )}

      {!loading && tab === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="Search by username or display name..." aria-label="Search users"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
                isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-400'
              }`} />
            {userSearch && (
              <button onClick={() => setUserSearch('')} aria-label="Clear search"
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className={`rounded-2xl overflow-hidden ${cardClass}`}>
            <div className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-muted bg-midnight' : 'text-gray-400 bg-gray-50'}`}>
              <span>User</span>
              <span className="text-center">Role</span>
              <span className="text-center">Status</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredUsers.map(u => (
              <div key={u.user_id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-3 items-center text-sm border-t ${isDark ? 'border-edge' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <button onClick={() => handleViewUserByUsername(u.username || u.user_id)}
                    className={`font-medium truncate hover:underline ${frostText}`}>
                    @{u.username || 'unknown'}
                  </button>
                  {u.display_name && u.display_name !== u.username && (
                    <span className={`text-xs truncate ${mutedText}`}>{u.display_name}</span>
                  )}
                  {u.user_id === currentUserId && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-cyanx/20 text-cyanx' : 'bg-cyan-100 text-cyan-700'}`}>you</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {u.role === 'admin' ? (
                    <span className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className={`text-xs ${mutedText}`}>User</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {u.is_banned ? (
                    <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Banned
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 justify-end shrink-0">
                  {u.user_id !== currentUserId && (
                    <>
                      {u.role === 'admin' ? (
                        <button onClick={() => handleSetRole(u.user_id, 'user')} title="Demote to user"
                          className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-muted hover:text-amber-400 hover:bg-midnight' : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'}`}>
                          <ShieldOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => handleSetRole(u.user_id, 'admin')} title="Promote to admin"
                          className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-muted hover:text-amber-400 hover:bg-midnight' : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'}`}>
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {u.is_banned ? (
                        <button onClick={() => handleSetBan(u.user_id, false)} title="Unban user"
                          className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-muted hover:text-emerald-400 hover:bg-midnight' : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-100'}`}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => handleSetBan(u.user_id, true)} title="Ban user"
                          className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}>
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className={`text-center py-8 text-sm ${mutedText}`}>
                {userSearch ? 'No users found' : 'No users yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && tab === 'posts' && (
        <div className="space-y-2">
          {posts.length === 0 ? (
            <p className={`text-center py-12 text-sm ${mutedText}`}>No posts yet</p>
          ) : (
            posts.map(p => (
              <div key={p.id} className={`flex items-start gap-3 p-4 rounded-2xl ${cardClass}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {(p.author_username || p.author_name)?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => handleViewUserByUsername(p.author_username || p.user_id)}
                      className={`text-xs font-semibold hover:underline ${frostText}`}>
                      @{p.author_username || p.author_name}
                    </button>
                    {p.author_name && p.author_name !== p.author_username && (
                      <span className={`text-xs ${mutedText}`}>{p.author_name}</span>
                    )}
                    <span className={`text-xs ${mutedText}`}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${bodyText}`}>{p.content}</p>
                </div>
                <button onClick={() => setConfirm({ kind: 'post', id: p.id, label: 'delete this post' })} title="Delete post"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${hoverBtn}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === 'comments' && (
        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className={`text-center py-12 text-sm ${mutedText}`}>No comments yet</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className={`flex items-start gap-3 p-4 rounded-2xl ${cardClass}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {(c.author_username || c.author_name)?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => handleViewUserByUsername(c.author_username || c.user_id)}
                      className={`text-xs font-semibold hover:underline ${frostText}`}>
                      @{c.author_username || c.author_name}
                    </button>
                    {c.author_name && c.author_name !== c.author_username && (
                      <span className={`text-xs ${mutedText}`}>{c.author_name}</span>
                    )}
                    <span className={`text-xs ${mutedText}`}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${bodyText}`}>{c.content}</p>
                </div>
                <button onClick={() => setConfirm({ kind: 'comment', id: c.id, label: 'delete this comment' })} title="Delete comment"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${hoverBtn}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === 'listings' && (
        <div className="space-y-2">
          {listings.length === 0 ? (
            <p className={`text-center py-12 text-sm ${mutedText}`}>No listings yet</p>
          ) : (
            listings.map(l => (
              <div key={l.id} className={`flex items-start gap-3 p-4 rounded-2xl ${cardClass}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {(l.author_username || l.author_name)?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <button onClick={() => handleViewUserByUsername(l.author_username || l.user_id)}
                      className={`text-xs font-semibold hover:underline ${frostText}`}>
                      @{l.author_username || l.author_name}
                    </button>
                    {l.author_name && l.author_name !== l.author_username && (
                      <span className={`text-xs ${mutedText}`}>{l.author_name}</span>
                    )}
                    <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      ${l.price}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.status === 'active'
                      ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      : isDark ? 'bg-midnight text-muted' : 'bg-gray-100 text-gray-400'}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className={`text-sm font-medium truncate ${frostText}`}>{l.title}</p>
                  <p className={`text-xs ${mutedText}`}>{new Date(l.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setConfirm({ kind: 'listing', id: l.id, label: 'delete this listing' })} title="Delete listing"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${hoverBtn}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === 'reviews' && (
        <div className="space-y-2">
          {reviews.length === 0 ? (
            <p className={`text-center py-12 text-sm ${mutedText}`}>No reviews yet</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className={`flex items-start gap-3 p-4 rounded-2xl ${cardClass}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {(r.author_username || r.author_name)?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => handleViewUserByUsername(r.author_username || r.user_id)}
                      className={`text-xs font-semibold hover:underline ${frostText}`}>
                      @{r.author_username || r.author_name}
                    </button>
                    {r.author_name && r.author_name !== r.author_username && (
                      <span className={`text-xs ${mutedText}`}>{r.author_name}</span>
                    )}
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      <Star className="w-3 h-3 fill-current" /> {r.rating}/5
                    </span>
                    <span className={`text-xs ${mutedText}`}>
                      on {r.listing_title}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${bodyText}`}>{r.comment}</p>
                </div>
                <button onClick={() => setConfirm({ kind: 'review', id: r.id, label: 'delete this review' })} title="Delete review"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${hoverBtn}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirm(null)}>
          <div className={`w-full max-w-sm rounded-2xl p-5 ${cardClass}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className={`text-sm font-semibold ${frostText}`}>Confirm action</h3>
            </div>
            <p className={`text-sm ${bodyText} mb-4`}>Are you sure you want to {confirm.label}? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${isDark ? 'text-muted hover:bg-midnight' : 'text-gray-500 hover:bg-gray-100'}`}>
                Cancel
              </button>
              <button onClick={confirmAction}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
