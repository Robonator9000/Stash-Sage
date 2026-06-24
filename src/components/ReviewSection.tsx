import { useState, useEffect, useCallback } from 'react';
import type { ListingReview } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { Star, MessageSquare, Trash2 } from 'lucide-react';

interface ReviewSectionProps {
  listingId: string;
  isOwner: boolean;
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onViewProfile?: (userId: string) => void;
}

export function ReviewSection({ listingId, isOwner, currentUserId, isDark, lang, onViewProfile }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const myReview = reviews.find(r => r.user_id === currentUserId);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setReviews(data.map(r => ({
      ...r,
      author: { username: profileMap.get(r.user_id)?.display_name || 'User', avatar_url: profileMap.get(r.user_id)?.avatar_url },
    })));
    setLoading(false);
  }, [listingId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = useCallback(async () => {
    if (!currentUserId || myRating === 0 || submitting) return;
    setSubmitting(true);
    try {
      if (myReview) {
        const { error } = await supabase.from('listing_reviews')
          .update({ rating: myRating, comment })
          .eq('id', myReview.id);
        if (error) { setSubmitting(false); return; }
      } else {
        const { error } = await supabase.from('listing_reviews')
          .insert({ listing_id: listingId, user_id: currentUserId, rating: myRating, comment });
        if (error) { setSubmitting(false); return; }
      }
      setComment('');
      setShowForm(false);
      fetchReviews();
    } finally {
      setSubmitting(false);
    }
  }, [currentUserId, myRating, comment, submitting, myReview, listingId, fetchReviews]);

  const handleDelete = useCallback(async (reviewId: string) => {
    await supabase.from('listing_reviews').delete().eq('id', reviewId);
    fetchReviews();
  }, [fetchReviews]);

  const openForm = useCallback(() => {
    if (myReview) { setMyRating(myReview.rating); setComment(myReview.comment); }
    setShowForm(true);
  }, [myReview]);

  return (
    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-edge' : 'border-gray-200'}`}>
      {/* Summary */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : isDark ? 'text-midnight' : 'text-gray-300'}`} />
          ))}
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-frost' : 'text-gray-700'}`}>
          {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : t('noReviews', lang)}
        </span>
      </div>

      {/* Write review button */}
      {currentUserId && !isOwner && (
        <button onClick={openForm}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mb-3 ${isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <MessageSquare className="w-3.5 h-3.5" />
          {myReview ? t('editReview', lang) : t('writeReview', lang)}
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-surface/50 border border-edge' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => setMyRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                className="p-0.5" aria-label={`${s} star${s > 1 ? 's' : ''}`}>
                <Star className={`w-6 h-6 transition-colors ${(hoverRating || myRating) >= s ? 'text-amber-400 fill-amber-400' : isDark ? 'text-midnight' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t('reviewPlaceholder', lang)} rows={2}
            className={`w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors ${isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-white text-gray-800 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'}`} />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSubmit} disabled={myRating === 0 || submitting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark disabled:opacity-50 transition-all">
              {submitting ? '...' : t('submit', lang)}
            </button>
            <button onClick={() => setShowForm(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}>
              {t('cancel', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {!loading && reviews.length === 0 && !showForm && (
        <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('noReviewsYet', lang)}</p>
      )}
      {reviews.map(r => (
        <div key={r.id} className={`flex gap-3 py-3 ${isDark ? '' : ''}`}>
          <button onClick={() => onViewProfile?.(r.user_id)} className="shrink-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${r.author?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
              {r.author?.avatar_url ? (
                <img src={r.author.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{(r.author?.username?.[0] || '?').toUpperCase()}</span>
              )}
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button onClick={() => onViewProfile?.(r.user_id)} className={`text-xs font-semibold hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                {r.author?.username || 'User'}
              </button>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : isDark ? 'text-midnight' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                {new Date(r.created_at).toLocaleDateString(lang)}
              </span>
              {r.user_id === currentUserId && (
                <button onClick={() => handleDelete(r.id)} className="ml-auto text-red-400 hover:text-red-500" aria-label="Delete review">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {r.comment && (
              <p className={`text-sm mt-1 ${isDark ? 'text-mist' : 'text-gray-600'}`}>{r.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
