import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Group, Stack, Text, Button, SimpleGrid, Paper, Divider, Badge } from '@mantine/core';
import { IconChevronLeft, IconArrowRight } from '@tabler/icons-react';
import { NumberTicker, BorderBeam, ShineBorder, AnimatedGradientText, AuroraText } from './magicui';
import { InteractiveHoverButton } from './magicui/interactive-hover-button';

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

const STRAIN_COLORS: Record<StrainType, { accent: string; label: string }> = {
  indica: { accent: '#6366f1', label: 'Indica' },
  sativa: { accent: '#f59e0b', label: 'Sativa' },
  hybrid: { accent: '#10b981', label: 'Hybrid' },
};

const FEATURES = [
  { icon: '📦', title: 'Track Your Stash', desc: 'Add strains, cartridges, edibles — log THC/CBD levels, ratings, prices, and more.' },
  { icon: '🫧', title: 'Log Sessions', desc: 'Record every session with method, amount, and notes. See your usage over time.' },
  { icon: '📊', title: 'View Stats', desc: 'Dashboards and charts showing your consumption patterns, spending, and favorites.' },
  { icon: '👥', title: 'Community', desc: 'Social feed to share posts, follow friends, comment, and like.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy and sell within the community. Listings with images, ratings, and contact info.' },
  { icon: '📴', title: 'Works Offline', desc: 'Installable web app — works anywhere, even without internet. No account needed to start.' },
];

const INSTAGRAM_URL = 'https://instagram.com/stashsageapp';
const INSTAGRAM_HANDLE = '@stashsageapp';

const BRAND_PINK = '#EF1187';
const BRAND_PINK_DARK = '#BF0F6C';
const BRAND_CYAN = '#13EEEF';
const BRAND_YELLOW = '#FABF39';
const BRAND_DARK = '#29292C';
const BRAND_BLACK = '#1a1a1d';

function InstagramIcon({ size = 'w-6 h-6' }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={size}>
      <path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function ProductCard({ product, index, visible }: { product: Product; index: number; visible: boolean }) {
  const strainInfo = STRAIN_COLORS[product.strain];

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = visible ? 'translateY(-4px)' : el.style.transform;
    el.style.boxShadow = `0 0 30px 0 ${strainInfo.accent}33`;
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = visible ? 'translateY(0)' : el.style.transform;
    el.style.boxShadow = 'none';
  };

  return (
    <Box
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: 16,
        overflow: 'hidden',
        border: `3px solid ${strainInfo.accent}`,
        transition: 'opacity 0.3s, transform 0.3s',
        transitionDelay: visible ? '0ms' : `${index * 40}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        cursor: 'pointer',
      }}
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND_BLACK }}>
          <span style={{ fontSize: 48 }}>🌿</span>
        </Box>
      )}
      <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent, transparent)' }} />
      <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 12, textAlign: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.25, fontFamily: '"Varela Round", sans-serif' }}>
          {product.name}
        </span>
      </Box>
    </Box>
  );
}

function DisposableCard({ product, visible }: { product: Product; visible: boolean }) {
  const strainInfo = STRAIN_COLORS[product.strain];

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = visible ? 'translateY(-4px)' : el.style.transform;
    el.style.boxShadow = `0 15px 40px 0 ${strainInfo.accent}33`;
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = visible ? 'translateY(0)' : el.style.transform;
    el.style.boxShadow = 'none';
  };

  return (
    <Box
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: `3px solid ${strainInfo.accent}`,
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        background: BRAND_BLACK,
      }}
    >
      {product.image ? (
        <Box style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden', background: BRAND_BLACK }}>
          <img src={product.image} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      ) : (
        <Box style={{ aspectRatio: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND_BLACK }}>
          <span style={{ fontSize: 40 }}>🔥</span>
        </Box>
      )}
      <Box p="xl" style={{ textAlign: 'center', background: BRAND_BLACK }}>
        <Text size="lg" fw={600} mb={4} style={{ color: '#fff', fontFamily: '"Varela Round", sans-serif' }}>
          {product.name}
        </Text>
        <Group justify="center" gap="sm" mb={4} wrap="nowrap">
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: strainInfo.accent }}>{strainInfo.label}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#13EEEF' }}>2g Disposable</span>
        </Group>
        <Box style={{ fontSize: 30, fontWeight: 700, color: BRAND_YELLOW, fontFamily: '"Varela Round", sans-serif' }}>
          <NumberTicker value={product.price} prefix="$" duration={900} />
        </Box>
      </Box>
    </Box>
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
    <Box style={{ minHeight: '100vh', background: '#fff', color: '#000', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <Box style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <InteractiveHoverButton
          onClick={() => navigate('/')}
          icon={<IconChevronLeft size={18} />}
        >
          Back
        </InteractiveHoverButton>
      </Box>

      <Box style={{ background: BRAND_DARK, color: '#fff', textAlign: 'center', padding: '8px 0', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 500 }}>
        21 Exotic Flavors — All $15
      </Box>

      <Box component="header" style={{ position: 'relative' }}>
        <Box style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Group gap="sm" align="center" wrap="nowrap">
            <Box style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${BRAND_PINK}, ${BRAND_PINK_DARK})`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              🌿
            </Box>
            <Box>
              <AuroraText className="text-[18px] font-bold leading-none font-['Varela_Round']" colors={['#EF1187', '#13EEEF', '#EF1187']}>
                Stash Sage
              </AuroraText>
              <div style={{ color: BRAND_CYAN, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>The Menu</div>
            </Box>
          </Group>
          <InteractiveHoverButton
            icon={<InstagramIcon size="w-5 h-5" />}
            onClick={() => window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer')}
          >
            {`Contact ${INSTAGRAM_HANDLE}`}
          </InteractiveHoverButton>
        </Box>
        <Box style={{ height: 4, background: `linear-gradient(90deg, ${BRAND_CYAN}, ${BRAND_PINK}, ${BRAND_CYAN})` }} />
      </Box>

      <Box style={{ position: 'relative', background: BRAND_DARK, color: '#fff', overflow: 'hidden' }}>
        <Box style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: '25%', width: 600, height: 600, background: 'rgba(239,17,135,0.1)', borderRadius: '50%', filter: 'blur(150px)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: '25%', width: 400, height: 400, background: 'rgba(19,238,239,0.1)', borderRadius: '50%', filter: 'blur(120px)' }} />
        </Box>
        <Box
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '40px 24px',
            position: 'relative',
            zIndex: 10,
            transition: 'all 0.7s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <Stack align="center" gap={40} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Box style={{ flex: 1, minWidth: 260 }}>
              <Group gap="xs" mb="md" wrap="nowrap">
                <Badge
                  radius="xl"
                  variant="light"
                  color="cyan"
                  leftSection={<span style={{ width: 8, height: 8, background: BRAND_CYAN, borderRadius: '50%', animation: 'pulse 1s infinite' }} />}
                  styles={{ label: { color: BRAND_CYAN, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 } }}
                >
                  Coming Soon
                </Badge>
              </Group>
              <Text style={{ fontSize: 48, fontWeight: 700, lineHeight: 0.95, marginBottom: 8, fontFamily: '"Varela Round", sans-serif', color: BRAND_PINK }}>
                STASH SAGE<br />MENU
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.625 }}>
                The Stash Sage menu is coming soon. Contact the owner to order — all flavors $15.
              </Text>
              <Group gap="sm" align="baseline" wrap="nowrap" mt="md">
                <NumberTicker value={15} prefix="$" className="!text-[60px] font-bold tabular-nums !text-[#fabf39]" style={{ fontSize: 60, fontWeight: 700, fontFamily: '"Varela Round", sans-serif', color: BRAND_YELLOW }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 }}>each</span>
              </Group>
            </Box>
            <Box style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Box style={{ position: 'relative' }}>
                <Box style={{ width: 192, height: 192, background: `linear-gradient(135deg, ${BRAND_PINK}, ${BRAND_PINK_DARK})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, boxShadow: '0 30px 60px rgba(239,72,135,0.3)' }}>🌿</Box>
                <BorderBeam size={220} duration={9} borderWidth={2.5} colorFrom={BRAND_CYAN} colorTo={BRAND_PINK} className="rounded-[9999px]" />
                <Box style={{ position: 'absolute', top: -12, right: -12, width: 80, height: 80, background: BRAND_YELLOW, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#111', fontFamily: '"Varela Round", sans-serif', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>$15</Box>
                <Box style={{ position: 'absolute', bottom: -8, left: -8, width: 56, height: 56, background: BRAND_CYAN, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>🔥</Box>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box style={{ background: BRAND_PINK, color: '#fff', padding: '8px 0', overflow: 'hidden' }}>
        <Box style={{ display: 'flex', animation: 'marquee 30s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ margin: '0 32px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              🍎 Apple Candy   🍇 Frosted Grapes   🍌 Banana Daze   🍒 Mint Chocolate   🍉 Watermelon   🥭 Golden Mango   👑 Grand Daddy Purple   💚 Green Crack   🦩 Pink Flamingo   🍊 Clementine Ice   🥂 Champagne   🍓 Red Berry Punch   🍺 Rootbeer{' '}
            </span>
          ))}
        </Box>
      </Box>

      <Box py={40} px={24}>
        <Box style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Box ta="center" mb="lg">
            <Text style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, fontFamily: '"Varela Round", sans-serif', color: BRAND_PINK }}>
              1g Cartridges
            </Text>
            <Text style={{ color: BRAND_DARK, fontSize: 18 }}>All flavors — $15 each</Text>
            <Group justify="center" gap="sm" mt="md" wrap="nowrap">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1' }} /> Indica</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Sativa</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Hybrid</span>
            </Group>
          </Box>
          <SimpleGrid cols={{ base: 3, sm: 4, md: 5, lg: 7 }} spacing="sm">
            {CARTRIDGES.map((p, i) => (
              <ProductCard key={p.name} product={p} index={i} visible={visible} />
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        <Divider style={{ opacity: 0.4 }} />
      </Box>

      <Box style={{ padding: '40px 24px', background: BRAND_BLACK }}>
        <Box style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Box ta="center" mb={32}>
            <Text style={{ fontSize: 30, fontWeight: 700, marginBottom: 8, fontFamily: '"Varela Round", sans-serif', color: BRAND_PINK }}>
              2g Disposables
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>Premium disposables — $30 each</Text>
          </Box>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" style={{ maxWidth: 448, margin: '0 auto' }}>
            {DISPOSABLES.map((p) => (
              <DisposableCard key={p.name} product={p} visible={visible} />
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box style={{ background: BRAND_DARK, padding: '32px 24px' }}>
        <Box style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12, fontFamily: '"Varela Round", sans-serif' }}>
            Order Coming Soon
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginBottom: 24 }}>
            This menu is a preview. To order, contact the Stash Sage owner at {INSTAGRAM_HANDLE}.
          </Text>
          <InteractiveHoverButton
            icon={<InstagramIcon size="w-6 h-6" />}
            onClick={() => window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer')}
          >
            {`Contact ${INSTAGRAM_HANDLE}`}
          </InteractiveHoverButton>
        </Box>
      </Box>

      <Box style={{ padding: '40px 24px', background: '#0b1120' }}>
        <Box style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Box ta="center" mb={32}>
            <AnimatedGradientText className="!mb-2 !text-[30px] !font-bold font-['Varela_Round']">
              Why Stash Sage?
            </AnimatedGradientText>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>One app. Your whole collection. Always with you.</Text>
          </Box>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {FEATURES.map((f) => (
              <ShineBorder key={f.title} color={[BRAND_PINK, BRAND_CYAN]} borderRadius={16} borderWidth={1.5} className="h-full">
                <Paper
                  p={24}
                  radius="lg"
                  withBorder
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    transition: 'borderColor 0.3s, box-shadow 0.3s',
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(19,238,239,0.4)'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.boxShadow = 'none'; }}
                >
                  <Stack gap="xs">
                    <span style={{ fontSize: 30 }}>{f.icon}</span>
                    <Text fw={600} size="lg" style={{ color: '#fff', fontFamily: '"Varela Round", sans-serif' }}>{f.title}</Text>
                    <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.625 }}>{f.desc}</Text>
                  </Stack>
                </Paper>
              </ShineBorder>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box style={{ background: BRAND_CYAN, padding: '40px 24px' }}>
        <Box style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <Text style={{ fontSize: 30, fontWeight: 700, marginBottom: 12, color: '#111', fontFamily: '"Varela Round", sans-serif' }}>Try Stash Sage</Text>
          <Button
            onClick={() => navigate('/')}
            size="lg"
            radius="md"
            rightSection={<IconArrowRight size={20} />}
            style={{ background: BRAND_PINK, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            Launch Stash Sage
          </Button>
        </Box>
      </Box>

      <Box component="footer" style={{ background: BRAND_DARK, padding: '24px 24px' }}>
        <Box style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <Group justify="center" gap="sm" mb="sm" wrap="nowrap">
            <Box style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${BRAND_PINK}, ${BRAND_PINK_DARK})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌿</Box>
            <AuroraText className="text-[14px] font-bold font-['Varela_Round']" colors={['#EF1187', '#13EEEF', '#EF1187']}>
              Stash Sage
            </AuroraText>
          </Group>
          <Group justify="center" gap="md" wrap="nowrap">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#E4405F', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <InstagramIcon size="w-5 h-5" /> {INSTAGRAM_HANDLE}
            </a>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <button onClick={() => navigate('/')} style={{ color: BRAND_CYAN, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
              Open App →
            </button>
          </Group>
          <Text size="xs" mt="md" style={{ color: 'rgba(255,255,255,0.3)' }}>&copy; {new Date().getFullYear()} Stash Sage</Text>
        </Box>
      </Box>
    </Box>
  );
}