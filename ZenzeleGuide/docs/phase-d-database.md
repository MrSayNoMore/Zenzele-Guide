# Zenzele Guide — Phase D: Database Schema (ERD, RLS, Indexes)

**Engine:** Postgres 15 (Supabase). All tables in `public` schema unless noted. RLS enabled on every table. Roles in dedicated `user_roles` table, checked via `has_role()` SECURITY DEFINER.

---

## 1. ERD (logical)

```text
┌──────────────────────── IDENTITY & RBAC ────────────────────────┐
│                                                                 │
│  auth.users (managed)                                           │
│      │ 1                                                        │
│      ├──────< profiles (1:1)                                    │
│      │                                                          │
│      └──────< user_roles  (role: app_role enum)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────── CONTENT (SEO) ──────────────────────────┐
│                                                                 │
│  universities ──1:N─< faculties ──1:N─< courses                 │
│       │                                       │                 │
│       │                                       └─< course_subject_requirements
│       │                                                         │
│       └──1:1── aps_rule_versions (active version pointer)       │
│                                                                 │
│  tvet_colleges ──1:N─< tvet_programmes                          │
│                                                                 │
│  bursaries ──1:N─< bursary_cycles  (yearly: open/close dates)   │
│       │                                                         │
│       └──N:M── careers (via bursary_careers)                    │
│                                                                 │
│  careers ──N:M── courses (via career_courses)                   │
│  careers ──N:M── tvet_programmes (via career_tvet_programmes)   │
│                                                                 │
│  guides (long-form SEO articles)                                │
│  subjects (canonical NSC subject list, e.g. Mathematics)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────── RULES (VERSIONED) ──────────────────────┐
│                                                                 │
│  aps_rule_versions  (per university; effective_from/to)         │
│       │                                                         │
│       └── rule_jsonb: { scheme, lo_handling, top_n_subjects,    │
│                         subject_weights, level_table }          │
│                                                                 │
│  nsfas_rule_versions  (singleton-active; effective_from/to)     │
│       └── rule_jsonb: { household_income_max,                   │
│                         disability_income_max,                  │
│                         sassa_auto_qualify, citizenship }       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────── JOURNEY STATE ──────────────────────────┐
│                                                                 │
│  results (saved match results — immutable view)                 │
│   ├─ anon_id  (uuid, nullable)                                  │
│   ├─ user_id  (uuid, nullable, FK auth.users)                   │
│   ├─ journey_type  (grade12 | nsfas | bursary | tvet)           │
│   ├─ inputs_jsonb                                               │
│   ├─ output_jsonb  (the MatchResult[] at compute time)          │
│   ├─ aps_rule_version_ids  jsonb  (per-uni snapshot)            │
│   ├─ nsfas_rule_version_id  uuid                                │
│   └─ computed_at                                                │
│                                                                 │
│  saved_items (favourites)                                       │
│   ├─ user_id  (FK auth.users)                                   │
│   ├─ item_type  (course | bursary | tvet_programme | career)    │
│   ├─ item_id    (uuid)                                          │
│   └─ created_at                                                 │
│                                                                 │
│  user_preferences (1:1 profiles)                                │
│   └─ interests[], province, language_pref                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────── OPS & TELEMETRY ────────────────────────┐
│                                                                 │
│  admin_audit_log  (append-only)                                 │
│  analytics_events (write-only for anon; admin read)             │
│  email_subscriptions (deadline reminders, "coming soon" capture)│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Enums

```sql
create type app_role         as enum ('super_admin','content_admin');
create type journey_type     as enum ('grade12','nsfas','bursary','tvet');
create type match_status     as enum ('qualifies','borderline','below','missing_info');
create type saved_item_type  as enum ('course','bursary','tvet_programme','career');
create type nsc_level        as enum ('1','2','3','4','5','6','7'); -- 7 = 80-100%
create type institution_kind as enum ('university','university_of_tech','comprehensive');
```

---

## 3. Tables (DDL summary — full SQL in migration Phase E)

### 3.1 Identity & RBAC

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  province text,
  grade text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
```

### 3.2 Content — institutions & courses

```sql
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                 -- "uct", "wits", ...
  name text not null,
  short_name text,
  kind institution_kind not null,
  province text not null,
  city text not null,
  website_url text,
  logo_url text,
  hero_image_url text,
  about_md text,
  application_open_date date,
  application_close_date date,
  active_aps_rule_version_id uuid,           -- FK set after rule insert
  is_published boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  slug text not null,
  name text not null,
  unique (university_id, slug)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  slug text not null,
  name text not null,                        -- "BSc Computer Science"
  qualification_type text not null,          -- "Bachelor","Diploma",...
  duration_years numeric(3,1) not null,
  min_aps int,                               -- per institution's own scheme
  description_md text,
  is_published boolean not null default false,
  last_verified_at timestamptz,
  unique (faculty_id, slug)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- "MATH","MLIT","PHSC","ENG_HL",...
  name text not null,
  is_language boolean not null default false,
  is_life_orientation boolean not null default false
);

create table public.course_subject_requirements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  min_level nsc_level not null,              -- e.g. Math level 5
  is_mandatory boolean not null default true,
  notes text,
  unique (course_id, subject_id)
);
```

### 3.3 TVET

```sql
create table public.tvet_colleges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  province text not null,
  city text not null,
  website_url text,
  logo_url text,
  about_md text,
  is_published boolean not null default false,
  last_verified_at timestamptz
);

create table public.tvet_programmes (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.tvet_colleges(id) on delete cascade,
  slug text not null,
  name text not null,
  programme_type text not null,              -- "NCV","Report 191",...
  nqf_level int not null,
  min_grade_completed int not null,          -- e.g. 9, 10, 12
  duration_years numeric(3,1) not null,
  description_md text,
  unique (college_id, slug)
);
```

### 3.4 Bursaries

```sql
create table public.bursaries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  provider text not null,
  provider_type text not null,               -- "government","corporate","ngo"
  covers text[] not null,                    -- {tuition,accommodation,stipend,books}
  fields_of_study text[],                    -- {engineering,health,...} broad tags
  min_household_income int,                  -- nullable = no cap
  max_household_income int,                  -- nullable = no cap
  min_academic_average int,                  -- percentage
  citizenship_required text not null default 'SA', -- 'SA','SADC','any'
  province_restriction text[],               -- null = nationwide
  requires_disability boolean default false,
  bonded boolean default false,              -- work-back requirement
  description_md text,
  website_url text,
  is_published boolean not null default false,
  last_verified_at timestamptz
);

create table public.bursary_cycles (
  id uuid primary key default gen_random_uuid(),
  bursary_id uuid not null references public.bursaries(id) on delete cascade,
  year int not null,
  open_date date not null,
  close_date date not null,
  notes text,
  unique (bursary_id, year)
);
```

### 3.5 Careers (cross-link surface)

```sql
create table public.careers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description_md text,
  median_salary_zar int,
  growth_outlook text,                       -- "high","moderate","low"
  is_published boolean not null default false
);

create table public.career_courses (
  career_id uuid not null references public.careers(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (career_id, course_id)
);

create table public.career_tvet_programmes (
  career_id uuid not null references public.careers(id) on delete cascade,
  programme_id uuid not null references public.tvet_programmes(id) on delete cascade,
  primary key (career_id, programme_id)
);

create table public.bursary_careers (
  bursary_id uuid not null references public.bursaries(id) on delete cascade,
  career_id  uuid not null references public.careers(id) on delete cascade,
  primary key (bursary_id, career_id)
);
```

### 3.6 Guides (SEO long-form)

```sql
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body_md text not null,
  cover_image_url text,
  topic text not null,                       -- "nsfas","aps","careers",...
  published_at timestamptz,
  updated_at timestamptz default now()
);
```

### 3.7 Versioned rules

```sql
create table public.aps_rule_versions (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  version_label text not null,               -- "2026-intake-v1"
  rule_jsonb jsonb not null,                 -- see schema below
  effective_from timestamptz not null,
  effective_to   timestamptz,                -- null = currently active
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (university_id, version_label)
);

create table public.nsfas_rule_versions (
  id uuid primary key default gen_random_uuid(),
  version_label text not null unique,
  rule_jsonb jsonb not null,
  effective_from timestamptz not null,
  effective_to   timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Exactly one active row per university:
create unique index aps_rule_one_active_per_uni
  on public.aps_rule_versions(university_id) where effective_to is null;

create unique index nsfas_rule_one_active
  on public.nsfas_rule_versions((true)) where effective_to is null;
```

**`aps_rule_jsonb` shape:**

```json
{
  "scheme": "uct_fps | wits_composite | uj_aps | standard_aps | custom",
  "input_unit": "percentage",
  "top_n_subjects": 6,
  "exclude_subjects": ["LO"],
  "lo_handling": { "mode": "half_weight|exclude|full", "cap": 3 },
  "level_table": [
    { "min_pct": 80, "points": 7 },
    { "min_pct": 70, "points": 6 },
    { "min_pct": 60, "points": 5 },
    { "min_pct": 50, "points": 4 },
    { "min_pct": 40, "points": 3 },
    { "min_pct": 30, "points": 2 },
    { "min_pct":  0, "points": 1 }
  ],
  "subject_weights": { "MATH": 1.0, "ENG_HL": 1.0 },
  "tiebreakers": ["math_level","english_level"]
}
```

**`nsfas_rule_jsonb` shape:**

```json
{
  "household_income_max": 350000,
  "disability_income_max": 600000,
  "sassa_auto_qualify": true,
  "citizenship": ["SA"],
  "study_levels": ["undergraduate","tvet"],
  "notes_md": "Source: NSFAS 2026 guidelines, published 2025-09-12"
}
```

### 3.8 Journey state

```sql
create table public.results (
  id uuid primary key default gen_random_uuid(),
  anon_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  journey_type journey_type not null,
  inputs_jsonb jsonb not null,
  output_jsonb jsonb not null,
  aps_rule_version_ids jsonb,                -- { "<university_id>": "<version_id>" }
  nsfas_rule_version_id uuid references public.nsfas_rule_versions(id),
  share_token text unique,                   -- random 128-bit for share links
  computed_at timestamptz not null default now(),
  check (anon_id is not null or user_id is not null)
);

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type saved_item_type not null,
  item_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, item_type, item_id)
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interests text[],
  province text,
  language_pref text default 'en',
  updated_at timestamptz default now()
);
```

### 3.9 Ops & telemetry

```sql
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  action text not null,                      -- "create","update","delete","publish"
  table_name text not null,
  record_id uuid,
  diff_jsonb jsonb,
  created_at timestamptz default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  anon_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,                       -- "journey_start","step_complete","result_view","signup"
  props_jsonb jsonb,
  occurred_at timestamptz not null default now()
);

create table public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topic text not null,                       -- "bursary_deadlines","coming_soon:learnerships",...
  created_at timestamptz default now(),
  unique (email, topic)
);
```

---

## 4. Indexes (performance)

```sql
-- Hot read paths
create index on public.courses(faculty_id) where is_published;
create index on public.course_subject_requirements(course_id);
create index on public.bursary_cycles(close_date) where close_date >= current_date;
create index on public.bursaries using gin (fields_of_study);
create index on public.bursaries using gin (covers);
create index on public.universities(province) where is_published;
create index on public.tvet_programmes(college_id);
create index on public.results(user_id, computed_at desc);
create index on public.results(anon_id, computed_at desc);
create index on public.saved_items(user_id, item_type);
create index on public.analytics_events(event, occurred_at desc);
create index on public.admin_audit_log(table_name, record_id, created_at desc);

-- Slug lookups for SEO routes are already covered by unique indexes.
```

---

## 5. GRANTs (REQUIRED — runs after every CREATE TABLE in the migration)

Default block applied per table; deviations noted.

```sql
-- Public content (SEO surface) — anon reads safe published rows
grant select on public.universities, public.faculties, public.courses,
                 public.course_subject_requirements, public.subjects,
                 public.tvet_colleges, public.tvet_programmes,
                 public.bursaries, public.bursary_cycles,
                 public.careers, public.career_courses,
                 public.career_tvet_programmes, public.bursary_careers,
                 public.guides
       to anon, authenticated;

-- Rule versions — anon SELECT (engine reads them at SSR), no writes
grant select on public.aps_rule_versions, public.nsfas_rule_versions
       to anon, authenticated;

-- User-owned
grant select, insert, update, delete on public.profiles, public.user_preferences,
                                         public.saved_items
       to authenticated;

-- Results: anon may INSERT + SELECT own rows (by anon_id), authenticated full on own
grant select, insert on public.results to anon;
grant select, insert, update, delete on public.results to authenticated;

-- Roles: read-only for authenticated (has_role uses SECURITY DEFINER)
grant select on public.user_roles to authenticated;

-- Audit log: select for admins only; inserts via SECURITY DEFINER trigger / service role
grant select on public.admin_audit_log to authenticated;

-- Analytics: anon + authenticated INSERT, admins SELECT
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;

-- Email capture: anon INSERT only
grant insert on public.email_subscriptions to anon, authenticated;

-- Service role full access everywhere
grant all on all tables in schema public to service_role;
```

---

## 6. RLS policies (canonical patterns)

```sql
alter table public.universities enable row level security;
create policy "public reads published universities"
  on public.universities for select
  to anon, authenticated
  using (is_published = true);

-- Same pattern: faculties/courses/course_subject_requirements/tvet_*/bursaries/careers/guides
-- (faculties/course_subject_requirements gate by parent is_published via join in app, or
--  add a denormalised is_published column — Phase E decides; cheaper to denormalise.)

-- Subjects: fully public
create policy "public reads subjects"
  on public.subjects for select to anon, authenticated using (true);

-- Rule versions: fully public read
create policy "public reads aps rules"
  on public.aps_rule_versions for select to anon, authenticated using (true);
create policy "public reads nsfas rules"
  on public.nsfas_rule_versions for select to anon, authenticated using (true);

-- Profiles
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select  to authenticated using (id = auth.uid());
create policy "own profile write"  on public.profiles for update  to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert  to authenticated with check (id = auth.uid());

-- Results
alter table public.results enable row level security;
create policy "anon inserts own result"
  on public.results for insert to anon
  with check (anon_id is not null and user_id is null);
create policy "anon reads own result by anon_id"
  on public.results for select to anon
  using (anon_id is not null);                -- column-level filtering enforced in app via WHERE
create policy "authed reads own results"
  on public.results for select to authenticated
  using (user_id = auth.uid());
create policy "authed inserts own result"
  on public.results for insert to authenticated
  with check (user_id = auth.uid());

-- Saved items
alter table public.saved_items enable row level security;
create policy "own saved items"
  on public.saved_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Roles: read own; admins read all
alter table public.user_roles enable row level security;
create policy "read own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));

-- Audit log: super_admin SELECT
alter table public.admin_audit_log enable row level security;
create policy "super admin reads audit"
  on public.admin_audit_log for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'));

-- Analytics: anyone inserts, super_admin reads
alter table public.analytics_events enable row level security;
create policy "anyone inserts events"
  on public.analytics_events for insert to anon, authenticated with check (true);
create policy "super admin reads events"
  on public.analytics_events for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'));

-- Email subscriptions: anyone inserts, super_admin reads
alter table public.email_subscriptions enable row level security;
create policy "anyone subscribes"
  on public.email_subscriptions for insert to anon, authenticated with check (true);
create policy "super admin reads subs"
  on public.email_subscriptions for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'));
```

**Content writes** (universities, courses, bursaries, rules, guides, …) are NOT exposed via RLS to `authenticated`. Admin server functions verify `has_role('content_admin'|'super_admin')` inside `.handler()` and write via `supabaseAdmin` (service role). This keeps the surface small and avoids accidental write policies.

---

## 7. Security definer helpers

```sql
-- Standard role check (per role guidance)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

-- Auto-profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic rule publish: close current active, open new one
create or replace function public.publish_aps_rule(_university_id uuid, _new_version_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.aps_rule_versions
     set effective_to = now()
   where university_id = _university_id and effective_to is null;
  update public.aps_rule_versions
     set effective_from = now(), effective_to = null
   where id = _new_version_id;
  update public.universities
     set active_aps_rule_version_id = _new_version_id, updated_at = now()
   where id = _university_id;
end $$;

revoke all on function public.publish_aps_rule(uuid,uuid) from public;
grant execute on function public.publish_aps_rule(uuid,uuid) to service_role;
```

---

## 8. Session migration (anon → authed)

Server fn `migrateAnonymousSession({ anonId })`, `.middleware([requireSupabaseAuth])`:

```sql
-- inside a single transaction (server fn wraps it):
update public.results
   set user_id = auth.uid(), anon_id = null
 where anon_id = $1 and user_id is null;
-- analytics_events deliberately NOT re-keyed (preserve anonymous funnel integrity);
-- only re-key behaviour the user "owns" (saved results).
```

---

## 9. Storage buckets

| Bucket | Purpose | Visibility | RLS |
|---|---|---|---|
| `public-content` | university logos, hero images, guide covers | public | admin write only |
| `admin-imports` | CSV uploads for bulk content | private | admin only |
| `result-pdfs` | generated "my results" PDFs (Phase 2) | signed URL | owner read |

---

## 10. pg_cron jobs

| Schedule | Job | Action |
|---|---|---|
| `0 6 * * *` | deadline-reminders | Email subscribers about bursary cycles closing within 14 days |
| `0 3 * * *` | stale-content-flag | Mark `last_verified_at < now() - 90d` rows for admin review |
| `*/15 * * * *` | sitemap-touch | Increment a `seo_meta` row so the sitemap server route revalidates |

---

## 11. Things deliberately NOT in MVP

- **Soft deletes** — `on delete cascade` is fine for our entities; we keep audit log for restorability.
- **Localized content tables** — English-only at MVP; the i18n shape (a `_translations` table per content table) is documented in Phase G (Roadmap), not built now.
- **Materialized views for aggregates** (e.g. "popular courses") — wait until we have real traffic.
- **Full-text search tables** — Postgres `tsvector` indexes can be added later on `courses.name`, `guides.body_md` without schema break.
- **Per-row column-level encryption** — POPIA does not require it for the data we hold; secrets stay in env, no card data, no health data.

---

## 12. Reproducibility contract (MUST hold)

1. Every `results` row stores the exact rule version IDs used to compute it.
2. Displaying a saved result reads `output_jsonb` directly — it does NOT re-run the engine.
3. Recomputing a saved result under a new rule version writes a NEW `results` row and writes an `admin_audit_log` entry tying the old → new IDs. The old row is never mutated.
4. Rule rows are append-only in practice; `effective_to` is the only field that changes after insert, and only via `publish_*_rule()` SECURITY DEFINER functions.

This is what lets us tell a learner six months later: *"On 12 March 2026, under UCT's then-current FPS rules, you qualified for these courses"* — and prove it.
