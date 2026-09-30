-- =========================================================================
-- Opportunities: learnerships, apprenticeships, internships, graduate
-- programmes and short courses. Powers /opportunities and the learnership,
-- graduate and gap-year journeys. Admins add them; learners see only
-- published rows. Safe to run more than once.
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE public.opportunity_kind AS ENUM
    ('learnership', 'apprenticeship', 'internship', 'graduate_programme', 'short_course');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.education_level AS ENUM
    ('none', 'grade_9', 'grade_10', 'grade_11', 'grade_12', 'nqf_4', 'certificate', 'diploma', 'degree', 'postgraduate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  kind public.opportunity_kind NOT NULL,
  title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  description TEXT,
  field_of_study TEXT,
  provinces TEXT[] NOT NULL DEFAULT '{}',          -- empty = anywhere / not restricted
  min_education public.education_level,             -- the minimum qualification asked for
  max_age INTEGER CHECK (max_age IS NULL OR max_age BETWEEN 14 AND 70),
  stipend TEXT,                                     -- as the provider states it
  duration_months INTEGER CHECK (duration_months IS NULL OR duration_months BETWEEN 1 AND 72),
  seta TEXT,                                        -- accrediting SETA, if any
  how_to_apply TEXT,
  website_url TEXT,
  opens_at DATE,
  closes_at DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT opportunities_dates CHECK (opens_at IS NULL OR closes_at IS NULL OR opens_at <= closes_at),
  CONSTRAINT opportunities_published_needs_source CHECK (NOT is_published OR source_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_opportunities_kind ON public.opportunities (kind);
CREATE INDEX IF NOT EXISTS idx_opportunities_closes ON public.opportunities (closes_at);

GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunities public read" ON public.opportunities;
CREATE POLICY "opportunities public read" ON public.opportunities
  FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "opportunities admin all" ON public.opportunities;
CREATE POLICY "opportunities admin all" ON public.opportunities
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_opportunities_updated ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shortlists can hold opportunities too. saved_items.kind is TEXT with a CHECK,
-- so replace that check with one that also allows 'opportunity'.
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.saved_items'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%kind%'
  LOOP
    EXECUTE format('ALTER TABLE public.saved_items DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.saved_items ADD CONSTRAINT saved_items_kind_check
  CHECK (kind IN ('course', 'bursary', 'tvet_program', 'career', 'university', 'opportunity'));

NOTIFY pgrst, 'reload schema';
