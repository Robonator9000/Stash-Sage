import { useState, useRef, useEffect } from 'react';
import { t } from '../utils/translations';
import { hashPin, generateId, rateLimit } from '../utils/helpers';
import { useSettings } from '../utils/useSettings';
import { Modal, Stack, Text, TextInput, Button, Box } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

interface PinModalProps {
  pinHash: string;
  onSuccess: () => void;
  isDark?: boolean;
  language: string;
}

export function PinModal({ pinHash, onSuccess, isDark = true, language }: PinModalProps) {
  const [pinValue, setPinValue] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    inputRef.current?.focus();
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (isVerifying) return;
    if (!rateLimit('pin-attempt', 5, 15_000)) {
      setError(t('tooManyAttempts', language));
      setPinValue('');
      return;
    }
    setIsVerifying(true);
    try {
      const salted = await hashPin(pinValue, settings.pinSalt || undefined);
      let ok = salted === pinHash;
      let legacy = false;
      if (!ok && !settings.pinSalt) {
        // Pins armed before salting stored an unsalted digest; validate then upgrade.
        if (await hashPin(pinValue) === pinHash) { ok = true; legacy = true; }
      }
      if (ok) {
        if (legacy) {
          const salt = generateId();
          updateSettings({ pinSalt: salt, pinHash: await hashPin(pinValue, salt) });
        }
        onSuccess();
      } else {
        setError(t('pinMismatch', language));
        setPinValue('');
      }
    } catch {
      setError(t('pinMismatch', language));
      setPinValue('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      opened={isVisible}
      onClose={() => {}}
      size="sm"
      centered
      radius="lg"
      closeOnEscape={false}
      closeOnClickOutside={false}
      withCloseButton={false}
    >
      <Stack align="center" gap="sm" mt="md">
        <Box
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--mantine-radius-md)',
            background: isDark ? 'var(--mantine-color-cyan-9)' : 'var(--mantine-color-cyan-0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconLock size={32} color={isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)'} />
        </Box>
        <Text fw={700} size="xl" c={isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)'}>
          {t('pinPrompt', language)}
        </Text>
      </Stack>

      <TextInput
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={pinValue}
        onChange={(e) => {
          setPinValue(e.currentTarget.value.replace(/\D/g, '').slice(0, 6));
          setError('');
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="\u2022 \u2022 \u2022 \u2022 \u2022 \u2022"
        aria-label={t('enterPin', language)}
        mt="md"
        styles={{ input: { textAlign: 'center', fontSize: 24, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.5em' } }}
      />

      {error && (
        <Text size="sm" fw={500} ta="center" mt="md" c={isDark ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-red-6)'}>
          {error}
        </Text>
      )}

      <Button
        onClick={handleSubmit}
        disabled={pinValue.length < 4 || isVerifying}
        aria-label={t('unlock', language)}
        fullWidth
        mt="md"
        mb="sm"
        loading={isVerifying}
        styles={{
          root: {
            background: pinValue.length >= 4 && !isVerifying
              ? 'linear-gradient(to right, var(--mantine-color-cyan-7), var(--mantine-color-emerald-7))'
              : isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-2)',
            color: pinValue.length >= 4 && !isVerifying ? 'var(--mantine-color-white)' : isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-4)',
            cursor: pinValue.length >= 4 && !isVerifying ? 'pointer' : 'not-allowed',
          },
        }}
      >
        {isVerifying ? '...' : t('unlock', language)}
      </Button>
    </Modal>
  );
}
