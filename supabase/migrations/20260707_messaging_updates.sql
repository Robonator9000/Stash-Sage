-- Phase 1: Allow conversations without a listing (DMs)
ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;

-- Phase 2: Image attachment in messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Phase 2: Read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Phase 3: Blocked users
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blocks"
  ON blocked_users
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- Phase 4: Message editing / soft delete
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Phase 4: Reply threading
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Phase 4: Full-text search on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_messages_search_vector ON messages USING GIN(search_vector);

CREATE OR REPLACE FUNCTION messages_search_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_search ON messages;
CREATE TRIGGER trg_messages_search
  BEFORE INSERT OR UPDATE OF content ON messages
  FOR EACH ROW EXECUTE FUNCTION messages_search_update();
