ALTER TABLE marketplace_listings
ADD COLUMN IF NOT EXISTS price_options JSONB DEFAULT '[]'::jsonb;
