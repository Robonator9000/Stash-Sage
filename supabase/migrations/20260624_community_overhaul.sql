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

CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
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

CREATE POLICY "mentions_select_anyone" ON mentions FOR SELECT USING (true);
CREATE POLICY "mentions_insert_any" ON mentions FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON mentions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_post_id ON mentions(post_id);
