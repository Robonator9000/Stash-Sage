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
  { name: 'Mint Chocolate', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/06/Mint-Chocolate-1-400x400.jpg' },
  { name: 'Clementine Ice', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/Clementine-ice-1-400x400.jpg' },
  { name: 'Frosted Grapes', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/05/FROSTED-GRAPES-1.jpg' },
  { name: 'Green Crack', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/green-crack-400x400.jpg' },
  { name: 'Golden Mango', price: 15, strain: 'sativa', image: 'https://mightypuff.ca/wp-content/uploads/2025/10/Mango-01-400x400.jpg' },
  { name: 'Grand Daddy Purple', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Grand-Daddy-Purple-400x400.jpg' },
  { name: 'Irish Cream', price: 15, strain: 'indica', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/Irish-Cream-400x400.jpg' },
  { name: 'Red Berry Punch', price: 15, strain: 'hybrid', image: 'https://mightypuff.ca/wp-content/uploads/2026/04/red-berry-punch-1-400x400.jpg' },
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

const STRAIN_COLORS: Record<StrainType, { border: string; glow: string; text: string; label: string }> = {
  indica: { border: 'border-indigo-500', glow: 'hover:shadow-indigo-500/20', text: 'text-indigo-400', label: 'Indica' },
  sativa: { border: 'border-amber-500', glow: 'hover:shadow-amber-500/20', text: 'text-amber-400', label: 'Sativa' },
  hybrid: { border: 'border-emerald-500', glow: 'hover:shadow-emerald-500/20', text: 'text-emerald-400', label: 'Hybrid' },
};

const FEATURES = [
  { icon: '📦', title: 'Track Your Stash', desc: 'Add strains, cartridges, edibles — log THC/CBD levels, ratings, prices, and more.' },
  { icon: '🫧', title: 'Log Sessions', desc: 'Record every session with method, amount, and notes. See your usage over time.' },
  { icon: '📊', title: 'View Stats', desc: 'Dashboards and charts showing your consumption patterns, spending, and favorites.' },
  { icon: '👥', title: 'Community', desc: 'Social feed to share posts, follow friends, comment, and like.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy and sell within the community. Listings with images, ratings, and contact info.' },
  { icon: '📴', title: 'Works Offline', desc: 'Installable web app — works anywhere, even without internet. No account needed to start.' },
];

const SNAPCHAT_URL = 'https://www.snapchat.com/add/kotycannaco';
const SNAPCHAT_HANDLE = '@kotycannaco';

function ProductCard({ product, index, visible }: { product: Product; index: number; visible: boolean }) {
  const strainInfo = STRAIN_COLORS[product.strain];

  return (
    <div
      className={`aspect-square relative rounded-2xl overflow-hidden border-[3px] ${strainInfo.border} hover:shadow-lg ${strainInfo.glow} transition-[opacity,transform] duration-300 hover:-translate-y-1 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: visible ? '0ms' : `${index * 40}ms` }}
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1d]">
          <span className="text-6xl group-hover:scale-110 transition-transform">🌿</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 p-3 text-center">
        <h3 className="text-base font-bold text-white leading-tight" style={{ fontFamily: '"Varela Round", sans-serif' }}>
          {product.name}
        </h3>
      </div>
    </div>
  );
}

function DisposableCard({ product, visible }: { product: Product; visible: boolean }) {
  const strainInfo = STRAIN_COLORS[product.strain];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-[3px] ${strainInfo.border} hover:shadow-lg ${strainInfo.glow} transition-[opacity,transform] duration-300 hover:-translate-y-1 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {product.image ? (
        <div className="relative aspect-[4/5] overflow-hidden bg-[#1a1a1d]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[4/5] flex items-center justify-center bg-[#1a1a1d]">
          <div className="text-5xl group-hover:scale-110 transition-transform">🔥</div>
        </div>
      )}
      <div className="p-5 text-center bg-[#1a1a1d]">
        <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: '"Varela Round", sans-serif' }}>
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`text-sm font-bold uppercase tracking-wider ${strainInfo.text}`}>{strainInfo.label}</span>
          <span className="text-white/30">·</span>
          <span className="text-[#13EEEF] text-sm font-bold uppercase tracking-wider">2g Disposable</span>
        </div>
        <div className="text-3xl font-bold text-[#FABF39]" style={{ fontFamily: '"Varela Round", sans-serif' }}>${product.price}</div>
      </div>
    </div>
  );
}

function SnapchatIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="147.353 39.286 514.631 514.631" className={className}>
      <path fill="#fffc00" d="M147.553,423.021v0.023c0.308,11.424,0.403,22.914,2.33,34.268 c2.042,12.012,4.961,23.725,10.53,34.627c7.529,14.756,17.869,27.217,30.921,37.396c9.371,7.309,19.608,13.111,30.94,16.771 c16.524,5.33,33.571,7.373,50.867,7.473c10.791,0.068,21.575,0.338,32.37,0.293c78.395-0.33,156.792,0.566,235.189-0.484 c10.403-0.141,20.636-1.41,30.846-3.277c19.569-3.582,36.864-11.932,51.661-25.133c17.245-15.381,28.88-34.205,34.132-56.924 c3.437-14.85,4.297-29.916,4.444-45.035v-3.016c0-1.17-0.445-256.892-0.486-260.272c-0.115-9.285-0.799-18.5-2.54-27.636 c-2.117-11.133-5.108-21.981-10.439-32.053c-5.629-10.641-12.68-20.209-21.401-28.57c-13.359-12.81-28.775-21.869-46.722-26.661 c-16.21-4.327-32.747-5.285-49.405-5.27c-0.027-0.004-0.09-0.173-0.094-0.255H278.56c-0.005,0.086-0.008,0.172-0.014,0.255 c-9.454,0.173-18.922,0.102-28.328,1.268c-10.304,1.281-20.509,3.21-30.262,6.812c-15.362,5.682-28.709,14.532-40.11,26.347 c-12.917,13.386-22.022,28.867-26.853,46.894c-4.31,16.084-5.248,32.488-5.271,49.008"/>
      <path fill="#fff" d="M407.001,473.488c-1.068,0-2.087-0.039-2.862-0.076c-0.615,0.053-1.25,0.076-1.886,0.076 c-22.437,0-37.439-10.607-50.678-19.973c-9.489-6.703-18.438-13.031-28.922-14.775c-5.149-0.854-10.271-1.287-15.22-1.287 c-8.917,0-15.964,1.383-21.109,2.389c-3.166,0.617-5.896,1.148-8.006,1.148c-2.21,0-4.895-0.49-6.014-4.311 c-0.887-3.014-1.523-5.934-2.137-8.746c-1.536-7.027-2.65-11.316-5.281-11.723c-28.141-4.342-44.768-10.738-48.08-18.484 c-0.347-0.814-0.541-1.633-0.584-2.443c-0.129-2.309,1.501-4.334,3.777-4.711c22.348-3.68,42.219-15.492,59.064-35.119 c13.049-15.195,19.457-29.713,20.145-31.316c0.03-0.072,0.065-0.148,0.101-0.217c3.247-6.588,3.893-12.281,1.926-16.916 c-3.626-8.551-15.635-12.361-23.58-14.882c-1.976-0.625-3.845-1.217-5.334-1.808c-7.043-2.782-18.626-8.66-17.083-16.773 c1.124-5.916,8.949-10.036,15.273-10.036c1.756,0,3.312,0.308,4.622,0.923c7.146,3.348,13.575,5.045,19.104,5.045 c6.876,0,10.197-2.618,11-3.362c-0.198-3.668-0.44-7.546-0.674-11.214c0-0.004-0.005-0.048-0.005-0.048 c-1.614-25.675-3.627-57.627,4.546-75.95c24.462-54.847,76.339-59.112,91.651-59.112c0.408,0,6.674-0.062,6.674-0.062 c0.283-0.005,0.59-0.009,0.908-0.009c15.354,0,67.339,4.27,91.816,59.15c8.173,18.335,6.158,50.314,4.539,76.016l-0.076,1.23 c-0.222,3.49-0.427,6.793-0.6,9.995c0.756,0.696,3.795,3.096,9.978,3.339c5.271-0.202,11.328-1.891,17.998-5.014 c2.062-0.968,4.345-1.169,5.895-1.169c2.343,0,4.727,0.456,6.714,1.285l0.106,0.041c5.66,2.009,9.367,6.024,9.447,10.242 c0.071,3.932-2.851,9.809-17.223,15.485c-1.472,0.583-3.35,1.179-5.334,1.808c-7.952,2.524-19.951,6.332-23.577,14.878 c-1.97,4.635-1.322,10.326,1.926,16.912c0.036,0.072,0.067,0.145,0.102,0.221c1,2.344,25.205,57.535,79.209,66.432 c2.275,0.379,3.908,2.406,3.778,4.711c-0.048,0.828-0.248,1.656-0.598,2.465c-3.289,7.703-19.915,14.09-48.064,18.438 c-2.642,0.408-3.755,4.678-5.277,11.668c-0.63,2.887-1.271,5.717-2.146,8.691c-0.819,2.797-2.641,4.164-5.567,4.164h-0.441 c-1.905,0-4.604-0.346-8.008-1.012c-5.95-1.158-12.623-2.236-21.109-2.236c-5.21,0-10.577,0.453-15.962,1.352 c-11.511,1.914-20.872,8.535-30.786,15.543c-13.314,9.408-27.075,19.143-48.071,19.143c-0.917,0-1.812-0.031-2.709-0.076 l-0.236-0.01l-0.237,0.018c-0.515,0.045-1.034,0.068-1.564,0.068c-20.993,0-34.76-9.732-48.068-19.143 c-9.916-7.008-19.282-13.629-30.791-15.543c-5.38-0.896-10.752-1.352-15.959-1.352c-9.333,0-16.644,1.428-21.978,2.471 c-2.935,0.574-5.476,1.066-7.139,1.066c-1.362,0-1.388-0.08-1.676-1.064c-0.844-2.865-1.461-5.703-2.062-8.445 c-1.676-7.678-3.119-14.312-9.002-15.215c-37.613-5.809-43.659-13.561-44.613-15.795c-0.149-0.352-0.216-0.652-0.231-0.918 c56.11-9.238,81.041-65.408,82.63-69.119c3.857-7.818,4.541-14.775,2.032-20.678c-4.442-10.461-17.638-14.653-26.368-17.422 c-2.007-0.635-3.735-1.187-5.048-1.705c-11.336-4.479-14.823-8.991-14.305-11.725c0.601-3.153,6.067-6.359,10.837-6.359 c1.072,0,2.012,0.173,2.707,0.498c7.747,3.631,14.819,5.472,21.022,5.472c9.751,0,14.091-4.537,14.557-5.055l1.057-1.182 l-0.085-1.583c-0.197-3.699-0.44-7.574-0.696-11.565c-1.583-25.205-3.563-56.553,4.158-73.871 c23.37-52.396,72.903-56.435,87.525-56.435c0.36,0,6.717-0.065,6.717-0.065C407.744,124.239,408.033,124.236,408.336,124.235z"/>
      <path fill="#020202" d="M408.336,124.235c14.455,0,64.231,3.883,87.688,56.472c7.724,17.317,5.744,48.686,4.156,73.885 c-0.248,3.999-0.494,7.875-0.694,11.576l-0.084,1.591l1.062,1.185c0.429,0.476,4.444,4.672,13.374,5.017l0.144,0.008l0.15-0.003 c5.904-0.225,12.554-2.059,19.776-5.442c1.064-0.498,2.48-0.741,3.978-0.741c1.707,0,3.521,0.321,5.017,0.951l0.226,0.09 c3.787,1.327,6.464,3.829,6.505,6.093c0.022,1.28-0.935,5.891-14.359,11.194c-1.312,0.518-3.039,1.069-5.041,1.7 c-8.736,2.774-21.934,6.96-26.376,17.427c-2.501,5.896-1.816,12.854,2.034,20.678c1.584,3.697,26.52,59.865,82.631,69.111 c-0.011,0.266-0.079,0.557-0.229,0.9c-0.951,2.24-6.996,9.979-44.612,15.783c-5.886,0.902-7.328,7.5-9,15.17 c-0.604,2.746-1.218,5.518-2.062,8.381c-0.258,0.865-0.306,0.914-1.233,0.914c-0.128,0-0.278,0-0.442,0 c-1.668,0-4.2-0.346-7.135-0.922c-5.345-1.041-12.647-2.318-21.982-2.318c-5.21,0-10.577,0.453-15.962,1.352 c-11.511,1.914-20.872,8.535-30.786,15.543c-13.314,9.408-27.075,19.143-48.071,19.143c-0.917,0-1.812-0.031-2.709-0.076 l-0.236-0.01l-0.237,0.018c-0.515,0.045-1.034,0.068-1.564,0.068c-20.993,0-34.76-9.732-48.068-19.143 c-9.916-7.008-19.282-13.629-30.791-15.543c-5.38-0.896-10.752-1.352-15.959-1.352c-9.333,0-16.644,1.428-21.978,2.471 c-2.935,0.574-5.476,1.066-7.139,1.066c-1.362,0-1.388-0.08-1.676-1.064c-0.844-2.865-1.461-5.703-2.062-8.445 c-1.676-7.678-3.119-14.312-9.002-15.215c-37.613-5.809-43.659-13.561-44.613-15.795c-0.149-0.352-0.216-0.652-0.231-0.918 c56.11-9.238,81.041-65.408,82.63-69.119c3.857-7.818,4.541-14.775,2.032-20.678c-4.442-10.461-17.638-14.653-26.368-17.422 c-2.007-0.635-3.735-1.187-5.048-1.705c-11.336-4.479-14.823-8.991-14.305-11.725c0.601-3.153,6.067-6.359,10.837-6.359 c1.072,0,2.012,0.173,2.707,0.498c7.747,3.631,14.819,5.472,21.022,5.472c9.751,0,14.091-4.537,14.557-5.055l1.057-1.182 l-0.085-1.583c-0.197-3.699-0.44-7.574-0.696-11.565c-1.583-25.205-3.563-56.553,4.158-73.871 c23.37-52.396,72.903-56.435,87.525-56.435c0.36,0,6.717-0.065,6.717-0.065C407.744,124.239,408.033,124.236,408.336,124.235z"/>
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

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* ========== PRODUCT STORE ========== */}
      {/* Top bar */}
      <div className="bg-[#29292C] text-white text-center py-2 text-xs tracking-widest uppercase font-medium">
        21 Exotic Flavors — All $15
      </div>

      {/* Header */}
      <header className="relative">
        <div className="max-w-[1000px] mx-auto px-6 py-5 flex items-center justify-between">
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
            className="px-5 py-2.5 bg-[#FFFC00] text-[#111] rounded-[10px] text-sm font-bold hover:bg-[#e6e300] transition-colors shadow-md flex items-center gap-2.5"
          >
            <SnapchatIcon className="w-7 h-7" />
            Order on Snap
          </a>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#13EEEF] via-[#EF1187] to-[#13EEEF]" />
      </header>

      {/* Hero */}
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
              <p className="text-white/70 text-lg mb-6 leading-relaxed">
                Premium 1g cartridges. Lab tested quality. Unbeatable price.
              </p>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl sm:text-7xl font-bold" style={{ fontFamily: '"Varela Round", sans-serif', color: '#FABF39' }}>$15</span>
                <span className="text-white/60 text-lg uppercase tracking-wider">each</span>
              </div>
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

      {/* Marquee */}
      <div className="bg-[#EF1187] text-white py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="mx-8 text-sm font-bold uppercase tracking-wider">
              🍎 Apple Candy   🍇 Frosted Grapes   🍌 Banana Daze   🍒 Mint Chocolate   🍉 Watermelon   🥭 Golden Mango   👑 Grand Daddy Purple   💚 Green Crack   🦩 Pink Flamingo   🍊 Clementine Ice   🥂 Champagne   🍓 Red Berry Punch   🍺 Rootbeer   
            </span>
          ))}
        </div>
      </div>

      {/* Cartridges */}
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {CARTRIDGES.map((p, i) => (
              <ProductCard key={p.name} product={p} index={i} visible={visible} />
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#13EEEF]/40 to-transparent" />
      </div>

      {/* Disposables */}
      <section className="py-10 px-6 bg-[#1a1a1d]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: '"Varela Round", sans-serif', color: '#EF1187' }}>
              2g Disposables
            </h2>
            <p className="text-white/50 text-lg">Premium disposables — $30 each</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {DISPOSABLES.map((p) => (
              <DisposableCard key={p.name} product={p} visible={visible} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Snapchat CTA */}
      <section className="bg-[#29292C] py-8 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: '"Varela Round", sans-serif' }}>
            Ready to Order?
          </h2>
          <p className="text-white/60 text-lg mb-6">
            Message {SNAPCHAT_HANDLE} on Snapchat
          </p>
          <a
            href={SNAPCHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFFC00] text-[#111] rounded-[10px] text-lg font-bold hover:bg-[#e6e300] transition-colors shadow-lg"
          >
            <SnapchatIcon className="w-8 h-8" />
            Open Snapchat
          </a>
        </div>
      </section>

      {/* ========== STASH TRACKER APP SECTION ========== */}

      {/* Features */}
      <section className="py-10 px-6 bg-[#0b1120]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: '"Varela Round", sans-serif', color: '#13EEEF' }}>
              Why Stash Tracker?
            </h2>
            <p className="text-white/60 text-lg">One app. Your whole collection. Always with you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#13EEEF]/40 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-white" style={{ fontFamily: '"Varela Round", sans-serif' }}>{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
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
            Free web app. Works offline. No account required.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-[#EF1187] text-white rounded-[10px] text-lg font-bold hover:bg-[#BF0F6C] transition-colors shadow-lg"
          >
            Launch Stash Tracker →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#29292C] py-6 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#EF1187] to-[#BF0F6C] rounded-lg flex items-center justify-center text-sm">🌿</div>
            <span className="text-white/70 text-sm font-bold" style={{ fontFamily: '"Varela Round", sans-serif' }}>KOTY CANNA CO.</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href={SNAPCHAT_URL} target="_blank" rel="noopener noreferrer" className="text-[#FFFC00] hover:text-[#e6e300] transition-colors font-medium flex items-center gap-2">
              <SnapchatIcon className="w-5 h-5" /> {SNAPCHAT_HANDLE}
            </a>
            <span className="text-white/30">|</span>
            <button onClick={() => navigate('/')} className="text-[#13EEEF] hover:text-[#0fc5c6] transition-colors font-medium">
              Open App →
            </button>
          </div>
          <p className="text-white/30 text-xs mt-4">&copy; {new Date().getFullYear()} Koty Canna Co.</p>
        </div>
      </footer>
    </div>
  );
}
