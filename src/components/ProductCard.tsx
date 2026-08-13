import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../types';
import { formatDate, formatPrecision } from '../utils/helpers';
import { gramsToOz } from '../utils/convert';
import { IconStar, IconHeart, IconFlame, IconClock, IconPackage, IconCurrencyDollar } from '@tabler/icons-react';
import { t } from '../utils/translations';
import { useSettings } from '../utils/useSettings';
import { showToast } from './Toast';
import { Card, Group, Text, Center, UnstyledButton } from '@mantine/core';
import { BlurFade, BorderBeam, NumberTicker } from './magicui';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onConsume: (product: Product) => void;
  onSell: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  isDark?: boolean;
  layout?: 'grid' | 'list' | 'compact';
  precision?: number;
  isSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const COLOR_PRESETS = ['#a855f7', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export const ProductCard = memo(function ProductCard({ product, onClick, onConsume, onSell, onToggleFavorite, isDark = true, layout = 'grid', precision = 2, isSelectMode = false, selected = false, onToggleSelect }: ProductCardProps) {
  const { settings, updateSettings } = useSettings();
  const amountString = useMemo(() => `${formatPrecision(product.amount, precision)}g`, [product.amount, precision]);
  const lang = settings.language;

  const [strainHovered, setStrainHovered] = useState(false);
  const [amountHovered, setAmountHovered] = useState(false);
  const [compactHovered, setCompactHovered] = useState(false);
  const [pickingStrain, setPickingStrain] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickingStrain) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickingStrain(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickingStrain]);
  const [showOz, setShowOz] = useState(false);
  const ozTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (ozTimer.current) clearTimeout(ozTimer.current); };
  }, []);

  const strainColors = useMemo(() => {
    const custom = settings.customStrainColors?.[product.type];
    if (custom && /^#[0-9a-f]{6}$/i.test(custom)) {
      return { bg: '', text: '', border: '', customHex: custom };
    }
    switch (product.type.toLowerCase()) {
      case 'indica':
        return isDark
          ? { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.3)', customHex: '' }
          : { bg: 'rgba(168,85,247,0.12)', text: '#7e22ce', border: 'rgba(168,85,247,0.35)', customHex: '' };
      case 'sativa':
        return isDark
          ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)', customHex: '' }
          : { bg: 'rgba(245,158,11,0.12)', text: '#b45309', border: 'rgba(245,158,11,0.35)', customHex: '' };
      case 'hybrid':
        return isDark
          ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)', customHex: '' }
          : { bg: 'rgba(16,185,129,0.12)', text: '#047857', border: 'rgba(16,185,129,0.35)', customHex: '' };
      default:
        return isDark
          ? { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)', customHex: '' }
          : { bg: 'rgba(148,163,184,0.12)', text: '#475569', border: 'rgba(148,163,184,0.35)', customHex: '' };
    }
  }, [product.type, isDark, settings.customStrainColors]);

  const highlight = useMemo(() => {
    const hex = settings.customStrainColors?.[product.type];
    if (hex && /^#[0-9a-f]{6}$/i.test(hex)) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { borderHex: '', glowRgb: `rgba(${r},${g},${b},0.35)` };
    }
    const known: Record<string, { borderHex: string; glowRgb: string }> = {
      indica: { borderHex: '#a855f7', glowRgb: 'rgba(168,85,247,0.35)' },
      sativa: { borderHex: '#f59e0b', glowRgb: 'rgba(245,158,11,0.35)' },
      hybrid: { borderHex: '#10b981', glowRgb: 'rgba(16,185,129,0.35)' },
    };
    const hit = known[product.type.toLowerCase()];
    if (hit) return hit;
    return { borderHex: '#94a3b8', glowRgb: 'rgba(148,163,184,0.25)' };
  }, [product.type, settings.customStrainColors]);

  const glowStyle = useMemo(() => ({
    boxShadow: `3px 0 22px -6px ${highlight.glowRgb}`,
    borderLeft: `5px solid ${settings.customStrainColors?.[product.type] || highlight.borderHex}`,
  }), [highlight, settings.customStrainColors, product.type]);

  const displayType = product.type.charAt(0).toUpperCase() + product.type.slice(1);

  const renderColorPicker = () => pickingStrain === product.type && createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }} onClick={() => setPickingStrain(null)}>
      <div ref={pickerRef} onClick={e => e.stopPropagation()} style={{ padding: 16, borderRadius: 16, display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 280, background: isDark ? '#1a2332' : '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '100%', fontSize: 12, fontWeight: 500, marginBottom: 4, color: isDark ? '#94a3b8' : '#64748b' }}>
          Color for <strong>{displayType}</strong>
        </div>
        {COLOR_PRESETS.map(c => (
          <UnstyledButton
            key={c}
            onClick={(e) => { e.stopPropagation(); updateSettings({ customStrainColors: { ...settings.customStrainColors, [product.type]: c } }); setPickingStrain(null); }}
            style={{ width: 32, height: 32, borderRadius: '50%', transition: 'transform 0.2s', background: c }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
        <UnstyledButton
          style={{ width: '100%', fontSize: 12, marginTop: 4, padding: '4px 0', borderRadius: 8, color: isDark ? '#94a3b8' : '#64748b' }}
          onClick={(e) => {
            e.stopPropagation();
            const next = { ...settings.customStrainColors };
            delete next[product.type];
            updateSettings({ customStrainColors: next });
            setPickingStrain(null);
          }}
        >
          Reset to default
        </UnstyledButton>
      </div>
    </div>,
    document.body
  );

  const renderStrainBadge = (inner: { padding: string; bg?: string; color?: string; border?: string; transform?: string }) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: inner.padding,
        fontSize: '0.75rem',
        fontWeight: 500,
        borderRadius: 999,
        border: `1px solid ${inner.border || 'transparent'}`,
        background: inner.bg || undefined,
        color: inner.color || undefined,
        transform: inner.transform,
        cursor: 'pointer',
        ...(strainColors.customHex
          ? { background: strainColors.customHex + '20', color: strainColors.customHex, border: `1px solid ${strainColors.customHex + '40'}` }
          : {}),
      }}
    >
      {displayType}
    </span>
  );

  const vibrantStrainColor = isDark
    ? { bg: 'rgba(6,182,212,0.3)', text: '#67e8f9', border: 'rgba(34,211,238,0.6)' }
    : { bg: 'rgba(165,243,252,0.6)', text: '#0e7490', border: 'rgba(6,182,212,0.6)' };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isSelectMode) { onToggleSelect?.(product.id); } else { onClick(product); }
    }
  };

  const handleCardClick = () => {
    if (isSelectMode) { onToggleSelect?.(product.id); } else { onClick(product); }
  };

  const buttonAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleAmountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOz) {
      const ozVal = gramsToOz(product.amount);
      const ozStr = formatPrecision(ozVal, precision);
      setShowOz(true);
      navigator.clipboard.writeText(ozStr).then(() => {
        showToast({
          id: 'oz-copy-' + product.id,
          title: t('convertedToOz', lang).replace('{value}', ozStr),
          body: t('copiedToClipboard', lang),
        });
      });
      if (ozTimer.current) clearTimeout(ozTimer.current);
      ozTimer.current = setTimeout(() => setShowOz(false), 3000);
    }
  };

  const cardBg = isDark ? 'var(--mantine-color-dark-7)' : '#fff';
  const primaryText = isDark ? 'var(--mantine-color-dark-0)' : 'var(--mantine-color-gray-9)';
  const secondaryText = isDark ? 'var(--mantine-color-dark-3)' : 'var(--mantine-color-gray-5)';
  const mutedText = isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-4)';
  const borderColor = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';

  const favoriteOutline = product.favorite
    ? { outline: `1px solid ${isDark ? 'rgba(251,191,36,0.4)' : 'rgba(217,119,6,0.4)'}` }
    : undefined;
  const selectedOutline = selected ? { outline: '2px solid var(--mantine-color-cyan-6)' } : undefined;

  const renderSelectRing = (size: number, checkSize: number, absolute?: boolean, top?: number, left?: number) => (
    <div
      style={{
        position: absolute ? 'absolute' : 'relative',
        top: absolute ? top : undefined,
        left: absolute ? left : undefined,
        zIndex: 30,
        width: size,
        height: size,
        borderRadius: 6,
        border: `2px solid ${selected ? 'var(--mantine-color-cyan-6)' : isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
        background: selected ? 'var(--mantine-color-cyan-6)' : (isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.9)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={(e) => { e.stopPropagation(); onToggleSelect?.(product.id); }}
    >
      {selected && (
        <svg width={checkSize} height={checkSize} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );

  const renderAmountText = (fontSize: string) => (
    <span
      style={{
        fontSize,
        fontWeight: 500,
        background: 'linear-gradient(to right, var(--mantine-color-cyan-6), var(--mantine-color-emerald-6))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {showOz ? formatPrecision(gramsToOz(product.amount), precision) + 'oz' : amountString}
    </span>
  );

  const renderIconButton = (
    onClick: (e: React.MouseEvent) => void,
    aria: string,
    variant: 'cyan' | 'amber' | 'plain',
    children: React.ReactNode
  ) => (
    <UnstyledButton
      onClick={onClick}
      aria-label={aria}
      style={{
        padding: 8,
        borderRadius: 8,
        color:
          variant === 'plain'
            ? product.favorite ? 'var(--mantine-color-amber-6)' : (isDark ? 'var(--mantine-color-dark-1)' : 'var(--mantine-color-gray-4)')
            : variant === 'cyan'
              ? 'var(--mantine-color-cyan-6)'
              : 'var(--mantine-color-amber-6)',
        background:
          variant === 'plain'
            ? 'transparent'
            : variant === 'cyan'
              ? (isDark ? 'rgba(6,182,212,0.12)' : 'var(--mantine-color-cyan-1)')
              : (isDark ? 'rgba(251,191,36,0.12)' : 'var(--mantine-color-amber-1)'),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </UnstyledButton>
  );

  if (layout === 'list') {
    return (
      <BlurFade delay={0.05} blur="0px" className="h-full">
      <Card
        p={0}
        radius="lg"
        
        style={{ position: 'relative', cursor: 'pointer', transition: 'all 0.2s', background: cardBg, ...glowStyle, ...favoriteOutline, ...selectedOutline }}
      >
        <BorderBeam size={160} duration={7} borderWidth={1.5} className="rounded-[20px]" />
        <Group gap="md" p="md" wrap="nowrap" onClick={handleCardClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={product.name}>
          {isSelectMode && renderSelectRing(20, 12)}
          <Group style={{ position: 'relative', flexShrink: 0 }} align="center">
            {(product.pictures?.[0] || product.picture) ? (
              <img src={(product.pictures?.[0] || product.picture)} alt={product.name} loading="lazy" decoding="async" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <Center w={64} h={64} style={{ borderRadius: 8, background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)', flexShrink: 0 }}>
                <IconPackage size={24} color={isDark ? 'var(--mantine-color-dark-1)' : 'var(--mantine-color-gray-4)'} />
              </Center>
            )}
            {product.favorite && (
              <Center style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: 'var(--mantine-color-amber-6)' }}>
                <IconHeart size={11} color="#fff" style={{ fill: '#fff' }} />
              </Center>
            )}
          </Group>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center" wrap="nowrap" mb={2}>
              <Text fw={700} c={primaryText} truncate>{product.name}</Text>
              <span onClick={(e) => { e.stopPropagation(); setPickingStrain(product.type); }}>
                {renderStrainBadge({ padding: '2px 8px', bg: strainColors.bg || undefined, color: strainColors.text || undefined, border: strainColors.border || undefined })}
              </span>
              {renderColorPicker()}
            </Group>
            {product.brand && (
              <Text size="sm" c={secondaryText} truncate>{t('from', lang)} {product.brand}</Text>
            )}
            <Group gap="md" mt={4}>
              {renderAmountText('0.875rem')}
              {product.thc > 0 && <Text size="xs" c={mutedText}>{t('thc', lang)}: {product.thc}%</Text>}
              {product.rating > 0 && (
                <Group gap={4}>
                  <IconStar size={12} color="var(--mantine-color-cyan-5)" style={{ fill: 'var(--mantine-color-cyan-5)' }} />
                  <Text size="xs" c={secondaryText}>{product.rating}</Text>
                </Group>
              )}
            </Group>
          </div>

          <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
            {renderIconButton((e) => buttonAction(e, () => onConsume(product)), t('consume', lang), 'cyan', <IconFlame size={16} />)}
            {renderIconButton((e) => buttonAction(e, () => onSell(product)), t('sell', lang), 'amber', <IconCurrencyDollar size={16} />)}
            {renderIconButton(
              (e) => buttonAction(e, () => onToggleFavorite(product.id)),
              product.favorite ? t('filterFavorites', lang) : t('addToFavorites', lang),
              'plain',
              <IconHeart size={16} style={product.favorite ? { fill: 'currentColor' } : undefined} />
            )}
          </Group>
        </Group>
      </Card>
      </BlurFade>
    );
  }

  if (layout === 'compact') {
    return (
      <BlurFade delay={0.05} blur="0px" className="h-full">
      <Card
        p={0}
        radius="lg"
        
        style={{ position: 'relative', cursor: 'pointer', transition: 'all 0.2s', background: cardBg, ...glowStyle, ...favoriteOutline, ...selectedOutline }}
        onClick={handleCardClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={product.name}
        onMouseEnter={() => setCompactHovered(true)}
        onMouseLeave={() => setCompactHovered(false)}
      >
        <BorderBeam size={160} duration={7} borderWidth={1.5} className="rounded-[20px]" />
        {isSelectMode && renderSelectRing(20, 12, true, 8, 8)}
        <div style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          {(product.pictures?.[0] || product.picture) ? (
            <img src={(product.pictures?.[0] || product.picture)} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Center style={{ width: '100%', height: '100%', background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)' }}>
              <IconPackage size={32} color={isDark ? 'var(--mantine-color-dark-1)' : 'var(--mantine-color-gray-4)'} />
            </Center>
          )}
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <span onClick={(e) => { e.stopPropagation(); setPickingStrain(product.type); }}>
              {renderStrainBadge({ padding: '4px 8px', bg: strainColors.bg || undefined, color: strainColors.text || undefined, border: strainColors.border || undefined })}
            </span>
            {renderColorPicker()}
          </div>
          {product.favorite && (
            <Center style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'var(--mantine-color-amber-6)' }}>
              <IconHeart size={12} color="#fff" style={{ fill: '#fff' }} />
            </Center>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', backdropFilter: 'blur(4px)', background: isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.9)' }}>
            {renderAmountText('0.875rem')}
          </div>
        </div>
        <div style={{ padding: 8 }}>
          <Text fw={700} size="sm" c={primaryText} truncate>{product.name}</Text>
          {product.rating > 0 && (
            <Group gap={4} align="center">
              <IconStar size={12} color="var(--mantine-color-cyan-5)" style={{ fill: 'var(--mantine-color-cyan-5)' }} />
              <Text size="xs" c={secondaryText}>{product.rating}</Text>
            </Group>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4, opacity: compactHovered ? 1 : 0, transition: 'all 0.2s' }}>
          {renderIconButton((e) => buttonAction(e, () => onConsume(product)), t('consume', lang), 'cyan', <IconFlame size={14} />)}
          {renderIconButton((e) => buttonAction(e, () => onSell(product)), 'Sell', 'amber', <IconCurrencyDollar size={14} />)}
          {renderIconButton(
            (e) => buttonAction(e, () => onToggleFavorite(product.id)),
            product.favorite ? t('filterFavorites', lang) : 'Add to favourites',
            'plain',
            <IconHeart size={14} style={product.favorite ? { fill: 'currentColor' } : undefined} />
          )}
        </div>
      </Card>
      </BlurFade>
    );
  }

  return (
    <BlurFade delay={0.05} blur="0px" className="h-full">
    <Card
      p={0}
      radius="lg"
      
      style={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: cardBg,
        ...glowStyle,
        ...favoriteOutline,
        ...selectedOutline,
      }}
      onClick={handleCardClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={product.name}
    >
      <BorderBeam size={160} duration={7} borderWidth={1.5} className="rounded-[20px]" />
      {isSelectMode && renderSelectRing(24, 14, true, 12, 12)}
      <div style={{ position: 'relative', aspectRatio: '16/9', flexShrink: 0 }}>
        {(product.pictures?.[0] || product.picture) ? (
          <img
            src={(product.pictures?.[0] || product.picture)} alt={product.name}
            loading="lazy" decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Center style={{ width: '100%', height: '100%', background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)' }}>
            <IconPackage size={48} color={isDark ? 'var(--mantine-color-dark-1)' : 'var(--mantine-color-gray-4)'} />
          </Center>
        )}

        <div
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 20,
            transition: 'all 0.2s ease-out', borderRadius: 999,
          }}
          onMouseEnter={() => setStrainHovered(true)}
          onMouseLeave={() => setStrainHovered(false)}
        >
          <span onClick={(e) => { e.stopPropagation(); setPickingStrain(product.type); }}>
            {renderStrainBadge({
              padding: '4px 12px',
              bg: (strainHovered && !strainColors.customHex) ? vibrantStrainColor.bg : (strainColors.bg || undefined),
              color: (strainHovered && !strainColors.customHex) ? vibrantStrainColor.text : (strainColors.text || undefined),
              border: (strainHovered && !strainColors.customHex) ? vibrantStrainColor.border : (strainColors.border || undefined),
              transform: (strainHovered && !strainColors.customHex) ? 'scale(1.1)' : undefined,
            })}
          </span>
          {renderColorPicker()}
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, transition: 'all 0.2s' }}>
          {product.favorite ? (
            <Center style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--mantine-color-amber-6)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer' }}
              onClick={(e) => buttonAction(e, () => onToggleFavorite(product.id))}
            >
              <IconHeart size={16} color="#fff" style={{ fill: '#fff' }} />
            </Center>
          ) : (
            <UnstyledButton
              onClick={(e) => buttonAction(e, () => onToggleFavorite(product.id))}
              style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.2s', background: isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.9)', color: isDark ? 'var(--mantine-color-dark-1)' : 'var(--mantine-color-gray-4)' }}
              aria-label={t('addToFavorites', lang)}
            >
              <IconHeart size={16} />
            </UnstyledButton>
          )}
        </div>

        <div
          style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 20, transition: 'all 0.2s ease-out', transform: amountHovered ? 'scale(1.1)' : 'scale(1)' }}
          onMouseEnter={() => setAmountHovered(true)}
          onMouseLeave={() => setAmountHovered(false)}
          onClick={handleAmountClick}
        >
          <div style={{ padding: '6px 12px', borderRadius: 8, backdropFilter: 'blur(4px)', cursor: 'pointer', background: isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.9)' }}>
            {renderAmountText(amountHovered ? '1rem' : '0.875rem')}
          </div>
          {amountHovered && !showOz && (
            <div style={{ position: 'absolute', top: -32, right: 0, padding: '4px 8px', borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)', color: isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-6)' }}>
              Convert to oz
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <Text fw={700} size="lg" c={primaryText} truncate>{product.name}</Text>
            {product.brand && <Text size="sm" c={secondaryText} truncate style={{ marginTop: 2 }}>{t('from', lang)} {product.brand}</Text>}
          </div>

          <Group gap={6} wrap="nowrap" align="center" style={{ marginBottom: 8 }}>
            <span className="text-lg font-bold text-cyan-500">$</span>
            <NumberTicker value={product.price} decimals={precision} duration={700} className="text-lg font-bold text-cyan-500" />
          </Group>

          <Group gap="md" wrap="nowrap" style={{ marginBottom: 12 }}>
            {product.thc > 0 && (
              <Group gap={4} wrap="nowrap">
                <Text size="xs" fw={500} c={mutedText}>{t('thc', lang)}</Text>
                <Text size="sm" fw={700} c={primaryText}>{product.thc}%</Text>
              </Group>
            )}
            {product.cbd > 0 && (
              <Group gap={4} wrap="nowrap">
                <Text size="xs" fw={500} c={mutedText}>{t('cbd', lang)}</Text>
                <Text size="sm" fw={700} c={primaryText}>{product.cbd}%</Text>
              </Group>
            )}
          </Group>

          {product.rating > 0 && (
            <Group gap={0} wrap="nowrap" style={{ marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const fillPercent = product.rating >= star ? 100 : product.rating >= star - 0.5 ? 50 : 0;
                return (
                  <div key={star} style={{ position: 'relative', width: 16, height: 16 }}>
                    <IconStar size={16} style={{ position: 'absolute', inset: 0, color: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-3)' }} />
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPercent}%` }}>
                      <IconStar size={16} color="var(--mantine-color-cyan-5)" style={{ fill: 'var(--mantine-color-cyan-5)' }} />
                    </div>
                  </div>
                );
              })}
            </Group>
          )}

          {product.lastConsumed && (
            <Group gap={6} style={{ alignItems: 'center' }}>
              <IconClock size={12} color={mutedText} />
              <Text size="xs" c={mutedText}>
                {t('lastConsumed', lang)}: {formatDate(product.lastConsumed, lang)}
              </Text>
            </Group>
          )}
        </div>

        <Group gap={8} style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px dashed ${borderColor}` }} align="stretch">
          <UnstyledButton
            onClick={(e) => buttonAction(e, () => onConsume(product))}
            aria-label={t('consume', lang)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0', borderRadius: 12, fontWeight: 500, transition: 'all 0.2s', color: 'var(--mantine-color-cyan-6)', background: isDark ? 'linear-gradient(to right, rgba(6,182,212,0.1), rgba(16,185,129,0.1))' : 'linear-gradient(to right, var(--mantine-color-cyan-1), var(--mantine-color-emerald-1))' }}
          >
            <IconFlame size={16} />
            <Text size="sm">{t('consume', lang)}</Text>
          </UnstyledButton>
          <UnstyledButton
            onClick={(e) => buttonAction(e, () => onSell(product))}
            aria-label="Sell"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0', borderRadius: 12, fontWeight: 500, transition: 'all 0.2s', color: 'var(--mantine-color-amber-6)', background: isDark ? 'rgba(251,191,36,0.1)' : 'linear-gradient(to right, var(--mantine-color-amber-1), var(--mantine-color-orange-1))' }}
          >
            <IconCurrencyDollar size={16} />
            <Text size="sm">{t('sell', lang)}</Text>
          </UnstyledButton>
          <UnstyledButton
            onClick={(e) => buttonAction(e, () => onToggleFavorite(product.id))}
            aria-label={product.favorite ? t('filterFavorites', lang) : 'Add to favourites'}
            style={{ padding: 8, borderRadius: 12, transition: 'all 0.2s', color: product.favorite ? 'var(--mantine-color-amber-6)' : (isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-4)'), background: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)' }}
          >
            <IconHeart size={20} style={product.favorite ? { fill: 'currentColor' } : undefined} />
          </UnstyledButton>
        </Group>
      </div>
    </Card>
    </BlurFade>
  );
});
