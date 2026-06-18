import { useState, useEffect } from 'react';
import type { Post, Product } from '../types';
import { supabase } from '../utils/supabase';
import { PostCard } from './PostCard';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Package, MessageSquare } from 'lucide-react';
import { t } from '../utils/translations';

interface UserProfileModalProps {
  userId: string;
  isDark: boolean;
  lang: string;
  onBack?: () => void;
}

export function UserProfileModal({ userId, isDark, lang, onBack }: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string; avatar_url?: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'posts' | 'products'>('posts');

  useEffect(() => {
    async function load() {
      setError(null);
      const [profileRes, postsRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('products').select('id, name, type, amount, price, rating, thc, cbd, favorite, createdat, updatedat, notes, consumptionCount, lastconsumed, purchasedAt, brand, tags, effects, picture, pictures').eq('user_id', userId).order('createdat', { ascending: false }).limit(20),
      ]);

      if (profileRes.error) setError(profileRes.error.message);
      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.error) setError(prev => prev ? prev + '; ' + postsRes.error.message : postsRes.error.message);
      if (postsRes.data) {
        const enriched = postsRes.data.map(p => ({
          ...p,
          author: { username: profileRes.data?.display_name || 'User', avatar_url: profileRes.data?.avatar_url },
          likes_count: 0,
          liked_by_me: false,
          comments_count: 0,
        }));
        setPosts(enriched);
      }
      if (productsRes.error) setError(prev => prev ? prev + '; ' + productsRes.error.message : productsRes.error.message);
      if (productsRes.data) {
        setProducts(productsRes.data as unknown as Product[]);
      }
      setLoading(false);
    }
    load().catch(e => { setError(e instanceof Error ? e.message : 'Failed to load profile'); setLoading(false); });
  }, [userId]);

  const username = profile?.display_name || 'User';
  const initial = username[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        {onBack && (
          <button onClick={onBack} aria-label="Go back" className={`p-2 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${profile?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-display font-bold text-lg">{initial}</span>
          )}
        </div>
        <div>
          <h2 className={`font-display font-bold text-lg ${isDark ? 'text-frost' : 'text-gray-800'}`}>{username}</h2>
          <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{posts.length} {t('posts', lang).toLowerCase()} &middot; {products.length} {t('products', lang).toLowerCase()}</p>
        </div>
      </div>

      {/* Section tabs: Posts / Products */}
      <div role="tablist" className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveSection('posts')}
          role="tab"
          aria-selected={activeSection === 'posts'}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeSection === 'posts' ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('posts', lang)} ({posts.length})
        </button>
        <button
          onClick={() => setActiveSection('products')}
          role="tab"
          aria-selected={activeSection === 'products'}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeSection === 'products' ? isDark ? 'bg-surface text-frost' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-mist hover:text-frost' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Package className="w-4 h-4" />
          {t('products', lang)} ({products.length})
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-4 rounded-2xl animate-pulse ${isDark ? 'bg-surface/50' : 'bg-gray-50'}`}>
                <div className={`h-3 w-24 rounded ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className={`h-3 w-full rounded mt-2 ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-2xl text-center text-sm ${isDark ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-500 border border-red-200'}`}>
            {error}
          </div>
        )}

        {!loading && !error && activeSection === 'posts' && posts.length === 0 && (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {t('noPostsYet', lang)}
          </div>
        )}

        {!loading && !error && activeSection === 'products' && products.length === 0 && (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
            {t('noProductsYet', lang)}
          </div>
        )}

        {activeSection === 'posts' && posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isDark={isDark}
            lang={lang}
            currentUserId={currentUser?.id || ''}
            username={currentUser?.email || 'User'}
            onLike={async (postId) => {
              const { error } = await supabase.from('post_likes').insert({ user_id: currentUser?.id, post_id: postId });
              if (error) throw error;
            }}
            onUnlike={async (postId) => {
              const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUser?.id).eq('post_id', postId);
              if (error) throw error;
            }}
            onDelete={async (postId) => {
              await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser?.id);
              setPosts(prev => prev.filter(p => p.id !== postId));
            }}
            onEdit={async (postId, content) => {
              await supabase.from('posts').update({ content }).eq('id', postId).eq('user_id', currentUser?.id);
              setPosts(prev => prev.map(p => p.id === postId ? { ...p, content } : p));
            }}
            onViewProfile={(userId) => {
              if (userId !== userId) { /* already viewing this profile */ }
            }}
          />
        ))}

        {activeSection === 'products' && (
          <div className="grid grid-cols-1 gap-3">
            {products.map(product => (
              <div key={product.id} className={`p-4 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm truncate ${isDark ? 'text-frost' : 'text-gray-900'}`}>{product.name}</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      {product.type} {product.thc ? `· ${product.thc}% THC` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-bold ${isDark ? 'text-emera' : 'text-emerald-600'}`}>{product.amount}g</span>
                    {product.price > 0 && (
                      <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>${product.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-xs ${i < Math.round(product.rating) ? 'text-amberx' : isDark ? 'text-slate-600' : 'text-gray-300'}`}>&#9733;</span>
                    ))}
                    <span className={`text-xs ml-1 ${isDark ? 'text-muted' : 'text-gray-400'}`}>{product.rating.toFixed(1)}</span>
                  </div>
                )}
                {product.notes && (
                  <p className={`text-xs mt-2 line-clamp-2 ${isDark ? 'text-mist' : 'text-gray-500'}`}>{product.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}