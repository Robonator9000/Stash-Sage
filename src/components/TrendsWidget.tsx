import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const TRENDING_CACHE_TTL = 60 * 1000;
let cachedTrendingTags: string[] | null = null;
let cachedTrendingAt = 0;

interface TrendsWidgetProps {
  isDark: boolean;
  activeHashtag?: string | null;
  onHashtagClick?: (tag: string) => void;
}

export function TrendsWidget({ isDark, activeHashtag, onHashtagClick }: TrendsWidgetProps) {
  const [tags, setTags] = useState<string[]>(cachedTrendingTags || []);

  useEffect(() => {
    const now = Date.now();
    if (cachedTrendingTags && now - cachedTrendingAt < TRENDING_CACHE_TTL) {
      setTags(cachedTrendingTags);
      return;
    }
    supabase.from('post_hashtags').select('tag, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach(h => { counts[h.tag] = (counts[h.tag] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
        cachedTrendingTags = sorted;
        cachedTrendingAt = Date.now();
        setTags(sorted);
      });
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className={`rounded-2xl backdrop-blur-sm ${isDark ? 'bg-surface/40 border border-edge' : 'bg-white/70 border border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${isDark ? 'border-edge' : 'border-gray-200'}`}>
        <h3 className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>Trends for you</h3>
      </div>
      <div className="p-2 space-y-0.5">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => onHashtagClick?.(tag)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeHashtag === tag
                ? 'bg-cyanx/20 text-cyanx'
                : isDark ? 'text-mist hover:bg-midnight hover:text-frost' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="text-xs text-muted">Trending</span>
            <p className="font-medium">#{tag}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
