import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MenuButton() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = document.getElementById('menu-btn-glow');
    if (!el) return;
    let frame: number;
    const animate = () => {
      const t = Date.now() / 1000;
      const scale = 1 + Math.sin(t * 2) * 0.15;
      const opacity = 0.3 + Math.sin(t * 2) * 0.2;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(opacity);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <button
      onClick={() => navigate('/menu')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 left-6 z-50 group"
      title="New Products Menu"
    >
      {/* Outer glow ring */}
      <div
        id="menu-btn-glow"
        className="absolute inset-[-6px] rounded-full bg-[#EF1187]/20 blur-md pointer-events-none"
      />
      {/* Main circle */}
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
        hovered
          ? 'bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] shadow-lg shadow-[#EF1187]/30 scale-110'
          : 'bg-gradient-to-br from-[#EF1187] to-[#d40e76] shadow-md shadow-[#EF1187]/20'
      }`}>
        {/* Inner ring */}
        <div className="absolute inset-1 rounded-full border border-white/20" />
        {/* Star sparkle */}
        <svg className={`w-6 h-6 text-white transition-transform duration-300 ${hovered ? 'rotate-45 scale-110' : ''}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
        </svg>
        {/* Pulse dot */}
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#13EEEF] rounded-full border-2 border-[#EF1187]">
          <div className="absolute inset-0 rounded-full bg-[#13EEEF] animate-ping opacity-75" />
        </div>
      </div>
      {/* Label on hover */}
      <div className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-200 pointer-events-none ${
        hovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
      }`}>
        <div className="bg-[#29292C] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg border border-white/10 flex items-center gap-2">
          <span className="text-[#13EEEF] font-bold">NEW</span>
          <span>Products Menu</span>
        </div>
      </div>
    </button>
  );
}
