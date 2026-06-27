# Zenzele Guide — Phase B: Product Requirements Document (MVP)

**Version:** 1.0 (MVP, locked scope)
**Stack decision:** TanStack Start + React 19 + Vite 7 on Cloudflare Workers, with managed Supabase as the backend.
**Locale:** South Africa, English only.
**Target users:** Grade 12 learners, NSFAS-eligible applicants, bursary seekers, and prospective TVET students.

---

## 1. Vision & Positioning

Zenzele Guide is a free, mobile-first decision engine that turns the chaos of "what do I do after matric?" into a clear, personalised next step. We are NOT a directory. We are a **journey engine**: a student answers 6–12 questions and receives a ranked, explainable list of universities, TVET colleges, and bursaries they actually qualify for — with deadlines, requirements, and links to apply.

**Differentiators vs. existing SA EdTech (CareersPortal, ZaBursaries, Studytrust):**
1. Per-institution APS computation (not a generic "your APS is 32" number).
2. Explainable matches ("You qualify because… You don't qualify because…").
3. Anonymous-first — no signup wall before value.
4. Works on a Moto G4 over 3G in Limpopo.

---

## 2. MVP Scope (locked)

### 2.1 Journeys shipped Phase 1
1. **Grade 12 → University** — APS-based course matching across 6 flagship universities.
2. **NSFAS Eligibility Check** — official threshold engine (versioned rules).
3. **Bursary Finder** — filter 30–50 curated national bursaries by field, demographic, and deadline.
4. **TVET Pathway** — NC(V) and Report 191 programme matching across 10 public TVET colleges.

### 2.2 Journeys deferred (visible as "Coming soon" with email capture)
- Postgraduate funding
- Private college search
- SETA learnerships
- International study
- Gap year / volunteer
- Skills bootcamps

### 2.3 Cross-cutting
- Anonymous session persisted in `localStorage` + IndexedDB; migrated to user account on optional signup (Google OAuth or email magic link).
- Save results as a shareable PDF / link.
- Admin CMS for content + rules.
- SEO-indexable programmatic pages for each university, course, bursary, and career.

### 2.4 Explicitly OUT of scope for MVP
- PWA / offline mode (revisit Phase 2)
- Mobile native apps
- Multi-language (i18n scaffolded, not translated)
- Payments / premium tier
- Parent/teacher accounts
- SMS / WhatsApp delivery
- Cross-border SADC institutions

---

## 3. Users & Personas

| Persona | Context | Primary Job |
|---|---|---|
| **Lerato, 17, Grade 12, Soweto** | Shared Android phone, ~500MB data/month, English+Sesotho at home, parents didn't attend university | "Tell me which universities will accept me with my marks, and which bursary will pay." |
| **Sipho, 19, gap year, Mthatha** | Failed to get NSFAS last year, considering TVET | "Tell me honestly if NSFAS will fund me this year and what TVET programme suits me." |
| **Ms. Khumalo, Life Orientation teacher** | Helping 80 learners across 4 classes | "Give me one tool I can put in front of a class that produces a printable plan per learner." (Phase 2 feature — captured in waitlist now.) |
| **Content Admin (Zenzele staff)** | Updates bursary deadlines, APS rules, institution data | "Edit a bursary's close date in <60 seconds without touching code or risking the match engine." |

---

## 4. Core User Stories (MVP)

### Anonymous learner
- As a learner, I can start a journey from the home page without an account.
- As a learner, I see my progress through the journey (e.g. "Step 3 of 7").
- As a learner, I can go back and change a previous answer without losing later ones.
- As a learner, I receive a results page with **status badges** (Qualifies / Borderline / Below / Missing info) and **explanations**.
- As a learner, I can sort results by status, then by APS proximity to my score.
- As a learner, I can save my results to a unique URL and return to them later on the same device.
- As a learner, I can optionally sign up (Google or magic link) to sync results across devices and receive deadline reminders.

### Signed-in learner
- As a learner, I can see all my saved journeys.
- As a learner, I can opt into email reminders for bursary deadlines in my shortlist.
- As a learner, I can delete my account and all data (POPIA).

### Content admin
- As a content admin, I can CRUD universities, faculties, courses, TVET colleges, programmes, bursaries, and careers.
- As a content admin, I can CSV-import bursaries.
- As a content admin, I see `last_verified_at` on every record and can mark "verified today".

### Rules admin (super admin only)
- As a super admin, I can publish a new version of APS rules per university with an effective date.
- As a super admin, I can publish a new version of NSFAS thresholds with an effective date.
- Old results computed under previous rule versions remain reproducible (rule version is stored on the saved result).

---

## 5. The Match Engine (MVP behaviour spec)

### 5.1 Inputs
- 7 NSC subjects (6 + Life Orientation), each as a **raw percentage** (0–100).
- Optional: NBT scores (AQL, MAT, QL) as percentages, used only by institutions that require them (UCT, Wits Health Sciences).
- Citizenship: SA citizen / SA permanent resident / Other.
- Household income band (for NSFAS): ≤R350k / R350k–R600k / >R600k / SASSA recipient / unsure.
- Disability status (boolean, voluntary).
- Province (optional, used for TVET proximity sort).
- Intended field of study (broad: Health / Engineering / Commerce / Humanities / Law / Education / Science / IT / Arts / Agriculture / undecided).

### 5.2 Per-institution APS computation
Each institution stores a **scoring rule set** (versioned, effective-dated):
- Conversion table: percentage → level (NSC 7-point) → APS points (institution-specific table; UCT uses FPS, Wits uses composite, UJ uses standard APS, etc.).
- Subject treatment of Life Orientation: `excluded` | `half-weight` | `full-weight` (default `half-weight`, per-institution override).
- Top-N rule: e.g. "best 6 subjects excluding LO".
- Bonus subjects (e.g. Mathematics +2 for engineering at UP).
- Per-course minimums: minimum APS, minimum subject levels (e.g. Maths ≥ level 5, English HL/FAL ≥ level 4), NBT minimums.

### 5.3 Match status (4 buckets)
For each course the learner is matched against:
- **Qualifies** — all minima met (APS, subjects, NBT if required).
- **Borderline** — APS within 2 points of minimum OR one subject 1 level short.
- **Below** — APS or subject minimum missed by more than borderline threshold.
- **Missing info** — required input not supplied (e.g. NBT for a Health Sciences programme).

### 5.4 Explanations
Every result row carries machine-generated reasoning:
- "Qualifies: APS 34 ≥ 32 required, Maths L5 ≥ L4 required, English L5 ≥ L4 required."
- "Borderline: APS 31 vs 32 required (1 point short)."
- "Below: Maths L3 vs L5 required."
- "Missing info: this programme requires NBT scores; add yours to see your status."

### 5.5 Sorting
Default sort: **status bucket** (Qualifies → Borderline → Below → Missing), then **APS proximity** within bucket (closer to threshold first for Borderline/Below; highest headroom first for Qualifies).

### 5.6 NSFAS engine
- Versioned rule set with effective dates.
- Inputs: citizenship, household income band, SASSA status, disability.
- Output: `funded` | `funded_disability_threshold` | `not_funded` | `auto_qualifies_sassa`, plus the rule version applied and a human explanation.

### 5.7 Bursary engine
- Each bursary has: eligibility predicates (citizenship, field, demographic, province, minimum marks), opens/closes month+day, year cycle, value, link, `last_verified_at`.
- Match: filter by predicates met / partially met / not met.
- Sort: deadline proximity (open and closing soonest first).

---

## 6. Information Architecture & SEO Surface

Two surface types:

### 6.1 App surface (engine, behind a thin loader, SSR for shell)
- `/` — landing
- `/journey/grade-12` — Grade 12 wizard
- `/journey/nsfas` — NSFAS wizard
- `/journey/bursary` — Bursary finder
- `/journey/tvet` — TVET wizard
- `/results/:resultId` — shareable results
- `/saved` — signed-in user's saved journeys
- `/auth` — sign in / sign up
- `/account` — profile + POPIA delete

### 6.2 SEO surface (SSR + edge cache, indexable)
- `/universities` — index
- `/universities/:slug` — e.g. `/universities/university-of-cape-town`
- `/universities/:slug/courses/:courseSlug`
- `/tvet-colleges`
- `/tvet-colleges/:slug`
- `/tvet-colleges/:slug/programmes/:programmeSlug`
- `/bursaries`
- `/bursaries/:slug`
- `/careers`
- `/careers/:slug` — career page with required subjects, related courses, related bursaries
- `/guides/:slug` — long-form editorial (e.g. "How to apply for NSFAS in 2027")

Each SEO page carries: route-specific `<title>`, `<meta description>`, canonical, OG tags, JSON-LD (`Course`, `EducationalOrganization`, `Article`, `FAQPage`, `BreadcrumbList` as appropriate).

`/sitemap.xml` is a dynamic server route that paginates if >50k URLs. `/robots.txt` is static.

---

## 7. Non-Functional Requirements

| Area | Target |
|---|---|
| LCP | ≤2.5s on Moto G4 / 3G; ≤1.8s on 4G |
| FCP | ≤1.5s on 3G |
| JS per route | ≤130KB gzipped |
| First-paint HTML for SEO routes | SSR at edge with 60s fresh / 1h stale-while-revalidate; revalidated on admin publish |
| Accessibility | WCAG 2.1 AA on all engine and results pages |
| Browser support | Chrome ≥90, Safari ≥14, Samsung Internet ≥14, Android WebView ≥90 |
| Uptime | 99.9% (Cloudflare edge + Supabase managed) |
| Data residency | Supabase eu-west (closest managed region) — disclosed in POPIA notice |
| POPIA | Right to access, export, delete; consent for email reminders; minor (under 18) flow flagged in T&Cs |
| Rule reproducibility | Every saved result stores `aps_rule_version_id` and `nsfas_rule_version_id` — re-displaying a result uses the original versions, never live rules |

---

## 8. Analytics & KPIs

Event taxonomy (Phase 1, server-emitted where possible):
- `journey_started` (journey_type)
- `journey_step_advanced` (journey_type, step_index)
- `journey_completed` (journey_type, time_to_complete_sec)
- `result_viewed` (result_id, has_qualifying_match: bool)
- `result_shared` (channel: copy_link | whatsapp | email)
- `signup_initiated`, `signup_completed` (method)
- `bursary_outbound_clicked` (bursary_id)
- `university_outbound_clicked` (university_id)
- `admin_record_updated` (table, record_id) — audit log, not product analytics

North-star KPIs:
- % of journey starts that reach results (target ≥70%)
- % of results pages with at least one "Qualifies" match (target ≥80%)
- Anonymous → signup conversion (target ≥15%)
- Returning user rate at 14 days (target ≥25%)

---

## 9. Content & Data Sourcing (MVP)

| Dataset | Source | Volume | Refresh cadence |
|---|---|---|---|
| Universities | UCT, Wits, UP, UJ, Stellenbosch, UKZN — public prospectuses 2026 intake | 6 institutions, ~60 faculties, ~600 courses | Annual + admin patches |
| APS rule sets | Same prospectuses; cited in `source_url` | 6 rule sets | Versioned per intake year |
| TVET colleges | DHET public list | 10 colleges (top-enrolled), ~50 NC(V) programmes | Annual |
| Bursaries | Public bursary websites (NSFAS, Funza Lushaka, Sasol, Anglo American, etc.) | 30–50 | Per cycle, monthly verification |
| Careers | Curated by content team | 20 careers mapped to subjects + courses | Quarterly |
| NSFAS rules | Official NSFAS site, current cycle | 1 active rule set + historical versions | When NSFAS publishes change |

Every record carries `source_url`, `last_verified_at`, `verified_by_user_id`.

---

## 10. Roles & Permissions

| Role | Scope |
|---|---|
| `learner` | Default. Owns own session, results, saved items. |
| `content_admin` | CRUD content tables (institutions, courses, bursaries, careers, guides). Cannot edit rules or roles. |
| `super_admin` | All `content_admin` powers + publish APS/NSFAS rule versions + manage roles + view audit log. |

Roles stored in `public.user_roles` table with `has_role()` SECURITY DEFINER function (per Supabase RBAC convention).

---

## 11. Launch Gate (definition of done for MVP)

- [ ] 4 journeys complete end-to-end, anonymous and signed-in.
- [ ] 6 universities + ~600 courses seeded with APS rule sets and `source_url`.
- [ ] 10 TVET colleges + ~50 programmes seeded.
- [ ] 30 bursaries seeded with deadlines.
- [ ] 20 career pages live.
- [ ] Admin CMS covers all content tables + CSV bursary import.
- [ ] All SEO routes SSR with unique meta + JSON-LD.
- [ ] `/sitemap.xml` and `/robots.txt` valid.
- [ ] POPIA: privacy policy, T&Cs, account delete flow live.
- [ ] Lighthouse mobile ≥90 on `/`, `/journey/grade-12`, `/universities/university-of-cape-town`.
- [ ] Audit log writing on every admin mutation.
- [ ] Rule versioning verified by re-displaying a year-old saved result with original rule version.

---

## 12. Open Decisions Deferred to Phase 2
1. PWA + offline engine.
2. isiZulu, Afrikaans, Sesotho translation.
3. Teacher / counsellor accounts with class rosters.
4. WhatsApp deadline reminders.
5. Private colleges and SETA learnerships.
6. Postgraduate funding.
7. Recommendation re-ranking from outcome data (which "Qualifies" matches actually converted to applications).
