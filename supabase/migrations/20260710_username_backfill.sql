-- Backfill NULL/empty `username` from `display_name`, slugified to [a-z0-9_].
-- Slug rules: lowercase, spaces -> underscores, strip anything not [a-z0-9_].

UPDATE profiles
SET username = CASE
  WHEN slug.s <> '' THEN slug.s
  ELSE 'user_' || substr(user_id::text, 1, 8)
END
FROM (
  SELECT user_id,
    REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(TRIM(display_name)), '\s+', '_', 'g'),
      '[^a-z0-9_]', '', 'g'
    ) AS s
  FROM profiles
) slug
WHERE profiles.user_id = slug.user_id
  AND (profiles.username IS NULL OR TRIM(profiles.username) = '');

-- Resolve duplicate usernames with a safe, looped dedup (mirrors the style used in
-- 20260707_profile_extras.sql). Each pass strips a trailing _N suffix, then assigns
-- a fresh sequential _N per group, so distinct base names can never collide and the
-- loop is guaranteed to terminate once every username is unique.
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  LOOP
    UPDATE profiles p
      SET username = base.s || '_' || base.n
      FROM (
        SELECT user_id,
          REGEXP_REPLACE(p2.username, '_\d+$', '') AS s,
          ROW_NUMBER() OVER (PARTITION BY p2.username ORDER BY p2.user_id) AS n
        FROM profiles p2
        WHERE p2.username IN (
          SELECT username FROM profiles GROUP BY username HAVING count(*) > 1
        )
      ) base
      WHERE p.user_id = base.user_id;

    SELECT count(*) INTO remaining
      FROM (SELECT username FROM profiles GROUP BY username HAVING count(*) > 1) d;
    EXIT WHEN remaining = 0;
  END LOOP;
END $$;

-- Ensure a unique constraint/index exists on username.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;
