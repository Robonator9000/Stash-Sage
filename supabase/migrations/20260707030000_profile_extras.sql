-- Add banner_url, bio, contacts, and username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Backfill username from display_name (fall back to a user_id-derived slug for blanks)
UPDATE profiles SET username = COALESCE(NULLIF(TRIM(display_name), ''), 'user_' || substr(user_id::text, 1, 8)) WHERE username IS NULL;

-- Resolve duplicate usernames (loop until none remain; a single pass can still
-- collide with a pre-existing suffixed username and would block the UNIQUE constraint below)
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  LOOP
    UPDATE profiles p
      SET username = p.username || '_' || substr(p.user_id::text, 1, 8)
      WHERE username IN (SELECT username FROM profiles GROUP BY username HAVING count(*) > 1);
    SELECT count(*) INTO remaining
      FROM (SELECT username FROM profiles GROUP BY username HAVING count(*) > 1) d;
    EXIT WHEN remaining = 0;
  END LOOP;
END $$;

-- Make username unique and not null (after backfill + dedup)
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
