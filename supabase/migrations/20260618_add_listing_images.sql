-- Add multi-image support to marketplace_listings
ALTER TABLE marketplace_listings
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
