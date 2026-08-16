-- Marketplace Overhaul: conversations, messages, saved_listings
-- Phase 2.1: Database migration

-- ============================================================
-- CONVERSATIONS: private DMs between buyer/seller on a listing
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id)
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Any authenticated user can create (start) a conversation
CREATE POLICY "conversations_insert_own"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Only participants can update (for last_message_at)
CREATE POLICY "conversations_update_participant"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================================
-- MESSAGES: individual messages within a conversation
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read) WHERE read = FALSE;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants can read messages in their conversations
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- Participants can insert messages in their conversations
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- Participants can mark messages as read
CREATE POLICY "messages_update_participant"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- ============================================================
-- SAVED LISTINGS: bookmark/save marketplace listings
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_saved_listings_user ON saved_listings(user_id, created_at DESC);
CREATE INDEX idx_saved_listings_listing ON saved_listings(listing_id);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_listings_select_own"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_listings_insert_own"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_listings_delete_own"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: update conversation last_message_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- Enable Realtime for messages (for chat)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
