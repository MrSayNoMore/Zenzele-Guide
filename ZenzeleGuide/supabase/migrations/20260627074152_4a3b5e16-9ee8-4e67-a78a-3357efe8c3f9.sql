
-- =========================================================================
-- 1. ENUMS + UTILITY FUNCTIONS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'content_admin', 'learner');
CREATE TYPE public.match_status AS ENUM ('qualifies', 'borderline', 'below', 'missing_info');
CREATE TYPE public.draft_state AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.uni_type AS ENUM ('traditional', 'university_of_technology', 'comprehensive');
CREATE TYPE public.tvet_program_type AS ENUM ('ncv', 'report_191', 'occupational');
CREATE TYPE public.journey_type AS ENUM ('grade_12', 'nsfas', 'bursary', 'tvet', 'grade_10', 'grade_11', 'gap_year', 'university', 'learnership', 'graduate');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========================================================================
-- 2. PROFILES + ROLES
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  province TEXT,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self upsert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'content_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 3. SUBJECTS (NSC catalogue)
-- =========================================================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_language BOOLEAN NOT NULL DEFAULT false,
  is_life_orientation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects public read" ON public.subjects FOR SELECT TO anon, authenticated USING (true);

-- =========================================================================
-- 4. UNIVERSITIES / FACULTIES / COURSES / REQUIREMENTS
-- =========================================================================
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  uni_type public.uni_type NOT NULL DEFAULT 'traditional',
  province TEXT,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_universities_published ON public.universities (is_published);
GRANT SELECT ON public.universities TO anon, authenticated;
GRANT ALL ON public.universities TO service_role;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "universities public read" ON public.universities FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "universities admin all" ON public.universities FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_universities_updated BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, slug)
);
CREATE INDEX idx_faculties_university ON public.faculties (university_id);
GRANT SELECT ON public.faculties TO anon, authenticated;
GRANT ALL ON public.faculties TO service_role;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faculties public read" ON public.faculties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faculties admin all" ON public.faculties FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_faculties_updated BEFORE UPDATE ON public.faculties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  qualification_type TEXT,
  duration_years NUMERIC(3,1),
  min_aps INTEGER,
  field_of_study TEXT,
  description TEXT,
  requires_nbt BOOLEAN NOT NULL DEFAULT false,
  draft_state public.draft_state NOT NULL DEFAULT 'approved',
  is_published BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (faculty_id, slug)
);
CREATE INDEX idx_courses_faculty ON public.courses (faculty_id);
CREATE INDEX idx_courses_published ON public.courses (is_published, draft_state);
CREATE INDEX idx_courses_field ON public.courses (field_of_study);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read" ON public.courses FOR SELECT TO anon, authenticated USING (is_published = true AND draft_state = 'approved');
CREATE POLICY "courses admin all" ON public.courses FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.course_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE RESTRICT,
  subject_group TEXT, -- e.g. "Mathematics" (vs "Mathematical Literacy" alternative)
  min_level INTEGER NOT NULL CHECK (min_level BETWEEN 1 AND 7),
  is_required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_requirements_course ON public.course_requirements (course_id);
GRANT SELECT ON public.course_requirements TO anon, authenticated;
GRANT ALL ON public.course_requirements TO service_role;
ALTER TABLE public.course_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_requirements public read" ON public.course_requirements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "course_requirements admin all" ON public.course_requirements FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 5. APS + NSFAS RULE VERSIONS (versioned, effective-dated)
-- =========================================================================
CREATE TABLE public.aps_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  rules JSONB NOT NULL, -- conversion table, LO treatment, top-N, bonuses, borderline thresholds
  notes TEXT,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_aps_rule_active ON public.aps_rule_versions (university_id) WHERE effective_to IS NULL;
GRANT SELECT ON public.aps_rule_versions TO anon, authenticated;
GRANT ALL ON public.aps_rule_versions TO service_role;
ALTER TABLE public.aps_rule_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aps_rules public read" ON public.aps_rule_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "aps_rules admin all" ON public.aps_rule_versions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.nsfas_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label TEXT NOT NULL UNIQUE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  rules JSONB NOT NULL, -- income thresholds, disability threshold, citizenship rules, SASSA auto-qualify
  notes TEXT,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_nsfas_rule_active ON public.nsfas_rule_versions ((1)) WHERE effective_to IS NULL;
GRANT SELECT ON public.nsfas_rule_versions TO anon, authenticated;
GRANT ALL ON public.nsfas_rule_versions TO service_role;
ALTER TABLE public.nsfas_rule_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nsfas_rules public read" ON public.nsfas_rule_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "nsfas_rules admin all" ON public.nsfas_rule_versions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 6. TVET COLLEGES + PROGRAMMES
-- =========================================================================
CREATE TABLE public.tvet_colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  province TEXT,
  website_url TEXT,
  description TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tvet_colleges TO anon, authenticated;
GRANT ALL ON public.tvet_colleges TO service_role;
ALTER TABLE public.tvet_colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tvet_colleges public read" ON public.tvet_colleges FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "tvet_colleges admin all" ON public.tvet_colleges FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_tvet_colleges_updated BEFORE UPDATE ON public.tvet_colleges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tvet_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.tvet_colleges(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  program_type public.tvet_program_type NOT NULL,
  field_of_study TEXT,
  nqf_level INTEGER,
  duration_years NUMERIC(3,1),
  min_grade INTEGER, -- e.g. 9 for NC(V)
  description TEXT,
  draft_state public.draft_state NOT NULL DEFAULT 'approved',
  is_published BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (college_id, slug)
);
CREATE INDEX idx_tvet_programs_college ON public.tvet_programs (college_id);
CREATE INDEX idx_tvet_programs_field ON public.tvet_programs (field_of_study);
GRANT SELECT ON public.tvet_programs TO anon, authenticated;
GRANT ALL ON public.tvet_programs TO service_role;
ALTER TABLE public.tvet_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tvet_programs public read" ON public.tvet_programs FOR SELECT TO anon, authenticated USING (is_published = true AND draft_state = 'approved');
CREATE POLICY "tvet_programs admin all" ON public.tvet_programs FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_tvet_programs_updated BEFORE UPDATE ON public.tvet_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 7. BURSARIES + CYCLES + REQUIREMENTS
-- =========================================================================
CREATE TABLE public.bursaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  fields_of_study TEXT[] NOT NULL DEFAULT '{}',
  value_description TEXT, -- e.g. "Full tuition + accommodation + laptop"
  description TEXT,
  website_url TEXT,
  eligibility JSONB NOT NULL DEFAULT '{}'::jsonb, -- citizenship, demographic, income, min_marks
  is_published BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bursaries_published ON public.bursaries (is_published);
CREATE INDEX idx_bursaries_fields ON public.bursaries USING gin (fields_of_study);
GRANT SELECT ON public.bursaries TO anon, authenticated;
GRANT ALL ON public.bursaries TO service_role;
ALTER TABLE public.bursaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bursaries public read" ON public.bursaries FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "bursaries admin all" ON public.bursaries FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_bursaries_updated BEFORE UPDATE ON public.bursaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bursary_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bursary_id UUID NOT NULL REFERENCES public.bursaries(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  opens_at DATE,
  closes_at DATE,
  notes TEXT,
  UNIQUE (bursary_id, year)
);
CREATE INDEX idx_bursary_cycles_close ON public.bursary_cycles (closes_at);
GRANT SELECT ON public.bursary_cycles TO anon, authenticated;
GRANT ALL ON public.bursary_cycles TO service_role;
ALTER TABLE public.bursary_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bursary_cycles public read" ON public.bursary_cycles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bursary_cycles admin all" ON public.bursary_cycles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 8. CAREERS
-- =========================================================================
CREATE TABLE public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  field_of_study TEXT,
  description TEXT,
  typical_salary_range TEXT,
  outlook TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.careers TO anon, authenticated;
GRANT ALL ON public.careers TO service_role;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "careers public read" ON public.careers FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "careers admin all" ON public.careers FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_careers_updated BEFORE UPDATE ON public.careers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.career_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  recommended_min_level INTEGER CHECK (recommended_min_level BETWEEN 1 AND 7),
  is_essential BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (career_id, subject_id)
);
GRANT SELECT ON public.career_subjects TO anon, authenticated;
GRANT ALL ON public.career_subjects TO service_role;
ALTER TABLE public.career_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_subjects public read" ON public.career_subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "career_subjects admin all" ON public.career_subjects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 9. RESULTS + SAVED ITEMS (anon-first, migrated on signup)
-- =========================================================================
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_slug TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
  anon_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  journey public.journey_type NOT NULL,
  inputs JSONB NOT NULL,
  output JSONB NOT NULL,
  engine_version TEXT NOT NULL,
  aps_rule_version_ids UUID[] NOT NULL DEFAULT '{}',
  nsfas_rule_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_results_user ON public.results (user_id);
CREATE INDEX idx_results_anon ON public.results (anon_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated;
GRANT SELECT, INSERT ON public.results TO anon;
GRANT ALL ON public.results TO service_role;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
-- Anyone with the share slug can read; lookups are by slug, never by enumeration.
CREATE POLICY "results public read by slug" ON public.results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "results anon insert" ON public.results FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "results user insert" ON public.results FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "results user update own" ON public.results FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "results user delete own" ON public.results FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('course', 'bursary', 'tvet_program', 'career', 'university')),
  ref_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_items owner all" ON public.saved_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- 10. PROSPECTUS UPLOADS + AI EXTRACTIONS (admin-only)
-- =========================================================================
CREATE TABLE public.prospectus_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  intake_year INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'extracting', 'extracted', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospectus_uploads TO authenticated;
GRANT ALL ON public.prospectus_uploads TO service_role;
ALTER TABLE public.prospectus_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospectus_uploads admin all" ON public.prospectus_uploads FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_prospectus_updated BEFORE UPDATE ON public.prospectus_uploads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.draft_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.prospectus_uploads(id) ON DELETE CASCADE,
  target_table TEXT NOT NULL CHECK (target_table IN ('courses', 'course_requirements', 'aps_rule_versions', 'faculties')),
  payload JSONB NOT NULL,
  confidence NUMERIC(3,2),
  state public.draft_state NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  promoted_row_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_draft_extractions_state ON public.draft_extractions (state);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draft_extractions TO authenticated;
GRANT ALL ON public.draft_extractions TO service_role;
ALTER TABLE public.draft_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "draft_extractions admin all" ON public.draft_extractions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 11. AUDIT LOG + ANALYTICS + EMAIL WAITLIST
-- =========================================================================
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON public.admin_audit_log (actor_id, created_at DESC);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_event_time ON public.analytics_events (event, created_at DESC);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics anon insert" ON public.analytics_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "analytics user insert" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "analytics admin read" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.email_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  journey public.journey_type,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, journey)
);
GRANT INSERT ON public.email_waitlist TO anon, authenticated;
GRANT SELECT ON public.email_waitlist TO authenticated;
GRANT ALL ON public.email_waitlist TO service_role;
ALTER TABLE public.email_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist public insert" ON public.email_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "waitlist admin read" ON public.email_waitlist FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
