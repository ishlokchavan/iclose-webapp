# iClose — webapp

Buyer-first Dubai **off-plan** property platform. Zero commission, 100% cashback.
Turborepo monorepo: `apps/web` (Next.js 14 App Router) + `packages/{db,config,shared}`.
Architecture and rationale: see the 10-phase Blueprint (Phases 1–10).

---

## ✅ What's already done

- **Database (live):** the full schema + security model is applied to your Supabase
  project `jvdmwvzlunmouvlvtebg` — **28 tables, 57 RLS policies, 9 enums, 14 triggers**.
  Mirrored as migrations in `/supabase/migrations`.
- **Auth wiring:** Supabase 3-client topology (`server` / `client` / `admin`), session
  refresh + route gating in `middleware.ts`, Google OAuth + magic-link sign-in, OAuth callback.
- **Design system:** your brand tokens (v2.1) encoded as CSS variables in
  `app/globals.css` (light + dark + `prefers-color-scheme` + reduced-motion), mapped into
  Tailwind. `data-theme` switch applied before first paint (no FOUC).
- **Screens (foundation):** public landing + how-it-works; gated buyer zone
  (`/app/explore` reads published projects live via RLS, plus `saved` / `me` stubs);
  staff-gated `/admin` shell.

This is the **M0 / Sprint-1 foundation** — enough to run, deploy, sign in, and read
from the database. It is intentionally not the whole product (see "What's next").

---

## Prerequisites
- Node.js ≥ 20 (`.nvmrc` pins 20) and npm.
- A Supabase account with access to project `jvdmwvzlunmouvlvtebg`.
- (For deploy) a Vercel account.

## Local setup
```bash
nvm use            # or install Node 20
npm install        # installs all workspaces

cp .env.example apps/web/.env.local
# then fill in apps/web/.env.local (see below)

npm run dev        # http://localhost:3000
```

### Fill `apps/web/.env.local`
From **Supabase → Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → already set to `https://jvdmwvzlunmouvlvtebg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → copy the **anon / public** key
- `SUPABASE_SERVICE_ROLE_KEY` → copy the **service_role** key. **Server-only.**
  Never expose it to the browser, never commit it. (It bypasses RLS.)

Enable **Google** auth in Supabase → Authentication → Providers, and add
`http://localhost:3000/auth/callback` (and your Vercel URL) to the redirect allow-list.

---

## Push this code to GitHub
This repo is not yet initialised with git. From the project root:
```bash
git init
git add .
git commit -m "iClose: DB schema + RLS + Next.js scaffold (M0 foundation)"
git branch -M main
git remote add origin https://github.com/ishlokchavan/iclose-webapp.git
git push -u origin main
```
> If the remote already has commits, run `git pull --rebase origin main` first.

## Deploy on Vercel
1. Import `ishlokchavan/iclose-webapp` in Vercel. Root directory: `apps/web`
   (or leave root and set the build to the `web` workspace).
2. Add the same env vars from `.env.local` to Vercel → Project → Settings → Environment Variables.
3. Deploy.
> **Note:** Vercel's free **Hobby** tier is for non-commercial use. iClose is a
> commercial product, so upgrade to **Pro** (~$20/mo) before a real public launch.

---

## 🔜 What's next (per Blueprint roadmap, Sprints S2–S9)
- **S2 — Catalog:** project detail pages, area/developer pages, payment-plan rendering,
  media (YouTube-unlisted via the media adapter), Postgres full-text search UI.
- **S3 — Identity & CRM:** onboarding, inquiry → **attributed** lead creation
  (attribution-first, ADR-006), RM assignment + SLA timers.
- **S4 — Admin portal:** projects/leads/users CRUD, audit views.
- **S5 — Transactions:** booking → handover milestone tracking, payment schedule.
- **S6 — Cashback engine:** commission-linked computation, **maker-checker** approvals,
  clearing window, append-only `cashback_events`. (Money locks below.)
- **S7 — Notifications:** transactional email + the outbox (`events`) worker.
- **S8 — Analytics & SEO:** PostHog, structured data, sitemaps.
- **S9 — Hardening:** rate limits, bot protection, a11y (WCAG AA) and perf passes.

## Database changes & rollback
- New change → add a migration in `/supabase/migrations`, then `npm run db:push`.
- Regenerate types → `npm run db:types`.
- Rollback → migrations were applied in order `0001…0004`; reverse by dropping
  objects in reverse, or `supabase db reset` against a dev branch. Only the `iclose`
  project was touched (never `iclose-academy-db`).

---

## ⚠️ Before you launch — non-technical blockers (from the Blueprint)
These gate the **business**, not the build:
1. **Legal Q1 — Brokerage/commission (§65.2):** confirm iClose can lawfully broker and
   earn commission in Dubai (RERA licensing/structure).
2. **Legal Q2 — Cashback permissibility (§65.2):** confirm the commission-rebate-to-buyer
   model is permissible and how it must be framed.
3. **Money locks:** cashback is **commission-linked, not a fixed %** (§13.3); pay buyers
   **only after** commission is received **+ a clearing window** (§13.5); model figures are
   **pre-VAT (5%) and pre-Corporate-Tax (9%)** (§13.7).
4. **Data residency (§A10):** your Supabase region is **Singapore** (`ap-southeast-1`).
   Confirm that's acceptable under PDPL/your DPA before storing real buyer PII.

© 2026 iClose · Dubai, UAE
