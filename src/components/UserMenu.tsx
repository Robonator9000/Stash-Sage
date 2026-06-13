import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  isDark: boolean;
  onOpenAccount: () => void;
}

export function UserMenu({ isDark, onOpenAccount }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-2 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
          isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        {user.email?.split('@')[0]}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute right-0 top-full mt-1 w-40 rounded-xl py-1 shadow-xl border z-50 ${
            isDark ? 'bg-midnight border border-edge' : 'bg-white border-gray-200'
          }`}
        >
          <button
            onClick={() => { setOpen(false); onOpenAccount(); }}
            className={`w-full px-3 py-2 text-left text-xs font-medium transition-all ${
              isDark ? 'text-mist hover:text-frost hover:bg-surface' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Account
          </button>
          <div className={`my-1 mx-2 h-px ${isDark ? 'bg-edge' : 'bg-gray-200'}`} />
          <button
            onClick={() => signOut()}
            className={`w-full px-3 py-2 text-left text-xs font-medium transition-all ${
              isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
