import { useState, useEffect, useCallback } from 'react';
import type { PostComment } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';

interface CommentSectionProps {
  postId: string;
  postUserId: string;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  username: string;
  onComment?: (userId: string, postId: string) => void;
}

export function CommentSection({ postId, postUserId, isDark, lang, currentUserId, username, onComment }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const buildThread = useCallback((flat: PostComment[]): PostComment[] => {
    const map = new Map<string, PostComment>();
    const roots: PostComment[] = [];
    for (const c of flat) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of flat) {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const enriched = data.map(c => ({
      ...c,
      author: {
        username: profileMap.get(c.user_id)?.display_name || 'Unknown',
        avatar_url: profileMap.get(c.user_id)?.avatar_url,
      },
    }));

    setComments(buildThread(enriched));
    setLoading(false);
  }, [postId, buildThread]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit() {
    const trimmed = newComment.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const { data, error: insertError } = await supabase.from('post_comments').insert({
      user_id: currentUserId,
      post_id: postId,
      content: trimmed,
      parent_id: replyingTo?.id || null,
    }).select('*').single();

    if (insertError || !data) {
      setSubmitting(false);
      setError(insertError?.message || 'Failed to post comment');
      return;
    }

    setNewComment('');
    setReplyingTo(null);
    setSubmitting(false);
    onComment?.(postUserId, postId);
    fetchComments();
  }

  async function handleDelete(commentId: string) {
    const { error: delError } = await supabase.from('post_comments').delete().eq('id', commentId).eq('user_id', currentUserId);
    if (delError) {
      setError(delError.message);
      return;
    }
    fetchComments();
  }

  function CommentItem({ comment, depth = 0 }: { comment: PostComment; depth?: number }) {
    const isOwner = comment.user_id === currentUserId;
    return (
      <div role="listitem" className={depth > 0 ? 'ml-6 mt-2' : 'mt-3'}>
        <div className="flex items-start gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyanx to-emera shrink-0`}>
            <span className="text-white font-display font-bold text-xs">
              {(comment.author?.username?.[0] || '?').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-display font-bold text-xs ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                {comment.author?.username || 'Unknown'}
              </span>
              <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                {timeAgo(comment.created_at, lang)}
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-600'}`}>
              {comment.content}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {depth < 2 && (
                <button
                  onClick={() => setReplyingTo({ id: comment.id, username: comment.author?.username || 'Unknown' })}
                  className={`text-xs font-medium ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t('reply', lang)}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  aria-label="Delete comment"
                  className={`text-xs ${isDark ? 'text-muted hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div role="list">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id={`comment-section-${postId}`} className={`mt-3 pt-3 border-t ${isDark ? 'border-edge' : 'border-gray-200'}`}>
      {loading && (
        <div className="space-y-2 pl-1">
          {[1, 2].map(i => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-6 h-6 rounded-lg animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-1">
                <div className={`h-2.5 w-16 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className={`h-2.5 w-3/4 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'} text-center py-2`}>
          {t('writeComment', lang)}
        </p>
      )}

      <div role="list" className="space-y-1">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {replyingTo && (
        <div className={`flex items-center gap-2 mt-2 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-midnight text-mist' : 'bg-gray-50 text-gray-500'}`}>
          <span>{t('replyTo', lang)} <span className="font-medium">{replyingTo.username}</span></span>
          <button onClick={() => setReplyingTo(null)} className="ml-auto hover:opacity-70">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyanx to-emera shrink-0`}>
          <span className="text-white font-display font-bold text-xs">
            {(username[0] || '?').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            id="comment-input"
            name="comment"
            value={newComment}
            onChange={e => setNewComment(e.target.value.slice(0, 500))}
            placeholder={replyingTo ? `${t('replyTo', lang)} ${replyingTo.username}...` : t('writeComment', lang)}
            className={`flex-1 text-sm px-3 py-1.5 rounded-xl outline-none transition-colors ${
              isDark ? 'bg-midnight text-frost placeholder-muted border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-cyan-500'
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            aria-label="Submit comment"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              newComment.trim() && !submitting
                ? 'text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark'
                : isDark ? 'bg-midnight text-muted cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6m0 0l-7 7m7-7l7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
