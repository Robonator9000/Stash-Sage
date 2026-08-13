import { useState, useMemo } from 'react';
import { Product } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Modal, Group, Stack, Text, NumberInput, Button, Paper, Divider, ActionIcon, Box, Textarea } from '@mantine/core';
import { IconCurrencyDollar, IconPackage, IconTrendingUp, IconTrendingDown, IconPlus } from '@tabler/icons-react';
import { t } from '../utils/translations';

interface SellModalProps {
  product: Product;
  onSell: (amount: number, notes?: string) => void;
  onClose: () => void;
  isDark?: boolean;
}

const PORTION_SIZES = [
  { label: '0.5g', grams: 0.5 },
  { label: '1g', grams: 1 },
  { label: '2g', grams: 2 },
  { label: '3.5g (\u215B oz)', grams: 3.5 },
  { label: '5g', grams: 5 },
  { label: '7g (\u00BC oz)', grams: 7 },
  { label: '14g (\u00BD oz)', grams: 14 },
  { label: '28g (1 oz)', grams: 28 },
  { label: '56g (2 oz)', grams: 56 },
  { label: '112g (\u00BC lb)', grams: 112 },
  { label: '224g (\u00BD lb)', grams: 224 },
  { label: '453.6g (1 lb)', grams: 453.592 },
];

const QUICK_AMOUNTS = [0.5, 1, 2, 3.5, 7];

export function SellModal({ product, onSell, onClose, isDark = true }: SellModalProps) {
  const { settings } = useSettings();
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const lang = settings.language;

  const [selectedPortion, setSelectedPortion] = useState<number | null>(null);
  const [customPortion, setCustomPortion] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [pricePerPortion, setPricePerPortion] = useState('');
  const [quickSellGrams, setQuickSellGrams] = useState('');
  const [quickSellPortions, setQuickSellPortions] = useState('');
  const [sellNotes, setSellNotes] = useState('');

  const portionGrams = selectedPortion !== null ? selectedPortion : (parseFloat(customPortion) || 0);
  const numberOfPortions = portionGrams > 0 ? Math.floor(product.amount / portionGrams) : 0;
  const portionPrice = parseFloat(pricePerPortion) || 0;
  const totalSaleValue = numberOfPortions * portionPrice;
  const profit = totalSaleValue - product.price;

  const quickSellTotal = (parseFloat(quickSellGrams) || 0) * (parseInt(quickSellPortions) || 0);
  const canQuickSell = (parseFloat(quickSellGrams) || 0) > 0 && (parseInt(quickSellPortions) || 0) > 0 && quickSellTotal <= product.amount;

  const baseGrams = useMemo(() => product.amount, [product.amount]);

  const handleSell = () => {
    const grams = parseFloat(quickSellGrams);
    const portions = parseInt(quickSellPortions) || 0;
    const total = grams * portions;
    if (grams > 0 && portions > 0 && total <= product.amount) {
      onSell(roundToHundredth(total), sellNotes.trim() || undefined);
    }
  };

  const dimColor = isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-slate-7)';

  return (
    <Modal
      opened={isVisible}
      onClose={handleClose}
      size="sm"
      centered
      radius="lg"
      closeOnEscape={false}
      aria-label={`${t('sell', lang)} ${product.name}`}
      styles={{ content: { display: 'flex', flexDirection: 'column' }, body: { padding: 0 } }}
    >
      <Box p="lg" pb="sm" style={{ background: isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(16,185,129,0.1))' : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(16,185,129,0.06))', borderBottom: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'}` }}>
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={800} size="xl" style={{ letterSpacing: -0.5 }}>{t('sell', lang)}</Text>
            <Text size="sm" c="dimmed" mt={2}>{product.name} · {formatPrecision(product.amount, settings.decimalPrecision)}g{product.price > 0 ? ` · ${t('paid', lang)}: ${settings.currency}${formatPrecision(product.price, 2)}` : ''}</Text>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 48, minHeight: 48, borderRadius: 14, background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)'}` }}>
            <IconCurrencyDollar size={24} style={{ color: isDark ? 'var(--mantine-color-yellow-4)' : 'var(--mantine-color-yellow-6)' }} />
          </Box>
        </Group>
      </Box>

      <Box p="lg" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>

        <Stack gap="lg">
          <Box>
            <Group gap="sm" mb="sm">
              <IconPackage size={16} style={{ color: isDark ? 'var(--mantine-color-cyan-3)' : 'var(--mantine-color-cyan-6)' }} />
              <Text fw={500} size="sm">{t('divideIntoPortions', lang)}</Text>
            </Group>
            <Group gap="xs" mb="sm">
              {PORTION_SIZES.map((p) => {
                const disabled = p.grams > baseGrams;
                const selected = selectedPortion === p.grams;
                return (
                  <Button
                    key={p.grams}
                    size="xs"
                    variant={selected ? 'filled' : 'default'}
                    color="cyan"
                    disabled={disabled}
                    onClick={() => { if (!disabled) { setSelectedPortion(p.grams); setCustomPortion(''); setShowCustom(false); } }}
                    styles={{
                      root: !selected && isDark ? { background: 'var(--mantine-color-slate-8)', color: 'var(--mantine-color-slate-4)' } : undefined,
                    }}
                  >{p.label}</Button>
                );
              })}
              <Button
                size="xs"
                variant={showCustom ? 'filled' : 'default'}
                color="cyan"
                leftSection={<IconPlus size={14} />}
                onClick={() => { setShowCustom(!showCustom); setSelectedPortion(null); setCustomPortion(''); }}
              >
                {t('custom', lang)}
              </Button>
            </Group>
            {showCustom && (
              <Group gap="sm" mb={4}>
                <NumberInput
                  flex={1}
                  value={customPortion === '' ? '' : parseFloat(customPortion)}
                  onChange={(v) => { setCustomPortion(v === '' ? '' : String(typeof v === 'number' ? v : parseFloat(v) || 0)); setSelectedPortion(null); }}
                  placeholder={t('grams', lang)}
                  min={0} step={0.1}
                  hideControls
                  size="xs"
                />
              </Group>
            )}
          </Box>

          {portionGrams > 0 && (
            <Paper withBorder bg="transparent" p="md">
              <Group gap="sm" mb="sm">
                <IconCurrencyDollar size={16} style={{ color: isDark ? 'var(--mantine-color-green-8)' : 'var(--mantine-color-green-6)' }} />
                <Text fw={500} size="sm">{t('pricePerPortion', lang)}</Text>
              </Group>
              <NumberInput
                value={pricePerPortion === '' ? '' : parseFloat(pricePerPortion)}
                onChange={(v) => setPricePerPortion(v === '' ? '' : String(typeof v === 'number' ? v : parseFloat(v) || 0))}
                placeholder={`${settings.currency}0.00`}
                min={0} step={0.01}
                size="sm"
                mb="md"
              />
              <Stack gap={6}>
                <Group justify="space-between"><Text size="sm" c="dimmed">{t('portions', lang)}:</Text><Text size="sm" fw={500}>{numberOfPortions}</Text></Group>
                <Group justify="space-between"><Text size="sm" c="dimmed">{t('perPortion', lang)}:</Text><Text size="sm" fw={500}>{formatPrecision(portionGrams, settings.decimalPrecision)}g</Text></Group>
                <Group justify="space-between"><Text size="sm" c="dimmed">{t('saleValue', lang)}:</Text><Text size="sm" fw={500}>{settings.currency}{formatPrecision(totalSaleValue, 2)}</Text></Group>
                {product.price > 0 && (
                  <Group justify="space-between" pt={6}>
                    <Text size="sm" c="dimmed">{profit >= 0 ? t('profit', lang) : t('loss', lang)}:</Text>
                    <Group gap={4}>
                      {profit >= 0 ? <IconTrendingUp size={14} style={{ color: 'var(--mantine-color-green-6)' }} /> : <IconTrendingDown size={14} style={{ color: 'var(--mantine-color-red-6)' }} />}
                      <Text size="sm" fw={700} c={profit >= 0 ? 'green' : 'red'}>{profit >= 0 ? '+' : ''}{settings.currency}{formatPrecision(profit, 2)}</Text>
                    </Group>
                  </Group>
                )}
              </Stack>
            </Paper>
          )}

          <Box>
            <Text fw={500} size="sm" mb="xs">{t('quickSell', lang)}</Text>
            <Text size="xs" c="dimmed">{t('gramsPerPortion', lang)}</Text>
            <Group gap="sm" mt={4}>
              <ActionIcon size="lg" radius="md" variant={isDark ? 'default' : 'light'} onClick={() => { const cur = parseFloat(quickSellGrams) || 0; const next = Math.max(0, Math.round((cur - 0.5) * 10) / 10); setQuickSellGrams(next > 0 ? String(next) : ''); }}>−</ActionIcon>
              <NumberInput
                flex={1}
                value={quickSellGrams === '' ? '' : parseFloat(quickSellGrams)}
                onChange={(v) => setQuickSellGrams(v === '' ? '' : String(typeof v === 'number' ? v : parseFloat(v) || 0))}
                placeholder="0" min={0} step={0.1}
                styles={{ input: { textAlign: 'center', fontWeight: 500 } }}
              />
              <ActionIcon size="lg" radius="default" color="green" variant="filled" onClick={() => { const cur = parseFloat(quickSellGrams) || 0; setQuickSellGrams(String(Math.round((cur + 0.5) * 10) / 10)); }}>+</ActionIcon>
            </Group>
            <Group gap="xs" mt="sm" grow>
              {QUICK_AMOUNTS.map((amt) => (
                <Button key={amt} size="xs" variant="default" styles={{ root: { background: isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)' } }} onClick={() => setQuickSellGrams(String(amt))}>+{amt}g</Button>
              ))}
            </Group>

            <Text size="xs" c="dimmed" mt="md">{t('numberOfPortions', lang)}</Text>
            <NumberInput
              value={quickSellPortions === '' ? '' : parseInt(quickSellPortions, 10)}
              onChange={(v) => setQuickSellPortions(v === '' ? '' : String(typeof v === 'number' ? v : parseInt(v, 10) || 0))}
              placeholder="0" min={0} step={1}
              size="sm" mt={4}
            />

            <Paper withBorder radius="md" bg="var(--mantine-color-slate-8)" mt="md" p="sm">
              <Group justify="space-between"><Text size="sm" c="dimmed">{t('totalToSell', lang)}:</Text><Text size="sm" fw={700}>{formatPrecision(quickSellTotal, settings.decimalPrecision)}g</Text></Group>
              <Group justify="space-between" mt={4}><Text size="sm" c="dimmed">{t('remainingAfter', lang)}:</Text><Text size="sm" fw={700}>{formatPrecision(Math.max(0, roundToHundredth(product.amount - quickSellTotal)), settings.decimalPrecision)}g</Text></Group>
            </Paper>
          </Box>
          <Box>
            <Text fw={500} size="sm" mb="xs">Sale Notes</Text>
            <Textarea
              value={sellNotes}
              onChange={(e) => setSellNotes(e.currentTarget.value)}
              placeholder="Record buyer info, price agreed, or any sale details..."
              minRows={2}
              maxLength={500}
              size="sm"
            />
          </Box>
        </Stack>

        <Divider my="lg" />

        <Group gap="sm">
          <Button flex={1} size="md" variant="default" onClick={handleClose} styles={{ root: { color: dimColor } }}>{t('cancel', lang)}</Button>
          <Button flex={1} size="md" color="orange" leftSection={<IconCurrencyDollar size={16} />} disabled={!canQuickSell} onClick={handleSell} aria-label={t('sell', lang)}>
            {t('sell', lang)}
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}