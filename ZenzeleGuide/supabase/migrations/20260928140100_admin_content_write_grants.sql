-- =========================================================================
-- Let signed-in admins edit content from the admin editors.
--
-- The content tables only granted SELECT to `authenticated`, so the existing
-- "<table> admin all" RLS policies could never apply: Postgres checks table
-- privileges before RLS. These grants open the door at table level; the RLS
-- policies (USING / WITH CHECK public.is_admin(auth.uid())) still decide who
-- may write, so learners remain read-only. Safe to run more than once.
-- =========================================================================
GRANT INSERT, UPDATE, DELETE ON
  public.universities,
  public.faculties,
  public.courses,
  public.course_requirements,
  public.bursaries,
  public.bursary_cycles,
  public.tvet_colleges,
  public.tvet_programs,
  public.aps_rule_versions,
  public.nsfas_rule_versions,
  public.careers,
  public.career_subjects
TO authenticated;

-- RLS policy expressions run with the privileges of the user making the
-- request, not the policy owner. 20260627074208 revoked EXECUTE on these from
-- `authenticated`, which made every policy that calls is_admin() fail with
-- "permission denied for function is_admin" for signed-in users (admin
-- writes, and reads where an admin policy also applies). Both functions only
-- return true/false for a given user id.
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
