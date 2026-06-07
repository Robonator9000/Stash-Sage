import { CommunityPost } from '../types';
import { useSettings } from '../utils/useSettings';
import { Heart, MessageCircle, Share2, Star, User } from 'lucide-react';

interface CommunityCardProps {
  post: CommunityPost;
  onLike: () => void;
  onRate: (rating: number) => void;
  isDark?: boolean;
}

export function CommunityCard({ post, onLike, onRate, isDark = true }: CommunityCardProps) {
  const { settings } = useSettings();
  const isLiked = post.likedBy.includes('current-user');

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] ${
      isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isDark ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-purple-400 to-pink-400'
        }`}>
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {post.userName}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Image */}
      {post.picture && (
        <div className="aspect-video bg-gray-800">
          <img 
            src={post.picture} 
            alt={post.productName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
            post.type === 'indica' 
              ? 'bg-purple-500/20 text-purple-400'
              : post.type === 'sativa'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {post.type}
          </span>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {post.productName}
          </h3>
        </div>

        {post.notes && (
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {post.notes}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRate(star)}
              className={`transition-colors ${
                star <= Math.round(post.rating)
                  ? 'text-amber-400'
                  : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          ))}
          <span className={`ml-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            ({post.rating.toFixed(1)})
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
          <button
            onClick={onLike}
            className={`flex items-center gap-1 transition-colors ${
              isLiked 
                ? 'text-pink-500' 
                : isDark ? 'text-slate-400 hover:text-pink-400' : 'text-gray-500 hover:text-pink-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes}</span>
          </button>
          <button className={`flex items-center gap-1 ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}>
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">0</span>
          </button>
          <button className={`flex items-center gap-1 ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}>
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}