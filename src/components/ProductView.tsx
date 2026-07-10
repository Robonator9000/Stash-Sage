import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { ChevronLeft, Star, Scale, FlaskConical, StickyNote, Calendar, Tag } from 'lucide-react';

interface ProductViewProps {
  productId: string;
  onClose: () => void;
  isDark: boolean;
  lang: string;
}

export function ProductView({ productId, onClose, isDark, lang }: ProductViewProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    supabase.from('products').select('*').eq('id', productId).single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError(true);
        } else {
          const pictures: string[] = data.pictures || (data.picture ? [data.picture] : []);
          setProduct({
            id: data.id,
            name: data.name || '',
            strain: data.strain || '',
            type: data.type || '',
            thc: data.thc || 0,
            cbd: data.cbd || 0,
            amount: data.amount || 0,
            price: data.price || 0,
            picture: data.picture || '',
            pictures,
            notes: data.notes || '',
            rating: data.rating || 0,
            brand: data.brand || '',
            tags: data.tags || '',
            effects: data.effects || '',
            consumptionCount: data.consumptionCount || 0,
            lastConsumed: data.lastconsumed ? new Date(data.lastconsumed) : undefined,
            purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : undefined,
            createdAt: new Date(data.createdat),
            updatedAt: new Date(data.updatedat),
            favorite: data.favorite || false,
          });
        }
        setLoading(false);
      });
  }, [productId]);

  const allImages = product?.pictures?.filter(Boolean) || (product?.picture ? [product.picture] : []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0 max-w-3xl w-full mx-auto">
        {/* Back button */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('back', lang)}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className={`w-8 h-8 border-2 rounded-full animate-spin ${isDark ? 'border-cyan-500 border-t-transparent' : 'border-cyan-500 border-t-transparent'}`} />
            </div>
          ) : error ? (
            <div className={`p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
              {t('noProductsFound', lang)}
            </div>
          ) : product ? (
            <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-950 border border-white/5' : 'bg-white border border-gray-200'}`}>
              {/* Images */}
              {allImages.length > 0 && (
                <div className="grid grid-cols-2 gap-1">
                  {allImages.map((img, i) => (
                    <div key={i} className={`${i === 0 && allImages.length === 1 ? 'col-span-2' : ''} aspect-video`}>
                      <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Name + Brand */}
                <div>
                  <h2 className={`text-xl font-bold font-display ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.name}</h2>
                  {product.brand && (
                    <p className={`text-sm mt-0.5 ${isDark ? 'text-muted' : 'text-gray-500'}`}>{product.brand}</p>
                  )}
                </div>

                {/* Type + Strain */}
                <div className="flex flex-wrap gap-2">
                  {product.type && (
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-600'}`}>{product.type}</span>
                  )}
                  {product.strain && product.strain !== product.name && (
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-surface text-mist' : 'bg-gray-100 text-gray-600'}`}>{product.strain}</span>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {product.thc > 0 && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight/50' : 'bg-gray-50'}`}>
                      <div className="text-xs text-muted">THC</div>
                      <div className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{product.thc}%</div>
                    </div>
                  )}
                  {product.cbd > 0 && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight/50' : 'bg-gray-50'}`}>
                      <div className="text-xs text-muted">CBD</div>
                      <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{product.cbd}%</div>
                    </div>
                  )}
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-muted">Amount</div>
                    <div className={`text-lg font-bold flex items-center gap-1 ${isDark ? 'text-frost' : 'text-gray-900'}`}>
                      <Scale className="w-4 h-4" />{product.amount}g
                    </div>
                  </div>
                  {product.price > 0 && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight/50' : 'bg-gray-50'}`}>
                      <div className="text-xs text-muted">Price</div>
                      <div className={`text-lg font-bold ${isDark ? 'text-emera' : 'text-emerald-600'}`}>${product.price.toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'text-amber-500 fill-amber-500' : isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                    ))}
                    <span className={`text-sm ml-1 ${isDark ? 'text-muted' : 'text-gray-500'}`}>{product.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Tags */}
                {product.tags && (
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      <Tag className="w-3 h-3" /> Tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-surface text-cyanx' : 'bg-cyan-50 text-cyan-600'}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Effects */}
                {product.effects && (
                  <div className="flex items-start gap-2">
                    <FlaskConical className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isDark ? 'text-mist' : 'text-gray-600'}`}>{product.effects}</span>
                  </div>
                )}

                {/* Notes */}
                {product.notes && (
                  <div className="flex items-start gap-2">
                    <StickyNote className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-mist' : 'text-gray-600'}`}>{product.notes}</p>
                  </div>
                )}

                {/* Purchase date */}
                {product.purchasedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 shrink-0 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isDark ? 'text-mist' : 'text-gray-600'}`}>
                      Purchased {new Date(product.purchasedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
