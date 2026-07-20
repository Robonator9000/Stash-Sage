import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Stack,
  NavLink,
  Text,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Collapse,
  Box,
} from '@mantine/core';
import {
  IconHome,
  IconUsers,
  IconShoppingCart,
  IconHistory,
  IconBell,
  IconBookmark,
  IconUser,
  IconLayoutDashboard,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';

type TabId =
  | 'stash'
  | 'community'
  | 'marketplace'
  | 'history'
  | 'notifications'
  | 'bookmarks'
  | 'profile'
  | 'dashboard'
  | 'settings';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  section: 'primary' | 'secondary' | 'utility';
  badge?: number;
  requiresAuth?: boolean;
}

interface LeftSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDark: boolean;
  onSettings: () => void;
  currentUserId: string;
  onDashboard: () => void;
}

const allTabs: TabId[] = [
  'stash', 'community', 'marketplace',
  'history', 'notifications', 'bookmarks',
  'profile', 'dashboard', 'settings',
];

export function LeftSidebar({
  activeTab,
  onTabChange,
  isDark,
  onSettings,
  currentUserId,
  onDashboard,
}: LeftSidebarProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primary: true,
    secondary: true,
    utility: true,
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { id: 'stash', label: 'Stash', icon: <IconHome size={20} />, section: 'primary' },
    { id: 'community', label: 'Community', icon: <IconUsers size={20} />, section: 'primary' },
    { id: 'marketplace', label: 'Market', icon: <IconShoppingCart size={20} />, section: 'primary' },
    { id: 'history', label: 'History', icon: <IconHistory size={20} />, section: 'secondary', requiresAuth: true },
    { id: 'notifications', label: 'Notifications', icon: <IconBell size={20} />, section: 'secondary', requiresAuth: true },
    { id: 'bookmarks', label: 'Bookmarks', icon: <IconBookmark size={20} />, section: 'secondary', requiresAuth: true },
    { id: 'profile', label: 'Profile', icon: <IconUser size={20} />, section: 'utility', requiresAuth: true },
    { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={20} />, section: 'utility' },
    { id: 'settings', label: 'Settings', icon: <IconSettings size={20} />, section: 'utility' },
  ];

  const handleTabClick = useCallback((tab: TabId) => {
    if (tab === 'profile') {
      navigate('/?tab=community&user=' + encodeURIComponent(currentUserId));
      return;
    }
    if (tab === 'dashboard') {
      onDashboard();
      return;
    }
    if (tab === 'settings') {
      onSettings();
      return;
    }
    onTabChange(tab);
  }, [currentUserId, navigate, onDashboard, onSettings, onTabChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const validTabs = allTabs;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % validTabs.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + validTabs.length) % validTabs.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(validTabs.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const focusedTab = validTabs[focusedIndex];
        if (focusedTab) handleTabClick(focusedTab);
        break;
      case 'Escape':
        if (collapsed) {
          e.preventDefault();
          setCollapsed(false);
        }
        break;
    }
  }, [collapsed, focusedIndex, handleTabClick]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const idx = allTabs.indexOf(activeTab as TabId);
    if (idx !== -1) setFocusedIndex(idx);
  }, [activeTab]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const sectionLabel: Record<string, string> = {
    primary: 'Main Navigation',
    secondary: 'Activity',
    utility: 'Utilities',
  };

  const renderNavItem = (item: NavItem) => {
    if (item.requiresAuth && !currentUserId && !isAdmin) return null;
    const isActive = activeTab === item.id;
    const isDisabled = item.requiresAuth && !currentUserId;

    return (
      <Tooltip
        key={item.id}
        label={item.label}
        position="right"
        disabled={!collapsed}
        openDelay={300}
      >
        <NavLink
          id={`nav-${item.id}`}
          label={!collapsed ? item.label : undefined}
          leftSection={item.icon}
          active={isActive}
          disabled={isDisabled}
          onClick={() => handleTabClick(item.id)}
          variant="light"
          color={isDark ? 'cyan' : 'cyan'}
          styles={{
            root: {
              borderRadius: 'var(--mantine-radius-md)',
              marginBottom: 2,
            },
            label: {
              fontSize: 'var(--mantine-font-size-sm)',
              fontWeight: 500,
            },
          }}
          role="menuitem"
          aria-current={isActive ? 'page' : undefined}
          tabIndex={0}
        />
      </Tooltip>
    );
  };

  const sectionOrder = ['primary', 'secondary', 'utility'];

  return (
    <Box
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      onKeyDown={handleKeyDown}
      style={{
        width: collapsed ? 60 : 220,
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Stack
        justify="space-between"
        align="center"
        px={collapsed ? 'xs' : 'sm'}
        py="sm"
        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
      >
        {!collapsed && (
          <Text size="sm" fw={700} c={isDark ? 'gray.0' : 'gray.9'}>
            Navigation
          </Text>
        )}
        <ActionIcon
          variant="subtle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
        </ActionIcon>
      </Stack>

      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        <Box py="xs">
          {sectionOrder.map(section => {
            const items = navItems.filter(i => i.section === section);
            if (items.length === 0) return null;

            const visibleItems = items.filter(
              i => !(i.requiresAuth && !currentUserId && !isAdmin)
            );
            if (visibleItems.length === 0) return null;

            return (
              <Box key={section} mb="xs">
                {!collapsed && (
                  <NavLink
                    label={sectionLabel[section]}
                    onClick={() => toggleSection(section)}
                    rightSection={
                      expandedSections[section] ? (
                        <IconChevronUp size={14} />
                      ) : (
                        <IconChevronDown size={14} />
                      )
                    }
                    variant="subtle"
                    styles={{
                      root: { marginBottom: 4 },
                      label: {
                        fontSize: 'var(--mantine-font-size-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)',
                      },
                    }}
                    aria-expanded={expandedSections[section]}
                    aria-label={`${sectionLabel[section]} section`}
                  />
                )}
                {collapsed ? (
                  <Box px={4}>{items.map(renderNavItem)}</Box>
                ) : (
                  <Collapse in={expandedSections[section]}>
                    <Box px={4}>{items.map(renderNavItem)}</Box>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </Box>
      </ScrollArea>
    </Box>
  );
}
