import { useState } from 'react';
import { Product, CommunityPost } from '../types';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { generateId } from '../utils/helpers';
import { X, Upload, Star, Check, Camera } from 'lucide-react';

interface ShareStrainModalProps {
  products: Product[];
  onClose: () => void;
  onShare: (post: CommunityPost) => void;
  isDark?: boolean;
}

export function ShareStrainModal({ products, onClose, onShare, isDark = true }: ShareStrainModalProps) {
  const { settings } = useSettings();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customStrain, setCustomStrain] = useState('');
  const [customType, setCustomType] = useState<'indica' | 'sativa' | 'hybrid'>('hybrid');
  const [customThc, setCustomThc] = useState(0);
  const [customCbd, setCustomCbd] = useState(0);
  const [customPicture, setCustomPicture] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [initialRating, setInitialRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [useCustomProduct, setUseCustomProduct] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const product = useCustomProduct ? null : selectedProduct;
    
    if (!product && !customName) return;

    const post: CommunityPost = {
      id: generateId(),
      userId: 'current-user',
      userName: settings.profileName || 'Anonymous',
      userAvatar: settings.profilePicture,
      productName: product?.name || customName,
      strain: product?.strain || customStrain,
      type: product?.type || customType,
      thc: product?.thc || customThc,
      cbd: product?.cbd || customCbd,
      picture: product?.picture || customPicture,
      notes: product?.notes || customNotes,
      rating: initialRating,
      ratings: initialRating > 0 ? [{ userId: 'current-user', rating: initialRating }] : [],
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    };

    onShare(post);
    onClose();
  };

  const canSubmit = (useCustomProduct && customName) || (!useCustomProduct && selectedProduct);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl border-2 shadow-2xl max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('shareStrain', settings.language)}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Toggle: From Stash or Custom */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseCustomProduct(false)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all border-2 ${
                !useCustomProduct
                  ? isDark 
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                    : 'bg-cyan-50 border-cyan-500 text-cyan-600'
                  : isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              {t('myStash', settings.language)}
            </button>
            <button
              onClick={() => setUseCustomProduct(true)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all border-2 ${
                useCustomProduct
                  ? isDark 
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                    : 'bg-cyan-50 border-cyan-500 text-cyan-600'
                  : isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              New Strain
            </button>
          </div>

          {!useCustomProduct ? (
            /* Select from existing products */
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('selectProduct', settings.language)}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left ${
                      selectedProductId === product.id
                        ? isDark 
                          ? 'border-cyan-500 bg-cyan-500/10' 
                          : 'border-cyan-500 bg-cyan-50'
                        : isDark 
                          ? 'border-slate-700 hover:border-slate-600' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {product.picture ? (
                      <img src={product.picture} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-slate-700' : 'bg-gray-200'
                      }`}>
                        <Camera className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {product.name}
                      </p>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {product.strain}
                      </p>
                    </div>
                    {selectedProductId === product.id && (
                      <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              {products.length === 0 && (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  No products in your stash yet
                </p>
              )}
            </div>
          ) : (
            /* Custom product form */
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  } outline-none`}
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Strain
                </label>
                <input
                  type="text"
                  value={customStrain}
                  onChange={(e) => setCustomStrain(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  } outline-none`}
                  placeholder="Strain name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Type
                </label>
                <div className="flex gap-2">
                  {(['indica', 'sativa', 'hybrid'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCustomType(type)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all border-2 ${
                        customType === type
                          ? type === 'indica'
                            ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                            : type === 'sativa'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : isDark 
                            ? 'bg-slate-800 border-slate-700 text-slate-400' 
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    THC %
                  </label>
                  <input
                    type="number"
                    value={customThc}
                    onChange={(e) => setCustomThc(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl border-2 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    } outline-none`}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    CBD %
                  </label>
                  <input
                    type="number"
                    value={customCbd}
                    onChange={(e) => setCustomCbd(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl border-2 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                    } outline-none`}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Picture
                </label>
                <div className="flex items-center gap-3">
                  {customPicture && (
                    <img src={customPicture} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  )}
                  <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-slate-700 hover:border-slate-600 text-slate-400' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-500'
                  }`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload</span>
                    <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border-2 resize-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
                  } outline-none`}
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>
            </div>
          )}

          {/* Initial Rating */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Your Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setInitialRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoveredStar || initialRating)
                        ? 'fill-amber-400 text-amber-400'
                        : isDark ? 'text-slate-600' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className={`ml-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {initialRating > 0 ? `${initialRating}/5` : 'Rate'}
              </span>
            </div>
          </div>

          {/* Preview */}
          {(selectedProduct || (useCustomProduct && customName)) && (
            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Preview
              </p>
              <div className="flex items-center gap-3">
                {(selectedProduct?.picture || customPicture) ? (
                  <img 
                    src={selectedProduct?.picture || customPicture} 
                    alt="" 
                    className="w-12 h-12 rounded-lg object-cover" 
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-slate-700' : 'bg-gray-200'
                  }`}>
                    <Camera className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  </div>
                )}
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedProduct?.name || customName}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {selectedProduct?.strain || customStrain || 'Unknown strain'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('cancel', settings.language)}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-cyan-500 to-green-500 text-white hover:from-cyan-400 hover:to-green-400'
                : isDark 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('share', settings.language)}
          </button>
        </div>
      </div>
    </div>
  );
}