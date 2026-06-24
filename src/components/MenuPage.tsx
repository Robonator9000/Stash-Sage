import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CARTRIDGES = [
  { name: 'Apple Candy', price: 15, emoji: '🍎' },
  { name: 'Apricot Jelly', price: 15, emoji: '🍑' },
  { name: 'Banana Daze', price: 15, emoji: '🍌' },
  { name: 'Banana Kush', price: 15, emoji: '🍌' },
  { name: 'Bloodshot', price: 15, emoji: '👁️' },
  { name: 'Blueberry Oatmeal', price: 15, emoji: '🫐' },
  { name: 'Blueberry Pie', price: 15, emoji: '🥧' },
  { name: 'Champagne', price: 15, emoji: '🥂' },
  { name: 'Cherry Candy Ice', price: 15, emoji: '🍒' },
  { name: 'Clementine Ice', price: 15, emoji: '🍊' },
  { name: 'Frosted Grapes', price: 15, emoji: '🍇' },
  { name: 'Golden Mango', price: 15, emoji: '🥭' },
  { name: 'Grand Daddy Purple', price: 15, emoji: '👑' },
  { name: 'Irish Cream', price: 15, emoji: '☘️' },
  { name: 'Island Sweet Skunk', price: 15, emoji: '🌴' },
  { name: 'Maple Pumpkin Pie', price: 15, emoji: '🎃' },
  { name: 'Pink Flamingo', price: 15, emoji: '🦩' },
  { name: 'Rootbeer', price: 15, emoji: '🍺' },
  { name: 'Sour Watermelon Candy', price: 15, emoji: '🍉' },
  { name: 'Tangie', price: 15, emoji: '🍊' },
  { name: 'Watermelon', price: 15, emoji: '🍉' },
];

const DISPOSABLES = [
  { name: 'Cherry Jam', price: 30, emoji: '🍒' },
  { name: 'Galactic Grape', price: 30, emoji: '🪐' },
];

const FEATURES = [
  { icon: '📦', title: 'Track Your Stash', desc: 'Add strains, cartridges, edibles — log THC/CBD levels, ratings, prices, and more.' },
  { icon: '🫧', title: 'Log Sessions', desc: 'Record every session with method, amount, and notes. See your usage over time.' },
  { icon: '📊', title: 'View Stats', desc: 'Dashboards and charts showing your consumption patterns, spending, and favorites.' },
  { icon: '👥', title: 'Community', desc: 'Social feed to share posts, follow friends, comment, and like.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy and sell within the community. Listings with images, ratings, and contact info.' },
  { icon: '📴', title: 'Works Offline', desc: 'Full PWA — install it, use it anywhere. No account needed to get started.' },
];

export function MenuPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* WIP Banner */}
      <div className="bg-[#FABF39] px-4 py-2 text-center relative z-50">
        <span className="text-[#111] font-bold text-sm tracking-wide uppercase" style={{ fontFamily: '"Varela Round", sans-serif' }}>
          🚧 Work In Progress — This page is under construction 🚧
        </span>
      </div>

      {/* Top bar */}
      <div className="bg-[#29292C] text-white text-center py-2 text-xs tracking-widest uppercase font-medium">
        🔥 21 Exotic Flavors — All $15 — Limited Time 🔥
      </div>

      {/* Header */}
      <header className="relative">
        <div className="max-w-[1000px] mx-auto px-6 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-[#EF1187] hover:text-[#BF0F6C] transition-colors text-sm font-medium"
          >
            ← Back to App
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] rounded-xl flex items-center justify-center text-white text-xl shadow-md">
              🌿
            </div>
            <div className="text-center">
              <div className="text-[#EF1187] font-bold text-lg leading-none" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                STASH TRACKER
              </div>
              <div className="text-[#13EEEF] text-[10px] tracking-widest uppercase">New Products</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 bg-[#EF1187] text-white rounded-[10px] text-sm font-bold hover:bg-[#BF0F6C] transition-colors shadow-md shadow-[#EF1187]/20"
          >
            Shop Now
          </button>
        </div>
        {/* Cyan accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#13EEEF] via-[#EF1187] to-[#13EEEF]" />
      </header>

      {/* Hero */}
      <section className="relative bg-[#29292C] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#EF1187]/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#13EEEF]/10 rounded-full blur-[120px]" />
        </div>
        <div className={`max-w-[1000px] mx-auto px-6 py-16 sm:py-20 relative z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#13EEEF]/15 border border-[#13EEEF]/40 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-[#13EEEF] rounded-full animate-pulse" />
                <span className="text-[#13EEEF] text-xs font-bold uppercase tracking-widest">In Stock Now</span>
              </div>
              <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] mb-4" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
                21 EXOTIC<br />FLAVORS
              </h1>
              <p className="text-white/60 text-lg mb-6 leading-relaxed">
                Premium 1g cartridges. Lab tested quality. Unbeatable price.
              </p>
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-6xl sm:text-7xl font-bold" style={{ fontFamily: '"Varela Round", sans-serif', color: '#FABF39' }}>$15</span>
                <span className="text-white/50 text-lg uppercase tracking-wider">each</span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-[#EF1187] text-white rounded-[10px] text-lg font-bold hover:bg-[#BF0F6C] transition-all shadow-lg shadow-[#EF1187]/25 hover:shadow-[#EF1187]/40 hover:scale-105"
              >
                Start Tracking →
              </button>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="w-48 h-48 bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] rounded-full flex items-center justify-center text-8xl shadow-2xl shadow-[#EF1187]/30">
                  🌿
                </div>
                <div className="absolute -top-3 -right-3 w-20 h-20 bg-[#FABF39] rounded-full flex items-center justify-center text-3xl font-bold text-[#111] shadow-lg" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                  $15
                </div>
                <div className="absolute -bottom-2 -left-2 w-14 h-14 bg-[#13EEEF] rounded-full flex items-center justify-center text-2xl shadow-lg">
                  🔥
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="bg-[#EF1187] text-white py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="mx-8 text-sm font-bold uppercase tracking-wider">
              🍎 Apple Candy &nbsp;•&nbsp; 🍇 Frosted Grapes &nbsp;•&nbsp; 🍌 Banana Daze &nbsp;•&nbsp; 🍒 Cherry Candy Ice &nbsp;•&nbsp; 🍉 Watermelon &nbsp;•&nbsp; 🥭 Golden Mango &nbsp;•&nbsp; 👑 Grand Daddy Purple &nbsp;•&nbsp; 🦩 Pink Flamingo &nbsp;•&nbsp; 🍊 Clementine Ice &nbsp;•&nbsp; 🥂 Champagne &nbsp;•&nbsp; 🌴 Island Sweet Skunk &nbsp;•&nbsp; 🍺 Rootbeer &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Products: Cartridges */}
      <section className="py-16 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
              1g Cartridges
            </h2>
            <p className="text-gray-500 text-lg">All flavors — $15 each</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CARTRIDGES.map((p, i) => (
              <div
                key={p.name}
                className={`bg-white border border-gray-100 rounded-2xl p-5 text-center hover:border-[#EF1187]/40 hover:shadow-lg hover:shadow-[#EF1187]/5 transition-all duration-300 hover:-translate-y-1 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{p.emoji}</div>
                <h3 className="text-sm font-semibold text-[#111] mb-2 leading-tight" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                  {p.name}
                </h3>
                <div className="text-[#13EEEF] text-xs font-bold uppercase tracking-wider mb-2">1g Cartridge</div>
                <div className="text-[#22c55e] text-xs font-medium mb-3">✓ In Stock</div>
                <div className="text-2xl font-bold text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#13EEEF]/40 to-transparent" />
      </div>

      {/* Products: Disposables */}
      <section className="py-16 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
              2g Disposables
            </h2>
            <p className="text-gray-500 text-lg">Premium disposables — $30 each</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {DISPOSABLES.map((p, i) => (
              <div
                key={p.name}
                className={`bg-gradient-to-br from-[#29292C] to-[#1a1a1d] border border-white/10 rounded-2xl p-8 text-center hover:border-[#13EEEF]/40 hover:shadow-lg hover:shadow-[#13EEEF]/10 transition-all duration-300 hover:-translate-y-1 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${(CARTRIDGES.length + i) * 40}ms` }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{p.emoji}</div>
                <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                  {p.name}
                </h3>
                <div className="text-[#13EEEF] text-sm font-bold uppercase tracking-wider mb-2">2g Disposable</div>
                <div className="text-[#22c55e] text-sm font-medium mb-3">✓ In Stock</div>
                <div className="text-3xl font-bold text-[#FABF39]" style={{ fontFamily: '"Varela Round", sans-serif' }}>${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#29292C] py-16 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            Track Your Collection With <span className="text-[#EF1187]">Stash Tracker</span>
          </h2>
          <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
            Log these cartridges, rate your favorites, see your stats. Free PWA — no account needed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-[#EF1187] text-white rounded-[10px] text-lg font-bold hover:bg-[#BF0F6C] transition-all shadow-lg shadow-[#EF1187]/25 hover:shadow-[#EF1187]/40 hover:scale-105"
          >
            Open Stash Tracker →
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
              Why Stash Tracker?
            </h2>
            <p className="text-gray-500 text-lg">One app. Your whole collection. Always with you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#13EEEF]/40 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter-style CTA */}
      <section className="bg-[#13EEEF] py-14 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3 text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            Ready to Start?
          </h2>
          <p className="text-[#29292C]/70 text-lg mb-6">
            Free PWA. Works offline. No account required.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-[#EF1187] text-white rounded-[10px] text-lg font-bold hover:bg-[#BF0F6C] transition-all shadow-lg"
          >
            Launch Stash Tracker
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#29292C] py-8 px-6">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] rounded-lg flex items-center justify-center text-sm">🌿</div>
            <span className="text-white/60 text-sm" style={{ fontFamily: '"Varela Round", sans-serif' }}>Stash Tracker</span>
          </div>
          <div className="text-white/30 text-sm">
            st-sh.vercel.app · Free PWA · Open Source
          </div>
          <button onClick={() => navigate('/')} className="text-[#13EEEF] hover:text-[#0fc5c6] transition-colors text-sm font-medium">
            Launch App →
          </button>
        </div>
      </footer>
    </div>
  );
}
