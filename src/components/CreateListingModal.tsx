import { useState, useRef } from 'react';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useSettings } from '../utils/useSettings';
import type { MarketplaceListing, Product } from '../types';
import { CONTACT_PLATFORMS, MARKETPLACE_CATEGORIES } from '../types';
import { uploadListingImages } from '../utils/supabase';
import { t } from '../utils/translations';
import { X, Phone, Mail, MessageCircle, Send, Camera, Globe, Tag, DollarSign } from 'lucide-react';

const PLATFORM_ICONS: Record<string, typeof Phone> = {
  phone: Phone, email: Mail, discord: MessageCircle, telegram: Send,
  instagram: Camera, snapchat: Camera, signal: MessageCircle, whatsapp: MessageCircle, other: Globe,
};

interface CreateListingModalProps {
  isDark: boolean;
  lang: string;
  products: Product[];
  currentUserId: string;
  initial?: MarketplaceListing;
  onSubmit: (data: Partial<MarketplaceListing>) => Promise<void>;
  onClose: () => void;
}

export function CreateListingModal({ isDark, lang, products, currentUserId, initial, onSubmit, onClose }: CreateListingModalProps) {
  const { settings } = useSettings();
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [contactPlatform, setContactPlatform] = useState(initial?.contact_platform || settings.profile?.contact_platform || 'email');
  const [contactValue, setContactValue] = useState(initial?.contact_value || settings.profile?.contact_value || '');
  const [linkedProductId, setLinkedProductId] = useState(initial?.product_id || '');
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images || (initial?.image_url ? [initial.image_url] : []));
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PlatformIcon = PLATFORM_ICONS[contactPlatform] || Globe;
  const linkedProduct = products.find(p => p.id === linkedProductId);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...newImageFiles, ...files];
    setNewImageFiles(newFiles);
    const previews = files.map(f => URL.createObjectURL(f));
    setNewImagePreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;
    setSubmitting(true);
    try {
      let allImages = [...existingImages];
      if (newImageFiles.length > 0) {
        const uploaded = await uploadListingImages(currentUserId, newImageFiles);
        allImages = [...allImages, ...uploaded];
      }
      newImagePreviews.forEach(p => URL.revokeObjectURL(p));
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category || undefined,
        contact_platform: contactPlatform,
        contact_value: contactValue.trim(),
        product_id: linkedProductId || undefined,
        product_name: linkedProduct?.name || undefined,
        image_url: allImages[0] || undefined,
        images: allImages.length > 0 ? allImages : undefined,
      });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={initial ? t('editListing', lang) : t('createListing', lang)}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border-2 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {initial ? t('editListing', lang) : t('createListing', lang)}
          </h2>
          <button type="button" onClick={handleClose} aria-label="Close dialog"
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">

        {/* Title */}
        <div>
          <label htmlFor="listing-title" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t('listingTitle', lang)} *
          </label>
          <input id="listing-title" name="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'}`} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="listing-desc" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t('listingDescription', lang)}
          </label>
          <textarea id="listing-desc" name="description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none resize-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'}`} />
        </div>

        {/* Price + Category row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="listing-price" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('listingPrice', lang)} *
            </label>
            <div className="relative">
              <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              <input id="listing-price" name="price" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'}`} />
            </div>
          </div>
          <div>
            <label htmlFor="listing-category" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('listingCategory', lang)}
            </label>
            <select id="listing-category" name="category" value={category} onChange={e => setCategory(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
              <option value="">{t('listingCategory', lang)}...</option>
              {MARKETPLACE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Contact */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t('contactInfo', lang)} *
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {CONTACT_PLATFORMS.map(pf => {
              const Icon = PLATFORM_ICONS[pf] || Globe;
              return (
                <button key={pf} type="button" onClick={() => setContactPlatform(pf)} aria-pressed={contactPlatform === pf}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${contactPlatform === pf ? 'bg-gradient-to-r from-cyanx to-emera text-white' : isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {pf}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <PlatformIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input type="text" name="contact" value={contactValue} onChange={e => setContactValue(e.target.value)} required
              placeholder={contactPlatform === 'email' ? 'user@example.com' : contactPlatform === 'phone' ? '+1 555 0000' : '@username'}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500 placeholder-gray-400'}`} />
          </div>
        </div>

        {/* Link product */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t('linkProduct', lang)}
          </label>
          {linkedProduct ? (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              <Tag className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyanx' : 'text-cyan-600'}`} />
              <span className={`text-sm font-medium flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{linkedProduct.name}</span>
              <button type="button" onClick={() => { setLinkedProductId(''); setShowProductPicker(false); }}
                className={`text-xs font-medium ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>
                {t('removeProduct', lang)}
              </button>
            </div>
          ) : (
            <div className="relative">
              <button type="button" onClick={() => setShowProductPicker(!showProductPicker)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-left transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t('linkProduct', lang)}...
              </button>
              {showProductPicker && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border-2 shadow-xl z-10 max-h-48 overflow-y-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  {products.map(p => (
                    <button key={p.id} type="button" onClick={() => { setLinkedProductId(p.id); setShowProductPicker(false); }}
                      className={`w-full px-4 py-2.5 text-sm text-left transition-all ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Images */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t('listingImage', lang)}
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {existingImages.map((url, i) => (
              <div key={`e-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)} aria-label="Remove image"
                  className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newImagePreviews.map((preview, i) => (
              <div key={`n-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(i)} aria-label="Remove image"
                  className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(existingImages.length + newImagePreviews.length) < 9 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Upload image"
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${isDark ? 'border-slate-700 hover:border-slate-600 text-slate-500' : 'border-gray-300 hover:border-gray-400 text-gray-400'}`}>
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">{t('uploadPicture', lang)}</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting || !title.trim() || !price.trim() || !contactValue.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyanx/20">
          {submitting ? '...' : initial ? t('editListing', lang) : t('createListing', lang)}
        </button>
      </form>
      </div>
    </div>
  );
}
