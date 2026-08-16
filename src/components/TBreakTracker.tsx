import { useState, useEffect, useMemo } from 'react';
import { Paper, Text, Group, Stack, Progress, Button, RingProgress, Center } from '@mantine/core';
import { IconTrophy, IconFlame, IconTarget, IconX } from '@tabler/icons-react';
import { Product, Session } from '../types';

const TBREAK_KEY = 'weed-tbreak';

interface TBreakState {
  goalDays: number;
  startDate: string;
  active: boolean;
}

const MILESTONES: Record<number, string> = {
  1: 'First day done. THC is already clearing from your system.',
  3: '72 hours in. The hardest part is often right here.',
  7: 'One week clean! Sleep is starting to normalize.',
  14: 'Two weeks. Your receptors are resetting.',
  21: 'Three weeks. Habit patterns are breaking.',
  30: 'One month! Tolerance is significantly reduced.',
  60: 'Two months. You\'ve built real momentum.',
  90: '90 days. A full reset. Be proud of this.',
};

function loadTBreak(): TBreakState | null {
  try {
    const raw = localStorage.getItem(TBREAK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTBreak(state: TBreakState | null) {
  if (state) {
    localStorage.setItem(TBREAK_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(TBREAK_KEY);
  }
}

interface TBreakTrackerProps {
  products: Product[];
  sessions: Session[];
  isDark: boolean;
}

export function TBreakTracker({ products, sessions, isDark }: TBreakTrackerProps) {
  const [tbreak, setTbreak] = useState<TBreakState | null>(loadTBreak);

  useEffect(() => {
    const handler = () => setTbreak(loadTBreak());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const cleanStreakDays = useMemo(() => {
    const lastDate = products.reduce<Date | null>((latest, p) => {
      if (!p.lastConsumed) return latest;
      const d = new Date(p.lastConsumed);
      return !latest || d.getTime() > latest.getTime() ? d : latest;
    }, null);
    if (!lastDate) return null;
    return Math.floor((Date.now() - lastDate.getTime()) / 86400000);
  }, [products]);

  const lastSessionDate = useMemo(() => {
    if (sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
  }, [sessions]);

  const streakDays = cleanStreakDays ?? (lastSessionDate ? Math.floor((Date.now() - lastSessionDate.getTime()) / 86400000) : 0);

  const startTBreak = (goalDays: number) => {
    const state: TBreakState = { goalDays, startDate: new Date().toISOString(), active: true };
    saveTBreak(state);
    setTbreak(state);
  };

  const cancelTBreak = () => {
    saveTBreak(null);
    setTbreak(null);
  };

  const progress = tbreak ? Math.min(100, (streakDays / tbreak.goalDays) * 100) : 0;
  const isComplete = tbreak ? streakDays >= tbreak.goalDays : false;

  const nearestMilestone = useMemo(() => {
    const passed = Object.keys(MILESTONES).map(Number).filter(d => streakDays >= d);
    const next = Object.keys(MILESTONES).map(Number).filter(d => streakDays < d);
    return {
      currentMsg: passed.length > 0 ? MILESTONES[passed[passed.length - 1]] : null,
      nextDay: next.length > 0 ? next[0] : null,
      nextMsg: next.length > 0 ? MILESTONES[next[0]] : null,
    };
  }, [streakDays]);

  const bg = isDark ? 'rgba(10, 17, 32, 0.8)' : '#fff';
  const border = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-3)';

  if (!tbreak) {
    return (
      <Paper radius="lg" p="lg" withBorder h="100%" style={{ background: bg, borderColor: border }}>
        <Group align="flex-start" gap="md">
          <RingProgress
            size={64}
            thickness={6}
            sections={[{ value: Math.min(100, streakDays > 0 ? 100 : 0), color: streakDays > 0 ? '#10b981' : '#64748b' }]}
            label={
              <Center>
                <Text size="sm" fw={800} c={streakDays > 0 ? '#10b981' : 'gray'}>{streakDays}</Text>
              </Center>
            }
          />
          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap={6}>
              <IconFlame size={18} color="#10b981" />
              <Text size="sm" fw={700}>Clean Streak: {streakDays} {streakDays === 1 ? 'day' : 'days'}</Text>
            </Group>
            <Text size="xs" c="dimmed">
              {streakDays === 0
                ? 'Log a day without consuming to start building your streak.'
                : nearestMilestone.currentMsg ?? `Keep going — next milestone at ${nearestMilestone.nextDay} days.`}
            </Text>
          </Stack>
        </Group>
        <Text size="xs" fw={600} c="dimmed" mt="sm" mb={6}>
          <Group gap={4}><IconTarget size={14} /> Start a Tolerance Break</Group>
        </Text>
        <Group gap="xs" wrap="wrap">
          {[
            { label: '7 days', value: 7, desc: 'Quick reset' },
            { label: '14 days', value: 14, desc: 'Moderate' },
            { label: '21 days', value: 21, desc: 'Deep reset' },
            { label: '30 days', value: 30, desc: 'Full reset' },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant="light"
              size="xs"
              radius="md"
              color="emerald"
              onClick={() => startTBreak(opt.value)}
              styles={{ root: { flexDirection: 'column', height: 'auto', padding: '6px 12px' } }}
            >
              <Text size="xs" fw={700}>{opt.label}</Text>
              <Text size="10px" opacity={0.7}>{opt.desc}</Text>
            </Button>
          ))}
        </Group>
      </Paper>
    );
  }

  return (
    <Paper radius="lg" p="lg" withBorder h="100%" style={{      background: isDark ? 'rgba(10, 17, 32, 0.8)' : '#fff',
      borderColor: isComplete ? '#10b981' : border,
      boxShadow: isComplete ? '0 0 20px rgba(16, 185, 129, 0.15)' : undefined,
    }}>
      <Group justify="space-between" align="flex-start" mb="sm">
        <Group gap={6}>
          <IconTrophy size={18} color={isComplete ? '#10b981' : '#f59e0b'} />
          <Text size="sm" fw={700}>
            {isComplete ? 'T-Break Complete!' : `T-Break: Day ${streakDays} / ${tbreak.goalDays}`}
          </Text>
        </Group>
        <Button variant="subtle" size="compact-xs" color="gray" leftSection={<IconX size={14} />} onClick={cancelTBreak}>
          End
        </Button>
      </Group>

      <Group align="center" gap="md">
        <RingProgress
          size={80}
          thickness={7}
          roundCaps
          sections={[{ value: progress, color: isComplete ? '#10b981' : '#06b6d4' }]}
          label={
            <Center>
              <Stack gap={0} align="center">
                <Text size="xl" fw={900} c={isComplete ? '#10b981' : '#06b6d4'}>{streakDays}</Text>
                <Text size="10px" c="dimmed">/ {tbreak.goalDays}d</Text>
              </Stack>
            </Center>
          }
        />
        <Stack gap={2} style={{ flex: 1 }}>
          {isComplete ? (
            <>
              <Text size="sm" fw={600} c="#10b981">Goal reached — your tolerance has reset.</Text>
              <Text size="xs" c="dimmed">If you resume, start low and go slow.</Text>
            </>
          ) : (
            <>
              <Text size="xs" c="dimmed">
                {tbreak.goalDays - streakDays} {tbreak.goalDays - streakDays === 1 ? 'day' : 'days'} to go
              </Text>
              {nearestMilestone.currentMsg && (
                <Text size="xs" fw={500} c={isDark ? '#94a3b8' : '#475569'}>{nearestMilestone.currentMsg}</Text>
              )}
              {nearestMilestone.nextMsg && nearestMilestone.nextDay && (
                <Text size="xs" c="dimmed">Next at day {nearestMilestone.nextDay}: {nearestMilestone.nextMsg}</Text>
              )}
            </>
          )}
        </Stack>
      </Group>

      <Progress
        value={progress}
        size="sm"
        radius="xl"
        mt="sm"
        color={isComplete ? 'emerald' : 'cyan'}
        striped={!isComplete}
      />
    </Paper>
  );
}
