import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '../types';
import { supabase } from '../utils/supabase';

export function useChat(conversationId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
    setLoading(false);

    // Mark unread messages as read
    if (userId && data) {
      const unreadIds = data.filter(m => !m.read && m.user_id !== userId).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unreadIds);
      }
    }
  }, [conversationId, userId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`chat-${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          // Mark as read if from the other user
          if (newMsg.user_id !== userId) {
            supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, userId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !userId || !content.trim() || sending) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        content: content.trim(),
      });
    } finally {
      setSending(false);
    }
  }, [conversationId, userId, sending]);

  return { messages, loading, sending, sendMessage, bottomRef };
}
