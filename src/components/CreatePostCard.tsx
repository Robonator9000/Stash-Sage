import { useState, useRef, useEffect } from 'react';
import type { Product } from '../types';
import { t } from '../utils/translations';

interface CreatePostCardProps {
  isDark: boolean;
  lang: string;
  displayName: string;
  currentUserId: string;
  products: Product[];
  avatarUrl?: string;
  onSubmit: (content: string, productId?: string, productName?: string, imageFiles?: File[]) => Promise<void>;
  onViewProfile?: (userId: string) => void;
}

const MAX_CHARS = 500;
const MAX_IMAGES = 4;

export function CreatePostCard({ isDark, lang, displayName, currentUserId, products, avatarUrl, onSubmit, onViewProfile }: CreatePostCardProps) {
  const [content, setContent] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [content]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowProductPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    return () => { imagePreviews.forEach(u => URL.revokeObjectURL(u)); };
  }, [imagePreviews]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;
    const newFiles = [...imageFiles, ...toAdd];
    const newPreviews = [...imagePreviews, ...toAdd.map(f => URL.createObjectURL(f))];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed, selectedProduct?.id, selectedProduct?.name, imageFiles.length > 0 ? imageFiles : undefined);
      setContent('');
      setSelectedProduct(null);
      imagePreviews.forEach(u => URL.revokeObjectURL(u));
      setImageFiles([]);
      setImagePreviews([]);
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_CHARS - content.length;
  const isValid = content.trim().length > 0;

  return (
    <div className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onViewProfile?.(currentUserId)}
          className="w-9 h-9 rounded-xl shrink-0 overflow-hidden"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyanx to-emera">
              <span className="text-white font-display font-bold text-sm">
                {(displayName[0] || '?').toUpperCase()}
              </span>
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onViewProfile?.(currentUserId)}
            className={`text-sm font-semibold mb-0.5 ${isDark ? 'text-frost hover:underline' : 'text-gray-800 hover:underline'}`}
          >
            {displayName}
          </button>
          <textarea
            ref={textareaRef}
            id="post-content"
            name="post-content"
            aria-label="Post content"
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder={t('postPlaceholder', lang)}
            rows={1}
            className={`w-full resize-none text-sm outline-none transition-colors ${
              isDark ? 'bg-transparent text-frost placeholder-muted' : 'bg-transparent text-gray-800 placeholder-gray-400'
            }`}
          />

          {selectedProduct && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mt-2 ${
              isDark ? 'bg-midnight text-cyanx' : 'bg-cyan-50 text-cyan-700'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              {selectedProduct.name}
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Remove linked product"
                className="ml-1 hover:opacity-70"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    aria-label={`Remove image ${i + 1}`}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-edge/50">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add images"
                disabled={imageFiles.length >= MAX_IMAGES}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  imageFiles.length >= MAX_IMAGES
                    ? isDark ? 'text-muted/50 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                    : isDark ? 'text-muted hover:text-frost hover:bg-midnight' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {t('addImages', lang)}
                {imageFiles.length > 0 && (
                  <span className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{imageFiles.length}/{MAX_IMAGES}</span>
                )}
              </button>

              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  aria-label="Toggle product picker"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDark ? 'text-muted hover:text-frost hover:bg-midnight' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  {t('linkProduct', lang)}
                </button>

                {showProductPicker && products.length > 0 && (
                  <div className={`absolute bottom-full left-0 mb-1 w-56 max-h-48 overflow-y-auto rounded-xl shadow-lg z-10 ${
                    isDark ? 'bg-card border border-edge' : 'bg-white border border-gray-200'
                  }`}>
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setShowProductPicker(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-50 text-gray-800'
                        } ${selectedProduct?.id === p.id ? (isDark ? 'bg-midnight' : 'bg-gray-50') : ''}`}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className={`ml-2 text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{p.strain}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${remaining < 50 ? 'text-orange-500' : isDark ? 'text-muted' : 'text-gray-400'}`}>
                {remaining}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isValid && !submitting
                    ? 'text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark'
                    : isDark ? 'bg-midnight text-muted cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : t('postButton', lang)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
