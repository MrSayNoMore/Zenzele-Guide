-- Zenzele Guide — Postgres schema + seed data
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (uses "if not exists"); the seed block at the bottom is
-- guarded so it only inserts when a table is empty.

create extension if not exists "pgcrypto"; -- provides gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists institutions (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  short_name      text,
  type            text,            -- 'University' | 'TVET College' | 'Private College'
  province        text,
  city            text,
  website         text,
  description     text,
  nsfas_eligible  boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists courses (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references institutions(id) on delete cascade,
  name            text not null,
  faculty         text,
  aps_minimum     integer not null default 0,
  duration_years  integer,
  created_at      timestamptz not null default now()
);
create index if not exists idx_courses_institution on courses(institution_id);
create index if not exists idx_courses_aps on courses(aps_minimum);

create table if not exists bursaries (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  provider            text,
  amount_description  text,
  fields_of_study     text[] not null default '{}',
  province            text,        -- null = nationwide
  min_aps             integer,
  closing_date        date,
  application_url     text,
  is_nsfas            boolean not null default false,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table if not exists jobs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  company          text not null,
  type             text not null default 'internship', -- stored lowercase
  province         text,
  location         text,
  stipend          text,
  description      text,
  requirements     text,           -- one requirement per line ("\n")
  closing_date     date,
  application_url  text,
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  views            integer not null default 0,
  created_at       timestamptz not null default now()
);

create table if not exists blog_posts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  title              text not null,
  category           text,
  excerpt            text,
  content            text,
  read_time_minutes  integer default 5,
  is_published       boolean not null default true,
  published_at       timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

-- profiles + recommendations: the /api/analyse route writes a recommendation
-- row only when a profile_id is supplied (the public portal does not send one),
-- so these are optional but present for completeness.
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table if not exists recommendations (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references profiles(id) on delete cascade,
  institution_id  uuid references institutions(id) on delete set null,
  course_id       uuid references courses(id) on delete set null,
  match_score     integer,
  reason          text,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA (only runs if the table is empty)
-- ─────────────────────────────────────────────────────────────────────────────

insert into institutions (name, short_name, type, province, city, website, description, nsfas_eligible)
select * from (values
  ('University of the Witwatersrand', 'Wits', 'University', 'Gauteng', 'Johannesburg', 'https://www.wits.ac.za', 'Leading research university in Johannesburg.', true),
  ('University of Pretoria', 'UP', 'University', 'Gauteng', 'Pretoria', 'https://www.up.ac.za', 'One of South Africa''s largest residential universities.', true),
  ('University of Cape Town', 'UCT', 'University', 'Western Cape', 'Cape Town', 'https://www.uct.ac.za', 'Top-ranked university on the African continent.', true),
  ('University of KwaZulu-Natal', 'UKZN', 'University', 'KwaZulu-Natal', 'Durban', 'https://www.ukzn.ac.za', 'Research-led university across five campuses.', true),
  ('Tshwane University of Technology', 'TUT', 'University', 'Gauteng', 'Pretoria', 'https://www.tut.ac.za', 'Largest university of technology in South Africa.', true),
  ('False Bay TVET College', 'False Bay', 'TVET College', 'Western Cape', 'Cape Town', 'https://www.falsebaycollege.co.za', 'Public TVET college offering vocational programmes.', true)
) as v
where not exists (select 1 from institutions);

insert into courses (institution_id, name, faculty, aps_minimum, duration_years)
select i.id, c.name, c.faculty, c.aps_minimum, c.duration_years
from (values
  ('Wits',      'BSc Engineering (Civil)',                  'Engineering',            32, 4),
  ('Wits',      'Bachelor of Commerce (Accounting)',        'Commerce',               30, 3),
  ('Wits',      'MBBCh (Medicine)',                         'Health Sciences',        40, 6),
  ('UP',        'BEng (Mechanical)',                        'Engineering',            32, 4),
  ('UP',        'BSc Computer Science',                     'Science',                30, 3),
  ('UCT',       'BSc (Computer Science)',                   'Science',                30, 3),
  ('UCT',       'Bachelor of Laws (LLB)',                   'Law',                    33, 4),
  ('UKZN',      'Bachelor of Education (Foundation Phase)', 'Education',              28, 4),
  ('UKZN',      'Bachelor of Nursing',                      'Health Sciences',        28, 4),
  ('TUT',       'National Diploma: Information Technology', 'Information Technology', 24, 3),
  ('False Bay', 'Engineering Studies (N1–N3)',              'Engineering',            18, 1)
) as c(short_name, name, faculty, aps_minimum, duration_years)
join institutions i on i.short_name = c.short_name
where not exists (select 1 from courses);

insert into bursaries (name, provider, amount_description, fields_of_study, province, min_aps, closing_date, application_url, is_nsfas, is_active)
select * from (values
  ('NSFAS Bursary 2026', 'NSFAS', 'Full tuition, accommodation, meals & monthly allowance', array['Engineering','Medicine','Business','Teaching','Science','Law','Arts'], null::text, 0, date '2026-11-30', 'https://www.nsfas.org.za', true, true),
  ('Sasol Engineering Bursary', 'Sasol', 'Full tuition, books, accommodation & monthly stipend', array['Engineering','Science'], 'Gauteng', 32, date '2026-08-31', 'https://www.sasolbursaries.com', false, true),
  ('Transnet Engineering Bursary', 'Transnet', 'Full cost of study + vacation work', array['Engineering'], null::text, 30, date '2026-09-15', 'https://www.transnet.net', false, true),
  ('Funza Lushaka Teaching Bursary', 'Department of Basic Education', 'Full tuition + living allowance for future teachers', array['Teaching','Education'], null::text, 26, date '2026-10-31', 'https://www.funzalushaka.doe.gov.za', false, true),
  ('Allan Gray Orbis Fellowship', 'Allan Gray Orbis Foundation', 'Full tuition, accommodation, laptop & mentorship', array['Business','Science','Engineering'], 'Western Cape', 34, date '2026-07-31', 'https://www.allangrayorbis.org', false, true),
  ('Investec Bursary Programme', 'Investec', 'Full tuition + accommodation for commerce students', array['Business','Accounting'], 'Gauteng', 33, date '2026-08-15', 'https://www.investec.com', false, true)
) as v
where not exists (select 1 from bursaries);

insert into jobs (title, company, type, province, location, stipend, description, requirements, closing_date, application_url, is_featured, is_active, views)
select * from (values
  ('IT Support Internship', 'Dimension Data', 'internship', 'Gauteng', 'Johannesburg', 'R7,000/month', 'A 12-month IT support internship for recent graduates.', E'Matric with Mathematics\nDiploma or degree in IT\nGood communication skills', date '2026-07-31', 'https://example.com/apply', true, true, 0),
  ('Engineering Learnership', 'Transnet', 'learnership', 'KwaZulu-Natal', 'Durban', 'R6,500/month', 'Hands-on engineering learnership with structured training.', E'Grade 12 with Maths and Physical Science\nAged 18-25', date '2026-08-15', 'https://example.com/apply', true, true, 0),
  ('Graduate Trainee — Finance', 'Standard Bank', 'graduate', 'Gauteng', 'Johannesburg', 'Market related', 'Two-year rotational graduate programme in finance.', E'BCom degree\nStrong academic record', date '2026-09-01', 'https://example.com/apply', false, true, 0),
  ('Junior Software Developer', 'Takealot', 'fulltime', 'Western Cape', 'Cape Town', 'R25,000/month', 'Join our e-commerce engineering team.', E'Degree or diploma in CS/IT\n1+ year experience\nJavaScript & Python', date '2026-07-20', 'https://example.com/apply', false, true, 0),
  ('Nursing Learnership', 'Netcare', 'learnership', 'Gauteng', 'Pretoria', 'R5,000/month', 'Enrolled nurse learnership programme.', E'Grade 12 with Life Sciences\nClear criminal record', date '2026-10-01', 'https://example.com/apply', false, true, 0),
  ('Teaching Assistant Programme', 'Department of Education', 'internship', 'Eastern Cape', 'East London', 'R4,000/month', 'Support classroom teaching in local schools.', E'Grade 12\nPassion for education', date '2026-08-30', 'https://example.com/apply', false, true, 0)
) as v
where not exists (select 1 from jobs);

insert into blog_posts (slug, title, category, excerpt, content, read_time_minutes, is_published)
select * from (values
  ('how-to-apply-nsfas-2026', 'How to apply for NSFAS in 2026', 'NSFAS', 'A step-by-step guide to the NSFAS application process, deadlines and required documents.', 'Full guide content goes here.', 6, true),
  ('understanding-your-aps-score', 'Understanding your APS score', 'APS tips', 'What an APS score is, how it is calculated, and how to improve your chances of admission.', 'Full guide content goes here.', 4, true),
  ('top-bursaries-for-engineering', 'Top bursaries for engineering students', 'Bursaries', 'The best-funded engineering bursaries in South Africa and how to apply for them.', 'Full guide content goes here.', 5, true)
) as v
where not exists (select 1 from blog_posts);
