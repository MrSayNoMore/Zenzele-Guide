# Zenzele Guide

> "Do it yourself — but not alone."

A free, mobile-first **decision engine** for South African post-matric students.
A learner answers a few questions and gets a ranked, **explainable** list of the
universities, courses, bursaries, and TVET programmes they actually qualify for —
with per-institution APS computation, NSFAS eligibility, and deadlines.

## Repository layout

The application lives in the **`ZenzeleGuide/`** subfolder:

```
ZenzeleGuide/
├── src/                # TanStack Start app (routes, components, engine, integrations)
├── supabase/           # Postgres migrations (schema, RLS, rules)
├── docs/               # Product + architecture + database + match-engine specs
├── package.json
└── vite.config.ts      # TanStack Start + Nitro (Cloudflare Workers) build
```

## Stack

TanStack Start (React 19 SSR + Nitro) · Vite · **Supabase** (Postgres + Auth +
Storage) · shadcn/ui · Tailwind v4 · TanStack Query · Zod. Deploys to
**Cloudflare Workers**.

## Local development

```bash
cd ZenzeleGuide
npm install
cp .env.example .env   # fill in your Supabase values
npm run dev
```

## Deploy — GitHub → Cloudflare Workers

The Cloudflare Workers Git integration builds and deploys on every push.

- **Root directory:** `ZenzeleGuide`
- **Build command:** `npm run build` (Vite + Nitro `cloudflare-module` preset → `.output/`)
- **Deploy:** uses the generated `.output/server/wrangler.json` (`wrangler deploy`)
- Set the Supabase env vars (see `ZenzeleGuide/.env.example`) in the Worker settings.
