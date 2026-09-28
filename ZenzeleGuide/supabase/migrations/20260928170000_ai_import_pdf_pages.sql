-- AI import: when the AI reads PDF pages directly (Gemini), each section is a
-- fixed run of pages. NULL means sections are pieces of extracted text.
-- Safe to run more than once.
ALTER TABLE public.prospectus_uploads
  ADD COLUMN IF NOT EXISTS chunk_pages INTEGER;
ALTER TABLE public.prospectus_uploads DROP CONSTRAINT IF EXISTS prospectus_uploads_chunk_pages_check;
ALTER TABLE public.prospectus_uploads ADD CONSTRAINT prospectus_uploads_chunk_pages_check
  CHECK (chunk_pages IS NULL OR chunk_pages BETWEEN 1 AND 50);
