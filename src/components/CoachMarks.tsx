import { useState, useEffect, useCallback } from 'react';
import { t } from '../utils/translations';
import { Paper, Text, Button, Group, Box } from '@mantine/core';
import { IconPlus, IconChartBar, IconSearch, IconSettings } from '@tabler/icons-react';

interface CoachMarksProps {
  language: string;
  isDark: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

const STEPS = [
  { icon: IconPlus, titleKey: 'coachAddTitle', descKey: 'coachAddDesc', target: '[data-coach="add-btn"]', arrowDir: 'top' as const },
  { icon: IconChartBar, titleKey: 'coachStatsTitle', descKey: 'coachStatsDesc', target: '[data-coach="stats"]', arrowDir: 'top' as const },
  { icon: IconSearch, titleKey: 'coachSearchTitle', descKey: 'coachSearchDesc', target: '[data-coach="search"]', arrowDir: 'top' as const },
  { icon: IconSettings, titleKey: 'coachSettingsTitle', descKey: 'coachSettingsDesc', target: '[data-coach="settings"]', arrowDir: 'top' as const },
];

export function CoachMarks({ language, isDark, onComplete, onSkip, onOpenSettings, onCloseSettings }: CoachMarksProps) {
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const updatePosition = useCallback(() => {
    const el = document.querySelector(current.target) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - 144, window.innerWidth - 296)),
      });
    }
  }, [current.target]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  useEffect(() => {
    if (step === 3) {
      onOpenSettings();
    }
    if (step < 3) {
      onCloseSettings();
    }
  }, [step, onOpenSettings, onCloseSettings]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  const borderColor = isDark ? '#334155' : '#e5e7eb';
  const cardBg = isDark ? '#0f172a' : '#ffffff';

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      <Paper
        className="pointer-events-auto"
        w={288}
        p="md"
        radius="lg"
        withBorder
        style={{ position: 'absolute', top: pos.top, left: pos.left, background: cardBg, border: `2px solid ${borderColor}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
      >
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            marginLeft: -6,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid',
            borderBottomColor: borderColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            marginLeft: -6,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid',
            borderBottomColor: cardBg,
          }}
        />

        <Group align="flex-start" gap="md" mb="md">
          <Paper
            w={40}
            h={40}
            radius="md"
            bg={isDark ? 'var(--mantine-color-cyan-9)' : 'var(--mantine-color-cyan-0)'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Icon size={20} color={isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)'} />
          </Paper>
          <Group gap={4} style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
            <Text fw={700} size="sm" c={isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)'} w="100%">
              {t(current.titleKey, language)}
            </Text>
            <Text size="xs" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} style={{ lineHeight: 1.6 }}>
              {t(current.descKey, language)}
            </Text>
          </Group>
        </Group>

        <Group justify="center" gap={6} mb="md">
          {STEPS.map((_, idx) => (
            <Box key={idx} style={{ width: idx === step ? 16 : 6, height: 6, borderRadius: '50%', transition: 'width 0.2s', background: idx === step ? 'var(--mantine-color-cyan-6)' : isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-3)' }} />
          ))}
        </Group>

        <Group gap="sm">
          <Button
            variant="subtle"
            size="compact-sm"
            c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-5)'}
            styles={{ root: { '&:hover': { background: isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)', color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' } } }}
            onClick={handleSkipAll}
          >
            {t('skip', language)}
          </Button>
          <Box style={{ flex: 1 }} />
          <Button
            size="compact-sm"
            styles={{ root: { background: 'linear-gradient(to right, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' } }}
            onClick={handleNext}
          >
            {isLast ? t('done', language) : t('next', language)}
          </Button>
        </Group>
      </Paper>
    </div>
  );
}
