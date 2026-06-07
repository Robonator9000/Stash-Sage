import { useState } from 'react';
import { CommunityPost } from '../types';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { formatDate, getStrainColor } from '../utils/helpers';
import { Star, Heart, MessageCircle, Clock, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId: string;
  onRate: (postId: string, rating: number) => void;
  onLike: (postId: string) => void;
  isDark?: boolean;
}

export function CommunityPostCard({ post, currentUserId, onRate, onLike, isDark = true }: CommunityPostCardProps) {
  const { settings } = useSettings();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const userRating = post.ratings.find(r => r.userId === currentUserId)?.rating || 0;
  const hasLiked = post.likedBy.includes(currentUserId);
  const strainColor = getStrainColor(post.type);

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.userAvatar} alt={post.userName} />
            <AvatarFallback className={`font-bold text-sm ${
              isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
            }`}>
              {post.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {post.userName}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${strainColor}`}>
                {post.type}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image */}
      {post.picture ? (
        <div className="aspect-video bg-slate-800">
          <img src={post.picture} alt={post.productName} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`aspect-video flex items-center justify-center ${
          isDark ? 'bg-slate-800' : 'bg-gray-100'
        }`}>
          <Camera className={`w-12 h-12 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {post.productName}
          </h3>
          {post.strain && (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {post.strain}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {(post.thc > 0 || post.cbd > 0) && (
            <div className="flex items-center gap-2">
              {post.thc > 0 && (
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-gray-100 text-cyan-600'
                }`}>
                  THC {post.thc}%
                </span>
              )}
              {post.cbd > 0 && (
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  isDark ? 'bg-slate-800 text-green-400' : 'bg-gray-100 text-green-600'
                }`}>
                  CBD {post.cbd}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {post.notes && (
          <div>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-600'}`}
            >
              {showNotes ? 'Hide notes' : 'Show notes'}
            </button>
            {showNotes && (
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {post.notes}
              </p>
            )}
          </div>
        )}

        {/* Rating */}
        <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(post.id, star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= (hoveredStar || userRating)
                        ? 'fill-amber-400 text-amber-400'
                        : isDark ? 'text-slate-600' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className={`ml-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {post.rating > 0 ? post.rating.toFixed(1) : '-'}
              </span>
            </div>
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {post.ratings.length} {post.ratings.length === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 transition-colors ${
              hasLiked
                ? 'text-red-500'
                : isDark ? 'text-slate-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-red-500' : ''}`} />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}