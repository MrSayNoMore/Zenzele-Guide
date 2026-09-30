-- AI import: photos and screenshots (e.g. bursary posters, photographed
-- prospectus pages) as a source. Safe to run more than once.
ALTER TABLE public.prospectus_uploads DROP CONSTRAINT IF EXISTS prospectus_uploads_source_kind_check;
ALTER TABLE public.prospectus_uploads ADD CONSTRAINT prospectus_uploads_source_kind_check
  CHECK (source_kind IN ('pdf', 'image', 'url', 'text'));
