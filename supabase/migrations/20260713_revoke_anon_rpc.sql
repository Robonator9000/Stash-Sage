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
REVOKE EXECUTE ON FUNCTION public.auto_confirm_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon, authenticated;

-- Trigger-only function (not RPC-invoked): revoke both roles.
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message() FROM anon, authenticated;
