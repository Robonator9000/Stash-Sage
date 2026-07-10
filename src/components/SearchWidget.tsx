import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useDebounce } from '../hooks/useDebounce';
import { Search } from 'lucide-react';

interface SearchResult {
  type: 'user' | 'post';
  id: string;
  label: string;
  sublabel?: string;
  avatar_url?: string;
  user_id?: string;
}

interface SearchWidgetProps {
  isDark: boolean;
  onViewProfile?: (userId: string) => void;
  onViewPost?: (postId: string) => void;
}

export function SearchWidget({ isDark, onViewProfile, onViewPost }: SearchWidgetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    setSearching(true);
    const [usersRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, username, avatar_url')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(5),
      supabase.from('posts').select('id, content, user_id').ilike('content', `%${q}%`).order('created_at', { ascending: false }).limit(5),
    ]);
    const items: SearchResult[] = [];
    for (const u of (usersRes.data || [])) {
      items.push({ type: 'user', id: u.user_id, label: u.display_name || u.username, sublabel: `@${u.username}`, avatar_url: u.avatar_url, user_id: u.user_id });
    }
    for (const p of (postsRes.data || [])) {
      items.push({ type: 'post', id: p.id, label: p.content.slice(0, 80), sublabel: 'Post', user_id: p.user_id });
    }
    setResults(items.slice(0, 8));
    setOpen(items.length > 0);
    setSearching(false);
  }, []);

  useEffect(() => { doSearch(debouncedQuery); }, [debouncedQuery, doSearch]);

  function handleSelect(item: SearchResult) {
    setOpen(false);
    setQuery('');
    if (item.type === 'user') onViewProfile?.(item.id);
    else onViewPost?.(item.id);
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${isDark ? 'bg-midnight border border-edge' : 'bg-gray-100 border border-gray-200'}`}>
        <Search className={`w-4 h-4 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search Stash Tracker"
          className={`flex-1 text-sm bg-transparent outline-none ${isDark ? 'text-frost placeholder-muted' : 'text-gray-800 placeholder-gray-400'}`}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
        />
        {searching && (
          <svg className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-muted' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
      {open && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 overflow-hidden ${isDark ? 'bg-card border border-edge' : 'bg-white border border-gray-200'}`}>
          {results.map(item => (
            <button key={`${item.type}-${item.id}`} onClick={() => handleSelect(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isDark ? 'hover:bg-midnight' : 'hover:bg-gray-50'}`}>
              {item.type === 'user' ? (
                <div className={`w-7 h-7 rounded-lg shrink-0 overflow-hidden ${item.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera flex items-center justify-center'}`}>
                  {item.avatar_url ? <img src={item.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{(item.label[0] || '?').toUpperCase()}</span>}
                </div>
              ) : (
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
                  <Search className={`w-3.5 h-3.5 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>{item.label}</p>
                <p className={`text-xs truncate ${isDark ? 'text-muted' : 'text-gray-400'}`}>{item.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
