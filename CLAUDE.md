# iClose — Project Guide for Claude Code

> Read this fully before acting. It encodes decisions that are expensive to reverse.
> The full 10-phase product/architecture blueprint lives in `/docs` (add it there) — consult it for detail.

## What this is
iClose is a **buyer-first Dubai off-plan real-estate platform**. The buyer pays **zero commission**; 100% of the developer commission is returned to them as **cashback**. Content-first advisory with **one dedicated relationship manager (RM)** per buyer — *not* a broker marketplace, *not* lead-selling. **MVP scope = off-plan primary only.**

## Current status (June 2026)
- **Database: LIVE** on Supabase project `jvdmwvzlunmouvlvtebg` (region `ap-southeast-1` / Singapore, Postgres 17). **28 tables, 57 RLS policies, 9 enums, 14 triggers.** Migrations `0001`–`0004` in `supabase/migrations/` are already applied.
- **App:** Next.js 14 App Router scaffold (M0 / Sprint-1 foundation), deployed to **Vercel** via GitHub auto-deploy on `main`.
- **Auth:** Supabase — Google OAuth + magic link.
- **Works today:** public landing + `/how-it-works`; gated `/app/explore` (live RLS read of published projects), `/app/saved`, `/app/me`; staff-gated `/admin` shell.
- **Not built yet:** see Roadmap.

## Architecture
- **Modular monolith.** Next.js 14 (RSC + Server Actions) · Supabase (Postgres + Auth + Storage + RLS) · Turborepo monorepo.
- **Layout:** `apps/web` (the app) · `packages/db` (migrations canonical in `/supabase/migrations`) · `packages/config` (zod env validation) · `packages/shared` (shared types/constants).
- **Supabase 3-client topology — CRITICAL:**
  - `apps/web/lib/supabase/server.ts` — RSC / server actions, runs **as the signed-in user**, RLS applies.
  - `apps/web/lib/supabase/client.ts` — browser, anon key, RLS applies.
  - `apps/web/lib/supabase/admin.ts` — **service-role, BYPASSES RLS**, guarded `import 'server-only'`. **NEVER import into client code.**

## Non-negotiable rules
- **RLS is the PRIMARY authorization layer.** Every table has RLS enabled. Never rely on app-layer checks alone — enforce at the DB. Any new table → add RLS policies in the same migration.
- **Secrets:** never commit `.env` / `.env.local`. The service-role key lives only in Vercel env + local `.env.local`. Only `NEXT_PUBLIC_*` values are public (by design); nothing else reaches the browser.
- **Brand / design system:** reference **CSS tokens only** (`var(--accent)`, `--surface`, `--text`, …) defined in `apps/web/app/globals.css`. No raw hex or px in feature code. Semantic over raw. Mobile-first; honor `prefers-color-scheme`, `prefers-reduced-motion`, `env(safe-area-inset-*)`. WCAG AA: 4.5:1 text contrast, 44px targets, visible focus rings. **Green (`--success`) = money/cashback ONLY.** One accent, one primary action per view. Voice: plain, calm, real numbers — no urgency, no exclamation marks.
- **MVP-first.** Off-plan only. Do not build seller/agent journeys yet.
- **Attribution-first CRM:** every inquiry becomes an *attributed* lead; capture attribution (source / UTM / developer registration ref) at creation. The data spine is **leads → transactions → commissions → cashback**.

## LOCKED money decisions (do NOT change without founder sign-off)
- Cashback is **commission-linked, not a fixed %** of price. (Blueprint §13.3)
- Pay buyers **only after** the developer commission is **received**, plus a **clearing window**. (§13.5)
- All model figures are **pre-VAT (5%)** and **pre-Corporate-Tax (9%)**. (§13.7)
- `projects.commission_pct`, `cashback_payout_pct`, `cashback_floor` are **internal** — never buyer-visible.

## TWO open legal blockers (business, not code — assume UNRESOLVED)
1. Can iClose legally broker and earn commission in Dubai (RERA licensing / structure)? (§65.2)
2. Is the commission-rebate-to-buyer (cashback) model permissible, and how must it be framed? (§65.2)
Do not ship anything that presupposes these are settled (e.g. public "guaranteed cashback" claims) until confirmed.

## Data model (high level)
- **Identity:** profiles, profile_roles (RBAC), consents, notification_prefs
- **Catalog:** developers, areas, projects, units, payment_plans, project_media, faqs, content_pages, media
- **Engagement:** saved_items
- **CRM:** leads, lead_attribution, lead_activities
- **Transactions:** transactions, transaction_milestones, payment_schedule
- **Money:** commissions, cashback, cashback_events (append-only)
- **Platform:** audit_log (append-only), events (outbox), notifications, feature_flags, community_identities
- Enums encode state machines: `lead_status`, `txn_status`, `cashback_status`, etc.
- Helpers: `has_role(role)`, `is_staff()`. Trigger `handle_new_user()` seeds profile + `buyer` role + notification prefs on signup.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` — turbo build; **run before pushing** (this is what Vercel runs)
- `npm run db:push` — apply migrations to the linked Supabase project
- `npm run db:reset` — reset DB to migrations (DEV ONLY — destroys data)
- `npm run db:types` — regenerate `apps/web/types/database.ts` from the live schema (run after any schema change)

## Environment (`apps/web/.env.local`; mirror in Vercel)
- `NEXT_PUBLIC_SUPABASE_URL=https://jvdmwvzlunmouvlvtebg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never commit
- Later: `EMAIL_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_POSTHOG_*`, `SENTRY_DSN`, `TURNSTILE_*`

## Connected services
- **Git:** `origin = github.com/ishlokchavan/iclose-webapp` (branch `main`). Push → Vercel auto-deploys. (Native to Claude Code — no setup.)
- **Supabase:** project ref `jvdmwvzlunmouvlvtebg`. Use the **Supabase CLI** for migrations/types; `.mcp.json` adds a Supabase MCP for DB inspection.
- **Vercel:** deploys from `main`. Use the **Vercel CLI** for env/logs; `.mcp.json` adds a Vercel MCP.
- There are TWO Supabase projects on the account — only ever touch **`iclose`** (`jvdmwvzlunmouvlvtebg`), never `iclose-academy-db`.

## Roadmap (next sprints — detail in /docs blueprint)
- **S2 Catalog:** project detail pages, area/developer pages, payment-plan UI, media (YouTube-unlisted via a media adapter), Postgres full-text-search UI.
- **S3 Identity & CRM:** onboarding, inquiry → attributed lead, RM assignment + SLA timers.
- **S4 Admin:** projects / leads / users CRUD + audit views.
- **S5 Transactions:** booking → handover milestones, payment schedule.
- **S6 Cashback engine:** commission-linked compute, **maker-checker** approvals, clearing window, append-only events.
- **S7 Notifications:** transactional email + outbox worker.
- **S8 Analytics & SEO:** PostHog, structured data, sitemaps.
- **S9 Hardening:** rate limits, bot protection, a11y / performance.

## Working agreement
- Before merging: `npm run build` must pass clean (prod build type-checks strictly; `next dev` does not).
- After schema changes: add a migration in `/supabase/migrations`, run `npm run db:push`, then `npm run db:types`.
- Keep changes MVP-scoped and reversible; flag anything that touches the money rules or legal posture above.
