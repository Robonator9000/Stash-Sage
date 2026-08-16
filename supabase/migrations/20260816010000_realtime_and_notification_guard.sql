-- 2026-08-16: security hardening follow-up
-- 1) Enable realtime for posts + notifications so the feed's "new posts"
--    banner and live notification delivery actually fire. REPLICA IDENTITY
--    FULL is required for postgres_changes to respect RLS — without it any
--    authenticated subscriber would receive every row's events.
-- 2) Notification guard: drop fabricated notifications (spoofed likes/follows/
--    comments/mentions) that aren't backed by a real action row. Invalid rows
--    are silently discarded (RETURN NULL) — the client treats this as a no-op.

-- Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END
$$;

ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Notification validation trigger
CREATE OR REPLACE FUNCTION validate_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Never notify yourself.
  IF NEW.actor_id = NEW.user_id THEN
    RETURN NULL;
  END IF;

  IF NEW.type = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM post_likes pl
      JOIN posts p ON p.id = pl.post_id
      WHERE pl.post_id = NEW.post_id
        AND pl.user_id = NEW.actor_id
        AND p.user_id = NEW.user_id
    ) THEN RETURN NEW; END IF;

  ELSIF NEW.type = 'comment' THEN
    IF EXISTS (
      SELECT 1 FROM post_comments pc
      JOIN posts p ON p.id = pc.post_id
      WHERE pc.post_id = NEW.post_id
        AND pc.user_id = NEW.actor_id
        AND p.user_id = NEW.user_id
    ) THEN RETURN NEW; END IF;

  ELSIF NEW.type = 'follow' THEN
    IF EXISTS (
      SELECT 1 FROM follows f
      WHERE f.follower_id = NEW.actor_id
        AND f.following_id = NEW.user_id
    ) THEN RETURN NEW; END IF;

  ELSIF NEW.type = 'mention' THEN
    IF EXISTS (
      SELECT 1 FROM mentions m
      JOIN posts p ON p.id = m.post_id
      WHERE m.post_id = NEW.post_id
        AND m.user_id = NEW.user_id
        AND p.user_id = NEW.actor_id
    ) THEN RETURN NEW; END IF;

  ELSIF NEW.type IN ('new_listing', 'listing_sold') THEN
    IF EXISTS (
      SELECT 1 FROM marketplace_listings ml
      WHERE ml.user_id = NEW.actor_id
        AND ml.title = NEW.listing_title
    ) THEN RETURN NEW; END IF;

  ELSE
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_notification ON notifications;
CREATE TRIGGER trg_validate_notification
BEFORE INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION validate_notification_insert();
