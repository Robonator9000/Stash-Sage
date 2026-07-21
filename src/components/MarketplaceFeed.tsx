import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import type { MarketplaceListing, Product } from '../types';
import { supabase, deleteStorageImages } from '../utils/supabase';
import { t } from '../utils/translations';
import { MarketplaceCard } from './MarketplaceCard';
import { CreateListingModal } from './CreateListingModal';
import { showToast } from './Toast';
import { Plus, ArrowUpDown } from 'lucide-react';
import { getProfiles } from '../utils/profileCache';
import { Carousel } from '@mantine/carousel';
import { Paper, Text } from '@mantine/core';

interface MarketplaceFeedProps {
  isDark: boolean;
  lang: string;
  currentUserId: string;
  products: Product[];
  searchQuery: string;
  onViewProfile?: (userId: string) => void;
  onOpenChat?: (userId: string) => void;
}

export const MarketplaceFeed = memo(function MarketplaceFeed({ isDark, lang, currentUserId, products, searchQuery, onViewProfile, onOpenChat }: MarketplaceFeedProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const enrichListings = useCallback(async (rawListings: MarketplaceListing[]): Promise<MarketplaceListing[]> => {
    if (rawListings.length === 0) return [];
    const userIds = [...new Set(rawListings.map(l => l.user_id))];
    const listingIds = rawListings.map(l => l.id);
    const [profileMap, reviewsRes, savedRes] = await Promise.all([
      getProfiles(userIds),
      supabase.from('listing_reviews').select('listing_id, rating').in('listing_id', listingIds),
      currentUserId ? supabase.from('saved_listings').select('listing_id').eq('user_id', currentUserId).in('listing_id', listingIds) : { data: null },
    ]);
    const reviewsByListing = new Map<string, { sum: number; count: number }>();
    for (const r of reviewsRes.data || []) {
      const existing = reviewsByListing.get(r.listing_id) || { sum: 0, count: 0 };
      existing.sum += r.rating;
      existing.count += 1;
      reviewsByListing.set(r.listing_id, existing);
    }
    const savedSet = new Set((savedRes.data || []).map(s => s.listing_id));
    setSavedIds(savedSet);
    return rawListings.map(l => {
      const prof = profileMap.get(l.user_id);
      const stats = reviewsByListing.get(l.id);
      return {
        ...l,
        author: {
          username: prof?.username || 'User',
          display_name: prof?.display_name,
          avatar_url: prof?.avatar_url ?? undefined,
        } as MarketplaceListing['author'],
        saved_by_me: savedSet.has(l.id),
        avg_seller_rating: stats ? stats.sum / stats.count : undefined,
        seller_review_count: stats?.count,
      };
    });
  }, [currentUserId]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = supabase.from('marketplace_listings').select('*');
    const { data, error: fetchError } = await query.order('created_at', { ascending: false }).limit(50);
    if (fetchError) { setError(fetchError.message); setLoading(false); return; }
    const enriched = await enrichListings(data || []);
    setListings(enriched);
    setLoading(false);
  }, [enrichListings]);

  useEffect(() => { fetchListings().catch(e => { setError(e.message); setLoading(false); }); }, [fetchListings]);

  const filtered = useMemo(() => listings.filter(l => {
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (searchQuery.trim() && !l.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  }), [listings, categoryFilter, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: listings.length };
    for (const l of listings) {
      counts[l.category] = (counts[l.category] || 0) + 1;
    }
    return counts;
  }, [listings]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [filtered, sortBy, pinnedIds]);

  const handleCreate = useCallback(async (data: Partial<MarketplaceListing>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error: insertError, data: created } = await supabase.from('marketplace_listings').insert({ ...data, user_id: currentUserId, status: 'active' }).select('id, title').single();
      if (insertError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: insertError.message }); return; }
      showToast({ id: 'listing-created', title: '', body: t('listingCreated', lang) });
      setShowCreateModal(false);
      fetchListings();
      if (created) {
        const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', currentUserId).limit(20);
        if (followers?.length) {
          supabase.from('notifications').insert(followers.map(f => ({
            user_id: f.follower_id, type: 'new_listing', actor_id: currentUserId, listing_id: created.id, listing_title: created.title,
          }))).then(undefined, () => {});
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang, fetchListings]);

  const handleUpdate = useCallback(async (data: Partial<MarketplaceListing>) => {
    if (submitting || !editingListing) return;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.from('marketplace_listings').update(data).eq('id', editingListing.id).eq('user_id', currentUserId);
      if (updateError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: updateError.message }); return; }
      showToast({ id: 'listing-updated', title: '', body: t('listingUpdated', lang) });
      setEditingListing(null);
      fetchListings();
    } finally {
      setSubmitting(false);
    }
  }, [submitting, editingListing, currentUserId, lang, fetchListings]);

  const handleDelete = useCallback(async (id: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data: listing } = await supabase.from('marketplace_listings').select('image_url, images').eq('id', id).eq('user_id', currentUserId).single();
      const imagesToDelete = [...(listing?.images || []), ...(listing?.image_url ? [listing.image_url] : [])].filter(Boolean);
      const { error: deleteError } = await supabase.from('marketplace_listings').delete().eq('id', id).eq('user_id', currentUserId);
      if (deleteError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: deleteError.message }); return; }
      deleteStorageImages(imagesToDelete);
      showToast({ id: 'listing-deleted', title: '', body: t('listingDeleted', lang) });
      fetchListings();
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang, fetchListings]);

  const handleMarkSold = useCallback(async (id: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data: listing } = await supabase.from('marketplace_listings').select('title, user_id').eq('id', id).single();
      const { error: updateError } = await supabase.from('marketplace_listings').update({ status: 'sold' }).eq('id', id).eq('user_id', currentUserId);
      if (updateError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: updateError.message }); return; }
      fetchListings();
      if (listing) {
        const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', currentUserId).limit(20);
        if (followers?.length) {
          supabase.from('notifications').insert(followers.map(f => ({
            user_id: f.follower_id, type: 'listing_sold', actor_id: currentUserId, listing_id: id, listing_title: listing.title,
          }))).then(undefined, () => {});
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang, fetchListings]);

  const handleEditListing = useCallback((l: MarketplaceListing) => setEditingListing(l), []);
  const handleCloseCreate = useCallback(() => setShowCreateModal(false), []);
  const handleCloseEdit = useCallback(() => setEditingListing(null), []);
  const handleOpenCreate = useCallback(() => setShowCreateModal(true), []);

  const handlePinToggle = useCallback((listingId: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  }, []);

  const handleToggleSave = useCallback(async (listingId: string) => {
    if (!currentUserId) return;
    const isSaved = savedIds.has(listingId);
    if (isSaved) {
      await supabase.from('saved_listings').delete().eq('user_id', currentUserId).eq('listing_id', listingId);
      setSavedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
    } else {
      await supabase.from('saved_listings').insert({ user_id: currentUserId, listing_id: listingId });
      setSavedIds(prev => new Set(prev).add(listingId));
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, saved_by_me: !isSaved } : l));
  }, [currentUserId, savedIds]);

  const handleStartChat = useCallback(async (listingId: string) => {
    if (!currentUserId) return;
    const { data: listing } = await supabase.from('marketplace_listings').select('user_id').eq('id', listingId).single();
    if (!listing || listing.user_id === currentUserId) return;
    const { data: existing } = await supabase.from('conversations')
      .select('id').eq('listing_id', listingId).eq('buyer_id', currentUserId).maybeSingle();
    if (!existing) {
      await supabase.from('conversations')
        .insert({ listing_id: listingId, buyer_id: currentUserId, seller_id: listing.user_id })
        .then(undefined, () => {});
    }
    onOpenChat?.(listing.user_id);
  }, [currentUserId, onOpenChat]);

  return (
    <div className="space-y-5 mx-auto max-w-7xl px-1">
      <>
      {/* Sell button - centered prominent */}
      <div className="flex justify-center">
        {currentUserId ? (
          <button onClick={handleOpenCreate} aria-label="Create new listing"
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/25 hover:shadow-xl hover:shadow-cyanx/30 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            {t('sellSomething', lang)}
          </button>
        ) : (
          <div className={`w-full p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-surface/50 border border-edge text-mist' : 'bg-white border border-gray-200 text-gray-500'}`}>
            Sign in to create a listing.
          </div>
        )}
      </div>

      {/* Category carousel */}
      <Carousel
        slideSize={90}
        slideGap="xs"
        height={100}
        controlsOffset="xs"
        withControls
        controlSize={28}
        emblaOptions={{ align: 'start', slidesToScroll: 3 }}
      >
        {[
          { id: 'all', label: 'All', icon: '📋' },
          { id: 'flower', label: 'Flower', icon: '🌿' },
          { id: 'concentrate', label: 'Concentrate', icon: '💎' },
          { id: 'edible', label: 'Edible', icon: '🍪' },
          { id: 'cartridge', label: 'Cartridge', icon: '🖊️' },
          { id: 'pre-roll', label: 'Pre-Roll', icon: '🚬' },
          { id: 'tincture', label: 'Tincture', icon: '💧' },
          { id: 'topical', label: 'Topical', icon: '🧴' },
          { id: 'seeds', label: 'Seeds', icon: '🌱' },
          { id: 'accessories', label: 'Access.', icon: '🔧' },
          { id: 'other', label: 'Other', icon: '📦' },
        ].map(cat => (
          <Carousel.Slide key={cat.id}>
            <Paper
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                height: 90, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                cursor: 'pointer',
                background: categoryFilter === cat.id
                  ? 'linear-gradient(135deg, var(--mantine-color-cyan-6), var(--mantine-color-blue-6))'
                  : isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                color: categoryFilter === cat.id ? '#fff' : undefined,
                border: categoryFilter === cat.id ? 'none' : `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
              }}
              radius="md"
              withBorder={categoryFilter !== 'all'}
            >
              <Text size="xl">{cat.icon}</Text>
              <Text size="xs" fw={600}>{cat.label}</Text>
              <Text size="xs" c={categoryFilter === cat.id ? 'white' : 'dimmed'}>{categoryCounts[cat.id] || 0}</Text>
            </Paper>
          </Carousel.Slide>
        ))}
      </Carousel>

      {/* Compact sort */}
      <div className={`flex items-center gap-1 p-1 rounded-xl w-fit ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        <ArrowUpDown className={`w-3.5 h-3.5 ml-1.5 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
        {([
          { id: 'newest' as const, label: t('sortNewest', lang) },
          { id: 'price_low' as const, label: t('sortPriceLow', lang) },
          { id: 'price_high' as const, label: t('sortPriceHigh', lang) },
        ]).map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)} aria-pressed={sortBy === s.id}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${sortBy === s.id ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" aria-busy="true" aria-label="Loading listings">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`aspect-square rounded-2xl overflow-hidden animate-pulse ${isDark ? 'bg-surface/60 border border-edge' : 'bg-white border border-gray-200'}`}>
              <div className={`w-full h-full ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-500 border border-red-200'}`} role="alert">
          {error}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className={`p-10 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`} role="status">
          <div className="text-4xl mb-3 opacity-60">&#128270;</div>
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-frost' : 'text-gray-800'}`}>No listings found</p>
          <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-muted' : 'text-gray-400'}`}>
            Try browsing a different category or adjust your search terms.
          </p>
          {categoryFilter !== 'all' && (
            <button onClick={() => setCategoryFilter('all')}
              className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isDark ? 'bg-midnight text-cyanx hover:bg-midnight/80' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Browse all categories
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {sorted.map(listing => (
          <MarketplaceCard key={listing.id} listing={listing} products={products} isDark={isDark} lang={lang} currentUserId={currentUserId}
            isPinned={pinnedIds.has(listing.id)} onPinToggle={handlePinToggle}
            onEdit={handleEditListing} onDelete={handleDelete} onMarkSold={handleMarkSold} onViewProfile={onViewProfile}
            onSave={handleToggleSave} onStartChat={handleStartChat} />
        ))}
      </div>

      {showCreateModal && (
        <CreateListingModal isDark={isDark} lang={lang} products={products} currentUserId={currentUserId} onSubmit={handleCreate} onClose={handleCloseCreate} />
      )}

      {editingListing && (
        <CreateListingModal isDark={isDark} lang={lang} products={products} currentUserId={currentUserId} initial={editingListing} onSubmit={handleUpdate} onClose={handleCloseEdit} />
      )}
      </>
    </div>
  );
});
