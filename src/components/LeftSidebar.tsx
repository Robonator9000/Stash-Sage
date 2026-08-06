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
  TextInput,
  Avatar,
  UnstyledButton,
  Group,
  Badge,
} from '@mantine/core';
import {
  IconHome,
  IconUsers,
  IconShoppingCart,
  IconHistory,
  IconBell,
  IconLayoutDashboard,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
} from '@tabler/icons-react';
import { getProfile } from '../utils/profileCache';

type TabId =
  | 'stash'
  | 'community'
  | 'marketplace'
  | 'history'
  | 'notifications'
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
  onOpenProfileSettings?: () => void;
  currentUserId: string;
}

const allTabs: TabId[] = [
  'stash', 'dashboard', 'history',
  'community', 'marketplace',
  'settings', 'notifications',
];

export function LeftSidebar({
  activeTab,
  onTabChange,
  isDark,
  onOpenProfileSettings,
  currentUserId,
}: LeftSidebarProps) {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primary: true,
    secondary: true,
    utility: true,
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const navRef = useRef<HTMLDivElement>(null);

  const [currentProfile, setCurrentProfile] = useState<{ username: string; display_name: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    if (!currentUserId) return;
    getProfile(currentUserId).then(p => {
      if (p) setCurrentProfile(p);
    }).catch(() => {});
  }, [currentUserId]);

  const profileUsername = currentProfile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const profileDisplayName = currentProfile?.display_name || profileUsername;
  const profileAvatar = currentProfile?.avatar_url || user?.user_metadata?.avatar_url;

  const navItems: NavItem[] = [
    { id: 'stash', label: 'Stash', icon: <IconHome size={20} />, section: 'primary' },
    { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={20} />, section: 'primary' },
    { id: 'history', label: 'History', icon: <IconHistory size={20} />, section: 'primary', requiresAuth: true },
    { id: 'community', label: 'Feed', icon: <IconUsers size={20} />, section: 'secondary' },
    { id: 'marketplace', label: 'Market', icon: <IconShoppingCart size={20} />, section: 'secondary' },
    { id: 'settings', label: 'Settings', icon: <IconSettings size={20} />, section: 'utility' },
    { id: 'notifications', label: 'Notifications', icon: <IconBell size={20} />, section: 'utility', requiresAuth: true },
  ];

  const openCommunityProfile = useCallback((username: string) => {
    navigate('/?tab=community&user=' + encodeURIComponent(username));
  }, [navigate]);

  const handleTabClick = useCallback((tab: TabId) => {
    onTabChange(tab);
  }, [onTabChange]);

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
    primary: 'My Stash',
    secondary: 'Community',
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
          color="cyan"
          rightSection={!collapsed && item.badge ? (
            <Badge size="xs" variant="filled" color="cyan" radius="xl">
              {item.badge}
            </Badge>
          ) : undefined}
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
        width: collapsed ? 60 : 240,
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
        style={{ borderBottom: '1px solid transparent' }}
      >
        <ActionIcon
          variant="subtle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
        </ActionIcon>
      </Stack>

      {!collapsed && (
        <Box px="sm" pt="sm">
          <TextInput
            placeholder="Search navigation..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="xs"
            radius="md"
          />
        </Box>
      )}

      <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars>
        <Box py="xs">
          {sectionOrder.map(section => {
            const items = navItems.filter(i => i.section === section &&
              (!searchQuery || i.label.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            if (items.length === 0) return null;

            const visibleItems = items.filter(
              i => !(i.requiresAuth && !currentUserId && !isAdmin)
            );
            if (visibleItems.length === 0) return null;

            return (
              <Box key={section} mb="xs">
                {!collapsed && (
                  <NavLink
                    label={`${sectionLabel[section]} (${visibleItems.length})`}
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

      {user && (
        <Box
          px={collapsed ? 'xs' : 'sm'}
          py="sm"
          style={{
            borderTop: '1px solid transparent',
            marginTop: 'auto',
          }}
        >
          {collapsed ? (
            <Group justify="center">
              <Tooltip label="Edit profile" position="right" openDelay={300}>
                <UnstyledButton onClick={() => onOpenProfileSettings?.()}>
                  <Avatar src={profileAvatar} alt={profileUsername} size={32} radius="xl" color="cyan">
                    {profileUsername?.[0]?.toUpperCase()}
                  </Avatar>
                </UnstyledButton>
              </Tooltip>
            </Group>
          ) : (
            <Group gap="sm" wrap="nowrap">
              <Tooltip label="Edit profile" position="right" openDelay={300}>
                <UnstyledButton onClick={() => onOpenProfileSettings?.()}>
                  <Avatar src={profileAvatar} alt={profileUsername} size={36} radius="xl" color="cyan">
                    {profileUsername?.[0]?.toUpperCase()}
                  </Avatar>
                </UnstyledButton>
              </Tooltip>
              <Box style={{ flex: 1, overflow: 'hidden' }}>
                <UnstyledButton
                  onClick={() => openCommunityProfile(profileUsername)}
                  style={{ width: '100%', borderRadius: 'var(--mantine-radius-md)' }}
                  aria-label={`View @${profileUsername} profile`}
                >
                  <Text size="sm" fw={600} truncate>
                    {profileDisplayName}
                  </Text>
                  <Text size="xs" c="cyan" truncate>
                    @{profileUsername}
                  </Text>
                </UnstyledButton>
              </Box>
            </Group>
          )}
        </Box>
      )}
    </Box>
  );
}
