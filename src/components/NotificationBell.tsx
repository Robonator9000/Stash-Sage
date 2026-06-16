import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  isDark: boolean;
  lang: string;
  onViewProfile?: (userId: string) => void;
}

export function NotificationBell({ isDark, lang, onViewProfile }: NotificationBellProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl transition-all ${isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-cyanx to-emera text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-80 max-h-96 rounded-2xl shadow-2xl overflow-hidden z-50 ${
          isDark ? 'bg-[#0f172a] border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-edge' : 'border-gray-200'}`}>
            <span className={`text-sm font-bold ${isDark ? 'text-frost' : 'text-gray-800'}`}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className={`text-xs font-medium ${isDark ? 'text-cyanx hover:text-cyan-400' : 'text-cyan-600 hover:text-cyan-700'}`}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {loading && (
              <div className="p-8 text-center">
                <div className={`w-6 h-6 mx-auto animate-spin rounded-full border-2 border-t-transparent ${isDark ? 'border-edge' : 'border-gray-200'}`} />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className={`p-8 text-center text-sm ${isDark ? 'text-mist' : 'text-gray-500'}`}>
                No notifications yet
              </div>
            )}

            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); onViewProfile?.(n.actor_id); }}
                className={`w-full text-left px-4 py-3 transition-all flex items-start gap-3 ${
                  !n.read
                    ? isDark ? 'bg-cyanx/5' : 'bg-cyan-50/50'
                    : 'hover:bg-opacity-50'
                } ${isDark ? 'hover:bg-surface' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${n.actor?.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
                  {n.actor?.avatar_url ? (
                    <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-display font-bold text-xs">
                      {(n.actor?.username?.[0] || '?').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isDark ? 'text-frost' : 'text-gray-800'}`}>
                    {n.type === 'like' && <><span className="font-semibold">{n.actor?.username}</span> liked your post</>}
                    {n.type === 'comment' && <><span className="font-semibold">{n.actor?.username}</span> commented on your post</>}
                    {n.type === 'follow' && <><span className="font-semibold">{n.actor?.username}</span> followed you</>}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
                    {timeAgo(n.created_at, lang)}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-cyanx shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}