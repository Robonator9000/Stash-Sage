import { useState, useEffect } from 'react';
import { Box, Paper, Text, ActionIcon, Group, Stack } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}

export function MobileSheet({ isOpen, onClose, title, isDark, children }: MobileSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <Box
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          transition: 'opacity 0.2s',
          background: visible ? 'rgba(0,0,0,0.5)' : 'transparent',
        }}
        onClick={onClose}
      />
      <Paper
        radius="0"
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          position: 'relative',
          width: '100%',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          transition: 'transform 0.2s',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          background: isDark ? 'var(--mantine-color-dark-8)' : '#fff',
          borderTop: `1px solid ${isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-2)'}`,
        }}
        role="dialog"
        aria-modal="true"
      >
        <Stack gap={0} style={{ height: '100%', maxHeight: '90vh' }}>
          <Group
            justify="space-between"
            px="md"
            py="sm"
            style={{ borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-2)'}` }}
          >
            <Text fw={600} size="lg" style={{ color: isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-9)' }}>
              {title}
            </Text>
            <ActionIcon
              variant="subtle"
              color={isDark ? 'gray' : 'dark'}
              onClick={onClose}
              radius="xl"
              aria-label="Close"
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>
          <Box p="md" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}