-- =========================================================================
-- AI-assisted content import (admin only).
-- An admin supplies a source (PDF text, a web page or pasted text); the AI
-- drafts courses or bursaries with a verbatim quote for every value; code and
-- a second AI pass check the drafts; a human approves or rejects each one.
-- Builds on the existing prospectus_uploads / draft_extractions tables.
-- Safe to run more than once.
-- =========================================================================

-- Imports can come from a web page or pasted text, not only a stored file.
ALTER TABLE public.prospectus_uploads ALTER COLUMN storage_path DROP NOT NULL;
ALTER TABLE public.prospectus_uploads
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'courses',
  ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_text TEXT,
  ADD COLUMN IF NOT EXISTS page_range TEXT,
  ADD COLUMN IF NOT EXISTS ai_model TEXT,
  ADD COLUMN IF NOT EXISTS chunks_total INTEGER,
  ADD COLUMN IF NOT EXISTS chunks_done INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.prospectus_uploads DROP CONSTRAINT IF EXISTS prospectus_uploads_content_type_check;
ALTER TABLE public.prospectus_uploads ADD CONSTRAINT prospectus_uploads_content_type_check
  CHECK (content_type IN ('courses', 'bursaries'));
ALTER TABLE public.prospectus_uploads DROP CONSTRAINT IF EXISTS prospectus_uploads_source_kind_check;
ALTER TABLE public.prospectus_uploads ADD CONSTRAINT prospectus_uploads_source_kind_check
  CHECK (source_kind IN ('pdf', 'url', 'text'));
-- Keep stored source text bounded (about 150 pages of prospectus text).
ALTER TABLE public.prospectus_uploads DROP CONSTRAINT IF EXISTS prospectus_uploads_source_text_size;
ALTER TABLE public.prospectus_uploads ADD CONSTRAINT prospectus_uploads_source_text_size
  CHECK (source_text IS NULL OR length(source_text) <= 600000);

-- Drafts can now be bursaries too, and carry their verification results.
ALTER TABLE public.draft_extractions DROP CONSTRAINT IF EXISTS draft_extractions_target_table_check;
ALTER TABLE public.draft_extractions ADD CONSTRAINT draft_extractions_target_table_check
  CHECK (target_table IN ('courses', 'course_requirements', 'aps_rule_versions', 'faculties', 'bursaries'));
ALTER TABLE public.draft_extractions
  ADD COLUMN IF NOT EXISTS checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chunk_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_draft_extractions_upload ON public.draft_extractions (upload_id);
