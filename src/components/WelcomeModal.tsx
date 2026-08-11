import { useState } from 'react';
import { LogoIcon } from './LogoIcon';
import { t } from '../utils/translations';
import { Card, Stack, Text, Button, Group, UnstyledButton, ThemeIcon } from '@mantine/core';
import { IconCheck, IconGlobe, IconSparkles } from '@tabler/icons-react';

interface WelcomeModalProps {
  onComplete: (language: 'en' | 'es' | 'fr' | 'de' | 'pt') => void;
  isDark: boolean;
  browserLang: string;
}

const LANGUAGES: { code: 'en' | 'es' | 'fr' | 'de' | 'pt'; flag: string }[] = [
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'pt', flag: '\u{1F1E7}\u{1F1F7}' },
];

const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese' },
  es: { en: 'Ingl\u00e9s', es: 'Espa\u00f1ol', fr: 'Franc\u00e9s', de: 'Alem\u00e1n', pt: 'Portugu\u00e9s' },
  fr: { en: 'Anglais', es: 'Espagnol', fr: 'Fran\u00e7ais', de: 'Allemand', pt: 'Portugais' },
  de: { en: 'Englisch', es: 'Spanisch', fr: 'Franz\u00f6sisch', de: 'Deutsch', pt: 'Portugiesisch' },
  pt: { en: 'Ingl\u00eas', es: 'Espanhol', fr: 'Franc\u00eas', de: 'Alem\u00e3o', pt: 'Portugu\u00eas' },
};

const NATIVE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Espa\u00f1ol',
  fr: 'Fran\u00e7ais',
  de: 'Deutsch',
  pt: 'Portugu\u00eas',
};

export function WelcomeModal({ onComplete, isDark, browserLang }: WelcomeModalProps) {
  const [selected, setSelected] = useState<'en' | 'es' | 'fr' | 'de' | 'pt'>('en');

  const borderColor = isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-3)';
  const cardBg = isDark ? 'var(--mantine-color-slate-8)' : '#fff';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, var(--mantine-color-cyan-6) 10%, transparent 50%, var(--mantine-color-emerald-5) 90%)',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />

      <Card
        radius="lg"
        p="xl"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 512,
          background: cardBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <Stack align="center" gap="lg" mb="xl">
          <LogoBadge borderColor={borderColor} />
          <Stack align="center" gap={6}>
            <Text
              fw={800}
              style={{
                fontSize: 30,
                letterSpacing: '-0.025em',
                background: 'linear-gradient(to right, var(--mantine-color-cyan-6), var(--mantine-color-emerald-5))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              STASH SAGE
            </Text>
            <Text size="sm" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} ta="center" maw={420}>
              {t('welcomeTagline', selected)}
            </Text>
          </Stack>
        </Stack>

        <Group mb="xs" gap={6}>
          <IconGlobe size={14} color={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'} />
          <Text size="xs" fw={600} tt="uppercase" style={{ letterSpacing: '0.1em' }} c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
            {t('language', selected)}
          </Text>
        </Group>

        <Stack gap="sm" mb="xl">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <UnstyledButton
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                aria-pressed={isSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--mantine-radius-md)',
                  cursor: 'pointer',
                  background: isSelected
                    ? isDark ? 'var(--mantine-color-cyan-9)' : 'var(--mantine-color-cyan-0)'
                    : isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-gray-0)',
                  border: `2px solid ${isSelected
                    ? isDark ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-cyan-5)'
                    : 'transparent'}`,
                  transition: 'background 0.2s, border 0.2s',
                }}
              >
                <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                <LangLabel textColor={isSelected
                  ? isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-8)'
                  : isDark ? 'var(--mantine-color-slate-2)' : 'var(--mantine-color-gray-8)'}
                  native={NATIVE_NAMES[lang.code]}
                  foreign={LANGUAGE_NAMES[browserLang]?.[lang.code] || LANGUAGE_NAMES.en[lang.code]}
                  muted={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}
                />
                {isSelected && (
                  <ThemeIcon
                    size={24}
                    radius="xl"
                    variant="filled"
                    color={isDark ? 'cyan.6' : 'cyan.5'}
                    ml="auto"
                    style={{ flexShrink: 0 }}
                  >
                    <IconCheck size={14} />
                  </ThemeIcon>
                )}
              </UnstyledButton>
            );
          })}
        </Stack>

        <Button
          fullWidth
          size="lg"
          radius="md"
          onClick={() => onComplete(selected)}
          leftSection={<IconSparkles size={18} />}
          styles={{
            root: {
              background: 'linear-gradient(to right, var(--mantine-color-cyan-6), var(--mantine-color-emerald-5))',
              '&:active': { transform: 'scale(0.97)' },
            },
          }}
        >
          {t('getStarted', selected)}
        </Button>

        <Text ta="center" size="xs" mt="md" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
          {t('welcomeFootnote', selected)}
        </Text>
      </Card>
    </div>
  );
}

function LogoBadge({ borderColor }: { borderColor: string }) {
  return (
    <div style={{ position: 'relative', width: 84, height: 84, borderRadius: 'var(--mantine-radius-md)', border: `1px solid ${borderColor}` }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'calc(var(--mantine-radius-md) - 1px)',
          background: 'linear-gradient(135deg, var(--mantine-color-cyan-6) 20%, var(--mantine-color-emerald-5) 20%)',
          opacity: 0.2,
        }}
      />
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LogoIcon className="w-12 h-12" />
      </div>
    </div>
  );
}

function LangLabel({ textColor, native, foreign, muted }: { textColor: string; native: string; foreign: string; muted: string }) {
  return (
    <div>
      <Text fw={600} size="sm" c={textColor}>{native}</Text>
      <Text size="xs" c={muted} mt={2}>{foreign}</Text>
    </div>
  );
}
