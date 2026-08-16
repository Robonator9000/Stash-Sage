-- Scope mentions + notifications INSERT to the acting user.
-- Clears the remaining rls_policy_always_true warnings. Every client-side
-- insert sets actor_id = current user and creates mentions only for the
-- post's own author, so these checks match existing app behavior.

-- mentions: only the post's author may create mentions for their post
DROP POLICY IF EXISTS "mentions_insert_any" ON mentions;
CREATE POLICY "mentions_insert_any" ON mentions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));

-- notifications: only the actor may create notifications about their own action
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT
  WITH CHECK (actor_id = auth.uid());
