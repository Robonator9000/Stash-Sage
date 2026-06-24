-- Listing reviews table
CREATE TABLE IF NOT EXISTS listing_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listing_reviews_listing ON listing_reviews(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_reviews_user ON listing_reviews(user_id);

-- RLS
ALTER TABLE listing_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "listing_reviews_select_anyone" ON listing_reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own review
CREATE POLICY "listing_reviews_insert_own" ON listing_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own review
CREATE POLICY "listing_reviews_update_own" ON listing_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own review
CREATE POLICY "listing_reviews_delete_own" ON listing_reviews
  FOR DELETE USING (auth.uid() = user_id);
