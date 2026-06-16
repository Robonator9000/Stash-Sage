import { useState } from 'react';
import type { Post } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { CommentSection } from './CommentSection';
import { FollowButton } from './FollowButton';
import { showToast } from './Toast';

interface PostCardProps {
  post: Post;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  isFollowing?: boolean;
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onEdit?: (postId: string, content: string) => Promise<void>;
  onFollow?: (userId: string) => Promise<void>;
  onUnfollow?: (userId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
  onComment?: (userId: string, postId: string) => void;
}

export function PostCard({ post, isDark, lang, currentUserId, username, isFollowing, onLike, onUnlike, onDelete, onEdit, onFollow, onUnfollow, onViewProfile, onComment }: PostCardProps) {
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const isOwner = post.user_id === currentUserId;
  const liked = post.liked_by_me ?? false;
  const likesCount = post.likes_count ?? 0;

  async function handleEdit() {
    if (!onEdit || !editContent.trim() || editSubmitting) return;
    setEditSubmitting(true);
    try {
      await supabase.from('posts').update({ content: editContent.trim() }).eq('id', post.id).eq('user_id', currentUserId);
      await onEdit(post.id, editContent.trim());
      setEditing(false);
      showToast({ id: 'post-edited', title: '', body: t('postCreated', lang) });
    } catch {
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleLike() {
    setLiking(true);
    try {
      if (liked) {
        await onUnlike(post.id);
      } else {
        await onLike(post.id);
      }
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onViewProfile?.(post.user_id)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyanx to-emera shrink-0`}
        >
          <span className="text-white font-display font-bold text-sm">
            {(post.author?.username?.[0] || '?').toUpperCase()}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onViewProfile?.(post.user_id)}
              className={`font-display font-bold text-sm hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}
            >
              {post.author?.username || 'Unknown'}
            </button>
            {onFollow && onUnfollow && (
              <FollowButton
                userId={post.user_id}
                currentUserId={currentUserId}
                isFollowing={isFollowing ?? false}
                isDark={isDark}
                onFollow={onFollow}
                onUnfollow={onUnfollow}
              />
            )}
            <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
              {timeAgo(post.created_at, lang)}
            </span>
          </div>

          {editing ? (
            <div className="mb-2 space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value.slice(0, 500))}
                autoFocus
                className={`w-full text-sm px-3 py-2 rounded-xl outline-none resize-none transition-colors ${
                  isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-500'
                }`}
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={!editContent.trim() || editSubmitting}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditContent(post.content); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-sm mb-2 whitespace-pre-wrap ${isDark ? 'text-mist' : 'text-gray-600'}`}>
              {post.content}
            </p>
          )}

          {post.product_name && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 ${
              isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-700'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              {post.product_name}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleLike}
              disabled={liking}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                liked
                  ? 'text-orange-500'
                  : isDark ? 'text-muted hover:text-orange-400' : 'text-gray-400 hover:text-orange-500'
              }`}
            >
              {liked ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.262.797-.01.564.68 1.2 1.3 1.938 1.814.76.528 1.6.912 2.471 1.14.238.063.487-.008.634-.202a.5.5 0 00.063-.504c-.423-.977-1.093-1.85-1.852-2.574-.34-.326-.7-.632-1.077-.915a7.04 7.04 0 015.032.516z" clipRule="evenodd" />
                  <path d="M13.5 4.938A7 7 0 004.494 6.675c.203-.257.59-.262.797-.01.564.68 1.2 1.3 1.938 1.814.76.528 1.6.912 2.471 1.14.238.063.487-.008.634-.202a.5.5 0 00.063-.504c-.423-.977-1.093-1.85-1.852-2.574-.34-.326-.7-.632-1.077-.915z" opacity={0.3} />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
              )}
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                showComments
                  ? isDark ? 'text-cyanx' : 'text-cyan-600'
                  : isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              {(post.comments_count ?? 0) > 0 && <span>{post.comments_count}</span>}
            </button>

            {isOwner && (
              <>
                {onEdit && (
                  <button
                    onClick={() => { setEditing(true); setEditContent(post.content); }}
                    className={`ml-auto text-xs font-medium ${isDark ? 'text-muted hover:text-cyan-400' : 'text-gray-400 hover:text-cyan-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className={`text-xs font-medium ${isDark ? 'text-muted hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
                {showConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
                    <div className={`p-6 rounded-2xl max-w-xs w-full mx-4 ${isDark ? 'bg-card border border-edge' : 'bg-white border border-gray-200'}`}
                      onClick={e => e.stopPropagation()}>
                      <p className={`text-sm font-medium mb-4 ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                        {t('confirmDeletePost', lang)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => { await onDelete?.(post.id); setShowConfirm(false); }}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all"
                        >
                          {t('delete', lang)}
                        </button>
                        <button
                          onClick={() => setShowConfirm(false)}
                          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {t('cancel', lang)}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {showComments && (
            <CommentSection
              postId={post.id}
              postUserId={post.user_id}
              isDark={isDark}
              lang={lang}
              currentUserId={currentUserId}
              username={username}
              onComment={onComment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
