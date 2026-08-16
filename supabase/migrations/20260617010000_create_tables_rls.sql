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
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"      ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
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

CREATE POLICY "products_select_own"  ON products FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "products_insert_own"  ON products FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update_own"  ON products FOR UPDATE  USING (auth.uid() = user_id);
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

CREATE POLICY "sessions_select_own"  ON sessions FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own"  ON sessions FOR INSERT  WITH CHECK (auth.uid() = user_id);
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

CREATE POLICY "activity_select_own"  ON activity_entries FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "activity_insert_own"  ON activity_entries FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_delete_own"  ON activity_entries FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_entries(user_id);

-- 5. settings — user preferences (JSON blob), private
CREATE TABLE IF NOT EXISTS settings (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data      JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_own"  ON settings FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own"  ON settings FOR INSERT  WITH CHECK (auth.uid() = user_id);
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

CREATE POLICY "posts_select_anyone" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own"    ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own"    ON posts FOR UPDATE USING (auth.uid() = user_id);
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

CREATE POLICY "likes_select_anyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own"    ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
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

CREATE POLICY "comments_select_anyone" ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own"    ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
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

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT  WITH CHECK (true);
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

CREATE POLICY "follows_select_anyone"   ON follows FOR SELECT  USING (true);
CREATE POLICY "follows_insert_own"      ON follows FOR INSERT  WITH CHECK (auth.uid() = follower_id);
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

CREATE POLICY "listings_select_anyone" ON marketplace_listings FOR SELECT  USING (true);
CREATE POLICY "listings_insert_own"    ON marketplace_listings FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update_own"    ON marketplace_listings FOR UPDATE  USING (auth.uid() = user_id);
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
