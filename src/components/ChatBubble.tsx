import type { Message } from '../types';
import { timeAgo } from '../utils/helpers';

interface ChatBubbleProps {
  message: Message;
  isDark: boolean;
  isOwn: boolean;
  showAvatar?: boolean;
}

export function ChatBubble({ message, isDark, isOwn }: ChatBubbleProps) {
  const readLabel = message.read_at ? `Read ${timeAgo(message.read_at, 'en')}` : message.read ? 'Read' : '';
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
        isOwn
          ? isDark ? 'bg-gradient-to-br from-cyanx to-emera text-white rounded-br-md' : 'bg-cyan-500 text-white rounded-br-md'
          : isDark ? 'bg-midnight text-frost rounded-bl-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
      }`}>
        {message.image_url && (
          <img src={message.image_url} alt="" className="max-w-full rounded-lg mb-1.5 max-h-60 object-cover" loading="lazy" />
        )}
        {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
        <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isOwn ? 'text-white/60' : isDark ? 'text-muted' : 'text-gray-400'}`}>
          {timeAgo(message.created_at, 'en')}
          {isOwn && readLabel && <span className="ml-auto">{readLabel}</span>}
        </p>
      </div>
    </div>
  );
}
