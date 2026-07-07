import { useState, useEffect, useMemo } from 'react';
import { useConversations } from '../hooks/useConversations';
import { ChatThread } from './ChatThread';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { supabase } from '../utils/supabase';
import { ArrowLeft, Trash2, Search } from 'lucide-react';
import type { Conversation } from '../types';

interface ChatInboxProps {
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onBack?: () => void;
  initialTargetUserId?: string;
  onSelectConversation?: (c: Conversation) => void;
  popover?: boolean;
}

export function ChatInbox({ currentUserId, isDark, lang, onBack, initialTargetUserId, onSelectConversation, popover }: ChatInboxProps) {
  const { conversations, loading, refresh } = useConversations(currentUserId);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.other_user?.username?.toLowerCase().includes(q) ||
      c.last_message?.content?.toLowerCase().includes(q) ||
      c.listing?.title?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  useEffect(() => {
    if (!initialTargetUserId || loading || conversations.length === 0 && !loading) return;
    const existing = conversations.find(c =>
      (c.buyer_id === initialTargetUserId && c.seller_id === currentUserId) ||
      (c.seller_id === initialTargetUserId && c.buyer_id === currentUserId)
    );
    if (existing) {
      if (onSelectConversation) onSelectConversation(existing);
      else setActiveConversation(existing);
    }
  }, [initialTargetUserId, loading, conversations, currentUserId, onSelectConversation]);

  async function handleDelete(convId: string) {
    setDeleting(convId);
    await Promise.all([
      supabase.from('messages').delete().eq('conversation_id', convId),
      supabase.from('conversations').delete().eq('id', convId),
    ]);
    setDeleting(null);
    setConfirmDelete(null);
    refresh();
  }

  if (!onSelectConversation && activeConversation) {
    return (
      <ChatThread
        conversation={activeConversation}
        currentUserId={currentUserId}
        isDark={isDark}
        lang={lang}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {!popover && (
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className={`p-1 rounded-lg ${isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-200 text-gray-600'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className={`text-lg font-display font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>
            {t('messages', lang)}
          </h2>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-40 rounded animate-pulse ${isDark ? 'bg-midnight' : 'bg-gray-200'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-midnight border border-edge' : 'bg-white border border-gray-200'}`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-muted' : 'text-gray-400'}`} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages..." className={`flex-1 text-sm bg-transparent outline-none ${isDark ? 'text-frost placeholder:text-muted' : 'text-gray-800 placeholder:text-gray-400'}`} />
          </div>
          {filteredConversations.length === 0 ? (
            <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
              <p className={`text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>No results</p>
            </div>
          ) : (
          <div className="space-y-1">
          {filteredConversations.map((c) => (
            <div key={c.id} className="group relative">
              {confirmDelete === c.id ? (
                <div className={`p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-red-900/20 border border-red-900/30' : 'bg-red-50 border border-red-200'}`}>
                  <span className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Delete this conversation?</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setConfirmDelete(null)} className={`px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-midnight text-mist hover:text-frost' : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-200'}`}>Cancel</button>
                    <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600">Delete</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { if (onSelectConversation) onSelectConversation(c); else setActiveConversation(c); }}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors ${
                    isDark ? 'hover:bg-surface/50' : 'hover:bg-gray-50'
                  }`}
                >
                  {c.other_user?.avatar_url ? (
                    <img src={c.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyanx to-emera flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{(c.other_user?.username?.[0] || '?').toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-display font-bold truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                        {c.other_user?.username}
                      </p>
                      {c.last_message && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                          {timeAgo(c.last_message.created_at, lang)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                      {c.listing?.title ? `Re: ${c.listing.title}` : 'Conversation'}
                    </p>
                    {c.last_message && (
                      <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                        {c.last_message.user_id === currentUserId ? 'You: ' : ''}{c.last_message.content}
                      </p>
                    )}
                  </div>
                  {(c.unread_count || 0) > 0 && (
                    <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">{c.unread_count}</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      isDark ? 'hover:bg-midnight text-muted hover:text-red-400' : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'
                    }`}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </>
    )}
    </div>
  );
}
