import { useState, useEffect, useCallback, useRef } from 'react';
import type { Conversation } from '../types';
import { supabase } from '../utils/supabase';

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const enriched = await Promise.all(data.map(async (c) => {
      const otherId = c.buyer_id === userId ? c.seller_id : c.buyer_id;
      const [profileRes, listingRes, msgRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', otherId).maybeSingle(),
        supabase.from('marketplace_listings').select('id, title, price, images, image_url, status').eq('id', c.listing_id).maybeSingle(),
        supabase.from('messages').select('*').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id).eq('read', false).neq('user_id', userId),
      ]);
      return {
        ...c,
        other_user: { username: profileRes.data?.display_name || 'User', avatar_url: profileRes.data?.avatar_url },
        listing: listingRes.data ?? undefined,
        last_message: msgRes.data,
        unread_count: unreadRes.count || 0,
      } as Conversation;
    }));

    setConversations(enriched);
    setLoading(false);
  }, [userId]);

  const fetchRef = useRef(fetchConversations);
  fetchRef.current = fetchConversations;

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;
    const channelName = `conversations-${userId}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchRef.current();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchRef.current();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { conversations, loading, refresh: fetchConversations };
}
