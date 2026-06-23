import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MenuButton() {
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate('/menu')}
      className="fixed bottom-6 left-6 z-50 group"
      title="Stash Tracker Menu"
    >
      <div className={`relative flex items-center gap-2 px-3 py-2.5 bg-[#0f1a12] border border-emerald-500/30 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 ${pulse ? 'animate-menu-pulse' : ''}`}>
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-base shadow-md shadow-emerald-500/20">
            🌿
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#0f1a12] animate-pulse" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-emerald-400/80 font-semibold uppercase tracking-wider leading-none">New</span>
          <span className="text-[11px] text-white/70 font-medium leading-tight">Menu</span>
        </div>
        {/* Subtle glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </button>
  );
}
