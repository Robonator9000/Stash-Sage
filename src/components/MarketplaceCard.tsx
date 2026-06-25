import { memo, useState, useCallback, useEffect } from 'react';
import type { MarketplaceListing } from '../types';
import { t } from '../utils/translations';
import { getContactUrl, copyToClipboard } from '../utils/helpers';
import { Tag, Clock, DollarSign, ExternalLink, ChevronLeft, ChevronRight, X, Bookmark, MessageCircle } from 'lucide-react';
import { ReviewSection } from './ReviewSection';

const PLATFORM_COLORS: Record<string, string> = {
  phone: '#22c55e',
  email: '#3b82f6',
  discord: '#5865f2',
  telegram: '#26a5e4',
  instagram: '#e4405f',
  snapchat: '#fffc00',
  signal: '#0f7bf5',
  whatsapp: '#25d366',
  chat: '#8b5cf6',
  other: '#94a3b8',
};

function timeAgo(dateStr: string, lang?: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(lang);
}

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  isDark: boolean;
  lang: string;
  currentUserId: string;
  onEdit?: (listing: MarketplaceListing) => void;
  onDelete?: (id: string) => void;
  onMarkSold?: (id: string) => void;
  onViewProfile?: (userId: string) => void;
  onSave?: (listingId: string) => void;
  onStartChat?: (listingId: string) => void;
}

const PLATFORM_BRAND_ICONS: Record<string, string> = {
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  email: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  discord: 'M14.82 4.26a10.14 10.14 0 00-.53 1.1 14.66 14.66 0 00-4.58 0 10.14 10.14 0 00-.53-1.1 16 16 0 00-4.13 1.3 17.33 17.33 0 00-3 11.59 16.6 16.6 0 004.67 2.37c.38-.5.72-1.04 1.01-1.6a12.36 12.36 0 01-1.59-.78 9.3 9.3 0 00.6-.46c1.7.8 3.42 1.2 5.16 1.2s3.46-.4 5.16-1.2c.2.16.4.32.6.46-.5.3-1.04.56-1.59.78.29.56.63 1.1 1.01 1.6a16.6 16.6 0 004.67-2.37 17.33 17.33 0 00-3-11.59 16 16 0 00-4.13-1.3zM9.6 12.82a1.56 1.56 0 01-1.44-1.68 1.56 1.56 0 011.44-1.68 1.56 1.56 0 011.44 1.68 1.56 1.56 0 01-1.44 1.68zm4.8 0a1.56 1.56 0 01-1.44-1.68 1.56 1.56 0 011.44-1.68 1.56 1.56 0 011.44 1.68 1.56 1.56 0 01-1.44 1.68z',
  telegram: 'M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.5.5 0 01.171.325c.016.127.087.638.046 1.056-.43 4.536-2.248 11.55-3.183 13.852-.407 1.003-.806 1.336-1.324 1.37-.894.058-1.574-.588-2.44-1.156-1.354-.888-2.118-1.44-3.43-2.306-1.518-.998-.534-1.547.33-2.444.226-.234 4.14-3.782 4.216-4.105.01-.042.02-.198-.074-.28-.094-.082-.233-.054-.333-.032-.142.032-2.4 1.522-6.777 4.468-.642.44-1.223.654-1.744.642-.421-.01-1.232-.238-1.834-.433-.739-.24-1.326-.367-1.275-.775.035-.213.32-.43.88-.652 3.452-1.5 5.755-2.488 6.906-2.976 3.29-1.394 3.973-1.636 4.42-1.644z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  snapchat: 'M12 2.02c3.46 0 6.26 2.6 6.26 5.8 0 1.12-.38 2.17-1.02 3.08-.28.4-.14.92.22 1.06.08.03.16.05.24.05.16 0 .32-.06.48-.18.44-.32.96-.5 1.5-.5.86 0 1.7.4 2.28 1.1.53.64.82 1.47.82 2.33 0 .92-.34 1.78-.96 2.42-.72.74-1.8 1.2-3.1 1.32-.08.84-.34 1.56-.76 2.12-.84 1.14-2.38 1.8-4.28 1.8s-3.44-.66-4.28-1.8c-.42-.56-.68-1.28-.76-2.12-1.3-.12-2.38-.58-3.1-1.32-.62-.64-.96-1.5-.96-2.42 0-.86.29-1.69.82-2.33.58-.7 1.42-1.1 2.28-1.1.54 0 1.06.18 1.5.5.16.12.32.18.48.18.08 0 .16-.02.24-.05.36-.14.5-.66.22-1.06-.64-.91-1.02-1.96-1.02-3.08 0-3.2 2.8-5.8 6.26-5.8z',
  signal: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.006 3.49c1.715 0 3.365.48 4.774 1.374l-1.424 2.465a6.327 6.327 0 00-3.35-.974 6.33 6.33 0 00-3.35.974L7.232 4.864a8.995 8.995 0 014.774-1.374zM5.655 6.782l1.585 2.708a6.357 6.357 0 00.101 6.456l-1.603 2.685A8.959 8.959 0 013 12c0-1.89.585-3.644 1.655-5.218zM9.93 9.078a3.76 3.76 0 012.076-.633 3.76 3.76 0 012.076.633l.75 1.055a3.76 3.76 0 01.751 1.267 3.76 3.76 0 01-1.084 3.11 3.76 3.76 0 01-2.493 1.084 3.76 3.76 0 01-2.076-.633l-.75-1.055a3.76 3.76 0 01-.751-1.267 3.76 3.76 0 011.084-3.11 3.76 3.76 0 011.417-.85zM12 9.047a2.953 2.953 0 100 5.906 2.953 2.953 0 000-5.906zM6.95 14.042a6.357 6.357 0 00.101 1.266l-1.585 2.708A8.96 8.96 0 003 18.35l1.603-2.685a6.357 6.357 0 00-.101-6.456L5.655 6.782a8.959 8.959 0 00-1.655 5.218c0 1.89.585 3.644 1.655 5.218zM12 20.51a8.995 8.995 0 01-4.774-1.374l1.424-2.465a6.327 6.327 0 003.35.974 6.33 6.33 0 003.35-.974l1.424 2.465A8.995 8.995 0 0112 20.51zm4.345-2.124l-1.585-2.708a6.357 6.357 0 00-.101-6.456l1.603-2.685A8.96 8.96 0 0121 12a8.96 8.96 0 01-1.655 5.218l-1.603-2.685a6.357 6.357 0 00.101 1.266z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  other: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  chat: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
};

export const MarketplaceCard = memo(function MarketplaceCard({ listing, isDark, lang, currentUserId, onEdit, onDelete, onMarkSold, onViewProfile, onSave, onStartChat }: MarketplaceCardProps) {
  const isOwner = listing.user_id === currentUserId;
  const brandPath = PLATFORM_BRAND_ICONS[listing.contact_platform] || PLATFORM_BRAND_ICONS.other;
  const brandColor = PLATFORM_COLORS[listing.contact_platform] || PLATFORM_COLORS.other;
  const allImages = listing.images?.filter(Boolean) || (listing.image_url ? [listing.image_url] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'sold', listingId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleContactClick = useCallback(async () => {
    const url = getContactUrl(listing.contact_platform, listing.contact_value);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    await copyToClipboard(listing.contact_value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [listing.contact_platform, listing.contact_value]);

  useEffect(() => { setCurrentImageIndex(0); }, [listing.id]);

  useEffect(() => {
    if (!showDetail) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowDetail(false);
      if (e.key === 'ArrowLeft') setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length);
      if (e.key === 'ArrowRight') setCurrentImageIndex(i => (i + 1) % allImages.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDetail, allImages.length]);

  return (
    <div className={`p-6 rounded-2xl transition-all ${isDark ? 'bg-surface/60 border border-edge hover:border-cyanx/30' : 'bg-white border border-gray-200 hover:border-cyan-400/30'} shadow-sm`} role="article">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => onViewProfile?.(listing.user_id)} aria-label={'View ' + (listing.author?.username || 'user') + '\'s profile'} className="shrink-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${listing.author?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
              {listing.author?.avatar_url ? (
                <img src={listing.author.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-bold text-lg">
                  {(listing.author?.username?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
          </button>
          <div className="min-w-0">
            <button onClick={() => onViewProfile?.(listing.user_id)} aria-label={'View ' + (listing.author?.username || 'user') + '\'s profile'} className={`text-sm font-semibold truncate block w-full text-left hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
              {listing.author?.username || 'User'}
            </button>
            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              <time dateTime={listing.created_at}>{timeAgo(listing.created_at, lang)}</time>
            </div>
          </div>
        </div>
        {listing.status === 'sold' && (
          <span className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'}`}>
            {t('statusSold', lang)}
          </span>
        )}
        {currentUserId && currentUserId !== listing.user_id && (
          <button onClick={() => onSave?.(listing.id)} aria-label={listing.saved_by_me ? t('unsaveListing', lang) : t('saveListing', lang)}
            className={`p-2 rounded-xl transition-all ${listing.saved_by_me ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-midnight text-mist hover:text-frost' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
            <Bookmark className="w-4 h-4" fill={listing.saved_by_me ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Image gallery */}
      {allImages.length > 0 && (
        <div className="mb-4 rounded-xl overflow-hidden relative group">
          <button type="button" onClick={() => setShowDetail(true)} className="w-full block">
            <img src={allImages[currentImageIndex]} alt={listing.title} loading="lazy" className="w-full h-56 object-cover" />
          </button>
          {allImages.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length); }} aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i + 1) % allImages.length); }} aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }} aria-label={`Image ${i + 1}`}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className={`font-display font-bold text-xl mb-2 ${isDark ? 'text-frost' : 'text-gray-800'}`}>
        {listing.title}
      </h3>

      {/* Category badge + Price */}
      <div className="flex items-center gap-2 mb-3">
        {listing.category && (
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-600'}`}>
            <Tag className="w-3.5 h-3.5" />
            {listing.category}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${isDark ? 'bg-emera/10 text-emera' : 'bg-emerald-50 text-emerald-600'}`}>
          <DollarSign className="w-3.5 h-3.5" />
          {listing.price.toFixed(2)}
        </span>
      </div>

      {/* Seller reputation */}
      {listing.avg_seller_rating != null && listing.seller_review_count != null && listing.seller_review_count > 0 && (
        <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-xs ${isDark ? 'bg-midnight/50 text-mist' : 'bg-amber-50 text-amber-700'}`}>
          <span className="text-amber-500">{'★'.repeat(Math.round(listing.avg_seller_rating))}{'☆'.repeat(5 - Math.round(listing.avg_seller_rating))}</span>
          <span className="font-medium">{listing.avg_seller_rating.toFixed(1)}</span>
          <span className={isDark ? 'text-muted' : 'text-amber-400'}>({listing.seller_review_count})</span>
        </div>
      )}

      {/* Description */}
      {listing.description && (
        <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-mist' : 'text-gray-600'}`}>
          {listing.description}
        </p>
      )}

      {/* Product link */}
      {listing.product_name && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-sm ${isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-600'}`}>
          <Tag className="w-4 h-4 shrink-0" />
          <span className="font-medium">{listing.product_name}</span>
        </div>
      )}

      {/* Contact info */}
      <button onClick={handleContactClick} aria-label={`Contact via ${listing.contact_platform}: ${listing.contact_value}`}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${isDark ? 'bg-midnight hover:bg-midnight/80' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: brandColor }} aria-hidden="true">
          <path d={brandPath} />
        </svg>
        <span className={`font-medium ${isDark ? 'text-frost' : 'text-gray-800'}`}>
           {listing.contact_platform === 'email' ? listing.contact_value :
            listing.contact_platform === 'phone' ? listing.contact_value :
            `@${listing.contact_value.replace(/^@+/, '')}`}
        </span>
        {copied ? (
          <span className="text-xs text-emera ml-auto">Copied!</span>
        ) : (
          <span className={`flex items-center gap-1 text-xs ml-auto capitalize ${isDark ? 'text-muted' : 'text-gray-400'}`}>
            <ExternalLink className="w-3 h-3" />
            {listing.contact_platform}
          </span>
        )}
      </button>

      {/* Send message button for non-owners */}
      {!isOwner && currentUserId && onStartChat && (
        <button onClick={() => onStartChat(listing.id)} aria-label={t('startChat', lang)}
          className={`w-full flex items-center justify-center gap-2 mt-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
          <MessageCircle className="w-4 h-4" />
          {t('startChat', lang)}
        </button>
      )}

      {/* Owner actions */}
      {isOwner && listing.status === 'active' && (
        <div className="flex gap-2 mt-5 pt-4 border-t border-edge">
          <button onClick={() => onEdit?.(listing)} aria-label="Edit listing"
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-midnight text-mist hover:text-frost hover:bg-surface' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t('editProduct', lang)}
          </button>
          <button onClick={() => setConfirmAction({ type: 'sold', listingId: listing.id })} aria-label="Mark listing as sold"
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-midnight text-emera hover:bg-emera/10' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
            {t('markAsSold', lang)}
          </button>
          <button onClick={() => setConfirmAction({ type: 'delete', listingId: listing.id })} aria-label="Delete listing"
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-midnight text-red-400 hover:bg-red-900/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
            {t('delete', lang)}
          </button>
        </div>
      )}

      {/* Reviews */}
      <ReviewSection listingId={listing.id} isOwner={isOwner} currentUserId={currentUserId} isDark={isDark} lang={lang} onViewProfile={onViewProfile} />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmAction(null)}>
          <div className={`p-6 rounded-2xl max-w-xs w-full mx-4 shadow-xl ${isDark ? 'bg-card border border-edge' : 'bg-white border border-gray-200'}`}
            onClick={e => e.stopPropagation()}>
            <p className={`text-sm font-medium mb-4 ${isDark ? 'text-frost' : 'text-gray-800'}`}>
              {confirmAction.type === 'delete' ? 'Delete this listing?' : 'Mark as sold?'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (confirmAction.type === 'delete') await onDelete?.(confirmAction.listingId);
                  else await onMarkSold?.(confirmAction.listingId);
                  setConfirmAction(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all"
              >
                {confirmAction.type === 'delete' ? 'Delete' : 'Mark Sold'}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setShowDetail(false)}>
          <button type="button" onClick={() => setShowDetail(false)} aria-label="Close gallery"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10">
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <img src={allImages[currentImageIndex]} alt={listing.title} className="w-full max-h-[85vh] object-contain rounded-2xl" />
            {allImages.length > 1 && (
              <>
                <button type="button" onClick={() => setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length)} aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button type="button" onClick={() => setCurrentImageIndex(i => (i + 1) % allImages.length)} aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, i) => (
                    <button key={i} type="button" onClick={() => setCurrentImageIndex(i)} aria-label={`Image ${i + 1}`}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
