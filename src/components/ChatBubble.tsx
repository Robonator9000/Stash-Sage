import { useState, memo } from 'react';
import type { Message } from '../types';
import { timeAgo } from '../utils/helpers';
import { Edit2, Trash2, Reply } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isDark: boolean;
  isOwn: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
}

export const ChatBubble = memo(function ChatBubble({ message, isDark, isOwn, onEdit, onDelete, onReply }: ChatBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const readLabel = message.read_at ? `Read ${timeAgo(message.read_at, 'en')}` : message.read ? 'Read' : '';

  if (message.deleted_at) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${isDark ? 'bg-surface/30 text-muted' : 'bg-gray-50 text-gray-400'} italic text-xs`}>
          Message deleted
        </div>
      </div>
    );
  }

  async function handleEditSave() {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
        isOwn
          ? isDark ? 'bg-gradient-to-br from-cyanx to-emera text-white rounded-br-md' : 'bg-cyan-500 text-white rounded-br-md'
          : isDark ? 'bg-midnight text-frost rounded-bl-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
      }`}>
        {/* Reply reference */}
        {message.reply_to && (
          <div className={`mb-1.5 pl-2 border-l-2 text-xs ${isOwn ? 'border-white/30 text-white/70' : isDark ? 'border-muted text-muted' : 'border-gray-300 text-gray-500'}`}>
            {message.reply_to.content?.substring(0, 60)}
          </div>
        )}
        {message.image_url && (
          <img src={message.image_url} alt="" className="max-w-full rounded-lg mb-1.5 max-h-60 object-cover" loading="lazy" />
        )}
        {editing ? (
          <div className="flex gap-1">
            <input value={editText} onChange={e => setEditText(e.target.value)} className={`flex-1 px-2 py-1 rounded text-sm ${isDark ? 'bg-midnight text-frost' : 'bg-white text-gray-800'}`} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditing(false); }} />
            <button onClick={handleEditSave} className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">Save</button>
          </div>
        ) : (
          message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isOwn ? 'text-white/60' : isDark ? 'text-muted' : 'text-gray-400'}`}>
          {timeAgo(message.created_at, 'en')}
          {message.edited_at && <span>(edited)</span>}
          {isOwn && readLabel && <span className="ml-auto">{readLabel}</span>}
        </p>
        {/* Actions */}
        {showActions && isOwn && !editing && (
          <div className={`flex items-center gap-1 mt-1 pt-1 border-t ${isOwn ? 'border-white/15' : isDark ? 'border-midnight' : 'border-gray-200'}`}>
            {onReply && <button onClick={() => onReply(message.id)} className={`p-0.5 rounded ${isOwn ? 'hover:bg-white/15' : isDark ? 'hover:bg-midnight' : 'hover:bg-gray-200'}`}><Reply className="w-3 h-3" /></button>}
            {onEdit && <button onClick={() => { setEditText(message.content); setEditing(true); }} className={`p-0.5 rounded ${isOwn ? 'hover:bg-white/15' : isDark ? 'hover:bg-midnight' : 'hover:bg-gray-200'}`}><Edit2 className="w-3 h-3" /></button>}
            {onDelete && <button onClick={() => onDelete(message.id)} className={`p-0.5 rounded ${isOwn ? 'hover:bg-white/15' : isDark ? 'hover:bg-midnight' : 'hover:bg-gray-200'}`}><Trash2 className="w-3 h-3" /></button>}
          </div>
        )}
      </div>
    </div>
  );
});
