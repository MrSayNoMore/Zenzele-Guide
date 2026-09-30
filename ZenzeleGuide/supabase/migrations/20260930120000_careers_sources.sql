-- Careers get a source link and "last checked" date like every other record
-- (salary ranges and outlooks change), so learners can see where the
-- information comes from. Safe to run more than once.
ALTER TABLE public.careers
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
