import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FLAVORS = [
  { emoji: '🍎', name: 'Apple Candy', type: '1g Cartridge' },
  { emoji: '🍇', name: 'Frosted Grapes', type: '1g Cartridge' },
  { emoji: '🍌', name: 'Banana Daze', type: '1g Cartridge' },
  { emoji: '🍒', name: 'Cherry Jam', type: '1g Cartridge' },
  { emoji: '🍉', name: 'Watermelon', type: '1g Cartridge' },
  { emoji: '🥭', name: 'Golden Mango', type: '1g Cartridge' },
  { emoji: '🍊', name: 'Clementine Ice', type: '1g Cartridge' },
  { emoji: '🫐', name: 'Blue Razz', type: '1g Cartridge' },
  { emoji: '🍑', name: 'Apricot Jelly', type: '1g Cartridge' },
  { emoji: '🍋', name: 'Lemon Zest', type: '1g Cartridge' },
  { emoji: '🍓', name: 'Strawberry Kush', type: '1g Cartridge' },
  { emoji: '🍍', name: 'Pineapple Express', type: '1g Cartridge' },
  { emoji: '🫒', name: 'Olive Garden', type: '1g Cartridge' },
  { emoji: '🍈', name: 'Honeydew', type: '1g Cartridge' },
  { emoji: '🥝', name: 'Kiwi Burst', type: '1g Cartridge' },
  { emoji: '🥥', name: 'Coconut Dream', type: '1g Cartridge' },
  { emoji: '🫧', name: 'Bubble Mint', type: '1g Cartridge' },
  { emoji: '🌿', name: 'Classic OG', type: '1g Cartridge' },
  { emoji: '🌲', name: 'Pine Forest', type: '1g Cartridge' },
  { emoji: '🧪', name: 'Cosmic Blend', type: '1g Cartridge' },
  { emoji: '🌸', name: 'Cherry Blossom', type: '1g Cartridge' },
];

const FEATURES = [
  {
    icon: '📦',
    title: 'Track Your Stash',
    desc: 'Add strains, cartridges, edibles — log THC/CBD levels, ratings, prices, and more.',
  },
  {
    icon: ' session',
    title: 'Log Sessions',
    desc: 'Record every session with method, amount, and notes. See your usage over time.',
  },
  {
    icon: '📊',
    title: 'View Stats',
    desc: 'Dashboards and charts showing your consumption patterns, spending, and favorites.',
  },
  {
    icon: '👥',
    title: 'Community',
    desc: 'Social feed to share posts, follow friends, comment, and like.',
  },
  {
    icon: '🛒',
    title: 'Marketplace',
    desc: 'Buy and sell within the community. Listings with images, ratings, and contact info.',
  },
  {
    icon: '📴',
    title: 'Works Offline',
    desc: 'Full PWA — install it, use it anywhere. No account needed to get started.',
  },
];

const STEPS = [
  { num: '01', title: 'Open the App', desc: 'Visit st-sh.vercel.app and add it to your home screen.' },
  { num: '02', title: 'Add Your Stash', desc: 'Log your products with details, ratings, and photos.' },
  { num: '03', title: 'Track Sessions', desc: 'Record consumption and watch your stats grow.' },
  { num: '04', title: 'Join the Community', desc: 'Connect, share, and discover in the marketplace.' },
];

export function MenuPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* WIP Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 px-4 py-2.5 text-center">
        <span className="text-amber-400 font-semibold text-sm tracking-wide uppercase">
          🚧 Work In Progress — This page is under construction 🚧
        </span>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
              🌿
            </div>
            <span className="font-['Bebas_Neue'] text-2xl tracking-wider text-white">Stash Tracker</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-semibold hover:bg-emerald-500/20 transition-all"
          >
            Open App →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
        </div>
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">🌿 Free PWA</span>
          </div>
          <h1 className="font-['Bebas_Neue'] text-6xl sm:text-8xl md:text-9xl leading-[0.9] tracking-wider mb-6">
            STASH<br />
            <span className="text-emerald-400">TRACKER</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            The modern way to manage your cannabis collection. Track strains, log sessions, see your stats, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
            >
              Launch Stash Tracker
            </button>
            <a
              href="#features"
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/70 font-medium hover:bg-white/10 transition-all"
            >
              Learn More ↓
            </a>
          </div>
        </div>
      </section>

      {/* Promo Section */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/40 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">🔥 Limited Time</span>
          </div>
          <h2 className="font-['Bebas_Neue'] text-5xl sm:text-7xl tracking-wider mb-4">
            <span className="text-white">21 EXOTIC</span> <span className="text-emerald-400">FLAVORS</span>
          </h2>
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="font-['Bebas_Neue'] text-7xl sm:text-8xl text-emerald-400">$15</span>
            <div className="text-left">
              <div className="text-white font-semibold text-xl">Each</div>
              <div className="text-white/40 text-sm uppercase tracking-wider">1g Cartridges</div>
            </div>
          </div>
          <p className="text-white/50 text-lg mb-12">Track your collection in Stash Tracker — free PWA, no account needed</p>

          {/* Flavor Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {FLAVORS.map((f, i) => (
              <div
                key={f.name}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-center hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-default"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="text-2xl mb-1">{f.emoji}</div>
                <div className="text-[10px] text-white/70 font-medium leading-tight">{f.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-['Bebas_Neue'] text-4xl sm:text-6xl tracking-wider text-white mb-4">
              EVERYTHING YOU <span className="text-emerald-400">NEED</span>
            </h2>
            <p className="text-white/50 text-lg">One app. Your whole collection. Always with you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['Bebas_Neue'] text-4xl sm:text-6xl tracking-wider text-white mb-4">
              GET STARTED IN <span className="text-emerald-400">SECONDS</span>
            </h2>
            <p className="text-white/50 text-lg">No sign-up required. Just open and start tracking.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="flex gap-5 items-start bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <div className="font-['Bebas_Neue'] text-4xl text-emerald-500/30 leading-none shrink-0">{s.num}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10">
              <h2 className="font-['Bebas_Neue'] text-4xl sm:text-5xl tracking-wider text-white mb-4">
                READY TO <span className="text-emerald-400">TRACK?</span>
              </h2>
              <p className="text-white/50 text-lg mb-8">Join the community. Start your collection today.</p>
              <button
                onClick={() => navigate('/')}
                className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
              >
                Open Stash Tracker →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm">🌿</div>
            <span className="font-['Bebas_Neue'] text-lg tracking-wider text-white/60">Stash Tracker</span>
          </div>
          <div className="text-white/30 text-sm">
            st-sh.vercel.app · Free PWA · Open Source
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Robonator9000/Stash-Tracker" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white/70 transition-colors text-sm">
              GitHub
            </a>
            <button onClick={() => navigate('/')} className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium">
              Launch App →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
