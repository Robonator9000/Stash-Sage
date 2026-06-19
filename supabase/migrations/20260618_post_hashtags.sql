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

CREATE POLICY "post_hashtags_select_anyone" ON post_hashtags FOR SELECT USING (true);
CREATE POLICY "post_hashtags_insert_all" ON post_hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "post_hashtags_delete_all" ON post_hashtags FOR DELETE USING (true);
