import { useState, useEffect, memo } from 'react';
import type { Post } from '../types';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { CommentSection } from './CommentSection';
import { ProductView } from './ProductView';

interface PostDetailViewProps {
  post: Post;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  onClose: () => void;
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  onUnbookmark?: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onEdit?: (postId: string, content: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
  onHashtagClick?: (tag: string) => void;
  onComment?: (userId: string, postId: string) => void;
}

function renderContent(text: string, isDark: boolean, onHashtagClick?: (tag: string) => void) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (/^#\w+$/.test(part)) {
      return (
        <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHashtagClick?.(part.slice(1).toLowerCase()); }}
          className={`inline font-medium ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} hover:underline`}>
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function PostDetailImages({ images }: { images: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const count = images.length;
  if (count === 0) return null;
  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden mb-3">
        <img src={images[0]} alt="" loading="lazy" className="w-full max-h-96 object-cover" />
      </div>
    );
  }
  return (
    <div className="relative rounded-xl overflow-hidden mb-3">
      <img src={images[currentIdx]} alt="" loading="lazy" className="w-full max-h-96 object-cover" />
      {count > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => prev === 0 ? count - 1 : prev - 1); }} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev + 1) % count); }} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuotedPostDetail({ post, isDark, onHashtagClick }: { post: Post; isDark: boolean; onHashtagClick?: (tag: string) => void }) {
  return (
    <div className={`mb-3 p-3 rounded-xl border ${isDark ? 'bg-midnight/50 border-edge' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${post.author?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
          {post.author?.avatar_url ? (
            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover rounded-md" />
          ) : (
            <span className="text-white text-[8px] font-bold">{(post.author?.display_name?.[0] || post.author?.username?.[0] || '?').toUpperCase()}</span>
          )}
        </div>
        <span className={`text-xs font-display font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>{post.author?.display_name || post.author?.username || 'Unknown'}</span>
        <span className={`text-[10px] ${isDark ? 'text-muted' : 'text-gray-400'}`}>@{post.author?.username || 'user'}</span>
        <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{timeAgo(post.created_at, 'en')}</span>
      </div>
      <p className={`text-xs whitespace-pre-wrap ${isDark ? 'text-mist' : 'text-gray-600'}`}>{renderContent(post.content, isDark, onHashtagClick)}</p>
    </div>
  );
}

export const PostDetailView = memo(function PostDetailView({ post, isDark, lang, currentUserId, username, onClose, onLike, onUnlike, onBookmark, onUnbookmark, onDelete, onEdit, onViewProfile, onHashtagClick, onComment }: PostDetailViewProps) {
  const [currentPost, setCurrentPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const isOwner = currentPost.user_id === currentUserId;
  const liked = currentPost.liked_by_me ?? false;
  const likesCount = currentPost.likes_count ?? 0;
  const bookmarked = currentPost.bookmarked_by_me ?? false;
  const postImages = (currentPost.images?.filter(Boolean)) || (currentPost.image_url ? [currentPost.image_url] : []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleToggleLike() {
    setLiking(true);
    try {
      if (liked) { await onUnlike(currentPost.id); setCurrentPost(p => ({ ...p, liked_by_me: false, likes_count: Math.max(0, (p.likes_count ?? 1) - 1) })); }
      else { await onLike(currentPost.id); setCurrentPost(p => ({ ...p, liked_by_me: true, likes_count: (p.likes_count ?? 0) + 1 })); }
    } finally { setLiking(false); }
  }

  async function handleToggleBookmark() {
    if (bookmarked) { await onUnbookmark?.(currentPost.id); setCurrentPost(p => ({ ...p, bookmarked_by_me: false })); }
    else { await onBookmark?.(currentPost.id); setCurrentPost(p => ({ ...p, bookmarked_by_me: true })); }
  }

  async function handleEdit() {
    if (!onEdit || !editContent.trim() || editSubmitting) return;
    setEditSubmitting(true);
    try {
      await onEdit(currentPost.id, editContent.trim());
      setCurrentPost(p => ({ ...p, content: editContent.trim() }));
      setEditing(false);
    } finally { setEditSubmitting(false); }
  }

  async function handleDelete() {
    await onDelete?.(currentPost.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-5xl mx-auto my-0 sm:my-4 min-h-screen sm:min-h-0" onClick={e => e.stopPropagation()}>
        <div className={`flex flex-col sm:flex-row w-full sm:rounded-2xl overflow-hidden min-h-screen sm:min-h-[90vh] ${isDark ? 'bg-card' : 'bg-white'}`}>
          <div className="flex-1 max-w-full sm:max-w-[55%] flex flex-col border-r-0 sm:border-r border-edge/50 overflow-y-auto">
            <div className={`sticky top-0 z-10 flex items-center gap-3 p-3 ${isDark ? 'bg-card/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`}>
              <button onClick={onClose} aria-label="Close" className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-100 text-gray-700'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <span className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>Post</span>
            </div>

            <div className="px-4 pb-2">
              <div className="flex items-start gap-3 mb-3">
                <button onClick={() => onViewProfile?.(currentPost.user_id)} className={`w-10 h-10 rounded-xl shrink-0 overflow-hidden ${currentPost.author?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
                  {currentPost.author?.avatar_url ? <img src={currentPost.author.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <span className="text-white font-display font-bold text-sm">{(currentPost.author?.display_name?.[0] || currentPost.author?.username?.[0] || '?').toUpperCase()}</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => onViewProfile?.(currentPost.user_id)} className={`font-display font-bold text-sm hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>{currentPost.author?.display_name || currentPost.author?.username || 'Unknown'}</button>
                  <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>@{currentPost.author?.username || 'user'}</p>
                </div>
              </div>

              <p className={`text-base mb-3 whitespace-pre-wrap leading-relaxed ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                {renderContent(currentPost.content, isDark, onHashtagClick)}
              </p>

              {postImages.length > 0 && <PostDetailImages images={postImages} />}
              {currentPost.quoted_post && <QuotedPostDetail post={currentPost.quoted_post} isDark={isDark} onHashtagClick={onHashtagClick} />}

              {editing && (
                <div className="mb-3 space-y-2">
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value.slice(0, 500))} autoFocus
                    className={`w-full text-sm px-3 py-2 rounded-xl outline-none resize-none ${
                      isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-500'
                    }`} rows={3} />
                  <div className="flex gap-2">
                    <button onClick={handleEdit} disabled={!editContent.trim() || editSubmitting} className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-cyanx to-emera disabled:opacity-50">{editSubmitting ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => { setEditing(false); setEditContent(post.content); }} className={`px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                  </div>
                </div>
              )}

              {currentPost.product_name && currentPost.product_id && (
                <button type="button" onClick={() => setViewProductId(currentPost.product_id!)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 transition-all hover:opacity-80 ${isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-700'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  {currentPost.product_name}
                </button>
              )}
              {viewProductId && <ProductView productId={viewProductId} onClose={() => setViewProductId(null)} isDark={isDark} lang={lang} />}

              <div className={`py-3 border-t ${isDark ? 'border-edge' : 'border-gray-200'}`}>
                <p className={`text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                  {new Date(currentPost.created_at).toLocaleString(lang === 'en' ? 'en-US' : lang, { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>

              <div className={`py-3 border-t ${isDark ? 'border-edge' : 'border-gray-200'}`}>
                <div className="flex items-center gap-6 text-sm">
                  <span className={isDark ? 'text-muted' : 'text-gray-500'}><strong className={isDark ? 'text-frost' : 'text-gray-800'}>{likesCount}</strong> Likes</span>
                  <span className={isDark ? 'text-muted' : 'text-gray-500'}><strong className={isDark ? 'text-frost' : 'text-gray-800'}>{currentPost.comments_count ?? 0}</strong> Comments</span>
                </div>
              </div>

              <div className={`flex items-center justify-around py-2 border-t border-b ${isDark ? 'border-edge' : 'border-gray-200'}`}>
                <button onClick={handleToggleLike} disabled={liking} aria-label={liked ? 'Unlike' : 'Like'} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  liked ? 'text-orange-500' : isDark ? 'text-muted hover:text-orange-400 hover:bg-midnight' : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100'
                }`}>
                  <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={liked ? 0 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  </svg>
                  Like
                </button>

                {onBookmark && (
                  <button onClick={handleToggleBookmark} aria-label={bookmarked ? t('bookmarked', lang) : t('bookmark', lang)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    bookmarked ? 'text-cyanx' : isDark ? 'text-muted hover:text-cyan-400 hover:bg-midnight' : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'
                  }`}>
                    <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={bookmarked ? 0 : 1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                    {bookmarked ? t('bookmarked', lang) : t('bookmark', lang)}
                  </button>
                )}

                {isOwner && (
                  <>
                    {onEdit && !editing && (
                      <button onClick={() => setEditing(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'text-muted hover:text-cyan-400 hover:bg-midnight' : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit
                      </button>
                    )}
                    {onDelete && !editing && (
                      <button onClick={() => setShowConfirm(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-full sm:max-w-[45%] flex flex-col overflow-y-auto">
            <div className={`sticky top-0 z-10 p-3 ${isDark ? 'bg-card/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`}>
              <span className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>Replies</span>
            </div>
            <div className="flex-1 px-4 pb-4">
              <CommentSection
                postId={currentPost.id}
                postUserId={currentPost.user_id}
                isDark={isDark}
                lang={lang}
                currentUserId={currentUserId}
                username={username}
                onComment={onComment}
              />
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-[2px]" onClick={() => setShowConfirm(false)}>
          <div className={`p-6 rounded-2xl max-w-xs w-full mx-4 ${isDark ? 'bg-card border border-edge' : 'bg-white border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <p className={`text-sm font-medium mb-4 ${isDark ? 'text-frost' : 'text-gray-800'}`}>{t('confirmDeletePost', lang)}</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600">{t('delete', lang)}</button>
              <button onClick={() => setShowConfirm(false)} className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600'}`}>{t('cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
