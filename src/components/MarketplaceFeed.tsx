import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import type { MarketplaceListing, Product } from '../types';
import { MARKETPLACE_CATEGORIES } from '../types';
import { supabase, deleteStorageImages } from '../utils/supabase';
import { t } from '../utils/translations';
import { MarketplaceCard } from './MarketplaceCard';
import { CreateListingModal } from './CreateListingModal';
import { ChatInbox } from './ChatInbox';
import { showToast } from './Toast';
import { Plus, Search, ArrowUpDown, SlidersHorizontal, X, Bookmark, MessageCircle } from 'lucide-react';

interface MarketplaceFeedProps {
  isDark: boolean;
  lang: string;
  currentUserId: string;
  products: Product[];
  onViewProfile?: (userId: string) => void;
}

export const MarketplaceFeed = memo(function MarketplaceFeed({ isDark, lang, currentUserId, products, onViewProfile }: MarketplaceFeedProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  const enrichListings = useCallback(async (rawListings: MarketplaceListing[]): Promise<MarketplaceListing[]> => {
    if (rawListings.length === 0) return [];
    const userIds = [...new Set(rawListings.map(l => l.user_id))];
    const listingIds = rawListings.map(l => l.id);
    const [profilesRes, reviewsRes, savedRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
      supabase.from('listing_reviews').select('listing_id, rating').in('listing_id', listingIds),
      currentUserId ? supabase.from('saved_listings').select('listing_id').eq('user_id', currentUserId).in('listing_id', listingIds) : { data: null },
    ]);
    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
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
      const stats = reviewsByListing.get(l.id);
      return {
        ...l,
        author: { username: profileMap.get(l.user_id)?.display_name || 'User', avatar_url: profileMap.get(l.user_id)?.avatar_url },
        saved_by_me: savedSet.has(l.id),
        avg_seller_rating: stats ? stats.sum / stats.count : undefined,
        seller_review_count: stats?.count,
      };
    });
  }, [currentUserId]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from('marketplace_listings').select('*');
    if (debouncedSearch.trim()) {
      query = query.textSearch('search_vector', debouncedSearch.trim(), { config: 'english' });
    }
    const { data, error: fetchError } = await query.order('created_at', { ascending: false }).limit(50);
    if (fetchError) { setError(fetchError.message); setLoading(false); return; }
    const enriched = await enrichListings(data || []);
    setListings(enriched);
    setLoading(false);
  }, [enrichListings, debouncedSearch]);

  useEffect(() => { fetchListings().catch(e => { setError(e.message); setLoading(false); }); }, [fetchListings]);

  const filtered = useMemo(() => listings.filter(l => {
    if (showSaved && !l.saved_by_me) return false;
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (priceMin && l.price < parseFloat(priceMin)) return false;
    if (priceMax && l.price > parseFloat(priceMax)) return false;
    return true;
  }), [listings, categoryFilter, statusFilter, priceMin, priceMax, showSaved]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [filtered, sortBy]);

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
    setShowChat(true);
  }, [currentUserId]);

  return (
    <div className="space-y-5">
      {showChat ? (
        <ChatInbox currentUserId={currentUserId} isDark={isDark} lang={lang} onBack={() => setShowChat(false)} />
      ) : (<>
      {/* Header + Create / Sign in */}
      <div className="flex items-center gap-2">
        {currentUserId ? (
          <div className="flex items-center gap-2 flex-1">
            <button onClick={handleOpenCreate} aria-label="Create new listing"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/20">
              <Plus className="w-4 h-4" />
              {t('sellSomething', lang)}
            </button>
            <button onClick={() => setShowSaved(!showSaved)} aria-label="Toggle saved listings"
              className={`p-3 rounded-xl transition-all ${showSaved ? 'bg-gradient-to-r from-cyanx to-emera text-white shadow-lg shadow-cyanx/20' : isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Bookmark className="w-4 h-4" />
            </button>
            <button onClick={() => setShowChat(true)} aria-label="Open messages"
              className={`p-3 rounded-xl transition-all ${isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className={`w-full p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-surface/50 border border-edge text-mist' : 'bg-white border border-gray-200 text-gray-500'}`}>
            Sign in to create a listing.
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} aria-label="Search listings"
          placeholder={t('searchPlaceholder', lang)}
          className={`w-full pl-12 pr-12 py-3.5 rounded-xl text-base outline-none transition-all ${isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'}`} />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} aria-label="Clear search"
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter toggle + Categories row */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-label="Toggle advanced filters"
          className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          <button onClick={() => setCategoryFilter('all')} role="button" aria-pressed={categoryFilter === 'all'}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === 'all' ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t('allCategories', lang)}
          </button>
          {MARKETPLACE_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} role="button" aria-pressed={categoryFilter === cat}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === cat ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>Status</span>
            <div className="flex gap-1">
              {(['all', 'active', 'sold'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? isDark ? 'bg-cyanx/20 text-cyanx' : 'bg-cyan-50 text-cyan-600' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}>
                  {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Sold'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-muted' : 'text-gray-400'}`}>Price</span>
            <div className="flex items-center gap-2">
              <input type="number" min="0" step="0.01" value={priceMin} onChange={e => setPriceMin(e.target.value)} aria-label="Minimum price"
                placeholder="Min"
                className={`w-24 px-3 py-1.5 rounded-lg text-sm outline-none transition-colors ${isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'}`} />
              <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>to</span>
              <input type="number" min="0" step="0.01" value={priceMax} onChange={e => setPriceMax(e.target.value)} aria-label="Maximum price"
                placeholder="Max"
                className={`w-24 px-3 py-1.5 rounded-lg text-sm outline-none transition-colors ${isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'}`} />
              {(priceMin || priceMax) && (
                <button onClick={() => { setPriceMin(''); setPriceMax(''); }} aria-label="Clear price filter"
                  className={`text-xs ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sort */}
      <div className={`flex items-center gap-1.5 p-1.5 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        <ArrowUpDown className={`w-4 h-4 ml-2 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
        {([
          { id: 'newest' as const, label: t('sortNewest', lang) },
          { id: 'price_low' as const, label: t('sortPriceLow', lang) },
          { id: 'price_high' as const, label: t('sortPriceHigh', lang) },
        ]).map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)} aria-pressed={sortBy === s.id}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${sortBy === s.id ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading listings">
          {[1, 2, 3].map(i => (
            <div key={i} className={`p-5 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                  <div className={`h-2.5 w-16 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                </div>
              </div>
              <div className={`h-3 w-3/4 rounded animate-pulse mb-2 ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
              <div className={`h-3 w-1/2 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
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
        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`} role="status">
          <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('noListings', lang)}</p>
        </div>
      )}

      {sorted.map(listing => (
        <MarketplaceCard key={listing.id} listing={listing} isDark={isDark} lang={lang} currentUserId={currentUserId}
          onEdit={handleEditListing} onDelete={handleDelete} onMarkSold={handleMarkSold} onViewProfile={onViewProfile}
          onSave={handleToggleSave} onStartChat={handleStartChat} />
      ))}

      {showCreateModal && (
        <CreateListingModal isDark={isDark} lang={lang} products={products} currentUserId={currentUserId} onSubmit={handleCreate} onClose={handleCloseCreate} />
      )}

      {editingListing && (
        <CreateListingModal isDark={isDark} lang={lang} products={products} currentUserId={currentUserId} initial={editingListing} onSubmit={handleUpdate} onClose={handleCloseEdit} />
      )}
      </>)}
    </div>
  );
});
