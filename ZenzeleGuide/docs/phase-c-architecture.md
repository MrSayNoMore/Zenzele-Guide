# Zenzele Guide — Phase C: System Architecture

**Stack:** TanStack Start (React 19 + Vite 7) → Cloudflare Workers (edge SSR + server fns) → Supabase (managed Supabase: Postgres + Auth + Storage).

---

## 1. Topology (request path)

```text
                     ┌──────────────────────────────────────────────────┐
                     │                  END USER                        │
                     │  (Moto G4 / 3G in Limpopo, Chrome on Android)    │
                     └───────────────────┬──────────────────────────────┘
                                         │  HTTPS
                                         ▼
                ┌────────────────────────────────────────────────────┐
                │             CLOUDFLARE EDGE (300+ POPs)            │
                │  • TLS termination                                 │
                │  • Cache: SEO routes (60s fresh / 1h SWR)          │
                │  • Cache: /sitemap.xml (1h)                        │
                │  • Static assets (immutable, 1y)                   │
                │  • DDoS / bot mitigation                           │
                └───────────────────┬────────────────────────────────┘
                                    │  cache MISS / dynamic
                                    ▼
                ┌────────────────────────────────────────────────────┐
                │     CLOUDFLARE WORKER  (TanStack Start runtime)    │
                │                                                    │
                │  ┌──────────────────────────────────────────────┐  │
                │  │  SSR Handler (routes/__root → leaf)          │  │
                │  │   • Renders HTML for engine + SEO pages      │  │
                │  │   • Streams via React 19                     │  │
                │  └──────────────┬───────────────────────────────┘  │
                │                 │                                  │
                │  ┌──────────────▼───────────────────────────────┐  │
                │  │  Server Functions (createServerFn)           │  │
                │  │   • Match engine (APS / NSFAS / bursary)     │  │
                │  │   • Read content (public, anon Supabase)     │  │
                │  │   • User-scoped reads (requireSupabaseAuth)  │  │
                │  │   • Admin writes (verified role + admin SB)  │  │
                │  └──────────────┬───────────────────────────────┘  │
                │                 │                                  │
                │  ┌──────────────▼───────────────────────────────┐  │
                │  │  Server Routes  (src/routes/api/*)           │  │
                │  │   • /sitemap.xml      (dynamic)              │  │
                │  │   • /robots.txt       (static)               │  │
                │  │   • /api/public/og/:type/:id  (OG images)    │  │
                │  │   • /api/public/webhooks/*  (HMAC verified)  │  │
                │  └──────────────┬───────────────────────────────┘  │
                └─────────────────┼──────────────────────────────────┘
                                  │  Postgres wire / PostgREST
                                  ▼
                ┌────────────────────────────────────────────────────┐
                │           MANAGED SUPABASE  (Postgres+Auth+Storage)        │
                │  • Postgres 15 + RLS                               │
                │  • Auth (Google OAuth via broker, magic link)      │
                │  • Storage (admin CSV uploads, generated PDFs)     │
                │  • pg_cron (nightly: deadline reminders, sitemap   │
                │    rebuild ping, last_verified_at warnings)        │
                └────────────────────────────────────────────────────┘
```

---

## 2. Runtime boundaries

| Layer | Code lives in | Auth posture | What it does |
|---|---|---|---|
| **Browser** | `src/components/**`, `src/hooks/**`, `src/routes/**.tsx` (client islands) | Publishable key, user session in `localStorage` | Renders UI, captures journey state, optimistic updates, realtime (none in MVP) |
| **Edge SSR** | `src/routes/**.tsx` `head()` + `component` | None (server) | Renders HTML shell + initial data into stream |
| **Public server fns** | `src/lib/*.functions.ts` (no middleware) | Server publishable client, RLS as `anon` | Reads SEO content, runs match engine on anonymous input |
| **Authed server fns** | `src/lib/*.functions.ts` + `.middleware([requireSupabaseAuth])` | Bearer token from request, RLS as that user | Saves results to user account, manages preferences, admin reads scoped by `has_role` |
| **Admin server fns** | Same files, `has_role('content_admin' \| 'super_admin')` check inside `.handler()` | After role check: `await import('@/integrations/supabase/client.server')` for service-role writes | Writes to content + rule tables, audit log |
| **Server routes** | `src/routes/api/public/**` | Self-verified (HMAC, signed URL) | Webhooks, OG image generation, sitemap |

The **match engine is pure** — a TypeScript module under `src/engine/` with no Supabase dependency, called from server fns. This lets us unit-test it offline and (Phase 2) reuse it in a worker for batch recomputation.

---

## 3. Caching strategy

| Surface | Cache | TTL | Invalidation |
|---|---|---|---|
| `/`, `/journey/*`, `/results/:id`, `/saved`, `/auth`, `/account` | None (SSR every request) | — | — |
| `/universities/*`, `/tvet-colleges/*`, `/bursaries/*`, `/careers/*`, `/guides/*` | CF edge cache | 60s fresh, 1h SWR | Admin publish → server fn issues `cache.purge(tag)` via Cloudflare Cache API using surrogate-key tag per entity (`univ:<id>`, `course:<id>`, etc.) |
| `/sitemap.xml` | CF edge cache | 1h | Same surrogate-key on any indexable entity publish |
| `/api/public/og/*` | CF edge cache | 7d immutable per (entity, version) | Bumped via version segment in URL |
| Static assets (`/_build/*`, hashed) | CF edge | 1y immutable | Filename hash |
| Browser HTTP cache for engine routes | `Cache-Control: private, no-store` | — | — |

Surrogate-key purging is implemented by setting `Cache-Tag: univ:123,course:456` response headers on SSR pages, then admin mutations call a small helper `purgeTags(['univ:123'])` that hits Cloudflare's Cache API.

---

## 4. Auth model

- **Anonymous-first.** No auth wall on any journey. Anonymous session ID is a 128-bit UUID generated client-side, stored in `localStorage` + IndexedDB. Server fns accept it as an opaque correlation key for analytics; it grants no DB access.
- **Google OAuth** via Supabase Auth (`supabase.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback" })`).
- **Email magic link** via `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/auth/callback" } })`.
- **Session storage:** Supabase JS client → `localStorage`. Bearer attached to every server fn call via `attachSupabaseAuth` in `src/start.ts`.
- **Account migration:** on first successful sign-in, client posts the anonymous session UUID to `migrateAnonymousSession({ anonId })` — an authed server fn that re-keys saved results from `anon_id = ?` to `user_id = auth.uid()` inside a transaction.
- **Protected routes:** all live under `src/routes/_authenticated/` (managed `ssr: false` gate). Only `/saved` and `/account` are protected in MVP. Admin pages live under `_authenticated/admin/` with an additional `has_role` check inside each server fn.

---

## 5. Data flow per journey (example: Grade 12)

1. Browser loads `/journey/grade-12` (SSR, ~30KB HTML).
2. Wizard state lives in a `useReducer` + persisted to `localStorage` per step.
3. On final step, client calls `computeGrade12Match({ data: { inputs } })` — a **public** server fn.
4. Server fn:
   a. Validates inputs with Zod.
   b. Reads active `aps_rule_version` for each of the 6 universities (publishable Supabase, anon SELECT policy, cached in-memory for the request).
   c. Reads all courses + minimums (single query, ~600 rows, ≤50KB).
   d. Runs pure `matchEngine.grade12(inputs, rules, courses)` → returns `MatchResult[]`.
   e. Persists `result` row keyed by `anon_id` (or `user_id` if signed in) with `aps_rule_version_ids` JSON, returns `resultId`.
5. Client navigates to `/results/:resultId`. SSR loads the persisted result (immutable view).

The match engine **never reads live rules at display time** — display reads the rule versions stored on the result row.

---

## 6. Admin & CMS

- Lives at `/_authenticated/admin/*`, gated by `has_role('content_admin')` on every server fn.
- Built with shadcn `Table`, `Form`, `Dialog`. No custom CMS framework.
- CSV import: client uploads to Supabase Storage `admin-imports` bucket (RLS: admin only) → server fn streams, validates row-by-row with Zod, writes via service-role client, emits audit log row, returns per-row success/error report.
- Rule versioning: admin edits a draft, clicks "Publish" → server fn sets `effective_from = now()` on the new version and `effective_to = now()` on the previous one, atomically. Old saved results unaffected (they pin version IDs).
- **Audit log:** every admin mutation writes one row to `admin_audit_log(user_id, action, table_name, record_id, diff_jsonb, created_at)` in the same transaction. Append-only (RLS: SELECT for super_admin, no UPDATE/DELETE for anyone).

---

## 7. Observability

| Signal | Mechanism |
|---|---|
| Server fn errors | Cloudflare Worker logs → Logpush to R2 (Phase 2) or Cloudflare/Supabase logs (MVP) |
| Client errors | Root error boundary in `__root.tsx` (`console.error`); Phase 2 wires a first-party client error report |
| Product analytics | First-party events table `analytics_events(anon_id, user_id, event, props_jsonb, occurred_at)` — write-only RLS for anon, summary views for admin |
| Performance | Web Vitals collected client-side → batched POST to `/api/public/vitals` (sampled 10%) |
| Admin audit | `admin_audit_log` (above) |

No third-party analytics SDK at MVP (keeps JS budget and POPIA surface small).

---

## 8. Deploy topology

| Environment | URL | Trigger | Notes |
|---|---|---|---|
| **Preview** | Cloudflare Workers preview (`*.workers.dev`) | Push to any non-`main` branch (Cloudflare ↔ GitHub Git integration) | Build: `npm run build` |
| **Production** | `zenzeleguide.co.za` (when configured) | Push to `main` → auto-deploy | Cloudflare custom domain |

Cloudflare Workers cold start: ~5ms (V8 isolates). No region pinning needed; Postgres latency from Cape Town POP → Supabase eu-west is ~180ms — acceptable for SSR because the match engine query is one round trip.

**Phase 2** option to cut Postgres latency: nightly export of the content tables to a Workers KV namespace, read content from KV in SSR, hit Postgres only for user-scoped writes. Documented for later, not built now.

---

## 9. Security posture (POPIA-aware)

- HTTPS only, HSTS preload (Cloudflare default).
- All user-data tables RLS-enabled with `auth.uid()`-scoped policies; public content tables have narrow `TO anon` SELECT on safe columns only.
- Roles in dedicated `user_roles` table, checked via `has_role()` SECURITY DEFINER — never on the profile row.
- Secrets: `SUPABASE_SERVICE_ROLE_KEY`, webhook HMAC keys → Cloudflare Worker env (Cloudflare Worker secrets), never in client bundle.
- Webhook routes verify HMAC with `timingSafeEqual` before any DB write.
- POPIA delete: `deleteMyAccount()` authed server fn → service-role cascading delete + auth.users delete + audit log entry.
- No PII in URLs (result IDs are random 128-bit). Result share links carry no name/email.
- Minor flow: T&Cs flag that under-18s should have guardian consent; no parental verification at MVP (documented limitation).

---

## 10. Failure modes & fallbacks

| Failure | Behaviour |
|---|---|
| Supabase unavailable (SSR for SEO page) | Serve stale (SWR) until 1h; after 1h serve generic placeholder with 503 |
| Supabase unavailable (engine submit) | Client shows "we couldn't compute your results — your answers are saved on this device, try again in a minute"; retry button re-submits from `localStorage` |
| Auth broker down | Magic link fallback always available; OAuth button shows "temporarily unavailable" |
| Admin mutation partial failure | Transactional — fail-closed, no audit log row, error surfaced to admin with row index for CSV imports |
| Cache purge fails after admin publish | Logged; max staleness bounded by 1h SWR window |
| Rule version published with bug | Roll forward only — admin publishes a new corrected version. Old (buggy) saved results remain pinned and re-displayable; a backfill server fn can re-compute them under the new version (logged in audit) |

---

## 11. What lives where (cheat sheet for engineers)

```text
src/
├── routes/                  # File-based routing (URL → page or API)
│   ├── __root.tsx           # html shell, providers, sitewide head defaults
│   ├── index.tsx            # /
│   ├── journey.*.tsx        # /journey/grade-12, /journey/nsfas, ...
│   ├── results.$resultId.tsx
│   ├── universities.*.tsx   # SEO routes
│   ├── _authenticated/
│   │   ├── route.tsx        # managed gate, do not edit
│   │   ├── saved.tsx
│   │   ├── account.tsx
│   │   └── admin/*.tsx
│   └── api/
│       ├── public/
│       │   ├── webhooks.*.ts
│       │   ├── og.$type.$id.ts
│       │   └── vitals.ts
│       └── ...
├── engine/                  # PURE match engine — no Supabase imports
│   ├── aps.ts
│   ├── nsfas.ts
│   ├── bursary.ts
│   └── tvet.ts
├── lib/
│   ├── *.functions.ts       # createServerFn (client-reachable; admin imports inside .handler())
│   └── *.server.ts          # server-only helpers (filename-blocked from client)
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── journey/             # wizard, step, progress
│   ├── results/             # status badge, explanation card
│   └── admin/               # tables, forms
├── hooks/
├── integrations/supabase/   # client, client.server, auth-middleware, auth-attacher, types
└── styles.css
```

Engine is deliberately Supabase-free so it can be unit-tested with seed JSON and reused later (batch recompute, mobile app, public API).
