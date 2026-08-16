import { useState, useEffect, useRef, memo } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from './ChatBubble';
import { t } from '../utils/translations';
import { uploadMessageImage } from '../utils/supabase';
import { Group, Text, ActionIcon, Avatar, Loader, TextInput, Button, Box, ScrollArea } from '@mantine/core';
import { IconArrowLeft, IconSend, IconPhoto, IconX, IconBan } from '@tabler/icons-react';
import type { Conversation } from '../types';

interface ChatThreadProps {
  conversation: Conversation;
  currentUserId: string;
  isDark: boolean;
  lang: string;
  onBack: () => void;
}

export const ChatThread = memo(function ChatThread({ conversation, currentUserId, isDark, lang, onBack }: ChatThreadProps) {
  const otherUserId = conversation.buyer_id === currentUserId ? conversation.seller_id : conversation.buyer_id;
  const { messages, loading, sending, sendMessage, bottomRef, otherUserTyping, broadcastTyping, blockedByOther, iBlockedOther, blockUser, unblockUser, editMessage, deleteMessage } = useChat(conversation.id, currentUserId, otherUserId);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingBroadcastRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, bottomRef]);

  useEffect(() => {
    if (input && !blockedByOther && !iBlockedOther) {
      broadcastTyping();
      clearInterval(typingBroadcastRef.current);
      typingBroadcastRef.current = setInterval(() => broadcastTyping(), 2000);
    }
    return () => clearInterval(typingBroadcastRef.current);
  }, [input, broadcastTyping, blockedByOther, iBlockedOther]);

  async function handleSend() {
    if ((!input.trim() && !imageFile) || sending || uploading) return;
    setUploading(true);
    setSendFailed(false);
    let imageUrl: string | null = null;
    try {
      if (imageFile) imageUrl = await uploadMessageImage(currentUserId, imageFile);
    } catch {
      setSendFailed(true);
      setUploading(false);
      return;
    }
    const msgText = input.trim();
    const replyId = replyingTo?.id;
    setUploading(false);
    const ok = await sendMessage(msgText, imageUrl || undefined, replyId);
    if (!ok) { setSendFailed(true); return; }
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setReplyingTo(null);
    inputRef.current?.focus();
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const listingTitle = conversation.listing?.title || 'listing';

  const headerFg = isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)';
  const muted = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const surfaceBg = isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)';
  const borderColor = isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const inputBg = isDark ? 'var(--mantine-color-dark-7)' : '#fff';
  const canSend = !!(input.trim() || imageFile) && !sending && !uploading;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <Group p="sm" gap="sm" align="center" wrap="nowrap" style={{
        borderBottom: `1px solid ${borderColor}`,
        background: surfaceBg,
      }}>
        <ActionIcon variant="subtle" onClick={onBack} color="gray" aria-label="Back">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Group gap="sm" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {conversation.other_user?.avatar_url ? (
            <Avatar src={conversation.other_user.avatar_url} radius="xl" size={32} />
          ) : (
            <Avatar radius="xl" size={32} color="cyan" style={{ background: 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))' }}>
              {(conversation.other_user?.username?.[0] || '?').toUpperCase()}
            </Avatar>
          )}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={700} truncate style={{ color: headerFg }}>
              {conversation.other_user?.username}
            </Text>
            <Text size="xs" truncate style={{ color: muted }}>
              {blockedByOther ? 'Blocked you' : iBlockedOther ? 'Blocked' : t('conversationAbout', lang).replace('{title}', listingTitle)}
            </Text>
          </Box>
          {!showBlockConfirm ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setShowBlockConfirm(true)}
              title={iBlockedOther ? 'Unblock' : 'Block'}
              aria-label={iBlockedOther ? 'Unblock' : 'Block'}
            >
              <IconBan size={16} />
            </ActionIcon>
          ) : (
            <Group gap={4} wrap="nowrap">
              <Button size="xs" variant="subtle" color="red" onClick={() => { setShowBlockConfirm(false); if (iBlockedOther) unblockUser(); else blockUser(); }}>
                {iBlockedOther ? 'Unblock' : 'Block'}
              </Button>
              <Button size="xs" variant="subtle" color="gray" onClick={() => setShowBlockConfirm(false)}>Cancel</Button>
            </Group>
          )}
        </Group>
      </Group>

      {otherUserTyping && (
        <Box px="md" py={6} style={{ fontSize: 12, fontStyle: 'italic', color: muted }}>
          {conversation.other_user?.username} is typing...
        </Box>
      )}

      <ScrollArea style={{ flex: 1, minHeight: 0 }} px="md" py="md">
        {loading ? (
          <Group justify="center" h="100%">
            <Loader size="md" color="cyan" />
          </Group>
        ) : messages.length === 0 ? (
          <Group justify="center" align="center" h="100%" gap="xs">
            <Text size="sm" c="dimmed">{t('noMessages', lang)}</Text>
          </Group>
        ) : (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isDark={isDark}
                isOwn={msg.user_id === currentUserId}
                lang={lang}
                onEdit={msg.user_id === currentUserId ? editMessage : undefined}
                onDelete={msg.user_id === currentUserId ? deleteMessage : undefined}
                onReply={() => setReplyingTo({ id: msg.id, content: msg.content.substring(0, 60) })}
              />
            ))}
          </Box>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {replyingTo && (
        <Group px="md" py="sm" gap="sm" align="center" wrap="nowrap" style={{
          borderTop: `1px solid ${borderColor}`,
          background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)',
        }}>
          <Text size="xs" truncate style={{ flex: 1, color: muted }}>
            Replying to: <span style={{ color: headerFg }}>{replyingTo.content}</span>
          </Text>
          <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => setReplyingTo(null)} aria-label="Cancel reply"><IconX size={14} /></ActionIcon>
        </Group>
      )}

      {imagePreview && (
        <Box px="md" py="sm" style={{
          borderTop: `1px solid ${borderColor}`,
          background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)',
        }}>
          <Box style={{ position: 'relative', display: 'inline-block' }}>
            <img src={imagePreview} alt="" style={{ height: 80, borderRadius: 8, objectFit: 'cover' }} />
            <ActionIcon
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              aria-label="Remove image"
              color="red"
              variant="filled"
              size={20}
              style={{ position: 'absolute', top: -6, right: -6, borderRadius: '50%' }}
            >
              <IconX size={12} />
            </ActionIcon>
          </Box>
        </Box>
      )}

      <Group p="sm" gap="sm" align="center" wrap="nowrap" style={{
        borderTop: `1px solid ${borderColor}`,
        background: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)',
      }}>
        {blockedByOther || iBlockedOther ? (
          <Text size="xs" ta="center" py="sm" style={{ color: muted, width: '100%' }}>
            {blockedByOther ? conversation.other_user?.username + ' has blocked you' : 'You blocked ' + conversation.other_user?.username}
          </Text>
        ) : (
          <div style={{ flex: 1 }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
              >
                <IconPhoto size={20} />
              </ActionIcon>
              <input ref={fileInputRef} type="file" accept="image/webp,image/jpeg,image/png" style={{ display: 'none' }} tabIndex={-1} onChange={handleImageSelect} />
              <TextInput
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); setSendFailed(false); }}
                placeholder={t('typeMessage', lang)}
                style={{ flex: 1 }}
                styles={{ input: { background: inputBg, color: headerFg, border: `1px solid ${borderColor}` } }}
              />
              <Button
                type="submit"
                disabled={!canSend}
                style={{ padding: 8, borderRadius: 'var(--mantine-radius-md)', height: 'auto' }}
                variant="filled"
                color="cyan"
              >
                <IconSend size={20} />
              </Button>
            </form>
            {sendFailed && (
              <Text size="xs" c="red" mt={4} ta="right">
                Message failed to send. Check your connection and try again.
              </Text>
            )}
          </div>
        )}
      </Group>
    </Box>
  );
});