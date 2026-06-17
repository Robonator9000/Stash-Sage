import type { MarketplaceListing } from '../types';
import { t } from '../utils/translations';
import { Phone, Mail, MessageCircle, Send, Camera, Globe, Tag, Clock, DollarSign } from 'lucide-react';

const PLATFORM_ICONS: Record<string, { icon: typeof Phone; color: string }> = {
  phone: { icon: Phone, color: '#22c55e' },
  email: { icon: Mail, color: '#3b82f6' },
  discord: { icon: MessageCircle, color: '#5865f2' },
  telegram: { icon: Send, color: '#26a5e4' },
  instagram: { icon: Camera, color: '#e4405f' },
  signal: { icon: MessageCircle, color: '#0f7bf5' },
  whatsapp: { icon: MessageCircle, color: '#25d366' },
  other: { icon: Globe, color: '#94a3b8' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
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
}

export function MarketplaceCard({ listing, isDark, lang, currentUserId, onEdit, onDelete, onMarkSold, onViewProfile }: MarketplaceCardProps) {
  const platformMeta = PLATFORM_ICONS[listing.contact_platform] || PLATFORM_ICONS.other;
  const PlatformIcon = platformMeta.icon;
  const isOwner = listing.user_id === currentUserId;

  return (
    <div className={`p-5 rounded-2xl transition-all ${isDark ? 'bg-surface/60 border border-edge hover:border-cyanx/30' : 'bg-white border border-gray-200 hover:border-cyan-400/30'} shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => onViewProfile?.(listing.user_id)} className="shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${listing.author?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
              {listing.author?.avatar_url ? (
                <img src={listing.author.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-bold text-lg">
                  {(listing.author?.username?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
          </button>
          <div className="min-w-0">
            <button onClick={() => onViewProfile?.(listing.user_id)} className={`text-sm font-semibold truncate block w-full text-left hover:underline ${isDark ? 'text-frost' : 'text-gray-800'}`}>
              {listing.author?.username || 'User'}
            </button>
            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              {timeAgo(listing.created_at)}
            </div>
          </div>
        </div>
        {listing.status === 'sold' && (
          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'}`}>
            {t('statusSold', lang)}
          </span>
        )}
      </div>

      {/* Image */}
      {listing.image_url && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img src={listing.image_url} alt="" className="w-full h-48 object-cover" />
        </div>
      )}

      {/* Title */}
      <h3 className={`font-display font-bold text-lg mb-2 ${isDark ? 'text-frost' : 'text-gray-800'}`}>
        {listing.title}
      </h3>

      {/* Category badge + Price */}
      <div className="flex items-center gap-2 mb-3">
        {listing.category && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-600'}`}>
            <Tag className="w-3 h-3" />
            {listing.category}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${isDark ? 'bg-emera/10 text-emera' : 'bg-emerald-50 text-emerald-600'}`}>
          <DollarSign className="w-3 h-3" />
          {listing.price.toFixed(2)}
        </span>
      </div>

      {/* Description */}
      {listing.description && (
        <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-mist' : 'text-gray-600'}`}>
          {listing.description}
        </p>
      )}

      {/* Product link */}
      {listing.product_name && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs ${isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-600'}`}>
          <Tag className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">{listing.product_name}</span>
        </div>
      )}

      {/* Contact info */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-midnight' : 'bg-gray-50'}`}>
        <PlatformIcon className="w-4 h-4 shrink-0" style={{ color: platformMeta.color }} />
        <span className={`font-medium ${isDark ? 'text-frost' : 'text-gray-800'}`}>
          {listing.contact_platform === 'email' ? listing.contact_value :
           listing.contact_platform === 'phone' ? listing.contact_value :
           `@${listing.contact_value}`}
        </span>
        <span className={`text-xs ml-auto ${isDark ? 'text-muted' : 'text-gray-400'}`}>
          {listing.contact_platform}
        </span>
      </div>

      {/* Owner actions */}
      {isOwner && listing.status === 'active' && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-edge">
          <button onClick={() => onEdit?.(listing)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-midnight text-mist hover:text-frost hover:bg-surface' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t('editProduct', lang)}
          </button>
          <button onClick={() => onMarkSold?.(listing.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-midnight text-emera hover:bg-emera/10' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
            {t('markAsSold', lang)}
          </button>
          <button onClick={() => onDelete?.(listing.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-midnight text-red-400 hover:bg-red-900/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
            {t('delete', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
