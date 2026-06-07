import { Product } from '../types';
import { formatDate, roundToHundredth } from '../utils/helpers';
import { Star, Heart, Flame, Clock, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onConsume: () => void;
  onToggleFavorite: () => void;
  isDark?: boolean;
  layout?: 'grid' | 'list' | 'compact';
}

export function ProductCard({ product, onClick, onConsume, onToggleFavorite, isDark = true, layout = 'grid' }: ProductCardProps) {
  const displayAmount = roundToHundredth(product.amount);
  const amountString = `${displayAmount.toFixed(2)}g`;

  const getStrainColor = (strainType: 'indica' | 'sativa' | 'hybrid') => {
    switch (strainType) {
      case 'indica':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'sativa':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'hybrid':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    }
  };

  const strainColors = getStrainColor(product.type);

  if (layout === 'list') {
    return (
      <div
        className={`group relative rounded-xl border-2 transition-all cursor-pointer ${
          isDark 
            ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
        } ${product.favorite ? 'ring-2 ring-amber-500/50' : ''}`}
      >
        <div className="flex items-center gap-4 p-4" onClick={onClick}>
          <div className="relative flex-shrink-0">
            {product.picture ? (
              <img
                src={product.picture}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-slate-800' : 'bg-gray-100'
              }`}>
                <Package className={`w-6 h-6 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
            )}
            {product.favorite && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {product.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${strainColors.bg} ${strainColors.text}`}>
                {product.type}
              </span>
            </div>
            {product.brand && (
              <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                From {product.brand}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {amountString}
              </span>
              {product.thc > 0 && (
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  THC: {product.thc}%
                </span>
              )}
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {product.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConsume();
              }}
              className={`p-2 rounded-lg transition-all ${
                isDark 
                  ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                  : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
              }`}
            >
              <Flame className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-2 rounded-lg transition-all ${
                product.favorite
                  ? 'text-amber-400'
                  : isDark ? 'text-slate-500 hover:text-amber-400' : 'text-gray-400 hover:text-amber-500'
              }`}
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
        className={`group relative rounded-xl border-2 transition-all cursor-pointer ${
          isDark 
            ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
        } ${product.favorite ? 'ring-2 ring-amber-500/50' : ''}`}
        onClick={onClick}
      >
        <div className="aspect-square relative">
          {product.picture ? (
            <img
              src={product.picture}
              alt={product.name}
              className="w-full h-full object-cover rounded-t-xl"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center rounded-t-xl ${
              isDark ? 'bg-slate-800' : 'bg-gray-100'
            }`}>
              <Package className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            </div>
          )}
          
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${strainColors.bg} ${strainColors.text}`}>
            {product.type}
          </div>

          {product.favorite && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
          )}

          <div className={`absolute bottom-0 left-0 right-0 px-2 py-1.5 ${isDark ? 'bg-slate-900/90' : 'bg-white/90'}`}>
            <span className={`text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {amountString}
            </span>
          </div>
        </div>

        <div className="p-2">
          <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {product.name}
          </h3>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {product.rating}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onConsume();
          }}
          className={`absolute bottom-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
            isDark 
              ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
              : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
          }`}
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Default Grid Layout
  return (
    <div
      className={`group relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
        isDark 
          ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl hover:shadow-cyan-500/5' 
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
      } ${product.favorite ? 'ring-2 ring-amber-500/50' : ''}`}
      onClick={onClick}
    >
      <div className="relative aspect-video">
        {product.picture ? (
          <img
            src={product.picture}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-slate-800' : 'bg-gray-100'
          }`}>
            <Package className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
        )}
        
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border ${strainColors.bg} ${strainColors.text} ${strainColors.border}`}>
          {product.type}
        </div>

        {product.favorite && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        )}

        <div className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-lg font-bold text-sm ${
          isDark 
            ? 'bg-slate-900/90 text-cyan-400 backdrop-blur-sm' 
            : 'bg-white/90 text-cyan-600 backdrop-blur-sm'
        }`}>
          {amountString}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {product.name}
            </h3>
            {product.brand && (
              <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                From {product.brand}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {product.thc > 0 && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                THC
              </span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {product.thc}%
              </span>
            </div>
          )}
          {product.cbd > 0 && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                CBD
              </span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {product.cbd}%
              </span>
            </div>
          )}
        </div>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= product.rating
                    ? 'text-amber-400 fill-amber-400'
                    : isDark ? 'text-slate-600' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {product.lastConsumed && (
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            <Clock className="w-3 h-3" />
            Last: {formatDate(product.lastConsumed)}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConsume();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${
              isDark 
                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="text-sm">Consume</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-2 rounded-xl transition-all ${
              product.favorite
                ? 'bg-amber-500/20 text-amber-400'
                : isDark 
                  ? 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10' 
                  : 'bg-gray-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${product.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}