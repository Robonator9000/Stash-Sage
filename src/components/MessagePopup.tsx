import { useState, useEffect } from 'react';
import { ChatInbox } from './ChatInbox';
import { ChatThread } from './ChatThread';
import { useConversations } from '../hooks/useConversations';
import { Paper, Group, Text, ActionIcon, Box, ScrollArea } from '@mantine/core';
import { IconMessageCircle, IconX, IconMinus } from '@tabler/icons-react';
import type { Conversation } from '../types';

interface MessagePopupProps {
  currentUserId: string;
  isDark: boolean;
  lang: string;
  initialTargetUserId?: string;
  initialOpen?: boolean;
  onClose?: () => void;
}

export function MessagePopup({ currentUserId, isDark, lang, initialTargetUserId, initialOpen, onClose }: MessagePopupProps) {
  const [open, setOpen] = useState(!!initialTargetUserId || !!initialOpen);
  const [minimized, setMinimized] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const { conversations } = useConversations(currentUserId);
  const unreadCount = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  useEffect(() => {
    if (!initialTargetUserId || conversations.length === 0) return;
    const existing = conversations.find(c =>
      (c.buyer_id === initialTargetUserId && c.seller_id === currentUserId) ||
      (c.seller_id === initialTargetUserId && c.buyer_id === currentUserId)
    );
    if (existing) setActiveConversation(existing);
  }, [initialTargetUserId, conversations, currentUserId]);

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  useEffect(() => {
    setOpen(!!initialTargetUserId);
  }, [initialTargetUserId]);

  const headerFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';

  const fabButton = (
    <Paper
      component="button"
      onClick={() => setOpen(true)}
      radius="xl"
      aria-label="Open messages"
      className="hidden lg:flex"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 16,
        zIndex: 50,
        width: 56,
        height: 56,
        cursor: 'pointer',
        borderRadius: '50%',
        background: 'linear-gradient(90deg, var(--mantine-color-cyan-6), var(--mantine-color-emerald-6))',
        color: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 20px 30px -10px rgba(6,182,212,0.3)',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <IconMessageCircle size={24} />
      {unreadCount > 0 && (
        <Paper
          radius="xl"
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            background: 'var(--mantine-color-red-6)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 10px rgba(0,0,0,0.3)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Paper>
      )}
    </Paper>
  );

  if (!open) return <>{fabButton}</>;

  if (minimized) return <>{fabButton}</>;

  return (
    <Paper
      radius="md"
      withBorder
      style={{
        position: 'fixed',
        bottom: 92,
        right: 16,
        zIndex: 70,
        width: 'min(380px, calc(100vw - 32px))',
        height: 'min(520px, calc(100dvh - 160px))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: isDark ? 'var(--mantine-color-dark-8)' : '#fff',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
      }}
    >
      <Group px="md" py="sm" justify="space-between" wrap="nowrap" style={{
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
      }}>
        <Text size="sm" fw={700} style={{ color: headerFg }}>
          {activeConversation ? activeConversation.other_user?.username : 'Messages'}
        </Text>
        <Group gap={4} wrap="nowrap">
          <ActionIcon variant="subtle" color="gray" onClick={() => setMinimized(true)} aria-label="Minimize">
            <IconMinus size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={() => { setOpen(false); setActiveConversation(null); onClose?.(); }} aria-label="Close">
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Group>
      {activeConversation ? (
        <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatThread
            conversation={activeConversation}
            currentUserId={currentUserId}
            isDark={isDark}
            lang={lang}
            onBack={() => setActiveConversation(null)}
          />
        </Box>
      ) : (
        <ScrollArea type="auto" style={{ flex: 1 }} p="sm">
          <ChatInbox
            currentUserId={currentUserId}
            isDark={isDark}
            lang={lang}
            onSelectConversation={(c) => setActiveConversation(c)}
            popover
          />
        </ScrollArea>
      )}
    </Paper>
  );
}