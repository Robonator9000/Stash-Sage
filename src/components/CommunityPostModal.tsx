import { useState } from 'react';
import { Product, CommunityPost } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { X, Upload, Star } from 'lucide-react';

interface CommunityPostModalProps {
  products: Product[];
  onSave: (data: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'likedBy'>) => void;
  onClose: () => void;
  isDark?: boolean;
}

export function CommunityPostModal({ products, onSave, onClose, isDark = true }: CommunityPostModalProps) {
  const [authorName, setAuthorName] = useState('');
  const [productName, setProductName] = useState('');
  const [strainName, setStrainName] = useState('');
  const [type, setType] = useState<'indica' | 'sativa' | 'hybrid'>('hybrid');
  const [image, setImage] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!authorName || !productName) return;
    
    onSave({
      userId: 'current-user',
      userName: authorName,
      productName,
      strain: strainName,
      type,
      thc: 0,
      cbd: 0,
      picture: image || undefined,
      notes: notes || undefined,
      rating,
      ratings: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex-shrink-0 px-6 py-4 flex items-center justify-between border-b ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Share Your Experience
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Author Name */}
          <div className="space-y-2">
            <Label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              Your Name
            </Label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Anonymous"
              className={isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
            />
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              Product Name
            </Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Blue Dream"
              className={isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
            />
            {products.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {products.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProductName(p.name);
                      setStrainName(p.strain);
                      setType(p.type);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isDark 
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strain Type */}
          <div className="space-y-2">
            <Label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              Strain Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(['indica', 'sativa', 'hybrid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setType(s)}
                  className={`py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                    type === s
                      ? s === 'indica'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : s === 'sativa'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              Rating
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-colors ${
                    star <= rating
                      ? 'text-amber-400'
                      : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              Photo (optional)
            </Label>
            {image ? (
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                isDark 
                  ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50' 
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}>
                <Upload className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Click to upload
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className={isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 px-6 py-4 flex gap-3 border-t ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <Button
            onClick={onClose}
            variant="outline"
            className={`flex-1 font-bold ${
              isDark 
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-100 bg-transparent'
            }`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!authorName || !productName}
            className={`flex-1 font-bold ${
              isDark 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white'
            }`}
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}