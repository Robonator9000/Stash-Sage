import { useState, useRef, useEffect, useMemo } from 'react';
import { Product, Session } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { generateId, roundToHundredth } from '../utils/helpers';
import { gramsToOz } from '../utils/convert';
import { X, Star, Camera, Heart, Plus, ChevronDown, History } from 'lucide-react';
import { t } from '../utils/translations';
import { showToast } from './Toast';

interface ProductModalProps {
  product?: Product | null;
  onSave: (product: Product) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isDark?: boolean;
  sessions?: Session[];
}

const POPULAR_BRANDS = [
  'Cookies',
  'Runtz',
  'Connected',
  'Do-Si-Dos',
  'Gelato',
  'Wedding Cake',
  'Blue Dream',
  'OG Kush',
  'Sour Diesel',
  'Purple Haze',
];

export function ProductModal({ product, onSave, onDelete, onClose, isDark = true, sessions = [] }: ProductModalProps) {
  const { settings, addFavoriteBrand, removeFavoriteBrand, addRecentBrand } = useSettings();
  const lang = settings.language;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(product?.name || '');
  const [type, setType] = useState<string>(product?.type || 'hybrid');
  const [showCustomType, setShowCustomType] = useState(false);
  const [thc, setThc] = useState(product?.thc || 0);
  const [cbd, setCbd] = useState(product?.cbd || 0);
  const [amount, setAmount] = useState(product?.amount || 0);
  const [price, setPrice] = useState(product?.price || 0);
  const [pictures, setPictures] = useState<string[]>(product?.pictures?.length ? product.pictures : (product?.picture ? [product.picture] : []));
  const [notes, setNotes] = useState(product?.notes || '');
  const [rating, setRating] = useState(product?.rating || 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [brand, setBrand] = useState(product?.brand || '');
  const [tags, setTags] = useState(product?.tags || '');
  const [effects, setEffects] = useState(product?.effects || '');
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showOz, setShowOz] = useState(false);
  const [purchasedAt, setPurchasedAt] = useState(
    product?.purchasedAt ? new Date(product.purchasedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const { isVisible, handleClose } = useModalAnimation(onClose);

  const productSessions = useMemo(() => {
    if (!product) return [];
    return sessions.filter(s => s.productId === product.id);
  }, [sessions, product]);

  const [showHistory, setShowHistory] = useState(false);

  const favoriteBrands = settings.favoriteBrands || [];
  const recentBrands = settings.recentBrands || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          showToast({ id: 'photo-size', title: t('photoSizeWarning', lang), body: file.name, variant: 'danger' });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setPictures((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setIsBrandDropdownOpen(false);
    setBrandSearchQuery('');
    addRecentBrand(selectedBrand);
  };

  const handleToggleFavoriteBrand = (e: React.MouseEvent, brandName: string) => {
    e.stopPropagation();
    if (favoriteBrands.includes(brandName)) {
      removeFavoriteBrand(brandName);
    } else {
      addFavoriteBrand(brandName);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const roundedAmount = roundToHundredth(amount);

    const productData: Product = {
      id: product?.id || generateId(),
      name: name.trim(),
      strain: name.trim(),
      type,
      thc,
      cbd,
      amount: roundedAmount,
      price,
      picture: pictures[0] || '',
      pictures: pictures,
      notes: notes.trim(),
      rating,
      brand: brand.trim(),
      tags: tags.trim(),
      effects: effects.trim(),
      consumptionCount: product?.consumptionCount || 0,
      lastConsumed: product?.lastConsumed,
      purchasedAt: purchasedAt ? new Date(purchasedAt) : undefined,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
      favorite: product?.favorite || false,
    };

    onSave(productData);
    handleClose();
  };

  const getStrainColor = (strainType: string) => {
    if (isDark) {
      switch (strainType.toLowerCase()) {
        case 'indica':
          return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'sativa':
          return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        case 'hybrid':
          return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        default:
          return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      }
    } else {
      switch (strainType.toLowerCase()) {
        case 'indica':
          return 'bg-purple-100 text-purple-700 border-purple-300';
        case 'sativa':
          return 'bg-amber-100 text-amber-700 border-amber-300';
        case 'hybrid':
          return 'bg-emerald-100 text-emerald-700 border-emerald-300';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-300';
      }
    }
  };

  const filteredBrands = [...new Set([...favoriteBrands, ...recentBrands, ...POPULAR_BRANDS])].filter(
    (b) => b.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={product ? `${t('editProduct', lang)} ${product.name}` : t('addProduct', lang)}
    >
      <div 
        className={`w-full max-w-md rounded-2xl border-2 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {product ? t('editProduct', lang) : t('addProduct', lang)}
          </h2>
          <button
            onClick={handleClose}
            aria-label={t('close', lang)}
            className={`p-2 rounded-xl transition-all ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Pictures */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('photos', lang)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {pictures.map((pic, idx) => (
                <div key={idx} className="relative group">
                  <div className={`w-full aspect-square rounded-xl overflow-hidden border-2 ${
                    isDark ? 'border-slate-700' : 'border-gray-200'
                  }`}>
                    <img src={pic} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => setPictures((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={t('removePhoto', lang)}
                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors md:opacity-0 md:group-hover:opacity-100 ${
                      isDark ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-red-600 text-white hover:bg-red-500'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors gap-1 ${
                  isDark
                    ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                <Camera className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                <span className={`text-[10px] leading-tight ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('addPhoto', lang)}</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePictureUpload}
              className="hidden"
            />
          </div>

          {/* Strain Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('strainName', lang)} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('strainNamePlaceholder', lang)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
              } outline-none`}
            />
          </div>

          {/* Brand Dropdown */}
          <div ref={brandDropdownRef}>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('brandDispensary', lang)}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-left flex items-center justify-between ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                } outline-none`}
              >
                <span className={brand ? '' : isDark ? 'text-slate-500' : 'text-gray-400'}>
                  {brand || t('selectBrand', lang)}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBrandDropdownOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border-2 shadow-xl z-10 max-h-60 overflow-y-auto ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                  {/* Search Input */}
                  <div className={`p-2 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      placeholder={t('searchBrands', lang)}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${
                        isDark 
                          ? 'bg-slate-700 text-white placeholder-slate-400' 
                          : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                      } outline-none`}
                    />
                  </div>

                  {/* Brand List */}
                  {filteredBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => handleBrandSelect(b)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                        brand === b
                          ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                          : isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <span>{b}</span>
                      <div className="flex items-center gap-2">
                        {favoriteBrands.includes(b) && (
                          <Heart className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                        <button
                          onClick={(e) => handleToggleFavoriteBrand(e, b)}
                          className={`p-1 rounded transition-colors ${
                            isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${
                            favoriteBrands.includes(b) 
                              ? 'text-amber-400 fill-amber-400' 
                              : isDark ? 'text-slate-500' : 'text-gray-400'
                          }`} />
                        </button>
                      </div>
                    </button>
                  ))}

                  {/* Add New Brand */}
                  {brandSearchQuery && !filteredBrands.some(b => b.toLowerCase() === brandSearchQuery.toLowerCase()) && (
                    <button
                      onClick={() => handleBrandSelect(brandSearchQuery)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        isDark ? 'hover:bg-slate-700 text-cyan-400' : 'hover:bg-gray-100 text-cyan-600'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      {t('addBrand', lang).replace('{query}', brandSearchQuery)}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('strainType', lang)}
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {(['indica', 'sativa', 'hybrid'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setShowCustomType(false); }}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border-2 capitalize ${
                    type === t && !showCustomType
                      ? getStrainColor(t) + ' border-current'
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => { setShowCustomType(!showCustomType); if (!showCustomType) setType(''); }}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border-2 flex items-center justify-center gap-1 ${
                  showCustomType
                    ? isDark
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'bg-cyan-50 text-cyan-600 border-cyan-500/30'
                    : isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('custom', lang)}</span>
              </button>
            </div>
            {showCustomType && (
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder={t('customStrainPlaceholder', lang)}
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                } outline-none`}
              />
            )}
          </div>

          {/* THC & CBD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('thcPercent', lang)}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={thc}
                onChange={(e) => setThc(parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                } outline-none`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('cbdPercent', lang)}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={cbd}
                onChange={(e) => setCbd(parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                } outline-none`}
              />
            </div>
          </div>

          {/* Amount & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('amountGrams', lang)}{' '}
                <button
                  type="button"
                  onClick={() => setShowOz(!showOz)}
                  className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors ${
                    isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'
                  }`}
                >
                  {showOz ? 'g' : 'oz'}
                </button>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={showOz ? roundToHundredth(gramsToOz(amount)) : amount}
                onChange={(e) => setAmount(showOz ? (parseFloat(e.target.value) || 0) * 28.3495 : (parseFloat(e.target.value) || 0))}
                placeholder={t('amountPlaceholder', lang)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                } outline-none`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('priceLabel', lang)} ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                } outline-none`}
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Purchase Date
            </label>
            <input
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
              } outline-none`}
            />
          </div>

          {/* Rating */}
          <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('rating', lang)}
              </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const fillPercent = (hoveredStar || rating) >= star ? 100 : (hoveredStar || rating) >= star - 0.5 ? 50 : 0;
                return (
                  <div key={star} className="relative flex">
                    <button
                      onClick={() => setRating(star - 0.5)}
                      onMouseEnter={() => setHoveredStar(star - 0.5)}
                      onMouseLeave={() => setHoveredStar(0)}
                      aria-label={`${star - 0.5} ${t('stars', lang)}`}
                      className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                    />
                    <button
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      aria-label={`${star} ${t('stars', lang)}`}
                      className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                    />
                    <div className="relative w-7 h-7 pointer-events-none">
                      <Star className={`w-7 h-7 absolute inset-0 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                      <div className={`absolute inset-0 overflow-hidden transition-all`} style={{ width: `${fillPercent}%` }}>
                        <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(hoveredStar || rating) > 0 && (
                <span className={`ml-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {(hoveredStar || rating)}/5
                </span>
              )}
            </div>
          </div>

          {/* Tags & Effects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('tags', lang)}
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('tagsPlaceholder', lang)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                } outline-none`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('effects', lang)}
              </label>
              <input
                type="text"
                value={effects}
                onChange={(e) => setEffects(e.target.value)}
                placeholder={t('effectsPlaceholder', lang)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
                } outline-none`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('notesLabel', lang)}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder', lang)}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'
              } outline-none`}
            />
          </div>

          {/* Session History */}
          {product && productSessions.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 w-full p-3 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="text-sm font-medium">{t('sessionHistory', lang)} ({productSessions.length})</span>
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {[...productSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((s) => (
                    <div key={s.id} className={`p-3 rounded-xl text-sm ${
                      isDark ? 'bg-slate-800/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                          {new Date(s.date).toLocaleDateString()}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {s.amount}g · {s.people}p · {s.hitsCount}hits
                        </span>
                      </div>
                      {s.notes && (
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} line-clamp-2`}>{s.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 p-5 border-t flex-shrink-0 ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          {product && onDelete && (
            <button
              onClick={() => {
                onDelete(product.id);
                handleClose();
              }}
              aria-label={t('delete', lang)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                isDark 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              {t('delete', lang)}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleClose}
            aria-label={t('cancel', lang)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            aria-label={product ? t('save', lang) : t('addProduct', lang)}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${
              name.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400'
                : isDark 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {product ? t('save', lang) : t('addProduct', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}