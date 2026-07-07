import { useState, useEffect } from 'react';
import { ChatInbox } from './ChatInbox';
import { ChatThread } from './ChatThread';
import { useConversations } from '../hooks/useConversations';
import { MessageCircle, X, Minus } from 'lucide-react';
import type { Conversation } from '../types';

interface MessagePopupProps {
  currentUserId: string;
  isDark: boolean;
  lang: string;
  initialTargetUserId?: string;
  onClose?: () => void;
}

export function MessagePopup({ currentUserId, isDark, lang, initialTargetUserId, onClose }: MessagePopupProps) {
  const [open, setOpen] = useState(!!initialTargetUserId);
  const [minimized, setMinimized] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const { conversations } = useConversations(currentUserId);
  const unreadCount = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  useEffect(() => {
    if (!initialTargetUserId || conversations.length === 0) return;
    const existing = conversations.find(c =>
      (c.buyer_id === initialTargetUserId && c.seller_id === currentUserId) ||
      (c.seller_id === initialTargetUserId && c.buyer_id === currentUserId)
    );
    if (existing) setActiveConversation(existing);
  }, [initialTargetUserId, conversations, currentUserId]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-cyanx to-emera text-white shadow-2xl shadow-cyanx/30 flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-cyanx to-emera text-white shadow-2xl shadow-cyanx/30 flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[380px] h-[560px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
      isDark ? 'bg-[#0b1120] border border-edge' : 'bg-white border border-gray-200 shadow-xl'
    }`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${isDark ? 'border-edge' : 'border-gray-200'}`}>
        <span className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>
          {activeConversation ? activeConversation.other_user?.username : 'Messages'}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className={`p-1 rounded-lg ${isDark ? 'hover:bg-midnight text-muted hover:text-frost' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => { setOpen(false); setActiveConversation(null); onClose?.(); }} className={`p-1 rounded-lg ${isDark ? 'hover:bg-midnight text-muted hover:text-frost' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {activeConversation ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatThread
            conversation={activeConversation}
            currentUserId={currentUserId}
            isDark={isDark}
            lang={lang}
            onBack={() => setActiveConversation(null)}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          <ChatInbox
            currentUserId={currentUserId}
            isDark={isDark}
            lang={lang}
            onSelectConversation={(c) => setActiveConversation(c)}
            popover
          />
        </div>
      )}
    </div>
  );
}