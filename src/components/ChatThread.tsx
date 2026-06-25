import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from './ChatBubble';
import { t } from '../utils/translations';
import { ArrowLeft, Send } from 'lucide-react';
import type { Conversation } from '../types';

interface ChatThreadProps {
  conversation: Conversation;
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onBack: () => void;
}

export function ChatThread({ conversation, currentUserId, isDark, lang, onBack }: ChatThreadProps) {
  const { messages, loading, sending, sendMessage, bottomRef } = useChat(conversation.id, currentUserId);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, bottomRef]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
    inputRef.current?.focus();
  }

  const listingTitle = conversation.listing?.title || 'listing';

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className={`flex items-center gap-3 p-3 border-b ${isDark ? 'border-edge bg-surface/50' : 'border-gray-200 bg-gray-50'}`}>
        <button onClick={onBack} className={`p-1 rounded-lg ${isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-200 text-gray-600'}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {conversation.other_user?.avatar_url ? (
            <img src={conversation.other_user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyanx to-emera flex items-center justify-center">
              <span className="text-white text-xs font-bold">{(conversation.other_user?.username?.[0] || '?').toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-sm font-display font-bold truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>
              {conversation.other_user?.username}
            </p>
            <p className={`text-xs truncate ${isDark ? 'text-muted' : 'text-gray-400'}`}>
              {t('conversationAbout', lang).replace('{title}', listingTitle)}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-cyan-400 border-t-transparent' : 'border-cyan-500 border-t-transparent'}`} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className={`text-sm ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('noMessages', lang)}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isDark={isDark}
              isOwn={msg.user_id === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${isDark ? 'border-edge bg-surface/50' : 'border-gray-200 bg-gray-50'}`}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('typeMessage', lang)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
              isDark ? 'bg-midnight text-frost placeholder:text-muted border border-edge focus:border-cyan-500/50' : 'bg-white text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:border-cyan-400'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={`p-2.5 rounded-xl transition-all ${
              input.trim() && !sending
                ? 'bg-gradient-to-r from-cyanx to-emera text-white shadow-lg shadow-cyan-500/20'
                : isDark ? 'bg-midnight text-muted' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
