# Deploying Zenzele Guide to Cloudflare

This app runs a **React Router v7 + Hono** server with **Supabase Postgres**.
Cloudflare's runtime (Workers) **cannot open raw TCP** to Postgres, so the
database connection goes through **Cloudflare Hyperdrive**. The code is already
prepared for this — `src/app/api/utils/sql.js` reads a Hyperdrive binding named
`HYPERDRIVE` on Cloudflare and falls back to `DATABASE_URL` locally.

> ⚠️ Honest note: the Workers runtime can't be exercised on this Windows machine
> locally, so the **first `wrangler deploy` is the real test**. The steps below
> are correct in shape; you may need to tweak build output paths or SSL settings
> on the first run (noted inline).

---

## 0. One-time prerequisites
```bash
cd web
npm install -D wrangler          # Cloudflare CLI
npx wrangler login               # opens browser, log into your Cloudflare account
```

## 1. Runtime must be `cloudflare` for the build
In `vite.config.ts` and `__create/index.ts` the runtime should be **`cloudflare`**:
- `vite.config.ts` → `reactRouterHonoServer({ ..., runtime: 'cloudflare' })`
- `__create/index.ts` → `import { createHonoServer } from 'react-router-hono-server/cloudflare'`

(The create.xyz tooling *defaults* to `cloudflare`, so this is usually already
set. For **local dev** you flip both back to `node` — that's the only reason we
kept switching them.)

## 2. Create a Hyperdrive over your Supabase database
Use your Supabase **Session pooler** connection string (the one in `.env`):
```bash
npx wrangler hyperdrive create zenzele-db \
  --connection-string="postgresql://postgres.yshfoprtsaradmqyrgut:YOUR-PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```
Copy the returned **id** into `wrangler.jsonc` → `hyperdrive[0].id`
(replace `<PASTE_YOUR_HYPERDRIVE_ID_HERE>`). Keep the binding name `HYPERDRIVE`.

## 3. Build & deploy
```bash
npm run deploy        # runs `react-router build` then `wrangler deploy`
```
- If `wrangler deploy` complains the `main`/`assets` paths don't exist, look in
  `./build` after the build and update those two paths in `wrangler.jsonc` to match.
- If the DB connection errors on Workers, try removing `ssl: 'require'` from
  `sql.js` (Hyperdrive terminates SSL for you) — that's the most likely tweak.

**Alternative (Git-based):** push to GitHub, then in the Cloudflare dashboard →
Workers & Pages → Create → connect the repo, set build command `npm run build`,
and add the Hyperdrive binding in the project's Settings → Bindings.

## 4. Custom domain (required for AdSense)
In the Cloudflare dashboard, add your domain (e.g. `zenzeleguide.co.za`) to the
deployed project. AdSense can only approve a real domain, never a `*.workers.dev`
preview URL.

## 5. Turn on Google AdSense (after the site is live + approved)
In `src/components/ads/ad-config.js`:
```js
export const AD_NETWORK = "adsense";
export const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
// + paste each unit's slot id into AD_FORMATS[...].adsenseSlot
```

---

## What you must do (can't be automated for you)
- [ ] Cloudflare account + `wrangler login`
- [ ] Create the Hyperdrive instance (step 2) and paste its id into `wrangler.jsonc`
- [ ] Run `npm run deploy` (or connect the Git repo in the dashboard)
- [ ] Point your domain at the deployment
- [ ] (Later) AdSense account + approval, then flip the config in step 5

## Already done in the code
- [x] DB layer reads Hyperdrive on Workers, `DATABASE_URL` locally (`sql.js`)
- [x] `wrangler.jsonc` with `nodejs_compat` + Hyperdrive binding scaffold
- [x] `build` / `deploy` / `cf-preview` npm scripts
- [x] Privacy Policy + Terms pages (AdSense requirements)
