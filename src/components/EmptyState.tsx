import { IconPlus } from '@tabler/icons-react';
import { t } from '../utils/translations';
import { useSettings } from '../utils/useSettings';
import { LogoIcon } from './LogoIcon';
import { Stack, Text, Button, Center } from '@mantine/core';

interface EmptyStateProps {
  isDark?: boolean;
  hasProducts: boolean;
  onAddProduct: () => void;
}

export function EmptyState({ isDark = true, hasProducts, onAddProduct }: EmptyStateProps) {
  const { settings } = useSettings();
  const lang = settings.language;

  return (
    <Stack align="center" justify="center" py="xl" px="md" style={{ color: isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)' }}>
      <Center
        w={144}
        h={144}
        mb="md"
        style={{
          borderRadius: '50%',
          background: isDark ? 'rgba(16,185,129,0.1)' : 'var(--mantine-color-emerald-1)',
          border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : 'var(--mantine-color-emerald-2)'}`,
        }}
      >
        <LogoIcon className="w-20 h-20" />
      </Center>

      {!hasProducts ? (
        <>
          <Text fw={700} size="xl" mb={4} c={isDark ? 'var(--mantine-color-dark-0)' : 'var(--mantine-color-gray-9)'}>
            {t('noProductsYet', lang)}
          </Text>
          <Text ta="center" mb="xl" maw={320} c={isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)'}>
            {t('addFirstProductHint', lang)}
          </Text>
          <Button
            onClick={onAddProduct}
            aria-label={t('addProduct', lang)}
            leftSection={<IconPlus size={20} />}
            size="md"
            variant="gradient"
            gradient={{ from: 'cyan.6', to: 'emerald.6', deg: 90 }}
            data-coach="add-empty"
          >
            {t('addProduct', lang)}
          </Button>
        </>
      ) : (
        <>
          <Text fw={700} size="xl" mb={4} c={isDark ? 'var(--mantine-color-dark-0)' : 'var(--mantine-color-gray-9)'}>
            {t('noProductsFound', lang)}
          </Text>
          <Text ta="center" c={isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)'}>
            {t('adjustSearchHint', lang)}
          </Text>
        </>
      )}
    </Stack>
  );
}
