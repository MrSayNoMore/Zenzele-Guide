# Zenzele Guide

> "Do it yourself — but not alone."

AI-powered student guidance & careers platform for South African matric students.
Calculates APS scores and matches students to universities, courses, bursaries,
and jobs. Target launch: **August 2026** (ahead of the Nov–Jan matric-results season).

## Repository layout

```
.
├── ZenzeleGuide/
│   ├── web/        # Main web app — React Router v7 + Hono on Cloudflare Workers
│   ├── mobile/     # Expo / React Native app
│   └── shared/     # Shared code
├── Brand Images/   # Logos, icons, social assets + brand kit
└── ZenzeleGuide_BusinessPlan.pdf
```

The deployable site is **`ZenzeleGuide/web`** — set that as the build root in
Cloudflare. Database is Supabase Postgres (reached via Cloudflare Hyperdrive on
Workers); AI matching runs through the Claude API.

## Web app — local development

```bash
cd ZenzeleGuide/web
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```

## Deployment

See [`ZenzeleGuide/web/CLOUDFLARE-DEPLOY.md`](ZenzeleGuide/web/CLOUDFLARE-DEPLOY.md)
for the Cloudflare deploy steps (Hyperdrive setup, bindings, custom domain, AdSense).

## Environment variables

Never commit real secrets. Each `.env` is git-ignored; copy the matching
`.env.example` and fill in your own values. The web app needs:

- `ANYTHING_PROJECT_TOKEN` — create.xyz project token
- `DATABASE_URL` — Supabase Postgres connection string (local dev)
