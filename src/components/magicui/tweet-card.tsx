import { cn } from '../../lib/utils';
import { ShineBorder } from './shine-border';

interface TweetCardProps {
  userName?: string;
  handle?: string;
  avatarText?: string;
  content?: string;
  time?: string;
  children?: React.ReactNode;
  className?: string;
  avatarColors?: string;
}

export function TweetCard({
  userName = '',
  handle = '',
  avatarText = '?',
  content = '',
  time = '',
  children,
  className,
  avatarColors = 'linear-gradient(135deg, #06b6d4, #10b981)',
}: TweetCardProps) {
  return (
    <ShineBorder
      borderRadius={16}
      borderWidth={1}
      duration={10}
      color={['#06b6d4', '#10b981', '#13eeef', '#06b6d4']}
      className="h-full"
    >
      <div className={cn('flex h-full flex-col gap-3 rounded-[14px] bg-[#111827]/95 p-4 dark:bg-[#0d1524]/95', className)}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: avatarColors }}
          >
            {avatarText}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-frost">{userName}</div>
            <div className="truncate text-xs text-mist">@{handle}</div>
          </div>
          <svg className="ml-auto h-5 w-5 shrink-0 text-cyanx" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M22 5.9a9 9 0 0 1-2.6.7 4.5 4.5 0 0 0 2-2.5 9 9 0 0 1-2.9 1.1 4.5 4.5 0 0 0-7.7 4.1A12.8 12.8 0 0 1 3.4 4.8a4.5 4.5 0 0 0 1.4 6 4.5 4.5 0 0 1-2-.6 4.5 4.5 0 0 0 3.6 4.4 4.5 4.5 0 0 1-2 .1 4.5 4.5 0 0 0 4.2 3.1A9 9 0 0 1 3 19.7a12.7 12.7 0 0 0 6.9 2c8.3 0 12.8-6.9 12.8-12.8v-.6A9 9 0 0 0 22 5.9Z" />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-frost/90">{content}</p>
        {children}
        <div className="mt-auto flex items-center justify-between text-xs text-mist">
          <span>{time}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Reply
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Share
            </span>
          </div>
        </div>
      </div>
    </ShineBorder>
  );
}

export default TweetCard;