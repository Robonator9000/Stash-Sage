-- Security hardening: ban enforcement in RLS + content length limits
-- Addresses:
--   1. Banned users (is_banned = true) could still write to all tables
--   2. No length limits on user-generated text (spam/abuse vector)

-- ============================================================
-- 1. Helper function: is the current user banned?
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_banned FROM profiles WHERE user_id = auth.uid()),
    FALSE
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_banned() FROM anon, PUBLIC;

-- ============================================================
-- 2. Block banned users from INSERT/UPDATE on all write tables
-- ============================================================

-- products
DROP POLICY IF EXISTS "products_insert_own" ON products;
CREATE POLICY "products_insert_own" ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own" ON products FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned());

-- sessions
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- activity_entries
DROP POLICY IF EXISTS "activity_insert_own" ON activity_entries;
CREATE POLICY "activity_insert_own" ON activity_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- posts
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned());

-- post_likes
DROP POLICY IF EXISTS "likes_insert_own" ON post_likes;
CREATE POLICY "likes_insert_own" ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- post_comments
DROP POLICY IF EXISTS "comments_insert_own" ON post_comments;
CREATE POLICY "comments_insert_own" ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- follows
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND NOT public.is_banned());

-- marketplace_listings
DROP POLICY IF EXISTS "listings_insert_own" ON marketplace_listings;
CREATE POLICY "listings_insert_own" ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
DROP POLICY IF EXISTS "listings_update_own" ON marketplace_listings;
CREATE POLICY "listings_update_own" ON marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned());

-- messages
DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.is_banned()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- conversations (starting new conversations)
DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
CREATE POLICY "conversations_insert_own" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id AND NOT public.is_banned());

-- ============================================================
-- 3. Content length limits (CHECK constraints)
-- ============================================================

-- posts: content max 5000 chars
ALTER TABLE posts ADD CONSTRAINT posts_content_max_len
  CHECK (char_length(content) <= 5000);

-- post_comments: content max 2000 chars
ALTER TABLE post_comments ADD CONSTRAINT comments_content_max_len
  CHECK (char_length(content) <= 2000);

-- messages: content max 5000 chars
ALTER TABLE messages ADD CONSTRAINT messages_content_max_len
  CHECK (char_length(content) <= 5000);

-- marketplace_listings: title max 200, description max 5000
ALTER TABLE marketplace_listings ADD CONSTRAINT listings_title_max_len
  CHECK (char_length(title) <= 200);
ALTER TABLE marketplace_listings ADD CONSTRAINT listings_description_max_len
  CHECK (char_length(description) <= 5000);

-- profiles: display_name max 100
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_max_len
  CHECK (char_length(display_name) <= 100);
