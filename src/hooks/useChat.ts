import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '../types';
import { supabase } from '../utils/supabase';

let chatChannelCounter = 0;

export function useChat(conversationId: string | null, userId: string | undefined, otherUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [iBlockedOther, setIBlockedOther] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    setLoading(true);

    const [messagesRes, blockedRes] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
      otherUserId && userId
        ? supabase.from('blocked_users').select('blocker_id, blocked_id')
            .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
            .maybeSingle()
        : { data: null },
    ]);

    if (!messagesRes.error && messagesRes.data) setMessages(messagesRes.data);
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

    const channel = supabase.channel(`chat-${conversationId}-${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.user_id !== userId) {
            const now = new Date().toISOString();
            supabase.from('messages').update({ read: true, read_at: now }).eq('id', newMsg.id);
            setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, read: true, read_at: now } : m));
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === otherUserId) {
          setOtherUserTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, userId, otherUserId]);

  const sendMessage = useCallback(async (content?: string, image_url?: string) => {
    if (!conversationId || !userId || (!content?.trim() && !image_url) || sending || blockedByOther) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        content: content?.trim() || '',
        image_url: image_url || null,
      });
    } finally {
      setSending(false);
    }
  }, [conversationId, userId, sending, blockedByOther]);

  const broadcastTyping = useCallback(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`chat-${conversationId}-${chatChannelCounter}`);
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId } });
  }, [conversationId, userId]);

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

  return { messages, loading, sending, sendMessage, bottomRef, otherUserTyping, broadcastTyping, blockedByOther, iBlockedOther, blockUser, unblockUser };
}
