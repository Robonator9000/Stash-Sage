import { useState, useEffect, useRef, memo } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from './ChatBubble';
import { t } from '../utils/translations';
import { uploadMessageImage } from '../utils/supabase';
import { ArrowLeft, Send, Image, X, Ban } from 'lucide-react';
import type { Conversation } from '../types';

interface ChatThreadProps {
  conversation: Conversation;
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onBack: () => void;
}

export const ChatThread = memo(function ChatThread({ conversation, currentUserId, isDark, lang, onBack }: ChatThreadProps) {
  const otherUserId = conversation.buyer_id === currentUserId ? conversation.seller_id : conversation.buyer_id;
  const { messages, loading, sending, sendMessage, bottomRef, otherUserTyping, broadcastTyping, blockedByOther, iBlockedOther, blockUser, unblockUser, editMessage, deleteMessage } = useChat(conversation.id, currentUserId, otherUserId);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingBroadcastRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, bottomRef]);

  useEffect(() => {
    if (input && !blockedByOther && !iBlockedOther) {
      broadcastTyping();
      clearInterval(typingBroadcastRef.current);
      typingBroadcastRef.current = setInterval(() => broadcastTyping(), 2000);
    }
    return () => clearInterval(typingBroadcastRef.current);
  }, [input, broadcastTyping, blockedByOther, iBlockedOther]);

  async function handleSend() {
    if ((!input.trim() && !imageFile) || sending || uploading) return;
    setUploading(true);
    const imageUrl = imageFile ? await uploadMessageImage(currentUserId, imageFile) : null;
    const msgText = input.trim();
    const replyId = replyingTo?.id;
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setReplyingTo(null);
    setUploading(false);
    await sendMessage(msgText, imageUrl || undefined, replyId);
    inputRef.current?.focus();
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const listingTitle = conversation.listing?.title || 'listing';

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header */}
      <div className={`flex items-center gap-3 p-3 border-b ${isDark ? 'border-edge bg-surface/50' : 'border-gray-200 bg-gray-50'}`}>
        <button onClick={onBack} className={`p-1 rounded-lg ${isDark ? 'hover:bg-midnight text-frost' : 'hover:bg-gray-200 text-gray-600'}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {conversation.other_user?.avatar_url ? (
            <img src={conversation.other_user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyanx to-emera flex items-center justify-center">
              <span className="text-white text-xs font-bold">{(conversation.other_user?.username?.[0] || '?').toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-display font-bold truncate ${isDark ? 'text-frost' : 'text-gray-800'}`}>
              {conversation.other_user?.username}
            </p>
            <p className={`text-xs truncate ${isDark ? 'text-muted' : 'text-gray-400'}`}>
              {blockedByOther ? 'Blocked you' : iBlockedOther ? 'Blocked' : t('conversationAbout', lang).replace('{title}', listingTitle)}
            </p>
          </div>
          {!showBlockConfirm ? (
            <button
              onClick={() => setShowBlockConfirm(true)}
              className={`p-1.5 rounded-lg ${isDark ? 'text-muted hover:text-red-400 hover:bg-midnight' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'}`}
              title={iBlockedOther ? 'Unblock' : 'Block'}
            >
              <Ban className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setShowBlockConfirm(false); if (iBlockedOther) unblockUser(); else blockUser(); }} className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}>
                {iBlockedOther ? 'Unblock' : 'Block'}
              </button>
              <button onClick={() => setShowBlockConfirm(false)} className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'text-muted hover:text-frost' : 'text-gray-400 hover:text-gray-600'}`}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Typing indicator */}
      {otherUserTyping && (
        <div className={`px-4 py-1.5 text-xs italic ${isDark ? 'text-muted' : 'text-gray-400'}`}>
          {conversation.other_user?.username} is typing...
        </div>
      )}

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
              onEdit={msg.user_id === currentUserId ? editMessage : undefined}
              onDelete={msg.user_id === currentUserId ? deleteMessage : undefined}
              onReply={() => setReplyingTo({ id: msg.id, content: msg.content.substring(0, 60) })}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className={`flex items-center gap-2 px-3 py-1.5 border-t ${isDark ? 'border-edge bg-surface/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`flex-1 text-xs truncate ${isDark ? 'text-muted' : 'text-gray-400'}`}>
            Replying to: <span className={isDark ? 'text-frost' : 'text-gray-600'}>{replyingTo.content}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className={`p-0.5 rounded ${isDark ? 'hover:bg-midnight text-muted' : 'hover:bg-gray-200 text-gray-400'}`}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className={`px-3 py-2 border-t ${isDark ? 'border-edge bg-surface/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative inline-block">
            <img src={imagePreview} alt="" className="h-20 rounded-lg object-cover" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`p-3 border-t ${isDark ? 'border-edge bg-surface/50' : 'border-gray-200 bg-gray-50'}`}>
        {blockedByOther || iBlockedOther ? (
          <p className={`text-center text-xs py-2 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
            {blockedByOther ? conversation.other_user?.username + ' has blocked you' : 'You blocked ' + conversation.other_user?.username}
          </p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-muted hover:text-frost hover:bg-midnight' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
            >
              <Image className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/webp,image/jpeg,image/png" className="hidden" onChange={handleImageSelect} />
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
              disabled={(!input.trim() && !imageFile) || sending || uploading}
              className={`p-2.5 rounded-xl transition-all ${
                (input.trim() || imageFile) && !sending && !uploading
                  ? 'bg-gradient-to-r from-cyanx to-emera text-white shadow-lg shadow-cyan-500/20'
                  : isDark ? 'bg-midnight text-muted' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
});
