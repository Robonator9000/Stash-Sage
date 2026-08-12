import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, Session } from '../types';
import { useSettings } from '../utils/useSettings';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { t } from '../utils/translations';
import { playSessionBeep } from '../utils/sounds';
import { Modal, Group, Stack, Text, Textarea, Button, NumberInput, ActionIcon, Paper, Divider, Box } from '@mantine/core';
import { IconUsers, IconClock, IconPlayerPlay, IconPlayerPause, IconRefresh, IconCalculator, IconArrowRight } from '@tabler/icons-react';
import { formatPrecision } from '../utils/helpers';
import { ShineBorder, NumberTicker } from './magicui';

interface SessionModalProps {
  product: Product;
  initialAmount: number;
  people: number;
  onFinish: (productId: string, amountUsed: number, session: Session) => void;
  onClose: () => void;
  isDark?: boolean;
  autoStartTimer?: boolean;
  defaultHitTimer?: number;
}

export function SessionModal({
  product,
  initialAmount,
  people,
  onFinish,
  onClose,
  isDark = true,
  autoStartTimer = false,
  defaultHitTimer = 10,
}: SessionModalProps) {
  const { settings } = useSettings();
  const { isVisible, handleClose } = useModalAnimation(onClose);

  const amountUsed = initialAmount;
  const [hitsCount, setHitsCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(autoStartTimer);
  const [timerSeconds, setTimerSeconds] = useState(defaultHitTimer);
  const [timerMs, setTimerMs] = useState(0);
  const [customTimerDuration, setCustomTimerDuration] = useState(defaultHitTimer);
  const [sessionNotes, setSessionNotes] = useState('');
  const [gramsPerBowl, setGramsPerBowl] = useState(settings.sessionDefaults.defaultGramsPerBowl);
  const [showCalculator, setShowCalculator] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(0);
  const [personHits, setPersonHits] = useState<number[]>(() => new Array(people).fill(0));

  const rotationEnabled = settings.sessionDefaults.rotationEnabled && people > 1;

  useEffect(() => {
    setPersonHits(new Array(people).fill(0));
    setCurrentPerson(0);
  }, [people]);

  const handleHit = useCallback(() => {
    setHitsCount((prev) => prev + 1);
    setPersonHits((prev) => {
      const next = [...prev];
      next[currentPerson] = (next[currentPerson] || 0) + 1;
      return next;
    });
    setCurrentPerson((p) => (p + 1) % people);
  }, [currentPerson, people]);

  const gramsPerPerson = people > 0 ? amountUsed / people : 0;
  const bowlsPerPerson = gramsPerPerson / gramsPerBowl;

  const handleHitRef = useRef(handleHit);
  handleHitRef.current = handleHit;
  const customTimerDurationRef = useRef(customTimerDuration);
  customTimerDurationRef.current = customTimerDuration;
  const timerSecondsRef = useRef(timerSeconds);
  timerSecondsRef.current = timerSeconds;

  useEffect(() => {
    if (!isTimerRunning) return;
    const ms = settings.showTimerMs ? 100 : 1000;
    const interval = setInterval(() => {
      if (settings.showTimerMs) {
        setTimerMs((prev) => {
          const next = prev - ms;
          return next <= 0 ? next + 1000 : next;
        });
      }
      timerSecondsRef.current -= 1;
      setTimerSeconds(timerSecondsRef.current);
      if (timerSecondsRef.current <= 0) {
        timerSecondsRef.current = customTimerDurationRef.current;
        setTimerSeconds(timerSecondsRef.current);
        setTimerMs(0);
        handleHitRef.current();
        playSessionBeep();
      }
    }, ms);
    return () => clearInterval(interval);
  }, [isTimerRunning, settings.showTimerMs]);

  const handleFinishSession = () => {
    const session: Session = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      date: new Date(),
      amount: amountUsed,
      people,
      hitsCount,
      notes: sessionNotes,
      bowlsPerPerson: Math.round(bowlsPerPerson * 10) / 10,
      personHits: rotationEnabled ? personHits : undefined,
      rotationEnabled: rotationEnabled || undefined,
    };
    onFinish(product.id, amountUsed, session);
  };

  const resetTimer = () => {
    setTimerSeconds(customTimerDuration);
    setTimerMs(0);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    setTimerSeconds(customTimerDuration);
    setTimerMs(0);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const dimColor = isDark ? '#cbd5e1' : '#475569';
  const subtleBg = isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)';
  const accent = isDark ? '#22d3ee' : '#0891b2';
  const headerBg = isDark ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.12))' : 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(16,185,129,0.08))';

  return (
    <Modal
      opened={isVisible}
      onClose={handleClose}
      size="md"
      centered
      radius="lg"
      closeOnEscape={false}
      aria-label={`Session - ${product.name}`}
      styles={{
        content: { display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' },
        body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
      }}
    >
      {/* Gradient header band */}
      <Box p="lg" pb="sm" style={{ background: headerBg, borderBottom: `1px solid ${isDark ? 'rgba(34,211,238,0.2)' : 'rgba(8,145,178,0.15)'}` }}>
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={800} size="xl" style={{ letterSpacing: -0.5 }}>{t('session', settings.language)}</Text>
            <Text size="sm" c="dimmed" mt={2}>{product.name} · {formatPrecision(amountUsed, settings.decimalPrecision)}g</Text>
          </Box>
          <Box
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 56, minHeight: 56, borderRadius: 16,
              background: isDark ? 'rgba(34,211,238,0.12)' : 'rgba(8,145,178,0.1)',
              border: `1px solid ${isDark ? 'rgba(34,211,238,0.25)' : 'rgba(8,145,178,0.2)'}`,
            }}
          >
            <IconUsers size={26} style={{ color: accent }} />
          </Box>
        </Group>
      </Box>

      <Box p="lg" style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>

        <Stack gap="lg" style={{ overflowY: 'auto', flex: 1, paddingRight: 4, minHeight: 0 }}>
          <ShineBorder borderRadius={14} duration={9} color={['#06b6d4', '#10b981', '#13eeef']} className="w-full">
          <Paper withBorder bg="transparent" p="sm" style={{ background: isDark ? 'rgba(17,24,39,0.6)' : 'rgba(255,255,255,0.7)' }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Group gap="sm">
                  <IconUsers size={20} style={{ color: isDark ? 'var(--mantine-color-cyan-3)' : 'var(--mantine-color-cyan-6)' }} />
                  <Text fw={500}>{people} {people === 1 ? t('person', settings.language) : t('people', settings.language)}</Text>
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">{t('hits', settings.language)}:</Text>
                  <Text fw={700} w={40} ta="center"><NumberTicker value={hitsCount} duration={400} /></Text>
                </Group>
              </Group>

              {rotationEnabled && (
                <>
                  <Group gap={6}>
                    {Array.from({ length: people }, (_, i) => (
                      <Button
                        key={i}
                        size="xs"
                        flex={1}
                        variant={i === currentPerson ? 'filled' : 'default'}
                        color="cyan"
                        onClick={() => setCurrentPerson(i)}
                        styles={{ root: i === currentPerson ? { boxShadow: '0 4px 12px rgba(0,0,0,0.25)', transform: 'scale(1.05)' } : { background: subtleBg } }}
                      >
                        P{i + 1}
                      </Button>
                    ))}
                  </Group>

                  <Group gap={6}>
                    {personHits.map((hits, i) => (
                      <Text
                        key={i}
                        flex={1} size="xs" ta="center" p={4}
                        fw={i === currentPerson ? 700 : 500}
                        c={i === currentPerson ? (isDark ? 'cyan' : 'cyan') : 'dimmed'}
                        style={i === currentPerson ? { background: isDark ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.1)', borderRadius: 6 } : undefined}
                      >
                        {hits}
                      </Text>
                    ))}
                  </Group>

                  <Button color="cyan" onClick={handleHit} leftSection={<IconArrowRight size={16} />}>
                    {t('nextHit', settings.language)} — P{(currentPerson % people) + 1}
                  </Button>
                </>
              )}

              {!rotationEnabled && (
                <Group justify="center" gap="sm">
                  <ActionIcon size="md" radius="md" variant={isDark ? 'default' : 'light'} onClick={() => setHitsCount(Math.max(0, hitsCount - 1))} aria-label={t('decrementHits', settings.language)}>−</ActionIcon>
                  <ActionIcon size="md" radius="md" color="cyan" variant="filled" onClick={() => setHitsCount(hitsCount + 1)} aria-label={t('incrementHits', settings.language)}>+</ActionIcon>
                </Group>
              )}
            </Stack>
          </Paper>
          </ShineBorder>

          <Paper withBorder bg="transparent" p={0}>
            <Group justify="space-between" p="md" onClick={() => setShowCalculator(!showCalculator)} style={{ cursor: 'pointer' }}>
              <Group gap="sm">
                <IconCalculator size={20} style={{ color: isDark ? 'var(--mantine-color-green-8)' : 'var(--mantine-color-green-6)' }} />
                <Text fw={500}>{t('bowlCalculator', settings.language)}</Text>
              </Group>
              <Text fw={700} c="green">{bowlsPerPerson.toFixed(1)} {t('bowlsPerPerson', settings.language)}</Text>
            </Group>

            {showCalculator && (
              <Box p="md" pt="sm">
                <Divider mb="sm" />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('gramsPerBowl', settings.language)}</Text>
                  <NumberInput
                    w={80}
                    min={0.01} max={5} step={0.05} decimalScale={2}
                    value={gramsPerBowl}
                    onChange={(v) => setGramsPerBowl(Math.max(0.01, typeof v === 'number' ? v : parseFloat(v) || 0.01))}
                    size="xs"
                    styles={{ input: { textAlign: 'center', fontWeight: 500 } }}
                  />
                </Group>

                <Paper bg={subtleBg} p="sm" mt="sm">
                  <Stack gap={6}>
                    <Group justify="space-between"><Text size="sm" c="dimmed">{t('totalAmount', settings.language)}:</Text><Text size="sm" fw={700}>{formatPrecision(amountUsed, settings.decimalPrecision)}g</Text></Group>
                    <Group justify="space-between"><Text size="sm" c="dimmed">{t('people', settings.language)}:</Text><Text size="sm" fw={700}>{people}</Text></Group>
                    <Divider />
                    <Group justify="space-between"><Text size="sm" c="dimmed">{t('gramsPerPerson', settings.language)}:</Text><Text size="sm" fw={700} c="cyan">{formatPrecision(gramsPerPerson, settings.decimalPrecision)}g</Text></Group>
                    <Group justify="space-between"><Text size="sm" c="dimmed">{t('totalBowls', settings.language)}:</Text><Text size="sm" fw={700}>{(amountUsed / gramsPerBowl).toFixed(1)}</Text></Group>
                    <Divider />
                    <Group justify="space-between"><Text size="sm" fw={500}>{t('bowlsPerPerson', settings.language)}:</Text><Text size="xl" fw={700} c="green">{bowlsPerPerson.toFixed(1)}</Text></Group>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Paper>

          <Paper withBorder bg="transparent" p="md">
            <Group justify="space-between" mb="sm">
              <Group gap="sm">
                <IconClock size={20} style={{ color: isDark ? 'var(--mantine-color-yellow-3)' : 'var(--mantine-color-yellow-6)' }} />
                <Text fw={500}>{t('hitTimer', settings.language)}</Text>
              </Group>
              <Group gap="xs">
                {!isTimerRunning && (
                  <Group gap={4} mr="sm">
                    <ActionIcon size="sm" variant={isDark ? 'default' : 'light'} onClick={() => { const next = Math.max(1, customTimerDuration - 5); setCustomTimerDuration(next); }}>−</ActionIcon>
                    <NumberInput
                      w={56}
                      min={1} max={999}
                      value={customTimerDuration}
                      onChange={(v) => { const val = typeof v === 'number' ? v : parseInt(v, 10) || 1; setCustomTimerDuration(val); }}
                      size="xs"
                      styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
                    />
                    <Text size="xs" c="dimmed">s</Text>
                    <ActionIcon size="sm" variant={isDark ? 'default' : 'light'} onClick={() => { const next = customTimerDuration + 5; setCustomTimerDuration(next); }}>+</ActionIcon>
                  </Group>
                )}
                <Text fw={700} size="xl" ff="monospace" c={timerSeconds <= 3 ? 'red' : undefined}>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  {settings.showTimerMs && <Text component="span" size="sm" opacity={0.6}>.{Math.floor(timerMs / 100).toString().padStart(1, '0')}</Text>}
                </Text>
              </Group>
            </Group>

            <Group gap="sm">
              {!isTimerRunning ? (
                <Button flex={1} variant="light" color="green" onClick={startTimer} leftSection={<IconPlayerPlay size={16} />}>{t('start', settings.language)}</Button>
              ) : (
                <Button flex={1} variant="light" color="yellow" onClick={pauseTimer} leftSection={<IconPlayerPause size={16} />}>{t('pause', settings.language)}</Button>
              )}
              <ActionIcon size="lg" radius="md" variant={isDark ? 'default' : 'light'} onClick={resetTimer}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>
          </Paper>

          <Box>
            <Text fw={500} size="sm" mb="xs">{t('sessionNotes', settings.language)}</Text>
            <Textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.currentTarget.value)}
              placeholder={t('sessionNotesPlaceholder', settings.language)}
              minRows={2}
            />
          </Box>
        </Stack>

        <Divider my="lg" />

        <Group gap="sm">
          <Button flex={1} size="md" variant="default" onClick={handleClose} aria-label={t('cancel', settings.language)} styles={{ root: { color: dimColor } }}>{t('cancel', settings.language)}</Button>
          <Button flex={1} size="md" color="cyan" onClick={handleFinishSession} aria-label={t('finishSession', settings.language)}>{t('finishSession', settings.language)}</Button>
        </Group>
      </Box>
    </Modal>
  );
}