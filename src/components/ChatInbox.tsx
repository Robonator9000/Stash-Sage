import { useState, useEffect, useMemo } from 'react';
import { useConversations } from '../hooks/useConversations';
import { ChatThread } from './ChatThread';
import { t } from '../utils/translations';
import { timeAgo } from '../utils/helpers';
import { supabase } from '../utils/supabase';
import { Paper, Group, Stack, Text, ActionIcon, TextInput, Avatar, Button, Skeleton } from '@mantine/core';
import { IconArrowLeft, IconTrash, IconSearch } from '@tabler/icons-react';
import type { Conversation } from '../types';

interface ChatInboxProps {
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onBack?: () => void;
  initialTargetUserId?: string;
  onSelectConversation?: (c: Conversation) => void;
  popover?: boolean;
}

export function ChatInbox({ currentUserId, isDark, lang, onBack, initialTargetUserId, onSelectConversation, popover }: ChatInboxProps) {
  const { conversations, loading, refresh } = useConversations(currentUserId);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.other_user?.username?.toLowerCase().includes(q) ||
      c.last_message?.content?.toLowerCase().includes(q) ||
      c.listing?.title?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  useEffect(() => {
    if (!initialTargetUserId || loading || conversations.length === 0 && !loading) return;
    const existing = conversations.find(c =>
      (c.buyer_id === initialTargetUserId && c.seller_id === currentUserId) ||
      (c.seller_id === initialTargetUserId && c.buyer_id === currentUserId)
    );
    if (existing) {
      if (onSelectConversation) onSelectConversation(existing);
      else setActiveConversation(existing);
    }
  }, [initialTargetUserId, loading, conversations, currentUserId, onSelectConversation]);

  async function handleDelete(convId: string) {
    setDeleting(convId);
    await Promise.all([
      supabase.from('messages').delete().eq('conversation_id', convId),
      supabase.from('conversations').delete().eq('id', convId),
    ]);
    setDeleting(null);
    setConfirmDelete(null);
    refresh();
  }

  if (!onSelectConversation && activeConversation) {
    return (
      <ChatThread
        conversation={activeConversation}
        currentUserId={currentUserId}
        isDark={isDark}
        lang={lang}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  const headerFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const cardBg = isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)';
  const hoverBg = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)';

  return (
    <Stack gap="md">
      {!popover && (
        <Group gap="sm">
          {onBack && (
            <ActionIcon variant="subtle" onClick={onBack} color="gray" aria-label="Back">
              <IconArrowLeft size={20} />
            </ActionIcon>
          )}
          <Text fw={700} size="lg" style={{ color: headerFg }}>
            {t('messages', lang)}
          </Text>
        </Group>
      )}

      {loading ? (
        <Stack gap="sm">
          {[1, 2, 3].map(i => (
            <Paper key={i} p="sm" radius="md" withBorder style={{ background: cardBg }}>
              <Group gap="sm" wrap="nowrap">
                <Skeleton width={40} height={40} radius="xl" />
                <Stack gap={6} style={{ flex: 1 }}>
                  <Skeleton height={12} width={96} radius="md" />
                  <Skeleton height={12} width={160} radius="md" />
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <>
          <TextInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            leftSection={<IconSearch size={16} />}
            size="sm"
          />
          {filteredConversations.length === 0 ? (
            <Paper p="xl" radius="md" ta="center" withBorder style={{ background: cardBg }}>
              <Text size="sm" c="dimmed">
                {searchQuery.trim() ? 'No results' : t('noMessages', lang)}
              </Text>
              {!searchQuery.trim() && (
                <Text size="xs" c="dimmed" mt={4}>
                  Start a chat from a listing or profile.
                </Text>
              )}
            </Paper>
          ) : (
            <Stack gap={4}>
              {filteredConversations.map((c) => {
                const showDelete = confirmDelete === c.id;
                const inner = showDelete ? (
                  <Group p="sm" justify="space-between" wrap="nowrap" style={{
                    borderRadius: 'var(--mantine-radius-md)',
                    background: isDark ? 'rgba(127,29,29,0.2)' : 'var(--mantine-color-red-1)',
                    border: `1px solid ${isDark ? 'rgba(127,29,29,0.3)' : 'var(--mantine-color-red-3)'}`,
                  }}>
                    <Text size="sm" style={{ color: isDark ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-red-7)' }}>
                      Delete this conversation?
                    </Text>
                    <Group gap="xs">
                      <Button size="xs" variant="default" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </Button>
                      <Button size="xs" color="red" loading={deleting === c.id} onClick={() => handleDelete(c.id)}>
                        Delete
                      </Button>
                    </Group>
                  </Group>
                ) : (
                  <Button
                    fullWidth
                    onClick={() => { if (onSelectConversation) onSelectConversation(c); else setActiveConversation(c); }}
                    variant="subtle"
                    style={{
                      borderRadius: 'var(--mantine-radius-md)',
                      padding: 12,
                      height: 'auto',
                      justifyContent: 'flex-start',
                      color: headerFg,
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    styles={{ label: { width: '100%', justifyContent: 'flex-start' } }}
                  >
                    <Group gap="sm" wrap="nowrap" style={{ width: '100%' }}>
                      {c.other_user?.avatar_url ? (
                        <Avatar src={c.other_user.avatar_url} radius="xl" size={40} />
                      ) : (
                        <Avatar radius="xl" size={40} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
                          {(c.other_user?.username?.[0] || '?').toUpperCase()}
                        </Avatar>
                      )}
                      <Group gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap" gap="xs" style={{ width: '100%' }}>
                          <Text size="sm" fw={700} truncate style={{ color: headerFg }}>
                            {c.other_user?.username}
                          </Text>
                          {c.last_message && (
                            <Text size="xs" c="dimmed" style={{ flexShrink: 0, color: muted }}>
                              {timeAgo(c.last_message.created_at, lang)}
                            </Text>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" truncate>
                          {c.listing?.title ? `Re: ${c.listing.title}` : 'Conversation'}
                        </Text>
                        {c.last_message && (
                          <Text size="xs" truncate style={{ color: muted }}>
                            {c.last_message.user_id === currentUserId ? 'You: ' : ''}{c.last_message.content}
                          </Text>
                        )}
                      </Group>
                      {(c.unread_count || 0) > 0 && (
                        <Avatar size={20} radius="xl" color="cyan" style={{ background: 'var(--mantine-color-cyan-6)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                          {c.unread_count}
                        </Avatar>
                      )}
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Button>
                );
                return <Paper key={c.id} radius="md" withBorder={showDelete} style={{ background: 'transparent' }}>{inner}</Paper>;
              })}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
