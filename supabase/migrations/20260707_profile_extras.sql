-- Add banner_url, bio, contacts, and username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
UPDATE profiles SET username = display_name WHERE username IS NULL;
-- Make username unique and not null (after backfill)
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
