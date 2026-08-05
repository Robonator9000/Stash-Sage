import { useState, useEffect, useCallback } from 'react';
import type { ListingReview } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { Box, Text, Group, Textarea, Button, Avatar, ActionIcon, Paper, UnstyledButton } from '@mantine/core';
import { IconStar, IconMessageCircle, IconTrash } from '@tabler/icons-react';

interface ReviewSectionProps {
  listingId: string;
  isOwner: boolean;
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onViewProfile?: (userId: string) => void;
}

const amber = '#f59e0b';
const avatarGradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';

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
    <Box>
      <Group gap="sm" mb="xs">
        {[1, 2, 3, 4, 5].map(s => (
          <IconStar key={s} size={16} fill={s <= Math.round(avgRating) ? 'currentColor' : 'none'} style={{ color: s <= Math.round(avgRating) ? amber : (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-3)') }} />
        ))}
        <Text size="sm" fw={500} style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-7)' }}>
          {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : t('noReviews', lang)}
        </Text>
      </Group>

      {currentUserId && !isOwner && (
        <Button onClick={openForm} variant="default" size="xs" mb="sm" leftSection={<IconMessageCircle size={14} />}>
          {myReview ? t('editReview', lang) : t('writeReview', lang)}
        </Button>
      )}

      {showForm && (
        <Paper p="sm" radius="md" mb="sm" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)' }}>
          <Group gap={4} mb="sm">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => setMyRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                style={{ padding: 2, background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label={`${s} star${s > 1 ? 's' : ''}`}>
                <IconStar size={24} fill={(hoverRating || myRating) >= s ? 'currentColor' : 'none'} style={{ color: (hoverRating || myRating) >= s ? amber : (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-3)') }} />
              </button>
            ))}
          </Group>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('reviewPlaceholder', lang)}
            minRows={2}
          />
          <Group gap="sm" mt="sm">
            <Button variant="gradient" gradient={{ from: 'cyan', to: 'emerald' }} onClick={handleSubmit} disabled={myRating === 0 || submitting}>
              {submitting ? '...' : t('submit', lang)}
            </Button>
            <Button variant="subtle" onClick={() => setShowForm(false)}>
              {t('cancel', lang)}
            </Button>
          </Group>
        </Paper>
      )}

      {!loading && reviews.length === 0 && !showForm && (
        <Text size="xs" c="dimmed">{t('noReviewsYet', lang)}</Text>
      )}
      {reviews.map(r => (
        <Group key={r.id} gap="md" py="sm" align="flex-start" wrap="nowrap">
          <UnstyledButton onClick={() => onViewProfile?.(r.user_id)} style={{ flexShrink: 0 }}>
            <Avatar size={32} radius="md" src={r.author?.avatar_url} style={{ backgroundImage: avatarGradient }}>
              {(r.author?.username?.[0] || '?').toUpperCase()}
            </Avatar>
          </UnstyledButton>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center" wrap="wrap">
              <UnstyledButton onClick={() => onViewProfile?.(r.user_id)}>
                <Text size="xs" fw={600} className="hover:underline" style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>
                  {r.author?.username || 'User'}
                </Text>
              </UnstyledButton>
              <Group gap={2}>
                {[1, 2, 3, 4, 5].map(s => (
                  <IconStar key={s} size={12} fill={s <= r.rating ? 'currentColor' : 'none'} style={{ color: s <= r.rating ? amber : (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-3)') }} />
                ))}
              </Group>
              <Text size="xs" c="dimmed">
                {new Date(r.created_at).toLocaleDateString(lang)}
              </Text>
              {r.user_id === currentUserId && (
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDelete(r.id)} aria-label="Delete review" style={{ marginLeft: 'auto' }}>
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </Group>
            {r.comment && (
              <Text size="sm" mt={4} style={{ color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-7)' }}>{r.comment}</Text>
            )}
          </Box>
        </Group>
      ))}
    </Box>
  );
}