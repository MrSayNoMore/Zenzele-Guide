-- TVET programmes get a "last checked" stamp like every other record, so the
-- admin editor and the public pages can show when it was verified.
-- Safe to run more than once.
ALTER TABLE public.tvet_programs ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
