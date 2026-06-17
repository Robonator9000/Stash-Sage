import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MarketplaceListing, Product } from '../types';
import { MARKETPLACE_CATEGORIES } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { MarketplaceCard } from './MarketplaceCard';
import { CreateListingModal } from './CreateListingModal';
import { showToast } from './Toast';
import { Plus, Search, ArrowUpDown } from 'lucide-react';

interface MarketplaceFeedProps {
  isDark: boolean;
  lang: string;
  currentUserId: string;
  products: Product[];
  onViewProfile?: (userId: string) => void;
}

export function MarketplaceFeed({ isDark, lang, currentUserId, products, onViewProfile }: MarketplaceFeedProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const enrichListings = useCallback(async (rawListings: any[]): Promise<MarketplaceListing[]> => {
    if (rawListings.length === 0) return [];
    const userIds = [...new Set(rawListings.map(l => l.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    return rawListings.map(l => ({ ...l, author: { username: profileMap.get(l.user_id)?.display_name || 'User', avatar_url: profileMap.get(l.user_id)?.avatar_url } }));
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false });
    if (fetchError) { setError(fetchError.message); setLoading(false); return; }
    const enriched = await enrichListings(data || []);
    setListings(enriched);
    setLoading(false);
  }, [enrichListings]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const filtered = useMemo(() => listings.filter(l => {
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [listings, categoryFilter, searchQuery]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [filtered, sortBy]);

  const handleCreate = useCallback(async (data: Partial<MarketplaceListing>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('marketplace_listings').insert({ ...data, user_id: currentUserId, status: 'active' });
      if (insertError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: insertError.message }); return; }
      showToast({ id: 'listing-created', title: '', body: t('listingCreated', lang) });
      setShowCreateModal(false);
      fetchListings();
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
      const { error: deleteError } = await supabase.from('marketplace_listings').delete().eq('id', id).eq('user_id', currentUserId);
      if (deleteError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: deleteError.message }); return; }
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
      const { error: updateError } = await supabase.from('marketplace_listings').update({ status: 'sold' }).eq('id', id).eq('user_id', currentUserId);
      if (updateError) { showToast({ id: 'listing-error', title: t('somethingWentWrong', lang), body: updateError.message }); return; }
      fetchListings();
    } finally {
      setSubmitting(false);
    }
  }, [submitting, currentUserId, lang, fetchListings]);

  const handleEditListing = useCallback((l: MarketplaceListing) => setEditingListing(l), []);
  const handleCloseCreate = useCallback(() => setShowCreateModal(false), []);
  const handleCloseEdit = useCallback(() => setEditingListing(null), []);
  const handleOpenCreate = useCallback(() => setShowCreateModal(true), []);

  return (
    <div className="space-y-5">
      {/* Header + Create / Sign in */}
      <div className="flex items-center gap-2">
        {currentUserId ? (
          <button onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all shadow-lg shadow-cyanx/20">
            <Plus className="w-4 h-4" />
            {t('sellSomething', lang)}
          </button>
        ) : (
          <div className={`w-full p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-surface/50 border border-edge text-mist' : 'bg-white border border-gray-200 text-gray-500'}`}>
            Sign in to create a listing.
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder', lang)}
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-base outline-none transition-all ${isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50 placeholder-muted' : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-cyan-400 placeholder-gray-400'}`} />
      </div>

      {/* Categories row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={() => setCategoryFilter('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === 'all' ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {t('allCategories', lang)}
        </button>
        {MARKETPLACE_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === cat ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className={`flex items-center gap-1.5 p-1.5 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        <ArrowUpDown className={`w-4 h-4 ml-2 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
        {([
          { id: 'newest' as const, label: t('sortNewest', lang) },
          { id: 'price_low' as const, label: t('sortPriceLow', lang) },
          { id: 'price_high' as const, label: t('sortPriceHigh', lang) },
        ]).map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${sortBy === s.id ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
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
        <div className={`p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-500 border border-red-200'}`}>
          {error}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('noListings', lang)}</p>
        </div>
      )}

      {sorted.map(listing => (
        <MarketplaceCard key={listing.id} listing={listing} isDark={isDark} lang={lang} currentUserId={currentUserId}
          onEdit={handleEditListing} onDelete={handleDelete} onMarkSold={handleMarkSold} onViewProfile={onViewProfile} />
      ))}

      {showCreateModal && (
        <CreateListingModal isDark={isDark} lang={lang} products={products} onSubmit={handleCreate} onClose={handleCloseCreate} />
      )}

      {editingListing && (
        <CreateListingModal isDark={isDark} lang={lang} products={products} initial={editingListing} onSubmit={handleUpdate} onClose={handleCloseEdit} />
      )}
    </div>
  );
}
