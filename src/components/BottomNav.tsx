import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MobileSheet } from './MobileSheet';
import { Box, Group, Text, UnstyledButton, Stack } from '@mantine/core';
import {
  IconHome,
  IconUsers,
  IconShoppingCart,
  IconBell,
  IconUser,
  IconHistory,
  IconMessageCircle,
  IconSearch,
  IconLayoutDashboard,
  IconSettings,
  IconDots,
} from '@tabler/icons-react';

type PrimaryTabId = 'stash' | 'community' | 'marketplace' | 'notifications' | 'profile';
type SecondaryTabId = 'history' | 'messages' | 'explore' | 'dashboard' | 'admin';

const primaryTabs: { id: PrimaryTabId; label: string; icon: typeof IconHome }[] = [
  { id: 'stash', label: 'Stash', icon: IconHome },
  { id: 'community', label: 'Community', icon: IconUsers },
  { id: 'marketplace', label: 'Market', icon: IconShoppingCart },
  { id: 'notifications', label: 'Alerts', icon: IconBell },
  { id: 'profile', label: 'Profile', icon: IconUser },
];

const secondaryTabs: { id: SecondaryTabId; label: string; icon: typeof IconHome; requiresAuth?: boolean }[] = [
  { id: 'history', label: 'History', icon: IconHistory, requiresAuth: true },
  { id: 'messages', label: 'Messages', icon: IconMessageCircle, requiresAuth: true },
  { id: 'explore', label: 'Explore', icon: IconSearch },
  { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard, requiresAuth: true },
  { id: 'admin', label: 'Admin', icon: IconSettings, requiresAuth: true },
];

interface BottomNavProps {
  isDark: boolean;
}

export function BottomNav({ isDark }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeTab = new URLSearchParams(location.search).get('tab') as PrimaryTabId | null;

  const handleTabClick = (tabId: PrimaryTabId | SecondaryTabId) => {
    if (tabId === 'profile') {
      navigate('/?tab=community');
      return;
    }
    if (tabId === 'dashboard') {
      navigate('/?tab=dashboard');
      return;
    }
    if (tabId === 'admin') {
      navigate('/?tab=admin');
      return;
    }
    if (tabId === 'history') {
      navigate('/?tab=history');
      return;
    }
    if (tabId === 'messages') {
      // Messages handled by MessagePopup
      navigate('/?tab=community');
      return;
    }
    if (tabId === 'explore') {
      navigate('/?tab=community');
      return;
    }
    navigate(`/?tab=${tabId}`);
    setMoreOpen(false);
  };

  const inactiveColor = isDark ? 'var(--mantine-color-gray-6)' : 'var(--mantine-color-gray-6)';

  return (
    <>
      <Box
        hiddenFrom="lg"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'var(--mantine-color-gray-2)'}`,
        }}
      >
        <Group justify="space-around" h={64} px="sm" align="center" wrap="nowrap">
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <UnstyledButton
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 12 }}
              >
                <Icon size={24} stroke={1.5} style={{ color: isActive ? 'var(--mantine-color-cyan-5)' : inactiveColor }} />
                <Text size="xs" style={{ color: isActive ? 'var(--mantine-color-cyan-5)' : inactiveColor }}>{tab.label}</Text>
              </UnstyledButton>
            );
          })}
          <UnstyledButton
            onClick={() => setMoreOpen(true)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 12 }}
          >
            <IconDots size={24} stroke={1.5} style={{ color: inactiveColor }} />
            <Text size="xs" style={{ color: inactiveColor }}>More</Text>
          </UnstyledButton>
        </Group>
      </Box>

      <MobileSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        isDark={isDark}
      >
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed" px="xs">Other</Text>
          {secondaryTabs
            .filter(tab => {
              if (tab.requiresAuth && !user) return false;
              if (tab.id === 'admin' && !isAdmin) return false;
              return true;
            })
            .map(tab => {
              const Icon = tab.icon;
              return (
                <UnstyledButton
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    textAlign: 'left',
                    color: isDark ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-gray-7)',
                    background: isDark ? 'var(--mantine-color-dark-8)' : 'transparent',
                    ':hover': { background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' },
                  } as any}
                >
                  <Icon size={24} stroke={1.5} style={{ display: 'block' }} />
                  <Text fw={500}>{tab.label}</Text>
                </UnstyledButton>
              );
            })}
        </Stack>
      </MobileSheet>
    </>
  );
}