import { useState, useEffect } from 'react';
import type { Post } from '../types';
import { supabase } from '../utils/supabase';
import { PostCard } from './PostCard';
import { getProfiles } from '../utils/profileCache';

export function BookmarksPage({ isDark, lang, currentUserId, username, onViewProfile, onViewPost }: {
  isDark: boolean; lang: string; currentUserId: string; username: string;
  onViewProfile?: (uid: string) => void;
  onViewPost?: (pid: string) => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }
    supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).then(async ({ data: bookmarks }) => {
      if (!bookmarks || bookmarks.length === 0) { setLoading(false); return; }
      const ids = bookmarks.map(b => b.post_id);
      const { data: rawPosts } = await supabase.from('posts').select('*').in('id', ids).order('created_at', { ascending: false });
      if (!rawPosts) { setLoading(false); return; }
      const userIds = [...new Set(rawPosts.map(p => p.user_id))];
      const profileMap = await getProfiles(userIds);
      const enriched: Post[] = rawPosts.map(p => ({
        ...p, liked_by_me: false, likes_count: 0, comments_count: 0, bookmarked_by_me: true,
        author: profileMap.get(p.user_id) || { username: 'Unknown' },
      }));
      setPosts(enriched);
      setLoading(false);
    });
  }, [currentUserId]);

  async function removeBookmark(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from('bookmarks').delete().eq('user_id', currentUserId).eq('post_id', postId);
  }

  if (loading) return <div className={`text-center py-16 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>Loading...</div>;
  if (posts.length === 0) return <div className={`text-center py-16 text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No bookmarked posts</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {posts.map(post => (
        <PostCard key={post.id} post={post} isDark={isDark} lang={lang}
          currentUserId={currentUserId} username={username}
          onLike={async () => {}} onUnlike={async () => {}}
          onBookmark={removeBookmark} onUnbookmark={removeBookmark}
          onViewProfile={onViewProfile} onPostClick={onViewPost}
        />
      ))}
    </div>
  );
}
