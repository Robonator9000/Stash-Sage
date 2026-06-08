import { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { formatDate, formatPrecision } from '../utils/helpers';
import { Star, Heart, Flame, Clock, Package, DollarSign } from 'lucide-react';
import { t } from '../utils/translations';
import { useSettings } from '../utils/useSettings';
import { showToast } from './Toast';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onConsume: () => void;
  onSell: () => void;
  onToggleFavorite: () => void;
  isDark?: boolean;
  layout?: 'grid' | 'list' | 'compact';
  precision?: number;
}

function gramsToOz(g: number): number {
  return g / 28.3495;
}

export function ProductCard({ product, onClick, onConsume, onSell, onToggleFavorite, isDark = true, layout = 'grid', precision = 2 }: ProductCardProps) {
  const { settings } = useSettings();
  const amountString = `${formatPrecision(product.amount, precision)}g`;
  const lang = settings.language;

  const [imageHovered, setImageHovered] = useState(false);
  const [strainHovered, setStrainHovered] = useState(false);
  const [amountHovered, setAmountHovered] = useState(false);
  const [showOz, setShowOz] = useState(false);
  const ozTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (ozTimer.current) clearTimeout(ozTimer.current); };
  }, []);

  const getStrainColor = (strainType: string) => {
    switch (strainType.toLowerCase()) {
      case 'indica':
        return { bg: isDark ? 'bg-purple-500/15' : 'bg-purple-100', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'sativa':
        return { bg: isDark ? 'bg-amberx/15' : 'bg-amber-100', text: 'text-amberx', border: 'border-amberx/30' };
      case 'hybrid':
        return { bg: isDark ? 'bg-emera/15' : 'bg-emerald-100', text: 'text-emera', border: 'border-emera/30' };
      default:
        return { bg: isDark ? 'bg-mist/15' : 'bg-gray-100', text: 'text-mist', border: 'border-mist/30' };
    }
  };

  const strainColors = getStrainColor(product.type);

  const vibrantStrainColor = isDark
    ? { bg: 'bg-cyan-500/30', text: 'text-cyan-300', border: 'border-cyan-400/60' }
    : { bg: 'bg-cyan-200', text: 'text-cyan-800', border: 'border-cyan-500/60' };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const buttonAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleAmountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOz) {
      const ozVal = gramsToOz(product.amount);
      const ozStr = formatPrecision(ozVal, precision);
      setShowOz(true);
      navigator.clipboard.writeText(ozStr).then(() => {
        showToast({
          id: 'oz-copy-' + product.id,
          title: t('convertedToOz', lang).replace('{value}', ozStr),
          body: t('copiedToClipboard', lang),
        });
      });
      if (ozTimer.current) clearTimeout(ozTimer.current);
      ozTimer.current = setTimeout(() => setShowOz(false), 3000);
    }
  };

  if (layout === 'list') {
    return (
      <div
        className={`group relative rounded-xl transition-all cursor-pointer ${
          isDark
            ? 'bg-midnight border border-edge hover:border-surface-light'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        } ${product.favorite ? 'ring-1 ring-amberx/40' : ''}`}
      >
        <div className="flex items-center gap-4 p-4" onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={product.name}>
          <div className="relative flex-shrink-0">
            {product.picture ? (
              <img src={product.picture} alt={product.name} loading="lazy" decoding="async" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-surface' : 'bg-gray-100'}`}>
                <Package className={`w-6 h-6 ${isDark ? 'text-haze' : 'text-gray-400'}`} />
              </div>
            )}
            {product.favorite && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amberx rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold truncate ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${strainColors.bg} ${strainColors.text}`}>
                {product.type}
              </span>
            </div>
            {product.brand && (
              <p className={`text-sm truncate ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('from', lang)} {product.brand}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-medium bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent`}>
                {amountString}
              </span>
              {product.thc > 0 && (
                <span className={`text-xs ${isDark ? 'text-haze' : 'text-gray-400'}`}>{t('thc', lang)}: {product.thc}%</span>
              )}
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amberx fill-amberx" />
                  <span className={`text-xs ${isDark ? 'text-mist' : 'text-gray-500'}`}>{product.rating}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => buttonAction(e, onConsume)}
              aria-label={t('consume', lang)}
              className={`p-2 rounded-lg transition-all ${isDark ? 'bg-cyanx/12 text-cyanx hover:bg-cyanx/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}
            >
              <Flame className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => buttonAction(e, onSell)}
              aria-label={t('sell', lang)}
              className={`p-2 rounded-lg transition-all ${isDark ? 'bg-amberx/12 text-amberx hover:bg-amberx/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
            >
              <DollarSign className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => buttonAction(e, onToggleFavorite)}
              aria-label={product.favorite ? t('filterFavorites', lang) : t('addToFavorites', lang)}
              className={`p-2 rounded-lg transition-all ${product.favorite ? 'text-amberx' : isDark ? 'text-haze hover:text-amberx' : 'text-gray-400 hover:text-amber-500'}`}
            >
              <Heart className={`w-4 h-4 ${product.favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div
        className={`group relative rounded-xl transition-all cursor-pointer ${
          isDark
            ? 'bg-midnight border border-edge hover:border-cyanx/30'
            : 'bg-white border border-gray-200 hover:border-cyan-400/50'
        } ${product.favorite ? 'ring-1 ring-amberx/40' : ''}`}
        onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={product.name}
      >
        <div className="aspect-square relative overflow-hidden rounded-t-xl">
          {product.picture ? (
            <img src={product.picture} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-surface' : 'bg-gray-100'}`}>
              <Package className={`w-8 h-8 ${isDark ? 'text-haze' : 'text-gray-400'}`} />
            </div>
          )}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${strainColors.bg} ${strainColors.text}`}>
            {product.type}
          </div>
          {product.favorite && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-amberx rounded-full flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          <div className={`absolute bottom-0 left-0 right-0 px-2 py-1.5 backdrop-blur-sm ${isDark ? 'bg-deep/80' : 'bg-white/90'}`}>
            <span className="text-sm font-medium bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent">
              {amountString}
            </span>
          </div>
        </div>
        <div className="p-2">
          <h3 className={`font-bold text-sm truncate ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.name}</h3>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amberx fill-amberx" />
              <span className={`text-xs ${isDark ? 'text-mist' : 'text-gray-500'}`}>{product.rating}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={(e) => buttonAction(e, onConsume)} aria-label={t('consume', lang)}
            className={`p-1.5 rounded-lg ${isDark ? 'bg-cyanx/15 text-cyanx hover:bg-cyanx/25' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}>
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => buttonAction(e, onSell)} aria-label="Sell"
            className={`p-1.5 rounded-lg ${isDark ? 'bg-amberx/15 text-amberx hover:bg-amberx/25' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
            <DollarSign className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => buttonAction(e, onToggleFavorite)} aria-label={product.favorite ? t('filterFavorites', lang) : 'Add to favourites'}
            className={`p-1.5 rounded-lg ${product.favorite ? 'text-amberx' : isDark ? 'text-haze hover:text-amberx' : 'text-gray-400 hover:text-amber-500'}`}>
            <Heart className={`w-3.5 h-3.5 ${product.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  const isZoomed = imageHovered && !strainHovered && !amountHovered;

  return (
    <>
      {isZoomed && (
        <div className="fixed inset-0 bg-black/60 z-[60] pointer-events-none" />
      )}
      <div
        className={`group relative rounded-2xl transition-all cursor-pointer overflow-hidden flex flex-col ${
          isDark
            ? 'bg-midnight border border-edge hover:border-cyanx/30'
            : 'bg-white border border-gray-200 hover:border-cyan-400/50'
        } ${product.favorite ? 'ring-1 ring-amberx/40' : ''}`}
        onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={product.name}
      >
        {/* Image Section */}
        <div
          className="relative aspect-video flex-shrink-0"
          onMouseEnter={() => setImageHovered(true)}
          onMouseLeave={() => setImageHovered(false)}
        >
          {product.picture ? (
            <img
              src={product.picture} alt={product.name}
              loading="lazy" decoding="async"
              className={`transition-all duration-500 ease-out ${
                isZoomed
                  ? 'fixed inset-0 w-screen h-screen object-contain z-[61] p-12'
                  : 'w-full h-full object-cover'
              }`}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-surface' : 'bg-gray-100'}`}>
              <Package className={`w-12 h-12 ${isDark ? 'text-haze' : 'text-gray-400'}`} />
            </div>
          )}

          {/* Card overlay when image hovered */}
          {imageHovered && (
            <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 z-10" />
          )}

          {/* Strain Type Badge */}
          <div
            className={`absolute top-3 left-3 z-20 transition-all duration-200 ease-out ${
              isZoomed ? 'opacity-0 pointer-events-none' : ''
            } ${strainHovered ? vibrantStrainColor.bg + ' ' + vibrantStrainColor.text + ' ' + vibrantStrainColor.border + ' scale-110' : `${strainColors.bg} ${strainColors.text} ${strainColors.border}`}`}
            onMouseEnter={() => setStrainHovered(true)}
            onMouseLeave={() => setStrainHovered(false)}
          >
            <span className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${
              strainHovered
                ? vibrantStrainColor.bg + ' ' + vibrantStrainColor.text + ' ' + vibrantStrainColor.border
                : `${strainColors.bg} ${strainColors.text} ${strainColors.border}`
            }`}>
              {product.type}
            </span>
          </div>

          {/* Favorite Heart */}
          <div
            className={`absolute top-3 right-3 z-20 transition-all duration-200 ${
              isZoomed ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            {product.favorite ? (
              <div className="w-8 h-8 bg-amberx rounded-full flex items-center justify-center shadow-lg"
                onClick={(e) => buttonAction(e, onToggleFavorite)}
              >
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            ) : (
              <button
                onClick={(e) => buttonAction(e, onToggleFavorite)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                  isDark ? 'bg-deep/80 text-mist hover:text-amberx' : 'bg-white/90 text-gray-400 hover:text-amber-500'
                }`}
                aria-label={t('addToFavorites', lang)}
              >
                <Heart className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Amount Badge */}
          <div
            className={`absolute bottom-3 right-3 z-20 transition-all duration-200 ease-out ${
              isZoomed ? 'opacity-0 pointer-events-none' : ''
            } ${amountHovered ? 'scale-110' : 'scale-100'}`}
            onMouseEnter={() => setAmountHovered(true)}
            onMouseLeave={() => setAmountHovered(false)}
            onClick={handleAmountClick}
          >
            <div className={`px-3 py-1.5 rounded-lg font-medium text-sm backdrop-blur-sm cursor-pointer ${
              isDark ? 'bg-deep/80' : 'bg-white/90'
            }`}>
              <span className={`bg-gradient-to-r from-cyanx to-emera bg-clip-text text-transparent ${
                amountHovered ? 'text-base' : 'text-sm'
              }`}>
                {showOz ? formatPrecision(gramsToOz(product.amount), precision) + 'oz' : amountString}
              </span>
            </div>
            {amountHovered && !showOz && (
              <div className={`absolute -top-8 right-0 px-2 py-1 rounded-md text-xs whitespace-nowrap shadow-lg ${
                isDark ? 'bg-surface text-mist' : 'bg-gray-100 text-gray-600'
              }`}>
                Convert to oz
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 flex flex-col flex-1 transition-opacity duration-300 ${
          isZoomed ? 'opacity-30' : ''
        }`}>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg truncate ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.name}</h3>
                {product.brand && <p className={`text-sm truncate ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('from', lang)} {product.brand}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              {product.thc > 0 && (
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${isDark ? 'text-haze' : 'text-gray-400'}`}>{t('thc', lang)}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.thc}%</span>
                </div>
              )}
              {product.cbd > 0 && (
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${isDark ? 'text-haze' : 'text-gray-400'}`}>{t('cbd', lang)}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.cbd}%</span>
                </div>
              )}
            </div>

            {product.rating > 0 && (
              <div className="flex items-center gap-0 mb-3">
                {[1, 2, 3, 4, 5].map((star) => {
                  const fillPercent = product.rating >= star ? 100 : product.rating >= star - 0.5 ? 50 : 0;
                  return (
                    <div key={star} className="relative w-4 h-4">
                      <Star className={`w-4 h-4 absolute inset-0 ${isDark ? 'text-edge' : 'text-gray-300'}`} />
                      <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                        <Star className="w-4 h-4 text-amberx fill-amberx" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {product.lastConsumed && (
              <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-haze' : 'text-gray-400'}`}>
                <Clock className="w-3 h-3" />
                {t('lastConsumed', lang)}: {formatDate(product.lastConsumed)}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 mt-auto pt-4 border-t border-dashed ${isDark ? 'border-edge' : 'border-gray-200'}`}>
            <button
              onClick={(e) => buttonAction(e, onConsume)}
              aria-label={t('consume', lang)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isDark
                  ? 'bg-gradient-to-r from-cyanx/10 to-emera/10 text-cyanx hover:from-cyanx/20 hover:to-emera/20'
                  : 'bg-gradient-to-r from-cyan-100 to-emerald-100 text-cyan-700 hover:from-cyan-200 hover:to-emerald-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="text-sm">{t('consume', lang)}</span>
            </button>
            <button
              onClick={(e) => buttonAction(e, onSell)}
              aria-label="Sell"
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isDark
                  ? 'bg-amberx/10 text-amberx hover:bg-amberx/20'
                  : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 hover:from-amber-200 hover:to-orange-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">{t('sell', lang)}</span>
            </button>
            <button
              onClick={(e) => buttonAction(e, onToggleFavorite)}
              aria-label={product.favorite ? t('filterFavorites', lang) : 'Add to favourites'}
              className={`p-2 rounded-xl transition-all ${
                product.favorite
                  ? 'bg-amberx/15 text-amberx'
                  : isDark
                    ? 'bg-edge/50 text-haze hover:text-amberx hover:bg-amberx/10'
                    : 'bg-gray-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${product.favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
