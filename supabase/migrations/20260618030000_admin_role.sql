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
