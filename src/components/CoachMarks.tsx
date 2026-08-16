import { useState, useEffect, useCallback } from 'react';
import { t } from '../utils/translations';
import { Card, Text, Button, Group, Box, Badge } from '@mantine/core';
import { IconPlus, IconChartBar, IconSearch, IconSettings } from '@tabler/icons-react';

interface CoachMarksProps {
  language: string;
  isDark: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

interface CoachStep {
  icon: typeof IconPlus;
  titleKey: string;
  descKey: string;
  targets: string[];
}

const STEPS: CoachStep[] = [
  { icon: IconPlus, titleKey: 'coachAddTitle', descKey: 'coachAddDesc', targets: ['[data-coach="add-btn"]', '[data-coach="add-empty"]'] },
  { icon: IconChartBar, titleKey: 'coachStatsTitle', descKey: 'coachStatsDesc', targets: ['[data-coach="stats"]'] },
  { icon: IconSearch, titleKey: 'coachSearchTitle', descKey: 'coachSearchDesc', targets: ['[data-coach="search"]', '[data-coach="search-mobile"]'] },
  { icon: IconSettings, titleKey: 'coachSettingsTitle', descKey: 'coachSettingsDesc', targets: ['[data-coach="settings"]', '[data-coach="settings-mobile"]'] },
];

const CARD_W = 304;
const CARD_H = 212;
const GAP = 12;

interface Placement {
  top: number;
  left: number;
  arrowLeft: number;
  below: boolean;
  bottomSheet: boolean;
  highlight: DOMRect | null;
}

export function CoachMarks({ language, isDark, onComplete, onSkip, onOpenSettings, onCloseSettings }: CoachMarksProps) {
  const [step, setStep] = useState(0);
  const [placement, setPlacement] = useState<Placement>({
    top: 80,
    left: 16,
    arrowLeft: CARD_W / 2,
    below: true,
    bottomSheet: typeof window !== 'undefined' && window.innerWidth < 640,
    highlight: null,
  });

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const updatePosition = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < 640) {
      setPlacement({ top: Math.max(16, vh - 170), left: 12, arrowLeft: CARD_W / 2, below: false, bottomSheet: true, highlight: null });
      return;
    }

    let el: HTMLElement | null = null;
    let rect: DOMRect | undefined;
    for (const sel of current.targets) {
      const candidate = document.querySelector(sel) as HTMLElement | null;
      const r = candidate?.getBoundingClientRect();
      const visible = !!r && r.width > 0 && r.height > 0 && (candidate!.offsetParent !== null || candidate!.getClientRects().length > 0);
      if (visible) {
        el = candidate;
        rect = r;
        break;
      }
    }

    if (!el || !rect) {
      setPlacement({ top: Math.max(16, (vh - CARD_H) / 2), left: Math.max(16, (vw - CARD_W) / 2), arrowLeft: CARD_W / 2, below: true, bottomSheet: false, highlight: null });
      return;
    }

    const r = rect;
    const below = vh - r.bottom - GAP >= CARD_H || r.top - GAP < CARD_H;
    const top = below ? r.bottom + GAP : Math.max(12, r.top - CARD_H - GAP);
    const left = Math.max(12, Math.min(r.left + r.width / 2 - CARD_W / 2, vw - CARD_W - 12));
    const arrowLeft = Math.max(26, Math.min(r.left + r.width / 2 - left, CARD_W - 26));

    setPlacement({ top, left, arrowLeft, below, bottomSheet: false, highlight: r });
  }, [current.targets]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  useEffect(() => {
    if (step === 3) onOpenSettings();
    if (step < 3) onCloseSettings();
  }, [step, onOpenSettings, onCloseSettings]);

  const handleNext = () => {
    if (isLast) onComplete();
    else setStep(step + 1);
  };

  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const cardBg = isDark ? 'var(--mantine-color-dark-8)' : '#fff';

  const arrowOuter = {
    left: placement.arrowLeft - 7,
    width: 0,
    height: 0,
    borderLeft: '7px solid transparent',
    borderRight: '7px solid transparent',
    ...(placement.below
      ? { top: -13, borderBottom: '13px solid', borderBottomColor: borderColor }
      : { bottom: -13, borderTop: '13px solid', borderTopColor: borderColor }),
  };

  const arrowInner = {
    left: placement.arrowLeft - 6,
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    ...(placement.below
      ? { top: -11, borderBottom: '11px solid', borderBottomColor: cardBg }
      : { bottom: -11, borderTop: '11px solid', borderTopColor: cardBg }),
  };

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {placement.highlight && !placement.bottomSheet && (
        <Box
          style={{
            position: 'fixed',
            top: placement.highlight.top - 4,
            left: placement.highlight.left - 4,
            width: placement.highlight.width + 8,
            height: placement.highlight.height + 8,
            borderRadius: 10,
            border: '2px solid var(--mantine-color-cyan-6)',
            boxShadow: '0 0 0 4px rgba(6,182,212,0.25)',
            zIndex: 151,
            transition: 'top 0.25s, left 0.25s, width 0.25s, height 0.25s',
          }}
        />
      )}

      <Card
        radius="lg"
        p="md"
        withBorder
        className="pointer-events-auto"
        style={{
          position: 'fixed',
          top: placement.top,
          left: placement.left,
          width: placement.bottomSheet ? `min(${CARD_W}px, calc(100vw - 24px))` : CARD_W,
          maxWidth: `calc(100vw - 24px)`,
          zIndex: 152,
          background: cardBg,
          border: `2px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        {!placement.bottomSheet && (
          <>
            <Box style={{ position: 'absolute', ...arrowOuter }} />
            <Box style={{ position: 'absolute', ...arrowInner }} />
          </>
        )}

        <Group justify="space-between" mb="xs">
          <Badge variant="light" color="cyan" radius="xl" size="sm">
            {step + 1} / {STEPS.length}
          </Badge>
          <Text size="xs" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
            {t('skip', language)}
          </Text>
        </Group>

        <Group align="flex-start" gap="md" wrap="nowrap">
          <Card
            w={40}
            h={40}
            p={0}
            radius="md"
            bg={isDark ? 'var(--mantine-color-cyan-9)' : 'var(--mantine-color-cyan-0)'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Icon size={20} color={isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)'} />
          </Card>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="sm" c={isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)'}>
              {t(current.titleKey, language)}
            </Text>
            <Text size="xs" mt={4} c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} style={{ lineHeight: 1.6 }}>
              {t(current.descKey, language)}
            </Text>
          </Box>
        </Group>

        <Group justify="center" gap={6} my="md">
          {STEPS.map((_, idx) => (
            <Box
              key={idx}
              style={{
                width: idx === step ? 16 : 6,
                height: 6,
                borderRadius: '50%',
                transition: 'width 0.2s',
                background: idx === step ? 'var(--mantine-color-cyan-6)' : isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-3)',
              }}
            />
          ))}
        </Group>

        <Group gap="sm">
          <Button
            variant="subtle"
            size="compact-sm"
            c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'}
            styles={{ root: { '&:hover': { background: isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)', color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' } } }}
            onClick={onSkip}
          >
            {t('skip', language)}
          </Button>
          <Box style={{ flex: 1 }} />
          <Button
            size="compact-sm"
            variant="gradient"
            gradient={{ from: 'cyan.7', to: 'emerald.7' }}
            onClick={handleNext}
          >
            {isLast ? t('done', language) : t('next', language)}
          </Button>
        </Group>
      </Card>
    </div>
  );
}
