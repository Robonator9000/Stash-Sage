import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type StrainType = 'indica' | 'sativa' | 'hybrid';

interface Product {
  name: string;
  price: number;
  image?: string;
  strain: StrainType;
}

const CARTRIDGES: Product[] = [
  { name: 'Apple Candy', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/06/Big-Apple-1-400x400.jpg' },
  { name: 'Apricot Jelly', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2025/09/Apricot-Jelly-510-cart-400x400.jpg' },
  { name: 'Banana Daze', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2025/09/Banana-Daze-cart-400x400.jpg' },
  { name: 'Banana Kush', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/06/Banana-Kush-1-400x400.jpg' },
  { name: 'Bloodshot', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Bloodshot-1.jpg' },
  { name: 'Blueberry Oatmeal', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Blueberry-Oatmeal-1.jpg' },
  { name: 'Blueberry Pie', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Blueberry-Pie-1.jpg' },
  { name: 'Champagne', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Champagne.jpg' },
  { name: 'Cherry Candy Ice', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/06/Cherry-Candy-Ice-1.jpg' },
  { name: 'Clementine Ice', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Clementine-ice-1-400x400.jpg' },
  { name: 'Frosted Grapes', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/FROSTED-GRAPES-1.jpg' },
  { name: 'Golden Mango', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2025/10/Mango-01-400x400.jpg' },
  { name: 'Grand Daddy Purple', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Grand-Daddy-Purple-400x400.jpg' },
  { name: 'Irish Cream', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Irish-Cream-400x400.jpg' },
  { name: 'Island Sweet Skunk', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Island-Sweet-Skunk-1.jpg' },
  { name: 'Maple Pumpkin Pie', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Maple-Pumpkin-Pie.jpg' },
  { name: 'Pink Flamingo', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/06/Pink-Flamingo-1-400x400.jpg' },
  { name: 'Rootbeer', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2025/11/Rootbeer-cart.jpg' },
  { name: 'Sour Watermelon Candy', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/06/Sour-Watermelon-Candy-1.jpg' },
  { name: 'Tangie', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Tangie.jpg' },
  { name: 'Watermelon', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Watermelon-splash.-1.jpg' },
];

const DISPOSABLES: Product[] = [
  { name: 'Cherry Jam', price: 30, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Mighty-Puff-2-GRAM-Disposable.jpg' },
  { name: 'Galactic Grape', price: 30, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Mighty-Puff-2-GRAM-Disposable.jpg' },
];

const STRAIN_COLORS: Record<StrainType, { bg: string; text: string; label: string }> = {
  indica: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', label: 'Indica' },
  sativa: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Sativa' },
  hybrid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Hybrid' },
};

const STRAIN_COLORS_LIGHT: Record<StrainType, { bg: string; text: string; label: string }> = {
  indica: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Indica' },
  sativa: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Sativa' },
  hybrid: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Hybrid' },
};

const FEATURES = [
  { icon: '📦', title: 'Track Your Stash', desc: 'Add strains, cartridges, edibles — log THC/CBD levels, ratings, prices, and more.' },
  { icon: '🫧', title: 'Log Sessions', desc: 'Record every session with method, amount, and notes. See your usage over time.' },
  { icon: '📊', title: 'View Stats', desc: 'Dashboards and charts showing your consumption patterns, spending, and favorites.' },
  { icon: '👥', title: 'Community', desc: 'Social feed to share posts, follow friends, comment, and like.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy and sell within the community. Listings with images, ratings, and contact info.' },
  { icon: '📴', title: 'Works Offline', desc: 'Full PWA — install it, use it anywhere. No account needed to get started.' },
];

const SNAPCHAT_URL = 'https://www.snapchat.com/add/kotycannaco';
const SNAPCHAT_HANDLE = '@kotycannaco';

function ProductCard({ product, index, visible, isDark }: { product: Product; index: number; visible: boolean; isDark: boolean }) {
  const sc = isDark ? STRAIN_COLORS : STRAIN_COLORS_LIGHT;
  const strainInfo = sc[product.strain];

  return (
    <div
      className={`${isDark ? 'bg-white/5 border-white/10 hover:border-[#EF1187]/40' : 'bg-white border-gray-100 hover:border-[#EF1187]/40'} rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-[#EF1187]/5 transition-all duration-300 hover:-translate-y-1 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      {product.image ? (
        <div className="relative h-44 overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${strainInfo.bg} ${strainInfo.text}`}>
              {strainInfo.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-44 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <span className="text-6xl group-hover:scale-110 transition-transform">🌿</span>
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${strainInfo.bg} ${strainInfo.text}`}>
              {strainInfo.label}
            </span>
          </div>
        </div>
      )}
      <div className="p-4 text-center">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#111]'} mb-1.5 leading-tight`} style={{ fontFamily: '"Varela Round", sans-serif' }}>
          {product.name}
        </h3>
        <div className="text-[#13EEEF] text-[10px] font-bold uppercase tracking-wider mb-2">1g Cartridge</div>
        <div className="text-[#22c55e] text-[10px] font-medium mb-2">✓ In Stock</div>
        <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`} style={{ fontFamily: '"Varela Round", sans-serif' }}>${product.price}</div>
      </div>
    </div>
  );
}

function DisposableCard({ product, index, visible, isDark }: { product: Product; index: number; visible: boolean; isDark: boolean }) {
  const sc = isDark ? STRAIN_COLORS : STRAIN_COLORS_LIGHT;
  const strainInfo = sc[product.strain];

  return (
    <div
      className={`${isDark ? 'bg-gradient-to-br from-[#29292C] to-[#1a1a1d] border-white/10 hover:border-[#13EEEF]/40' : 'bg-gradient-to-br from-gray-900 to-gray-800 border-white/10 hover:border-[#13EEEF]/40'} border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-[#13EEEF]/10 transition-all duration-300 hover:-translate-y-1 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      {product.image ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${strainInfo.bg} ${strainInfo.text}`}>
              {strainInfo.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <div className="text-5xl group-hover:scale-110 transition-transform">🔥</div>
        </div>
      )}
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: '"Varela Round", sans-serif' }}>
          {product.name}
        </h3>
        <div className="text-[#13EEEF] text-sm font-bold uppercase tracking-wider mb-2">2g Disposable</div>
        <div className="text-[#22c55e] text-sm font-medium mb-3">✓ In Stock</div>
        <div className="text-3xl font-bold text-[#FABF39]" style={{ fontFamily: '"Varela Round", sans-serif' }}>${product.price}</div>
      </div>
    </div>
  );
}

function SnapchatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.624 0 11.99-5.367 11.99-11.988C24.002 5.367 18.636 0 12.017 0" />
    </svg>
  );
}

export function MenuPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ========== PRODUCT STORE SECTION ========== */}
      {/* Top bar */}
      <div className="bg-[#29292C] text-white text-center py-2 text-xs tracking-widest uppercase font-medium">
        🔥 21 Exotic Flavors — All $15 — Limited Time 🔥
      </div>

      {/* Header — Product Store branding */}
      <header className="relative">
        <div className="max-w-[1000px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] rounded-xl flex items-center justify-center text-white text-xl shadow-md">
              🌿
            </div>
            <div>
              <div className="text-[#EF1187] font-bold text-lg leading-none" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                KOTY CANNA CO.
              </div>
              <div className="text-[#13EEEF] text-[10px] tracking-widest uppercase">Premium Vape Products</div>
            </div>
          </div>
          <a
            href={SNAPCHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-[#FFFC00] text-[#111] rounded-[10px] text-sm font-bold hover:bg-[#e6e300] transition-colors shadow-md flex items-center gap-2"
          >
            <SnapchatIcon />
            Order on Snap
          </a>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#13EEEF] via-[#EF1187] to-[#13EEEF]" />
      </header>

      {/* Hero — Products */}
      <section className="relative bg-[#29292C] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#EF1187]/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#13EEEF]/10 rounded-full blur-[120px]" />
        </div>
        <div className={`max-w-[1000px] mx-auto px-6 py-10 sm:py-12 relative z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
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
              <a
                href={SNAPCHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFFC00] text-[#111] rounded-[10px] text-lg font-bold hover:bg-[#e6e300] transition-all shadow-lg shadow-[#FFFC00]/20 hover:shadow-[#FFFC00]/40 hover:scale-105"
              >
                <SnapchatIcon />
                Message {SNAPCHAT_HANDLE} to Order
              </a>
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

      {/* How to Order */}
      <section className="bg-[#FFFC00]/10 border-y border-[#FFFC00]/30 py-6 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2 text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            How to Order
          </h2>
          <p className="text-gray-600 mb-6">Easy as 1-2-3</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-[#FFFC00] rounded-full flex items-center justify-center text-xl font-bold text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>1</div>
              <div className="text-sm font-semibold text-[#111]">Open Snapchat</div>
            </div>
            <div className="text-gray-300 text-2xl hidden sm:block">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-[#FFFC00] rounded-full flex items-center justify-center text-xl font-bold text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>2</div>
              <div className="text-sm font-semibold text-[#111]">Add <span className="text-[#EF1187]">{SNAPCHAT_HANDLE}</span></div>
            </div>
            <div className="text-gray-300 text-2xl hidden sm:block">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-[#FFFC00] rounded-full flex items-center justify-center text-xl font-bold text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>3</div>
              <div className="text-sm font-semibold text-[#111]">Place Your Order</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products: Cartridges */}
      <section className="py-10 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
              1g Cartridges
            </h2>
            <p className="text-gray-500 text-lg">All flavors — $15 each</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Indica</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Sativa</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hybrid</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CARTRIDGES.map((p, i) => (
              <ProductCard key={p.name} product={p} index={i} visible={visible} isDark={false} />
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#13EEEF]/40 to-transparent" />
      </div>

      {/* Products: Disposables */}
      <section className="py-10 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
              2g Disposables
            </h2>
            <p className="text-gray-500 text-lg">Premium disposables — $30 each</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {DISPOSABLES.map((p, i) => (
              <DisposableCard key={p.name} product={p} index={i} visible={visible} isDark={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Final Order CTA */}
      <section className="bg-[#29292C] py-8 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            Ready to Order?
          </h2>
          <p className="text-white/50 text-lg mb-6">
            Message <span className="text-[#FFFC00] font-bold">{SNAPCHAT_HANDLE}</span> on Snapchat
          </p>
          <a
            href={SNAPCHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFFC00] text-[#111] rounded-[10px] text-lg font-bold hover:bg-[#e6e300] transition-all shadow-lg shadow-[#FFFC00]/20 hover:shadow-[#FFFC00]/40 hover:scale-105"
          >
            <SnapchatIcon />
            Open Snapchat
          </a>
        </div>
      </section>


      {/* ========== DIVIDER — SEPARATE FROM PRODUCTS ========== */}
      <div className="relative py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#29292C] via-[#0b1120] to-[#0b1120]" />
        <div className="relative z-10 max-w-[800px] mx-auto text-center px-6">
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#13EEEF] to-transparent mx-auto mb-6" />
          <div className="inline-flex items-center gap-3 bg-[#13EEEF]/10 border border-[#13EEEF]/20 rounded-full px-5 py-2 mb-4">
            <span className="text-[#13EEEF] text-sm font-bold tracking-widest uppercase">Powered by</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            <span className="text-[#13EEEF]">Stash</span> Tracker
          </h2>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            The app behind the products. Track your stash, log sessions, view stats, and connect with the community.
          </p>
        </div>
      </div>

      {/* ========== STASH TRACKER APP SECTION ========== */}

      {/* Features */}
      <section className="py-10 px-6 bg-[#0b1120]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: '"Varela Round", sans-serif', color: '#13EEEF' }}>
              Why Stash Tracker?
            </h2>
            <p className="text-white/40 text-lg">One app. Your whole collection. Always with you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#13EEEF]/40 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-white" style={{ fontFamily: '"Varela Round", sans-serif' }}>{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App CTA */}
      <section className="bg-[#13EEEF] py-10 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3 text-[#111]" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            Try Stash Tracker
          </h2>
          <p className="text-[#29292C]/70 text-lg mb-6">
            Free PWA. Works offline. No account required.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-[#EF1187] text-white rounded-[10px] text-lg font-bold hover:bg-[#BF0F6C] transition-all shadow-lg"
          >
            Launch Stash Tracker →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#29292C] py-8 px-6">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] rounded-lg flex items-center justify-center text-sm">🌿</div>
            <div>
              <span className="text-white/60 text-sm font-bold" style={{ fontFamily: '"Varela Round", sans-serif' }}>KOTY CANNA CO.</span>
              <span className="text-white/20 text-xs mx-2">•</span>
              <span className="text-white/40 text-sm" style={{ fontFamily: '"Varela Round", sans-serif' }}>Stash Tracker</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href={SNAPCHAT_URL} target="_blank" rel="noopener noreferrer" className="text-[#FFFC00] hover:text-[#e6e300] transition-colors font-medium flex items-center gap-1.5">
              <SnapchatIcon /> {SNAPCHAT_HANDLE}
            </a>
            <span className="text-white/20">·</span>
            <button onClick={() => navigate('/')} className="text-[#13EEEF] hover:text-[#0fc5c6] transition-colors font-medium">
              Launch App →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
