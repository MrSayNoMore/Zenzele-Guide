-- =========================================================================
-- Profiles: first name, surname and career stage, captured at sign-up.
-- The sign-up form sends them as user metadata; handle_new_user copies
-- them into public.profiles. Safe to run more than once.
-- =========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS career_stage TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_career_stage_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_career_stage_check CHECK (
  career_stage IS NULL OR career_stage IN (
    'high_school',   -- High school learner
    'tvet_college',  -- TVET / college student
    'university',    -- University student
    'graduate',      -- Graduate / job seeker
    'intern',        -- Intern / learnership
    'junior',        -- Junior (0-2 years working)
    'intermediate',  -- Intermediate (2-5 years)
    'senior',        -- Senior (5+ years)
    'other'
  )
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_name_length_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_length_check CHECK (
  (first_name IS NULL OR length(first_name) <= 60) AND
  (last_name IS NULL OR length(last_name) <= 60)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  fname TEXT := NULLIF(left(btrim(meta->>'first_name'), 60), '');
  lname TEXT := NULLIF(left(btrim(meta->>'last_name'), 60), '');
  stage TEXT := meta->>'career_stage';
BEGIN
  -- Ignore unknown stages rather than failing the sign-up.
  IF stage IS NOT NULL AND stage NOT IN (
    'high_school', 'tvet_college', 'university', 'graduate', 'intern',
    'junior', 'intermediate', 'senior', 'other'
  ) THEN
    stage := NULL;
  END IF;

  INSERT INTO public.profiles (id, display_name, first_name, last_name, career_stage)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(concat_ws(' ', fname, lname)), ''), meta->>'full_name'),
    fname,
    lname,
    stage
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
