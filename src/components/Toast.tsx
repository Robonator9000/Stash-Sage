import { useEffect, useState, useCallback } from 'react';
import { Stack, Paper, Group, Text, ActionIcon, Button } from '@mantine/core';
import { IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  variant?: 'danger' | 'info';
}

let toastListeners: ((t: ToastMessage) => void)[] = [];

export function showToast(toast: ToastMessage) {
  playBeep();
  toastListeners.forEach((fn) => fn(toast));
}

interface ToastContainerProps {
  isDark?: boolean;
}

export function ToastContainer({ isDark = true }: ToastContainerProps) {
  const [toasts, setToasts] = useState<(ToastMessage & { leaving?: boolean })[]>([]);

  useEffect(() => {
    const handler = (t: ToastMessage) => {
      const id = t.id + '-' + Date.now();
      setToasts((prev) => [...prev, { ...t, id }]);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const last = toasts[toasts.length - 1];
    const timer = setTimeout(() => removeToast(last.id), 5000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  const isInfo = (toast: ToastMessage) => toast.variant === 'info' || (!toast.variant && toast.action);

  return (
    <Stack
      gap="xs"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 200,
        pointerEvents: 'none',
        maxWidth: 448,
      }}
    >
      {toasts.map((toast) => {
        const info = isInfo(toast);
        const containerBg = info
          ? isDark ? 'rgba(30, 41, 59, 0.9)' : '#fff'
          : isDark ? 'rgba(127, 29, 29, 0.9)' : '#fef2f2';
        const containerBorder = info
          ? isDark ? 'rgba(71, 85, 105, 0.5)' : 'var(--mantine-color-gray-2)'
          : isDark ? 'rgba(185, 28, 28, 0.5)' : 'var(--mantine-color-red-2)';
        const titleColor = info
          ? isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)'
          : isDark ? 'var(--mantine-color-red-2)' : 'var(--mantine-color-red-8)';
        const bodyColor = info
          ? isDark ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-gray-6)'
          : isDark ? 'rgba(254,202,202,0.8)' : 'var(--mantine-color-red-6)';
        return (
          <Paper
            key={toast.id}
            radius="md"
            p="sm"
            withBorder
            role="alert"
            style={{
              pointerEvents: 'auto',
              maxWidth: 448,
              borderColor: containerBorder,
              borderWidth: 2,
              background: containerBg,
              backdropFilter: isDark ? 'blur(12px)' : undefined,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              transition: 'opacity 0.3s, transform 0.3s',
              opacity: toast.leaving ? 0 : 1,
              transform: toast.leaving ? 'translateX(16px)' : 'translateX(0)',
            }}
          >
            <Group align="flex-start" gap="xs" wrap="nowrap">
              {info ? (
                <IconInfoCircle size={20} style={{ marginTop: 2, flexShrink: 0, color: isDark ? 'var(--mantine-color-cyan-5)' : 'var(--mantine-color-cyan-6)' }} />
              ) : (
                <IconAlertTriangle size={20} style={{ marginTop: 2, flexShrink: 0, color: isDark ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-red-6)' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <Text size="sm" fw={700} style={{ color: titleColor }}>{toast.title}</Text>
                )}
                <Text size="xs" mt={2} style={{ color: bodyColor }}>{toast.body}</Text>
                {toast.action && (
                  <Button
                    size="compact-xs"
                    variant={isDark ? 'subtle' : 'light'}
                    color="cyan"
                    mt="xs"
                    onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                  >
                    {toast.action.label}
                  </Button>
                )}
              </div>
              <ActionIcon
                variant="subtle"
                radius="md"
                color={info ? (isDark ? 'gray' : 'gray') : 'red'}
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                style={{ flexShrink: 0 }}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}