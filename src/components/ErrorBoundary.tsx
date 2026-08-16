import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { t } from '../utils/translations';

interface Props {
  children: ReactNode;
  isDark?: boolean;
  lang?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const isDark = this.props.isDark ?? true;
      const lang = this.props.lang ?? 'en';
      return (
        <Paper
          withBorder
          maw={512}
          mx="auto"
          mt="md"
          p="lg"
          radius="md"
          style={{
            background: isDark ? 'rgba(24, 24, 32, 0.5)' : '#fff',
            borderColor: isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)',
          }}
        >
          <Stack align="center" gap="xs">
            <Group
              justify="center"
              w={48}
              h={48}
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                background: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)',
              }}
            >
              <svg className="w-6 h-6" style={{ color: 'var(--mantine-color-red-4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </Group>
            <Text size="sm" fw={500} c={isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-dark-8)'}>
              {t('unexpectedError', lang)}
            </Text>
            <Text size="xs" c={isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-4)'}>
              {this.state.error?.message || ''}
            </Text>
            <Button
              mt="xs"
              variant="gradient"
              gradient={{ from: 'cyan.7', to: 'emerald.7' }}
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              {t('tryAgain', lang)}
            </Button>
          </Stack>
        </Paper>
      );
    }
    return this.props.children;
  }
}