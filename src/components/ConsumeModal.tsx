import { useState } from 'react';
import { Product } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { roundToHundredth, formatPrecision } from '../utils/helpers';
import { Modal, Group, Stack, Text, NumberInput, Switch, Divider, Button, ActionIcon, Box, Paper } from '@mantine/core';
import { IconMinus, IconPlus, IconPlayerPlay, IconUsers } from '@tabler/icons-react';
import { t } from '../utils/translations';

interface ConsumeModalProps {
  product: Product;
  onConsume: (amount: number, startSession: boolean, people: number, consumedAt?: Date) => void;
  onClose: () => void;
  isDark?: boolean;
}

export function ConsumeModal({ product, onConsume, onClose, isDark = true }: ConsumeModalProps) {
  const { settings } = useSettings();
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const [people, setPeople] = useState(settings.sessionDefaults.defaultPeople);
  const [amount, setAmount] = useState(settings.sessionDefaults.defaultAmount);
  const [startSession, setStartSession] = useState(false);
  const [consumedAt, setConsumedAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  });

  const lang = settings.language;

  const handleConsume = () => {
    onConsume(roundToHundredth(amount), startSession, people, new Date(consumedAt));
  };

  const adjustAmount = (delta: number) => {
    setAmount(prev => Math.max(0.01, roundToHundredth(prev + delta)));
  };

  const quickAmounts = [0.1, 0.25, 0.5, 1, 2];

  const dimColor = isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)';

  return (
    <Modal
      opened={isVisible}
      onClose={handleClose}
      size="sm"
      centered
      radius="lg"
      closeOnEscape={false}
      aria-label={`${t('consume', lang)} ${product.name}`}
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: { padding: 0 },
      }}
    >
      <Box p="lg" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
        <Group justify="space-between" mb="md" align="flex-start">
          <Stack gap={2}>
            <Text fw={700} size="lg">{t('consume', lang)} {product.name}</Text>
            <Text size="sm" c="dimmed">{t('amount', lang)}: {formatPrecision(product.amount, settings.decimalPrecision)}g</Text>
          </Stack>
        </Group>

        <Stack gap="md">
          <Box>
            <Text fw={500} size="sm" mb="xs">{t('amount', lang)} ({t('grams', lang)})</Text>
            <Group gap="sm" align="center">
              <ActionIcon
                size="lg"
                radius="md"
                variant={isDark ? 'default' : 'light'}
                onClick={() => adjustAmount(-0.1)}
                aria-label={`${t('amount', lang)} -0.1`}
              >
                <IconMinus size={16} />
              </ActionIcon>
              <NumberInput
                flex={1}
                value={amount}
                onChange={(v) => setAmount(Math.max(0, typeof v === 'number' ? v : parseFloat(v) || 0))}
                min={0}
                step={0.1}
                hideControls
                aria-label={t('amount', lang)}
                styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
              />
              <ActionIcon
                size="lg" radius="default"
                color="green"
                variant="filled"
                onClick={() => adjustAmount(0.1)}
                aria-label={`${t('amount', lang)} +0.1`}
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Group>

            <Group gap="xs" mt="md" grow>
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  size="xs"
                  variant="default"
                  onClick={() => setAmount(prev => roundToHundredth(Math.min(product.amount, prev + amt)))}
                  aria-label={`+${amt}g`}
                  styles={{
                    root: { background: isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)' },
                  }}
                >
                  +{amt}g
                </Button>
              ))}
            </Group>
          </Box>

          <Paper withBorder p="md" bg="transparent">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <IconPlayerPlay size={20} style={{ color: isDark ? 'var(--mantine-color-green-8)' : 'var(--mantine-color-green-6)' }} />
                <Box>
                  <Text fw={500}>{t('session', lang)}</Text>
                  <Text size="xs" c="dimmed">{t('sessionDefaults', lang)}</Text>
                </Box>
              </Group>
              <Switch
                checked={startSession}
                onChange={() => setStartSession(!startSession)}
                aria-label={startSession ? t('cancel', lang) : t('start', lang)}
              />
            </Group>
          </Paper>

          {startSession && (
            <Box>
              <Text fw={500} size="sm" mb="xs">
                <IconUsers size={16} style={{ display: 'inline', marginRight: 4 }} />
                {t('people', lang)}
              </Text>
              <Group gap="sm">
                <ActionIcon
                  size="lg" radius="default"
                  variant={isDark ? 'default' : 'light'}
                  onClick={() => setPeople(Math.max(1, people - 1))}
                  aria-label={`${t('people', lang)} -1`}
                >
                  <IconMinus size={16} />
                </ActionIcon>
                <Text flex={1} ta="center" fw={700} size="xl">{people}</Text>
                <ActionIcon
                  size="lg" radius="default" color="green" variant="filled"
                  onClick={() => setPeople(people + 1)}
                  aria-label={`${t('people', lang)} +1`}
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Group>
            </Box>
          )}

          <Paper withBorder radius="md" p="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t('setConsumptionTime', lang)}</Text>
              <input
                type="datetime-local"
                value={consumedAt}
                onChange={(e) => setConsumedAt(e.target.value)}
                aria-label={t('setConsumptionTime', lang)}
                style={{
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: dimColor,
                  fontSize: 12,
                }}
              />
            </Group>
          </Paper>

          <Paper withBorder radius="md" p="md" bg="var(--mantine-color-slate-8)">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t('amount', lang)}:</Text>
              <Text fw={700}>{formatPrecision(Math.max(0, roundToHundredth(product.amount - amount)), settings.decimalPrecision)}g</Text>
            </Group>
          </Paper>
        </Stack>

        <Divider my="lg" />

        <Group gap="sm">
          <Button
            flex={1} variant="default" size="md"
            onClick={handleClose}
            styles={{ root: { color: isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)' } }}
          >
            {t('cancel', lang)}
          </Button>
          <Button
            flex={1} size="md" color="green"
            onClick={handleConsume}
            disabled={amount <= 0}
            aria-label={startSession ? t('session', lang) : t('consume', lang)}
          >
            {startSession ? t('session', lang) : t('consume', lang)}
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}