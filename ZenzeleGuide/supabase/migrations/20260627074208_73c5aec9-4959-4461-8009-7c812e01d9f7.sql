
-- Restrict SECURITY DEFINER / trigger helper functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role / is_admin are called from RLS policies (run as the policy owner, postgres)
-- and from server functions using service_role. Both bypass the PUBLIC grant.

-- Tighten the always-true insert policies
DROP POLICY IF EXISTS "waitlist public insert" ON public.email_waitlist;
CREATE POLICY "waitlist public insert" ON public.email_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

DROP POLICY IF EXISTS "analytics anon insert" ON public.analytics_events;
CREATE POLICY "analytics anon insert" ON public.analytics_events
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND length(event) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "analytics user insert" ON public.analytics_events;
CREATE POLICY "analytics user insert" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() OR user_id IS NULL) AND length(event) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "results anon insert" ON public.results;
CREATE POLICY "results anon insert" ON public.results
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND anon_id IS NOT NULL AND length(anon_id) BETWEEN 8 AND 64);

DROP POLICY IF EXISTS "results user insert" ON public.results;
CREATE POLICY "results user insert" ON public.results
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND anon_id IS NOT NULL));
