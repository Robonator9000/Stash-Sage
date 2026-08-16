-- Migration: Fix RLS policies and add missing triggers on existing remote DB
-- Apply AFTER 20260617_create_tables_rls.sql if tables already exist.
-- Idempotent — safe to re-run.

-- Fix 1: profiles SELECT policy was restricting to own profile only,
-- which breaks social features (reading other users' names/avatars for posts, likes, comments, etc.)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
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
