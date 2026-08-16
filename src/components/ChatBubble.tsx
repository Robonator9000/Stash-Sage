import { useState, memo } from 'react';
import type { Message } from '../types';
import { timeAgo } from '../utils/helpers';
import { Paper, Group, Text, ActionIcon, Box, TextInput, Button } from '@mantine/core';
import { IconCornerUpLeft, IconEdit, IconTrash } from '@tabler/icons-react';

interface ChatBubbleProps {
  message: Message;
  isDark: boolean;
  isOwn: boolean;
  lang: string;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
}

export const ChatBubble = memo(function ChatBubble({ message, isDark, isOwn, lang, onEdit, onDelete, onReply }: ChatBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const readLabel = message.read_at ? `Read ${timeAgo(message.read_at, lang)}` : message.read ? 'Read' : '';

  if (message.deleted_at) {
    return (
      <Box style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
        <Paper
          p="xs"
          radius="md"
          style={{
            maxWidth: '75%',
            background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)',
            color: isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-5)',
            fontStyle: 'italic',
            fontSize: 12,
          }}
        >
          Message deleted
        </Paper>
      </Box>
    );
  }

  async function handleEditSave() {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  }

  const ownBg = isDark
    ? 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))'
    : 'var(--mantine-color-cyan-6)';
  const ownColor = '#fff';
  const ownRadius = '16px 16px 4px 16px';
  const otherBg = isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)';
  const otherColor = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const otherRadius = '16px 16px 16px 4px';
  const metaColor = isOwn
    ? 'var(--mantine-color-white)'
    : isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-5)';
  const replyBorder = isOwn
    ? 'rgba(255,255,255,0.3)'
    : isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-3)';
  const replyColor = isOwn
    ? 'rgba(255,255,255,0.7)'
    : isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-5)';

  return (
    <Box
      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 4 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Box
        p="xs"
        style={{
          maxWidth: '75%',
          background: isOwn ? ownBg : otherBg,
          color: isOwn ? ownColor : otherColor,
          borderRadius: isOwn ? ownRadius : otherRadius,
          padding: '8px 14px',
        }}
      >
        {message.reply_to && (
          <Box style={{ marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${replyBorder}`, fontSize: 12, color: replyColor }}>
            {message.reply_to.content?.substring(0, 60)}
          </Box>
        )}
        {message.image_url && (
          <img src={message.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 240, objectFit: 'cover' }} loading="lazy" />
        )}
        {editing ? (
          <Group gap={4} wrap="nowrap">
            <TextInput
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              size="xs"
              autoFocus
              styles={{ input: { background: isDark ? 'var(--mantine-color-dark-7)' : '#fff', color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' } }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditing(false); }}
            />
            <Button size="xs" variant="subtle" onClick={handleEditSave} style={{ color: '#fff', background: 'rgba(255,255,255,0.2)' }}>Save</Button>
          </Group>
        ) : (
          message.content && <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</Text>
        )}
        <Text size="xs" style={{ color: metaColor, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: 10 }}>
          {timeAgo(message.created_at, lang)}
          {message.edited_at && <span>(edited)</span>}
          {isOwn && readLabel && <span style={{ marginLeft: 'auto' }}>{readLabel}</span>}
        </Text>
        {showActions && isOwn && !editing && (
          <Group mt={1} pt={4} gap={2} style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${isOwn ? 'rgba(255,255,255,0.15)' : isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}` }}>
            {onReply && <ActionIcon variant="subtle" size="sm" color={isOwn ? 'white' : 'gray'} onClick={() => onReply(message.id)}><IconCornerUpLeft size={12} /></ActionIcon>}
            {onEdit && <ActionIcon variant="subtle" size="sm" color={isOwn ? 'white' : 'gray'} onClick={() => { setEditText(message.content); setEditing(true); }}><IconEdit size={12} /></ActionIcon>}
            {onDelete && <ActionIcon variant="subtle" size="sm" color={isOwn ? 'white' : 'gray'} onClick={() => onDelete(message.id)}><IconTrash size={12} /></ActionIcon>}
          </Group>
        )}
      </Box>
    </Box>
  );
});