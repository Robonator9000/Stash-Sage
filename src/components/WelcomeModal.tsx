import { useState } from 'react';
import { LogoIcon } from './LogoIcon';
import { Box, Stack, Text, Button } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

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

  const surfaceBg = isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-white)';
  const borderColor = isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-gray-3)';
  const primaryColor = 'var(--mantine-color-cyan-6)';
  const secondaryColor = 'var(--mantine-color-emerald-5)';

  return (
    <Box style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${primaryColor} 10%, transparent 50%, ${secondaryColor} 90%)`,
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      />

      <Box
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 512,
          borderRadius: 'var(--mantine-radius-lg)',
          padding: 24,
          background: surfaceBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <Stack align="center" gap="xl" mb="lg">
          <Box style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--mantine-radius-md)', border: `1px solid ${borderColor}` }}>
            <Box style={{ position: 'absolute', inset: 0, borderRadius: 'calc(var(--mantine-radius-md) - 1px)', background: `linear-gradient(135deg, ${primaryColor} 20%, ${secondaryColor} 20%)`, opacity: 0.2 }} />
            <Box style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box style={{ width: 48, height: 48 }}>
                <LogoIcon className="w-12 h-12" />
              </Box>
            </Box>
          </Box>
          <Stack align="center" gap={6}>
            <Text
              fw={800}
              style={{ fontFamily: 'inherit', fontSize: 30, letterSpacing: '-0.025em', background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              STASH TRACKER
            </Text>
            <Text size="sm" c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} ta="center">
              Keep track of your collection, log your sessions, and connect with the community
            </Text>
          </Stack>
        </Stack>

        <Stack gap="md" mb="lg">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            const borderClr = isSelected
              ? isDark ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-cyan-5)'
              : isDark ? 'transparent' : 'transparent';
            const bgClr = isSelected
              ? isDark ? 'var(--mantine-color-cyan-9)' : 'var(--mantine-color-cyan-0)'
              : isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-gray-0)';
            const textColor = isSelected
              ? isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-8)'
              : isDark ? 'var(--mantine-color-slate-2)' : 'var(--mantine-color-gray-8)';
            return (
              <Box
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  width: '100%',
                  padding: 16,
                  borderRadius: 'var(--mantine-radius-md)',
                  cursor: 'pointer',
                  background: bgClr,
                  border: `2px solid ${borderClr}`,
                  transition: 'background 0.2s, border 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = isDark ? 'var(--mantine-color-slate-8)' : 'var(--mantine-color-gray-1)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = isDark ? 'var(--mantine-color-slate-9)' : 'var(--mantine-color-gray-0)';
                }}
              >
                <Text style={{ fontSize: 30 }}>{lang.flag}</Text>
                <Box>
                  <Text fw={600} size="sm" c={textColor}>{NATIVE_NAMES[lang.code]}</Text>
                  <Text size="xs" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'} mt={2}>
                    {LANGUAGE_NAMES[browserLang]?.[lang.code] || LANGUAGE_NAMES.en[lang.code]}
                  </Text>
                </Box>
                {isSelected && (
                  <Box ml="auto" style={{ width: 24, height: 24, borderRadius: '50%', background: isDark ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-cyan-5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconCheck size={14} color="var(--mantine-color-white)" />
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>

        <Button
          fullWidth
          size="lg"
          radius="md"
          onClick={() => onComplete(selected)}
          styles={{
            root: {
              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
              '&:active': { transform: 'scale(0.97)' },
            },
          }}
        >
          Get Started
        </Button>

        <Text ta="center" size="xs" mt="md" c={isDark ? 'var(--mantine-color-slate-5)' : 'var(--mantine-color-gray-5)'}>
          You can change language anytime in Settings &middot; No account required
        </Text>
      </Box>
    </Box>
  );
}
