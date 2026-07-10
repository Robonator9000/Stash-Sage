import { ChatInbox } from './ChatInbox';

export function MessagesPage({ currentUserId, isDark, lang }: {
  currentUserId: string; isDark: boolean; lang: string;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className={`rounded-2xl backdrop-blur-sm ${isDark ? 'bg-surface/40 border border-edge' : 'bg-white/70 border border-gray-200'} overflow-hidden`}>
        <ChatInbox
          currentUserId={currentUserId}
          isDark={isDark}
          lang={lang}
        />
      </div>
    </div>
  );
}
