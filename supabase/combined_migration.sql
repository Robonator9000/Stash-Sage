-- ============================================================================
-- Stash Sage - full schema setup for a FRESH Supabase project
-- Generated from supabase/migrations (all 24 migrations, policies made
-- idempotent). Paste this ENTIRE file into the Supabase SQL Editor and Run.
-- Wrapped in a transaction: if any statement fails, nothing is applied.
-- ============================================================================
BEGIN;
-- Migration: Create all app tables with RLS policies and indexes
-- Applies to a fresh Supabase project. Idempotent (uses IF NOT EXISTS).

-- Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Revoke public EXECUTE on trigger function (only used internally by triggers)
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 1. profiles — user display info, readable by everyone for social features
CREATE TABLE IF NOT EXISTS profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for social features: post author names/avatars)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"      ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"      ON profiles FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. products — user inventory, fully private
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT '',
  type              TEXT NOT NULL DEFAULT '',
  strain            TEXT NOT NULL DEFAULT '',
  brand             TEXT,
  amount            NUMERIC NOT NULL DEFAULT 0,
  thc               NUMERIC,
  cbd               NUMERIC,
  price             NUMERIC,
  rating            NUMERIC,
  picture           TEXT,
  pictures          JSONB DEFAULT '[]'::jsonb,
  favorite          BOOLEAN DEFAULT FALSE,
  lastconsumed      TIMESTAMPTZ,
  createdat         TIMESTAMPTZ DEFAULT NOW(),
  updatedat         TIMESTAMPTZ DEFAULT NOW(),
  "consumptionCount" INTEGER DEFAULT 0,
  notes             TEXT,
  tags              TEXT,
  effects           TEXT,
  "purchasedAt"     TIMESTAMPTZ
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_own" ON products;
CREATE POLICY "products_select_own"  ON products FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "products_insert_own" ON products;
CREATE POLICY "products_insert_own"  ON products FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own"  ON products FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "products_delete_own" ON products;
CREATE POLICY "products_delete_own"  ON products FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_createdat ON products(createdat DESC);

-- 3. sessions — smoking session logs, private
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL DEFAULT '',
  amount        NUMERIC,
  people        INTEGER,
  notes         TEXT,
  date          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
CREATE POLICY "sessions_select_own"  ON sessions FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
CREATE POLICY "sessions_insert_own"  ON sessions FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_delete_own" ON sessions;
CREATE POLICY "sessions_delete_own"  ON sessions FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 4. activity_entries — activity log, private
CREATE TABLE IF NOT EXISTS activity_entries (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT,
  amount        NUMERIC,
  price         NUMERIC,
  notes         TEXT,
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_select_own" ON activity_entries;
CREATE POLICY "activity_select_own"  ON activity_entries FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "activity_insert_own" ON activity_entries;
CREATE POLICY "activity_insert_own"  ON activity_entries FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "activity_delete_own" ON activity_entries;
CREATE POLICY "activity_delete_own"  ON activity_entries FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_entries(user_id);

-- 5. settings — user preferences (JSON blob), private
CREATE TABLE IF NOT EXISTS settings (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data      JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_own" ON settings;
CREATE POLICY "settings_select_own"  ON settings FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "settings_insert_own" ON settings;
CREATE POLICY "settings_insert_own"  ON settings FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "settings_update_own" ON settings;
CREATE POLICY "settings_update_own"  ON settings FOR UPDATE  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. posts — social feed posts, public read, user write
CREATE TABLE IF NOT EXISTS posts (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_anyone" ON posts;
CREATE POLICY "posts_select_anyone" ON posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"    ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"    ON posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"    ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. post_likes — likes on social posts, public read
CREATE TABLE IF NOT EXISTS post_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_anyone" ON post_likes;
CREATE POLICY "likes_select_anyone" ON post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "likes_insert_own" ON post_likes;
CREATE POLICY "likes_insert_own"    ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "likes_delete_own" ON post_likes;
CREATE POLICY "likes_delete_own"    ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);

-- 8. post_comments — comments on social posts, public read
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_anyone" ON post_comments;
CREATE POLICY "comments_select_anyone" ON post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "comments_insert_own" ON post_comments;
CREATE POLICY "comments_insert_own"    ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_delete_own" ON post_comments;
CREATE POLICY "comments_delete_own"    ON post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- 9. notifications — user notifications, private read, system insert
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  actor_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT  WITH CHECK (true);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);

-- 10. follows — social graph, public read
CREATE TABLE IF NOT EXISTS follows (
  follower_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_anyone" ON follows;
CREATE POLICY "follows_select_anyone"   ON follows FOR SELECT  USING (true);
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own"      ON follows FOR INSERT  WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own"      ON follows FOR DELETE  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- 11. marketplace_listings — public listings, user-managed
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  price             NUMERIC NOT NULL DEFAULT 0,
  category          TEXT NOT NULL DEFAULT '',
  product_id        UUID,
  product_name      TEXT,
  contact_platform  TEXT NOT NULL DEFAULT '',
  contact_value     TEXT NOT NULL DEFAULT '',
  image_url         TEXT,
  status            TEXT DEFAULT 'active',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_anyone" ON marketplace_listings;
CREATE POLICY "listings_select_anyone" ON marketplace_listings FOR SELECT  USING (true);
DROP POLICY IF EXISTS "listings_insert_own" ON marketplace_listings;
CREATE POLICY "listings_insert_own"    ON marketplace_listings FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "listings_update_own" ON marketplace_listings;
CREATE POLICY "listings_update_own"    ON marketplace_listings FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "listings_delete_own" ON marketplace_listings;
CREATE POLICY "listings_delete_own"    ON marketplace_listings FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);

DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC: delete_my_account — called from AuthContext (supabase.rpc('delete_my_account'))
-- Only authenticated users can execute this.
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION delete_my_account() FROM anon;
GRANT  EXECUTE ON FUNCTION delete_my_account() TO authenticated;
-- Migration: Fix RLS policies and add missing triggers on existing remote DB
-- Apply AFTER 20260617_create_tables_rls.sql if tables already exist.
-- Idempotent — safe to re-run.

-- Fix 1: profiles SELECT policy was restricting to own profile only,
-- which breaks social features (reading other users' names/avatars for posts, likes, comments, etc.)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- Fix 2: Add updated_at triggers for tables that have updated_at columns
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fix 3: Set search_path on delete_my_account to prevent search path injection
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Fix 4: Set search_path on trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix 5: Revoke EXECUTE on delete_my_account from anon (unauthenticated) role
REVOKE EXECUTE ON FUNCTION delete_my_account() FROM anon;
GRANT  EXECUTE ON FUNCTION delete_my_account() TO authenticated;

-- Fix 6: Revoke public EXECUTE on trigger function (only used internally)
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Fix 7: Add missing index on products.createdat DESC for feed ordering
CREATE INDEX IF NOT EXISTS idx_products_createdat ON products(createdat DESC);
-- Add multi-image support to marketplace_listings
ALTER TABLE marketplace_listings
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS listing_title TEXT;
-- Admin roles and moderation support

-- Add role and is_banned columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- Security definer function for checking admin status (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin');
$$;

-- Admin policy: allow admins full access to all profiles
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
USING (public.is_admin());

-- RPC for promoting/demoting users (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_set_role(target_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET role = new_role WHERE user_id = target_id;
END;
$$;

-- RPC for banning/unbanning users
CREATE OR REPLACE FUNCTION public.admin_set_ban(target_id UUID, banned BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET is_banned = banned WHERE user_id = target_id;
END;
$$;

-- Note: To set the first admin, run in Supabase SQL editor:
-- UPDATE profiles SET role = 'admin' WHERE user_id = '<user-uuid>';
-- Migration: Add full-text search columns and GIN indexes

ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_search ON marketplace_listings USING GIN(search_vector);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(display_name, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(search_vector);
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
DROP POLICY IF EXISTS "listing_reviews_select_anyone" ON listing_reviews;
CREATE POLICY "listing_reviews_select_anyone" ON listing_reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own review
DROP POLICY IF EXISTS "listing_reviews_insert_own" ON listing_reviews;
CREATE POLICY "listing_reviews_insert_own" ON listing_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own review
DROP POLICY IF EXISTS "listing_reviews_update_own" ON listing_reviews;
CREATE POLICY "listing_reviews_update_own" ON listing_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own review
DROP POLICY IF EXISTS "listing_reviews_delete_own" ON listing_reviews;
CREATE POLICY "listing_reviews_delete_own" ON listing_reviews
  FOR DELETE USING (auth.uid() = user_id);
-- post_hashtags — extracted hashtags from posts for discovery and trending
CREATE TABLE IF NOT EXISTS post_hashtags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_hashtags_tag ON post_hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_tag_created ON post_hashtags(tag, created_at DESC);

ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_hashtags_select_anyone" ON post_hashtags;
CREATE POLICY "post_hashtags_select_anyone" ON post_hashtags FOR SELECT USING (true);
DROP POLICY IF EXISTS "post_hashtags_insert_all" ON post_hashtags;
CREATE POLICY "post_hashtags_insert_all" ON post_hashtags FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "post_hashtags_delete_all" ON post_hashtags;
CREATE POLICY "post_hashtags_delete_all" ON post_hashtags FOR DELETE USING (true);
-- Migration: Create storage buckets and RLS policies for image uploads

-- Helper: create bucket if not exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('avatars', 'avatars', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('listing-images', 'listing-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('post-images', 'post-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('message-images', 'message-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[])
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Helper function to create policy only if it doesn't exist
CREATE OR REPLACE FUNCTION create_storage_policy(p_name text, p_table text, p_definition text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = p_table AND policyname = p_name) THEN
    EXECUTE p_definition;
  END IF;
END
$$;

SELECT create_storage_policy('avatars_select_anyone', 'objects',
  'CREATE POLICY "avatars_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''avatars'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('avatars_insert_own', 'objects',
  'CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''avatars'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('avatars_update_own', 'objects',
  'CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''avatars'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('avatars_delete_own', 'objects',
  'CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''avatars'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('listings_select_anyone', 'objects',
  'CREATE POLICY "listings_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''listing-images'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('listings_insert_own', 'objects',
  'CREATE POLICY "listings_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''listing-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('listings_update_own', 'objects',
  'CREATE POLICY "listings_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''listing-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('listings_delete_own', 'objects',
  'CREATE POLICY "listings_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''listing-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('posts_select_anyone', 'objects',
  'CREATE POLICY "posts_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''post-images'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('posts_insert_own', 'objects',
  'CREATE POLICY "posts_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''post-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('posts_update_own', 'objects',
  'CREATE POLICY "posts_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''post-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('posts_delete_own', 'objects',
  'CREATE POLICY "posts_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''post-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('messages_select_anyone', 'objects',
  'CREATE POLICY "messages_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''message-images'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('messages_insert_own', 'objects',
  'CREATE POLICY "messages_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''message-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('messages_update_own', 'objects',
  'CREATE POLICY "messages_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''message-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('messages_delete_own', 'objects',
  'CREATE POLICY "messages_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''message-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

DROP FUNCTION IF EXISTS create_storage_policy;
-- Add location column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add show_online_status and show_location boolean columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT FALSE;
-- Community overhaul: post images, quote posts, threaded replies, bookmarks, mentions

-- 1. Add image support to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- 2. Add parent_id to comments for threaded replies
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);

-- 3. Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);

-- 4. Mentions table (for @username notifications)
CREATE TABLE IF NOT EXISTS mentions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentions_select_anyone" ON mentions;
CREATE POLICY "mentions_select_anyone" ON mentions FOR SELECT USING (true);
DROP POLICY IF EXISTS "mentions_insert_any" ON mentions;
CREATE POLICY "mentions_insert_any" ON mentions FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON mentions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_post_id ON mentions(post_id);
-- Marketplace Overhaul: conversations, messages, saved_listings
-- Phase 2.1: Database migration

-- ============================================================
-- CONVERSATIONS: private DMs between buyer/seller on a listing
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id)
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Any authenticated user can create (start) a conversation
DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
CREATE POLICY "conversations_insert_own"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Only participants can update (for last_message_at)
DROP POLICY IF EXISTS "conversations_update_participant" ON conversations;
CREATE POLICY "conversations_update_participant"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================================
-- MESSAGES: individual messages within a conversation
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read) WHERE read = FALSE;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants can read messages in their conversations
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- Participants can insert messages in their conversations
DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- Participants can mark messages as read
DROP POLICY IF EXISTS "messages_update_participant" ON messages;
CREATE POLICY "messages_update_participant"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.seller_id)
    )
  );

-- ============================================================
-- SAVED LISTINGS: bookmark/save marketplace listings
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_saved_listings_user ON saved_listings(user_id, created_at DESC);
CREATE INDEX idx_saved_listings_listing ON saved_listings(listing_id);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_listings_select_own" ON saved_listings;
CREATE POLICY "saved_listings_select_own"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_listings_insert_own" ON saved_listings;
CREATE POLICY "saved_listings_insert_own"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_listings_delete_own" ON saved_listings;
CREATE POLICY "saved_listings_delete_own"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: update conversation last_message_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- Enable Realtime for messages (for chat)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- Online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blocked_users' AND policyname = 'Users can manage their own blocks'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage their own blocks" ON blocked_users;
CREATE POLICY "Users can manage their own blocks"
      ON blocked_users
      USING (auth.uid() = blocker_id)
      WITH CHECK (auth.uid() = blocker_id);
  END IF;
END
$$;

-- Phase 4: Message editing / soft delete
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Phase 4: Reply threading
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Phase 4: Full-text search on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_messages_search_vector ON messages USING GIN(search_vector);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Users manage own subscriptions'
  ) THEN
    DROP POLICY IF EXISTS "Users manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own subscriptions"
      ON push_subscriptions
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

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
ALTER TABLE marketplace_listings
ADD COLUMN IF NOT EXISTS price_options JSONB DEFAULT '[]'::jsonb;
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
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Users can manage own push subs'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own push subs" ON push_subscriptions;
CREATE POLICY "Users can manage own push subs"
      ON push_subscriptions
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
-- Allow users to optionally make products visible to others

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_products BOOLEAN DEFAULT FALSE;

-- New policies: own products always visible, plus public products visible to all authenticated users
DROP POLICY IF EXISTS "products_select_own" ON products;
DROP POLICY IF EXISTS "products_select_own" ON products;
CREATE POLICY "products_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_select_public" ON products;
DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = products.user_id
      AND profiles.public_products = true
    )
  );
-- Backfill NULL/empty `username` from `display_name`, slugified to [a-z0-9_].
-- Slug rules: lowercase, spaces -> underscores, strip anything not [a-z0-9_].

UPDATE profiles
SET username = CASE
  WHEN slug.s <> '' THEN slug.s
  ELSE 'user_' || substr(profiles.user_id::text, 1, 8)
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
-- Security hardening: pin search_path on trigger/definer functions and
-- scope post_hashtags RLS to the post owner.

-- 1) update_conversation_last_message: was flagged function_search_path_mutable
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2) messages_search_update: was flagged function_search_path_mutable
CREATE OR REPLACE FUNCTION messages_search_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 3) post_hashtags: scope INSERT/DELETE to the owning post's author instead of
--    always-true. SELECT stays public (USING true) for trending/discovery.
DROP POLICY IF EXISTS "post_hashtags_insert_all" ON post_hashtags;
DROP POLICY IF EXISTS "post_hashtags_insert_all" ON post_hashtags;
CREATE POLICY "post_hashtags_insert_all" ON post_hashtags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "post_hashtags_delete_all" ON post_hashtags;
DROP POLICY IF EXISTS "post_hashtags_delete_all" ON post_hashtags;
CREATE POLICY "post_hashtags_delete_all" ON post_hashtags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));
-- Scope mentions + notifications INSERT to the acting user.
-- Clears the remaining rls_policy_always_true warnings. Every client-side
-- insert sets actor_id = current user and creates mentions only for the
-- post's own author, so these checks match existing app behavior.

-- mentions: only the post's author may create mentions for their post
DROP POLICY IF EXISTS "mentions_insert_any" ON mentions;
DROP POLICY IF EXISTS "mentions_insert_any" ON mentions;
CREATE POLICY "mentions_insert_any" ON mentions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));

-- notifications: only the actor may create notifications about their own action
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT
  WITH CHECK (actor_id = auth.uid());
-- Revoke anon EXECUTE on SECURITY DEFINER RPCs; retain authenticated grants.
-- The app invokes these while authenticated (user JWT), so public anon access
-- is unnecessary attack surface. Mirrors the existing delete_my_account pattern.

-- is_admin (used by RLS policies + admin checks; must stay callable by authenticated)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- admin_set_ban / admin_set_role (admin UI, called while authenticated)
REVOKE EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean) FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_role(uuid, text) TO authenticated;

-- delete_my_account (called from AuthContext while authenticated)
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
GRANT  EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- Unused by the client: revoke both roles entirely.
DO $$ BEGIN
  IF to_regprocedure('public.auto_confirm_email()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.auto_confirm_email() FROM anon, authenticated';
  END IF;
END $$;
DO $$ BEGIN
  IF to_regprocedure('public.delete_user_account()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon, authenticated';
  END IF;
END $$;

-- Trigger-only function (not RPC-invoked): revoke both roles.
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message() FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes_select" ON comment_likes;
CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "comment_likes_insert" ON comment_likes;
CREATE POLICY "comment_likes_insert" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comment_likes_delete" ON comment_likes;
CREATE POLICY "comment_likes_delete" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
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
DROP POLICY IF EXISTS "products_insert_own" ON products;
CREATE POLICY "products_insert_own" ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
DROP POLICY IF EXISTS "products_update_own" ON products;
DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own" ON products FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned());

-- sessions
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- activity_entries
DROP POLICY IF EXISTS "activity_insert_own" ON activity_entries;
DROP POLICY IF EXISTS "activity_insert_own" ON activity_entries;
CREATE POLICY "activity_insert_own" ON activity_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- posts
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned());

-- post_likes
DROP POLICY IF EXISTS "likes_insert_own" ON post_likes;
DROP POLICY IF EXISTS "likes_insert_own" ON post_likes;
CREATE POLICY "likes_insert_own" ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- post_comments
DROP POLICY IF EXISTS "comments_insert_own" ON post_comments;
DROP POLICY IF EXISTS "comments_insert_own" ON post_comments;
CREATE POLICY "comments_insert_own" ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- follows
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND NOT public.is_banned());

-- marketplace_listings
DROP POLICY IF EXISTS "listings_insert_own" ON marketplace_listings;
DROP POLICY IF EXISTS "listings_insert_own" ON marketplace_listings;
CREATE POLICY "listings_insert_own" ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
DROP POLICY IF EXISTS "listings_update_own" ON marketplace_listings;
DROP POLICY IF EXISTS "listings_update_own" ON marketplace_listings;
CREATE POLICY "listings_update_own" ON marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned());

-- messages
DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
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
COMMIT;
