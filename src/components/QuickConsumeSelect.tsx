import { useState } from 'react';
import { Button, NumberInput, Popover, Select, Stack, Text } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { Product } from '../types';
import { t } from '../utils/translations';

interface QuickConsumeSelectProps {
  products: Product[];
  isDark: boolean;
  lang: string;
  precision: number;
  defaultAmount: number;
  onQuickConsume: (product: Product, amount: number) => void;
}

export function QuickConsumeSelect({
  products,
  isDark,
  lang,
  precision,
  defaultAmount,
  onQuickConsume,
}: QuickConsumeSelectProps) {
  const [opened, setOpened] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | string>(defaultAmount);

  const selected = products.find((p) => p.id === productId) || null;

  const handleLog = () => {
    if (!selected) return;
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return;
    onQuickConsume(selected, Math.min(a, selected.amount));
    setOpened(false);
    setProductId(null);
    setAmount(defaultAmount);
  };

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom" width={280} shadow="md" withinPortal>
      <Popover.Target>
        <Button
          size="compact-sm"
          variant={opened ? 'gradient' : 'subtle'}
          gradient={{ from: 'cyan', to: 'teal', deg: 135 }}
          leftSection={<IconFlame size={14} />}
          onClick={() => setOpened((o) => !o)}
        >
          {t('quickLog', lang)}
        </Button>
      </Popover.Target>
      <Popover.Dropdown
        bg={isDark ? '#121a2b' : 'white'}
        style={{ border: isDark ? '1px solid #24304a' : '1px solid #e5e7eb' }}
      >
        <Stack gap="xs">
          <Text size="xs" fw={600} c={isDark ? 'gray.3' : 'gray.7'}>
            {t('quickLogTitle', lang)}
          </Text>
          <Select
            size="xs"
            placeholder={t('quickLogPlaceholder', lang)}
            data={products
              .filter((p) => p.amount > 0)
              .map((p) => ({ value: p.id, label: `${p.name} · ${p.amount.toFixed(precision)}g` }))}
            value={productId}
            onChange={setProductId}
            searchable
            maxDropdownHeight={220}
            comboboxProps={{ withinPortal: false }}
          />
          <NumberInput
            size="xs"
            label={t('quickLogAmount', lang)}
            value={amount}
            onChange={setAmount}
            min={0}
            step={0.1}
            suffix="g"
            w="100%"
          />
          <Button
            size="xs"
            variant="gradient"
            gradient={{ from: 'cyan', to: 'emerald', deg: 135 }}
            fullWidth
            disabled={!selected || Number(amount) <= 0}
            leftSection={<IconFlame size={14} />}
            onClick={handleLog}
          >
            {t('quickLogGo', lang)}
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
