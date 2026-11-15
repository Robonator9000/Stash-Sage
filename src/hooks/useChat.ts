import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '../types';
import { supabase } from '../utils/supabase';
import { rateLimit } from '../utils/helpers';

let chatChannelCounter = 0;

// Hard cap on messages fetched per thread open. Long conversations load the
// most recent page instead of the entire history.
const MESSAGE_PAGE_SIZE = 200;

export function useChat(conversationId: string | null, userId: string | undefined, otherUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [iBlockedOther, setIBlockedOther] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // One channel per conversation, reused for both realtime events and typing
  // broadcasts. Previously each typing ping created a throwaway channel that
  // was never subscribed or removed (a leak), and its topic could drift from
  // the subscribed channel's topic so typing was silently dropped.
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    setLoading(true);

    const [messagesRes, blockedRes] = await Promise.all([
      supabase
        .from('messages')
        .select('*, reply_to:reply_to_id(id, content, user_id)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE),
      otherUserId && userId
        ? supabase.from('blocked_users').select('blocker_id, blocked_id')
            .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
            .maybeSingle()
        : { data: null },
    ]);

    if (!messagesRes.error && messagesRes.data) {
      // Query pulled newest-first for the cap; restore chronological order for render.
      setMessages([...messagesRes.data].reverse());
    }
    setLoading(false);

    if (blockedRes?.data) {
      if (blockedRes.data.blocker_id === userId) setIBlockedOther(true);
      if (blockedRes.data.blocker_id === otherUserId) setBlockedByOther(true);
    }

    // Mark unread messages as read
    if (userId && messagesRes.data) {
      const unreadIds = messagesRes.data.filter(m => !m.read && m.user_id !== userId).map(m => m.id);
      if (unreadIds.length > 0) {
        const now = new Date().toISOString();
        await supabase.from('messages').update({ read: true, read_at: now }).in('id', unreadIds);
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true, read_at: now } : m));
      }
    }
  }, [conversationId, userId, otherUserId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Real-time subscription for new messages + typing
  useEffect(() => {
    if (!conversationId) return;
    chatChannelCounter += 1;
    const id = chatChannelCounter;
    subscribedRef.current = false;

    const channel = supabase.channel(`chat-${conversationId}-${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          // Dedupe: the row may already be present (initial fetch overlap or a
          // repeated echo) — never append a duplicate.
          setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          if (newMsg.user_id !== userId) {
            const now = new Date().toISOString();
            supabase.from('messages').update({ read: true, read_at: now }).eq('id', newMsg.id);
            setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, read: true, read_at: now } : m));
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, content: updated.content, edited_at: updated.edited_at, deleted_at: updated.deleted_at, image_url: updated.image_url } : m));
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === otherUserId) {
          setOtherUserTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
        }
      })
      .subscribe((status) => {
        subscribedRef.current = status === 'SUBSCRIBED';
      });

    // Reuse this single channel for typing broadcasts.
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      subscribedRef.current = false;
      supabase.removeChannel(channel);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, userId, otherUserId]);

  const sendMessage = useCallback(async (content?: string, image_url?: string, reply_to_id?: string): Promise<boolean> => {
    if (!conversationId || !userId || (!content?.trim() && !image_url) || sending || blockedByOther) return false;
    if (!rateLimit(`chat-send-${conversationId}`, 1, 1500)) return false;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        content: content?.trim() || '',
        image_url: image_url || null,
        reply_to_id: reply_to_id || null,
      });
      return !error;
    } finally {
      setSending(false);
    }
  }, [conversationId, userId, sending, blockedByOther]);

  const broadcastTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !subscribedRef.current) return;
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId } });
  }, [userId]);

  const unblockUser = useCallback(async () => {
    if (!userId || !otherUserId) return;
    await supabase.from('blocked_users').delete().eq('blocker_id', userId).eq('blocked_id', otherUserId);
    setIBlockedOther(false);
  }, [userId, otherUserId]);

  const blockUser = useCallback(async () => {
    if (!userId || !otherUserId) return;
    await supabase.from('blocked_users').insert({ blocker_id: userId, blocked_id: otherUserId });
    setIBlockedOther(true);
  }, [userId, otherUserId]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!content.trim() || !userId) return;
    const now = new Date().toISOString();
    await supabase.from('messages').update({ content: content.trim(), edited_at: now }).eq('id', messageId).eq('user_id', userId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: content.trim(), edited_at: now } : m));
  }, [userId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from('messages').update({ deleted_at: now, content: '' }).eq('id', messageId).eq('user_id', userId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted_at: now, content: '' } : m));
  }, [userId]);

  const replyToMessage = useRef<{ id: string; content: string; userId: string } | null>(null);

  return { messages, loading, sending, sendMessage, bottomRef, otherUserTyping, broadcastTyping, blockedByOther, iBlockedOther, blockUser, unblockUser, editMessage, deleteMessage, replyToMessage };
}
