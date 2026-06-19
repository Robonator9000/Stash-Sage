ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS listing_title TEXT;
