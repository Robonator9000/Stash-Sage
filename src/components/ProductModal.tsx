import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Product, Session } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { generateId, roundToHundredth } from '../utils/helpers';
import { gramsToOz } from '../utils/convert';
import { Modal, Group, Stack, Text, TextInput, NumberInput, Textarea, Button, ActionIcon, Paper, Divider, Box, SimpleGrid, ScrollArea, Image } from '@mantine/core';
import { IconX, IconStar, IconCamera, IconHeart, IconPlus, IconChevronDown, IconHistory } from '@tabler/icons-react';
import { t } from '../utils/translations';
import { showToast } from './Toast';

interface ProductModalProps {
  product?: Product | null;
  onSave: (product: Product) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isDark?: boolean;
  sessions?: Session[];
}

const POPULAR_BRANDS = [
  'Cookies',
  'Runtz',
  'Connected',
  'Do-Si-Dos',
  'Gelato',
  'Wedding Cake',
  'Blue Dream',
  'OG Kush',
  'Sour Diesel',
  'Purple Haze',
];

const TYPE_COLORS: Record<string, string> = {
  indica: 'grape',
  sativa: 'amber',
  hybrid: 'green',
};

const HEX_TO_COLOR: Record<string, string> = {
  '#a855f7': 'grape',
  '#f59e0b': 'amber',
  '#10b981': 'green',
  '#ef4444': 'red',
  '#3b82f6': 'blue',
  '#ec4899': 'pink',
  '#14b8a6': 'teal',
  '#f97316': 'orange',
  '#6366f1': 'indigo',
  '#84cc16': 'lime',
};

const STRAIN_COLORS = ['#a855f7', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export const ProductModal = memo(function ProductModal({ product, onSave, onDelete, onClose, isDark = true, sessions = [] }: ProductModalProps) {
  const { settings, updateSettings, addFavoriteBrand, removeFavoriteBrand, addRecentBrand } = useSettings();
  const lang = settings.language;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(product?.name || '');
  const [type, setType] = useState<string>(product?.type || 'hybrid');
  const [showCustomType, setShowCustomType] = useState(false);
  const [strainColor, setStrainColor] = useState(() => {
    if (product?.type && !['indica', 'sativa', 'hybrid'].includes(product.type.toLowerCase())) {
      return settings.customStrainColors?.[product.type] || '#a855f7';
    }
    return '#a855f7';
  });
  const [thc, setThc] = useState(product?.thc || 0);
  const [cbd, setCbd] = useState(product?.cbd || 0);
  const [amount, setAmount] = useState(product?.amount || 0);
  const [price, setPrice] = useState(product?.price || 0);
  const [pictures, setPictures] = useState<string[]>(product?.pictures?.length ? product.pictures : (product?.picture ? [product.picture] : []));
  const [notes, setNotes] = useState(product?.notes || '');
  const [rating, setRating] = useState(product?.rating || 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [brand, setBrand] = useState(product?.brand || '');
  const [tags, setTags] = useState(product?.tags || '');
  const [effects, setEffects] = useState(product?.effects || '');
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showOz, setShowOz] = useState(false);
  const [purchasedAt, setPurchasedAt] = useState(
    product?.purchasedAt ? new Date(product.purchasedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const { isVisible, handleClose } = useModalAnimation(onClose);

  const productSessions = useMemo(() => {
    if (!product) return [];
    return sessions.filter(s => s.productId === product.id);
  }, [sessions, product]);

  const [showHistory, setShowHistory] = useState(false);

  const favoriteBrands = settings.favoriteBrands || [];
  const recentBrands = settings.recentBrands || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          showToast({ id: 'photo-size', title: t('photoSizeWarning', lang), body: file.name, variant: 'danger' });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setPictures((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setIsBrandDropdownOpen(false);
    setBrandSearchQuery('');
    addRecentBrand(selectedBrand);
  };

  const handleToggleFavoriteBrand = (e: React.MouseEvent, brandName: string) => {
    e.stopPropagation();
    if (favoriteBrands.includes(brandName)) {
      removeFavoriteBrand(brandName);
    } else {
      addFavoriteBrand(brandName);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const roundedAmount = roundToHundredth(amount);

    const productData: Product = {
      id: product?.id || generateId(),
      name: name.trim(),
      strain: name.trim(),
      type,
      thc,
      cbd,
      amount: roundedAmount,
      price,
      picture: pictures[0] || '',
      pictures: pictures,
      notes: notes.trim(),
      rating,
      brand: brand.trim(),
      tags: tags.trim(),
      effects: effects.trim(),
      consumptionCount: product?.consumptionCount || 0,
      lastConsumed: product?.lastConsumed,
      purchasedAt: purchasedAt ? new Date(purchasedAt) : undefined,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
      favorite: product?.favorite || false,
    };

    const trimmedType = type.trim().toLowerCase();
    if (!['indica', 'sativa', 'hybrid'].includes(trimmedType) && trimmedType) {
      updateSettings({
        customStrainColors: {
          ...settings.customStrainColors,
          [type.trim()]: strainColor,
        },
      });
    }
    onSave(productData);
    handleClose();
  };

  const filteredBrands = useMemo(
    () => [...new Set([...favoriteBrands, ...recentBrands, ...POPULAR_BRANDS])].filter(
      (b) => b.toLowerCase().includes(brandSearchQuery.toLowerCase())
    ),
    [favoriteBrands, recentBrands, brandSearchQuery]
  );

  const sortedHistory = useMemo(() => {
    if (!product || productSessions.length === 0) return [];
    return [...productSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [productSessions, product]);

  const selectedTypeColor = type.trim().toLowerCase() in TYPE_COLORS
    ? TYPE_COLORS[type.trim().toLowerCase()]
    : HEX_TO_COLOR[strainColor] || 'slate';

  const inputBg = isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-0)';
  const dimColor = isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)';

  return (
    <Modal
      opened={isVisible}
      onClose={handleClose}
      size="md"
      centered
      radius="lg"
      closeOnEscape={false}
      aria-label={product ? `${t('editProduct', lang)} ${product.name}` : t('addProduct', lang)}
      styles={{ content: { display: 'flex', flexDirection: 'column', maxHeight: '90vh' }, body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }}
    >
      <Box p="lg" pb="sm">
        <Text fw={700} size="xl">{product ? t('editProduct', lang) : t('addProduct', lang)}</Text>
      </Box>

      <Box style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <Stack p="lg" pt="xs" gap="md">
          <Box>
            <Text fw={500} size="sm" mb="xs">{t('photos', lang)}</Text>
            <SimpleGrid cols={3} spacing="sm">
              {pictures.map((pic, idx) => (
                <Box key={idx} style={{ position: 'relative' }}>
                  <Box
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: `1px solid var(--mantine-color-default-border)`,
                    }}
                  >
                    <Image src={pic} alt={product?.name || ''} fit="cover" w="100%" h="100%" />
                  </Box>
                  <ActionIcon
                    size="sm" radius="xl" color="red" variant="filled"
                    onClick={() => setPictures((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={t('removePhoto', lang)}
                    style={{ position: 'absolute', top: -8, right: -8, opacity: 0.9 }}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Box>
              ))}
              <Button
                variant="default"
                style={{ width: '100%', aspectRatio: '1', height: 'auto', borderStyle: 'dashed', flexDirection: 'column', gap: 4, color: dimColor }}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconCamera size={20} />
                <Text style={{ fontSize: 10, lineHeight: 1.2 }}>{t('addPhoto', lang)}</Text>
              </Button>
            </SimpleGrid>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePictureUpload}
              style={{ display: 'none' }}
            />
          </Box>

          <TextInput
            id="strain-name"
            name="strain-name"
            label={`${t('strainName', lang)} *`}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder={t('strainNamePlaceholder', lang)}
          />

          <Box ref={brandDropdownRef}>
            <Text fw={500} size="sm" mb={6}>{t('brandDispensary', lang)}</Text>
            <Button
              variant="default" fullWidth
              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
              styles={{ root: { justifyContent: 'space-between' } }}
            >
              <Text fw={500} c={brand ? undefined : 'dimmed'}>{brand || t('selectBrand', lang)}</Text>
              <IconChevronDown size={16} style={{ transform: isBrandDropdownOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
            </Button>

            {isBrandDropdownOpen && (
              <Paper withBorder shadow="xl" mt={6} style={{ zIndex: 10 }}>
                <TextInput
                  id="brand-search"
                  name="brand-search"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.currentTarget.value)}
                  placeholder={t('searchBrands', lang)}
                  size="xs"
                  mb="xs"
                />
                <ScrollArea.Autosize mah={240}>
                  <Stack gap={0}>
                    {filteredBrands.map((b) => {
                      const isSelected = brand === b;
                      return (
                        <Button
                          key={b}
                          variant="subtle" fullWidth h="auto" p="xs" px="sm"
                          onClick={() => handleBrandSelect(b)}
                          styles={{ root: { justifyContent: 'space-between', fontWeight: 500, background: isSelected ? 'var(--mantine-color-cyan-light)' : undefined } }}
                        >
                          <Text size="sm">{b}</Text>
                          <Group gap={4}>
                            {favoriteBrands.includes(b) && (
                              <IconHeart size={14} style={{ color: 'var(--mantine-color-yellow-4)', fill: 'var(--mantine-color-yellow-4)' }} />
                            )}
                            <ActionIcon size="sm" variant="subtle" color={favoriteBrands.includes(b) ? 'yellow' : 'gray'} onClick={(e) => handleToggleFavoriteBrand(e, b)}>
                              <IconHeart size={14} style={favoriteBrands.includes(b) ? { fill: 'currentColor' } : undefined} />
                            </ActionIcon>
                          </Group>
                        </Button>
                      );
                    })}

                    {brandSearchQuery && !filteredBrands.some(b => b.toLowerCase() === brandSearchQuery.toLowerCase()) && (
                      <Button
                        variant="subtle" fullWidth h="auto" p="xs" px="sm" color="cyan"
                        onClick={() => handleBrandSelect(brandSearchQuery)}
                        styles={{ root: { justifyContent: 'flex-start', fontWeight: 500 } }}
                      >
                        <IconPlus size={16} />
                        <Text size="sm">{t('addBrand', lang).replace('{query}', brandSearchQuery)}</Text>
                      </Button>
                    )}
                  </Stack>
                </ScrollArea.Autosize>
              </Paper>
            )}
          </Box>

          <Box>
            <Text fw={500} size="sm" mb="xs">{t('strainType', lang)}</Text>
            <Group gap="xs" mb="sm">
              {(['indica', 'sativa', 'hybrid'] as const).map((st) => {
                const isSelected = type === st && !showCustomType;
                return (
                  <Button
                    key={st}
                    variant={isSelected ? 'filled' : 'default'}
                    color={TYPE_COLORS[st]}
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => { setType(st); setShowCustomType(false); }}
                    styles={{
                      root: {
                        textTransform: 'capitalize',
                        ...(isSelected && isDark ? { boxShadow: `inset 0 0 0 2px var(--mantine-color-${TYPE_COLORS[st]}-6)` } : {}),
                      },
                    }}
                  >
                    {st}
                  </Button>
                );
              })}
              <Button
                variant={showCustomType ? 'filled' : 'default'}
                color={showCustomType ? selectedTypeColor : 'cyan'}
                size="sm"
                style={{ flex: 1 }}
                leftSection={<IconPlus size={14} />}
                onClick={() => { setShowCustomType(!showCustomType); if (!showCustomType) setType(''); }}
              >
                {t('custom', lang)}
              </Button>
            </Group>
            {showCustomType && (
              <>
                <TextInput
                  id="custom-type"
                  name="custom-type"
                  value={type}
                  onChange={(e) => setType(e.currentTarget.value)}
                  placeholder={t('customStrainPlaceholder', lang)}
                  autoFocus
                />
                {type && !['indica', 'sativa', 'hybrid'].includes(type.toLowerCase()) && (
                  <Box mt="xs">
                    <Text fw={500} size="xs" mb={6} c="dimmed">Highlight Color</Text>
                    <Group gap={6}>
                      {STRAIN_COLORS.map(c => (
                        <ActionIcon
                          key={c}
                          size="md"
                          variant="filled"
                          onClick={() => setStrainColor(c)}
                          aria-label={c}
                          style={{
                            backgroundColor: c,
                            ...(strainColor === c ? { outline: '2px solid var(--mantine-color-body)', outlineOffset: 2, transform: 'scale(1.1)' } : {}),
                          }}
                        />
                      ))}
                    </Group>
                  </Box>
                )}
              </>
            )}
          </Box>

          <SimpleGrid cols={2} spacing="sm">
            <NumberInput
              id="thc" name="thc"
              label={t('thcPercent', lang)}
              value={thc}
              onChange={(v) => setThc(typeof v === 'number' ? v : parseFloat(v) || 0)}
              min={0} max={100} step={0.1} decimalScale={1}
              placeholder="0.0"
            />
            <NumberInput
              id="cbd" name="cbd"
              label={t('cbdPercent', lang)}
              value={cbd}
              onChange={(v) => setCbd(typeof v === 'number' ? v : parseFloat(v) || 0)}
              min={0} max={100} step={0.1} decimalScale={1}
              placeholder="0.0"
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <Box>
              <Group gap={6} mb={4} align="center">
                <Text fw={500} size="sm">{t('amountGrams', lang)}</Text>
                <Button variant="subtle" size="xs" p={2} style={{ height: 'auto', color: dimColor }} onClick={() => setShowOz(!showOz)}>
                  {showOz ? 'g' : 'oz'}
                </Button>
              </Group>
              <NumberInput
                id="amount" name="amount"
                value={showOz ? roundToHundredth(gramsToOz(amount)) : amount}
                onChange={(v) => setAmount(showOz ? ((typeof v === 'number' ? v : parseFloat(v) || 0) * 28.3495) : (typeof v === 'number' ? v : parseFloat(v) || 0))}
                min={0} step={0.01} decimalScale={2}
                placeholder={t('amountPlaceholder', lang)}
              />
            </Box>
            <NumberInput
              id="price" name="price"
              label={`${t('priceLabel', lang)} (${settings.currency})`}
              value={price}
              onChange={(v) => setPrice(typeof v === 'number' ? v : parseFloat(v) || 0)}
              min={0} step={0.01} decimalScale={2}
              placeholder="0.00"
            />
          </SimpleGrid>

          <Box>
            <Text fw={500} size="sm" mb="xs">Purchase Date</Text>
            <input
              id="purchase-date"
              name="purchase-date"
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--mantine-color-default-border)',
                background: inputBg,
                color: 'var(--mantine-color-text)',
                outline: 'none',
              }}
            />
          </Box>

          <Box>
            <Text fw={500} size="sm" mb="xs">{t('rating', lang)}</Text>
            <Group gap={4}>
              {[1, 2, 3, 4, 5].map((star) => {
                const fillPercent = (hoveredStar || rating) >= star ? 100 : (hoveredStar || rating) >= star - 0.5 ? 50 : 0;
                return (
                  <Box key={star} style={{ position: 'relative' }}>
                    <ActionIcon
                      variant="transparent"
                      style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 2, opacity: 0 }}
                      onClick={() => setRating(star - 0.5)}
                      onMouseEnter={() => setHoveredStar(star - 0.5)}
                      onMouseLeave={() => setHoveredStar(0)}
                      aria-label={`${star - 0.5} ${t('stars', lang)}`}
                    />
                    <ActionIcon
                      variant="transparent"
                      style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 2, opacity: 0 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      aria-label={`${star} ${t('stars', lang)}`}
                    />
                    <Box style={{ position: 'relative', width: 28, height: 28, pointerEvents: 'none' }}>
                      <IconStar size={28} style={{ position: 'absolute', inset: 0, color: isDark ? 'var(--mantine-color-slate-6)' : 'var(--mantine-color-gray-3)' }} />
                      <Box style={{ position: 'absolute', inset: 0, overflow: 'hidden', transition: 'width 0.15s', width: `${fillPercent}%` }}>
                        <IconStar size={28} style={{ color: 'var(--mantine-color-yellow-4)', fill: 'var(--mantine-color-yellow-4)' }} />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              {(hoveredStar || rating) > 0 && (
                <Text size="sm" fw={500} c="dimmed" ml="xs">{(hoveredStar || rating)}/5</Text>
              )}
            </Group>
          </Box>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              id="tags" name="tags"
              label={t('tags', lang)}
              value={tags}
              onChange={(e) => setTags(e.currentTarget.value)}
              placeholder={t('tagsPlaceholder', lang)}
            />
            <TextInput
              id="effects" name="effects"
              label={t('effects', lang)}
              value={effects}
              onChange={(e) => setEffects(e.currentTarget.value)}
              placeholder={t('effectsPlaceholder', lang)}
            />
          </SimpleGrid>

          <Textarea
            id="notes" name="notes"
            label={t('notesLabel', lang)}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            placeholder={t('notesPlaceholder', lang)}
            minRows={3}
          />

          {product && productSessions.length > 0 && (
            <Box>
              <Button
                variant="subtle" fullWidth h="auto" p="xs"
                onClick={() => setShowHistory(!showHistory)}
                styles={{ root: { justifyContent: 'flex-start', fontWeight: 500 } }}
              >
                <IconHistory size={16} />
                <Text size="sm" fw={500}>{t('sessionHistory', lang)} ({productSessions.length})</Text>
                <IconChevronDown size={16} style={{ marginLeft: 'auto', transform: showHistory ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
              </Button>
              {showHistory && (
                <ScrollArea.Autosize mah={192} mt="xs">
                  <Stack gap="xs">
                    {sortedHistory.map((s) => (
                      <Paper withBorder p="sm" radius="md" bg={isDark ? 'var(--mantine-color-slate-8)' : undefined}>
                        <Group justify="space-between" mb={4}>
                          <Text size="sm" fw={500}>{new Date(s.date).toLocaleDateString()}</Text>
                          <Text size="xs" c="dimmed">{s.amount}g · {s.people}p · {s.hitsCount}hits</Text>
                        </Group>
                        {s.notes && <Text size="xs" c="dimmed" lineClamp={2}>{s.notes}</Text>}
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              )}
            </Box>
          )}
        </Stack>
      </Box>

      <Divider />

      <Group p="lg" justify="space-between" gap="sm">
        {product && onDelete && (
          <Button
            variant="light" color="red"
            onClick={() => {
              onDelete(product.id);
              handleClose();
            }}
            aria-label={t('delete', lang)}
          >
            {t('delete', lang)}
          </Button>
        )}
        <Group gap="sm" ml="auto">
          <Button variant="default" onClick={handleClose} aria-label={t('cancel', lang)} styles={{ root: { color: dimColor } }}>{t('cancel', lang)}</Button>
          <Button
            color="cyan"
            onClick={handleSubmit}
            disabled={!name.trim()}
            aria-label={product ? t('save', lang) : t('addProduct', lang)}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500"
          >
            {product ? t('save', lang) : t('addProduct', lang)}
          </Button>
        </Group>
      </Group>
    </Modal>
  );
});
