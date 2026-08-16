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
CREATE POLICY "post_hashtags_insert_all" ON post_hashtags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "post_hashtags_delete_all" ON post_hashtags;
CREATE POLICY "post_hashtags_delete_all" ON post_hashtags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));
