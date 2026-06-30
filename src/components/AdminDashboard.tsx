import { useState, useEffect, useCallback, memo } from 'react';
import type { Post, MarketplaceListing } from '../types';
import { supabase } from '../utils/supabase';
import { showToast } from './Toast';
import { Shield, ShieldOff, Ban, CheckCircle, Trash2, Search, X, MessageSquare, Star } from 'lucide-react';

interface AdminUser {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  role?: string;
  is_banned?: boolean;
  created_at: string;
}

interface AdminPost extends Post {
  author_name?: string;
}

interface AdminListing extends MarketplaceListing {
  author_name?: string;
}

interface AdminComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface AdminReview {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  author_name?: string;
  listing_title?: string;
}

interface AdminDashboardProps {
  isDark: boolean;
  currentUserId: string;
  onViewProfile?: (userId: string) => void;
}

export const AdminDashboard = memo(function AdminDashboard({ isDark, currentUserId, onViewProfile }: AdminDashboardProps) {
  const [tab, setTab] = useState<'users' | 'posts' | 'listings' | 'comments' | 'reviews'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  }, []);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setPosts([]); return; }
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || 'Unknown']));
    setPosts(data.map(p => ({ ...p, author_name: profileMap.get(p.user_id) || 'Unknown' })));
  }, []);

  const fetchListings = useCallback(async () => {
    const { data } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setListings([]); return; }
    const userIds = [...new Set(data.map(l => l.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || 'Unknown']));
    setListings(data.map(l => ({ ...l, author_name: profileMap.get(l.user_id) || 'Unknown' })));
  }, []);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase.from('post_comments').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setComments([]); return; }
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || 'Unknown']));
    setComments(data.map(c => ({ ...c, author_name: profileMap.get(c.user_id) || 'Unknown' })));
  }, []);

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase.from('listing_reviews').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data) { setReviews([]); return; }
    const userIds = [...new Set(data.map(r => r.user_id))];
    const listingIds = [...new Set(data.map(r => r.listing_id))];
    const [{ data: profiles }, { data: listingsData }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name').in('user_id', userIds),
      supabase.from('marketplace_listings').select('id, title').in('id', listingIds),
    ]);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || 'Unknown']));
    const listingMap = new Map((listingsData || []).map(l => [l.id, l.title]));
    setReviews(data.map(r => ({
      ...r,
      author_name: profileMap.get(r.user_id) || 'Unknown',
      listing_title: listingMap.get(r.listing_id) || 'Unknown',
    })));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === 'users') fetchUsers().then(() => setLoading(false));
    else if (tab === 'posts') fetchPosts().then(() => setLoading(false));
    else if (tab === 'listings') fetchListings().then(() => setLoading(false));
    else if (tab === 'comments') fetchComments().then(() => setLoading(false));
    else fetchReviews().then(() => setLoading(false));
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

  const handleDeletePost = useCallback(async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setPosts(prev => prev.filter(p => p.id !== postId));
    showToast({ id: 'post-deleted', title: '', body: 'Post deleted' });
  }, []);

  const handleDeleteListing = useCallback(async (listingId: string) => {
    const { error } = await supabase.from('marketplace_listings').delete().eq('id', listingId);
    if (error) { showToast({ id: 'admin-err', title: 'Error', body: error.message }); return; }
    setListings(prev => prev.filter(l => l.id !== listingId));
    showToast({ id: 'listing-deleted', title: '', body: 'Listing deleted' });
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

  const filteredUsers = users.filter(u =>
    !userSearch.trim() || u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Shield, count: users.length },
    { id: 'posts', label: 'Posts', icon: MessageSquare, count: posts.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'listings', label: 'Listings', icon: Trash2, count: listings.length },
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
  ] as const;

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: isDark ? '#1a1a2e' : '#f3f4f6' }}>
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.id
                ? isDark ? 'bg-[#0b1120] text-cyan-400' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span className={`text-xs ml-0.5 ${tab === t.id ? (isDark ? 'text-cyan-400' : 'text-gray-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className={`text-center py-12 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>Loading...</div>
      )}

      {!loading && tab === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="Search users..." aria-label="Search users"
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
          <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
            <div className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-muted bg-midnight' : 'text-gray-400 bg-gray-50'}`}>
              <span>User</span>
              <span className="text-center">Role</span>
              <span className="text-center">Status</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredUsers.map(u => (
              <div key={u.user_id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-3 items-center text-sm border-t ${isDark ? 'border-edge' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <button onClick={() => onViewProfile?.(u.user_id)}
                    className={`font-medium truncate hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                    {u.display_name || 'Unknown'}
                  </button>
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
                    <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>User</span>
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
              <p className={`text-center py-8 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                {userSearch ? 'No users found' : 'No users yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && tab === 'posts' && (
        <div className="space-y-2">
          {posts.length === 0 ? (
            <p className={`text-center py-12 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No posts yet</p>
          ) : (
            posts.map(p => (
              <div key={p.id} className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {p.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => onViewProfile?.(p.user_id)}
                      className={`text-xs font-semibold hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                      {p.author_name}
                    </button>
                    <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-mist' : 'text-gray-600'}`}>{p.content}</p>
                </div>
                <button onClick={() => handleDeletePost(p.id)} title="Delete post"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}>
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
            <p className={`text-center py-12 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No comments yet</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {c.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => onViewProfile?.(c.user_id)}
                      className={`text-xs font-semibold hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                      {c.author_name}
                    </button>
                    <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-mist' : 'text-gray-600'}`}>{c.content}</p>
                </div>
                <button onClick={() => handleDeleteComment(c.id)} title="Delete comment"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}>
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
            <p className={`text-center py-12 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No listings yet</p>
          ) : (
            listings.map(l => (
              <div key={l.id} className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {l.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => onViewProfile?.(l.user_id)}
                      className={`text-xs font-semibold hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                      {l.author_name}
                    </button>
                    <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      ${l.price}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.status === 'active'
                      ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      : isDark ? 'bg-midnight text-muted' : 'bg-gray-100 text-gray-400'}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>{l.title}</p>
                  <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{new Date(l.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDeleteListing(l.id)} title="Delete listing"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}>
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
            <p className={`text-center py-12 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No reviews yet</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isDark ? 'bg-midnight text-mist' : 'bg-gray-100 text-gray-500'}`}>
                  {r.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => onViewProfile?.(r.user_id)}
                      className={`text-xs font-semibold hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                      {r.author_name}
                    </button>
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      <Star className="w-3 h-3 fill-current" /> {r.rating}/5
                    </span>
                    <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      on {r.listing_title}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-mist' : 'text-gray-600'}`}>{r.comment}</p>
                </div>
                <button onClick={() => handleDeleteReview(r.id)} title="Delete review"
                  className={`p-1.5 rounded-lg shrink-0 transition-all ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
