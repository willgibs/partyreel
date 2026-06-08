@AGENTS.md

# Partyreel — agent operating guide

> **How we work here.** This is the only file auto-loaded every session, so it stays lean: workflows,
> universal rules, and a map to everything else. Depth loads **on demand** from `docs/` (below).
> The `@AGENTS.md` import above is load-bearing: this is **Next.js 16**, with breaking changes from
> older Next — heed it.

Partyreel is a guest-powered event media platform. A host creates an event and shares a **QR code**;
guests scan it and upload photos/videos from their phones with **no app install and no account** (just a
verified email when the host requires one). The host curates; the growth loop is that every QR exposes
Partyreel to future hosts. Marketing site + host app + guest links + the admin portal all live on **one
domain**. The v1 build is **done and live**; the project is in **one-off-task mode** (a goal → its own
small plan → build → verify on partyreel.com → record).

**Core loop:** host creates an event → gets a QR (the single `/e/[qr_token]` link) → guests scan + upload
(no app/account) → host curates → the link doubles as the shareable album → guests become future hosts.

---

## Orient — the docs, and what each answers

Read the ONE doc whose question matches your task. Don't read everything; load depth on demand.

| Your question | Read |
| --- | --- |
| How do we work here? (this file) | `CLAUDE.md` — workflows, universal rules, the map |
| What exists + its invariants + the gotchas? | the [`docs/SYSTEMS.md`](docs/SYSTEMS.md) index → the **`docs/systems/<x>.md`** deep doc (folder view: [`docs/systems/README.md`](docs/systems/README.md)) |
| The whole-picture architecture / data flow? | [`docs/systems/architecture.md`](docs/systems/architecture.md) |
| Where are we right now? (live state, blockers) | [`docs/STATUS.md`](docs/STATUS.md) |
| What might be next? (provisional) | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Why was a decision made? | [`docs/adr/`](docs/adr) — rationale at decision time (a later ADR or change may have superseded it; the system docs are current truth) |
| What shipped, when? (history) | [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — off the orient path; read only for history |
| Product vision / pricing model | [`docs/PRD.md`](docs/PRD.md) · [`docs/PRICING.md`](docs/PRICING.md) |

**The system docs (`docs/systems/`) are the load-bearing layer** — "what exists + don't-revert". The
ROADMAP is **provisional** (candidate work that may change; never a spec). ADRs are **point-in-time
rationale** (a later ADR or subsequent change can supersede one — they tell you *why*, not necessarily
*what's true now*). When in doubt about how something actually works, **the system doc wins** — over the
roadmap and over an older ADR; keep the system docs in sync as the source of current truth.

---

## The working loop

A goal becomes its own small plan. Defaults, not rails — use judgment:

1. **Orient** — [`STATUS.md`](docs/STATUS.md) (you-are-here), then the relevant [`docs/systems/`](docs/systems) doc (what exists + invariants + files); skim its linked ADR for the why.
2. **Doc-check** — before coding, pull CURRENT docs for the libraries/services the task touches via the **Context7 MCP**. This stack drifts (Next 16, Tailwind v4, zod v4, Supabase SSR) and breaks in ways that look like your code is wrong — don't trust training data.
3. **Plan** — for anything non-trivial, write a short plan and clarify open product/UX choices with the human (AskUserQuestion) **before** building. Reuse the DRY single-sources (below).
4. **Build** — leave WHY-comments for the next agent; reuse `src/components/ui` + `src/components/shared`; use the MCPs directly.
5. **Test (internal)** — Vitest for pure logic + a **rolled-back Supabase-MCP RPC contract check** for any new SQL (run RPCs inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists); run `pnpm typecheck && lint && test && build`. After any DDL run **`get_advisors`**.
6. **Verify antagonistically on partyreel.com** — auth/upload/email/checkout can't complete on localhost (see "Local vs live"). Deploy, then **red-team your own change** via the Chrome MCP (force the error cases, the cross-tenant/escalation paths, the abuse paths) + the Supabase/R2 MCPs to seed/inspect. Test data is disposable.
7. **Commit + push** — only when asked; branch first if on `main`; never `git add -A`, never commit secrets, never `--no-verify` or force-push without an explicit ask. End commit messages with the `Co-Authored-By` trailer.
8. **Record (subtractively)** — update the owning `docs/systems/` doc **in place** (refine the line; don't append a dated block); move any shipping narrative to [`CHANGELOG.md`](docs/CHANGELOG.md); prune what your change made stale; log any new deferred task as a **one-liner under its ROADMAP bucket**. See "Keeping the docs healthy".

---

## Commands

```bash
pnpm dev            # next dev (Turbopack) on :3000
pnpm build          # production build
pnpm lint           # eslint  (NOTE: `next lint` was removed in 16 — use this)
pnpm typecheck      # next typegen && tsc --noEmit  (run before every commit)
pnpm format         # prettier --write .
pnpm test           # vitest run — unit tests for the pure data-integrity layer
pnpm db:types       # supabase gen types → src/lib/db/types.ts  (needs CLI + link)
pnpm db:push        # supabase db push                          (needs CLI + link)
```

Node is pinned in `.nvmrc` (22.21.1); package manager is **pnpm** (9.14.4). Run
`pnpm typecheck && pnpm lint && pnpm test` before committing — all must be clean.

---

## Stack (pinned — verify against current docs before upgrading)

| Area       | Choice                               | Version                |
| ---------- | ------------------------------------ | ---------------------- |
| Framework  | Next.js (App Router, `src/`, TS)     | `16.2.6`               |
| React      | react / react-dom                    | `19.2.4`               |
| Styling    | Tailwind CSS (CSS-first)             | `^4`                   |
| UI kit     | shadcn (radix-nova) + `radix-ui`     | `^4.8.2` / `^1.4.3`    |
| Icons      | lucide-react                         | `^1.17.0`              |
| Data       | Supabase (`@supabase/ssr` + `-js`)   | `^0.10.3` / `^2.106.2` |
| Validation | zod (v4)                             | `^4.4.3`               |
| Toasts     | sonner                               | `^2.0.7`               |
| Storage    | Cloudflare R2 (`@aws-sdk/client-s3`) | `3.1056.0`             |
| Payments   | Stripe (`stripe@22.2.0`)             | wired + live           |
| Tests      | Vitest                               | `^4.1.7`               |

---

## MCP tooling

Reach for the right one; prefer Context7 over web search/memory for any library/version question.

| MCP | For | Must-know |
| --- | --- | --- |
| **Context7** | up-to-date library/framework/CLI docs | first stop for "how does X work in this version" |
| **Supabase** | schema + DB ops (`list_tables`, `apply_migration`, `execute_sql`, `get_advisors`, `generate_typescript_types`, `get_logs`) | the CLI isn't installed → migrations land via `apply_migration`. Project ref `ddafaemglzmuekbtjwzn`. May be connected read-only (DB tool group → `permission` error) → re-auth with the DB scope or use the dashboard SQL editor. **MCP-created RPCs inherit an `anon` EXECUTE grant** → see [database-security.md](docs/systems/database-security.md) |
| **Cloudflare R2** | bucket/account ops + docs search | account `8bd90d2f6a374d6cdff2f379e929b060`, bucket `partyreel`. Cannot create API tokens or set CORS (dashboard / S3 API for those) |
| **Vercel** | deploys + build/runtime logs for partyreel.com | does NOT manage env vars or domains (manual in the dashboard) |
| **Stripe** | catalog + API for billing | acct `acct_1TcStrPtjqmVkBwk`. Bound to ONE mode per key with no per-call flag → **verify the mode first** (`retrieve_balance` → `livemode`). The full "who does what" runbook + the webhook/portal-are-human caveat live in [billing-caps.md](docs/systems/billing-caps.md) |
| **shadcn** | component registry browse/add | radix-nova has **no `form` item** (hand-authored) |
| **Preview / Chrome** | start the dev server / drive a browser to verify UI | Preview for pure render work; Chrome to drive partyreel.com (see "Local vs live") |

---

## Local dev vs. live testing — TEST ON partyreel.com

`localhost:3000` is deliberately NOT in the allow-list of **any** tooling (Supabase redirect allow-list,
R2 CORS, `NEXT_PUBLIC_SITE_URL`, Stripe redirect/return URLs), so `pnpm dev` renders UI but **cannot
complete sign-in, an upload, or checkout** — by design; don't "fix" it by adding localhost. Default to
verifying on the deployed site (push to `main` → Vercel deploys partyreel.com, then drive the **Chrome
MCP**). `pnpm dev` + the **Preview MCP** is fine for pure UI/render work. **Live/DB testing is authorized
and expected** — the project holds only disposable test data (host test account `willg97@gmail.com`,
operator/admin `partyr33l@gmail.com`); seed/mutate/inspect prod via the Supabase/R2 MCPs. One Chrome
gotcha: Vercel injects its dev **Toolbar** for logged-in team members (a floating circle at the
right-middle edge) that overlaps UI and is invisible to real guests — navigate by keyboard or dismiss it.

---

## Universal gotchas (true regardless of what you touch)

Per-system gotchas live in their `docs/systems/` doc; these few are cross-cutting. The **★ landmines**
also appear in full in the linked system doc — don't revert them.

**Next.js 16** (this is NOT the Next you know — read `node_modules/next/dist/docs/` when unsure)
- `params` and `searchParams` are **Promises** — `const { token } = await params` in every page/layout/route handler.
- `cookies()` / `headers()` are **async** — `await cookies()`.
- Middleware was renamed to **Proxy**: the file is `src/proxy.ts`, exports a function named `proxy`, runs on the Node runtime — **do not** add a `runtime` config. The old `middleware.ts` name no longer runs.
- `next lint` is gone — lint with `eslint` (the `pnpm lint` script).

**Supabase / auth**
- ★ **Authorize with `supabase.auth.getUser()`, NEVER `getSession()`** — `getUser()` re-validates the JWT; `getSession()` only decodes the spoofable cookie; the proxy refreshes cookies but is **not** a security boundary. Full detail: [auth-accounts.md](docs/systems/auth-accounts.md).
- Use `@supabase/ssr` (not the deprecated `auth-helpers`); the cookie API is **`getAll`/`setAll`**. Clients: `src/lib/supabase/{client,server,middleware,admin}.ts` (admin = service-role, `server-only`, bypasses RLS).

**Tailwind v4** — CSS-first: `@import "tailwindcss";` in `globals.css`, tokens in `@theme`, dark via `@custom-variant`. No `tailwind.config.js`; PostCSS uses only `@tailwindcss/postcss`. Theme is global via `next-themes`.

**zod v4** — top-level `z.url()` (not `z.string().url()`); `error.issues` (not `.errors`). See `src/lib/env.ts`.

**Postgres / plpgsql** — ★ integer literals are **int4**, so `2 * 1024 * 1024 * 1024` (2 GB) overflows int4 even when assigned to a `bigint` constant (during DECLARE init, before the body). Force `2::bigint * 1024 * 1024 * 1024`. Full detail: [database-security.md](docs/systems/database-security.md).

**Dependencies / pnpm** — `shadcn` (the CLI) is a real **build** dependency (`globals.css` does `@import "shadcn/tailwind.css"`); don't remove it. One `zod` is pinned via `pnpm.overrides` (the shadcn CLI pulls a second copy that breaks `zodResolver` typing) — keep it. The radix-nova registry has no `form` item — `src/components/ui/form.tsx` is hand-authored (semicolon-free like the other generated UI).

**Copy** — NO em-dashes (`—`) in user-facing copy (marketing, app UI, API/DB/validation messages, email templates); it reads as an AI tell. Recast with a comma/parens/colon/two sentences. A Vitest AST guard ([no-em-dash-policy.test.ts](src/lib/no-em-dash-policy.test.ts)) enforces this across `app`+`components`+`lib` (comments + internal docs are exempt).

**Git** — never `git add -A` (stage explicitly); never commit secrets; never skip hooks (`--no-verify`) or force-push without an explicit ask. Branch first if on `main`. Commit only when asked.

---

## Security guardrails (non-negotiable)

- **RLS is the security boundary** — ★ the proxy only refreshes cookies; re-verify authz with `getUser()` in every Server Function / route handler AND rely on RLS / SECURITY DEFINER RPCs at the DB. Full model: [database-security.md](docs/systems/database-security.md).
- **Anonymous guests use capability tokens** validated INSIDE security-definer RPCs (ADR-0004); never give `anon` direct table access.
- ★ **Never expose raw R2 object keys/URLs to the browser** — presign server-side (ADR-0003). Detail: [uploads-and-r2.md](docs/systems/uploads-and-r2.md).
- ★ **Never trust the client for tier/entitlements** — the Stripe webhook is the SOLE writer of `profiles.tier` / `storage_cap_bytes`; `tier` / `storage_*` / `is_admin` are service-role/RPC-write-only. Detail: [billing-caps.md](docs/systems/billing-caps.md).
- ★ **Host table writes are COLUMN-locked, not just row-locked** — RLS gates the ROW; you must `revoke insert,update,delete … from authenticated` at the TABLE level FIRST, then re-grant only legit columns (a column-level revoke is a SILENT NO-OP while a table grant stands). Detail: [database-security.md](docs/systems/database-security.md).
- **The service-role / secret key is server-only** (behind `src/lib/supabase/admin.ts`'s `import "server-only"`); never `NEXT_PUBLIC_`.
- **Events have no end date** — deletion is the only lifecycle exit (the anti-abuse core); don't add an "end event" path that keeps media accessible.

---

## DRY single-sources (do NOT duplicate these elsewhere)

| Concern | Single source |
| --- | --- |
| Pricing / tier limits (app side) | `src/lib/constants/tiers.ts` |
| Pricing / tier limits (DB enforcement) | `public.tier_limits()` SQL fn — **must mirror `tiers.ts`** (a Vitest parity test guards it) |
| Universal per-file media limits (5 min / 2 GB / 50 MB) | `src/lib/media/limits.ts` |
| R2 object keys (+ `parseMediaIdFromKey`/`parseExtFromKey`) | `src/lib/r2/keys.ts` |
| R2 bulk delete / list (purge cron) | `src/lib/r2/delete.ts` |
| DB access (queries/mutations) | `src/lib/db/*` — never inline SQL in components |
| Env vars (zod-validated) | `src/lib/env.ts` (`env` public, `serverEnv` server-only) |
| `cn()` class merge | `src/lib/utils.ts` |

> Tier limits unavoidably live in two places (TS for UX, SQL for enforcement). Change one → change the
> other and re-verify the parity test. `tiers.ts` is the human-authored source.

---

## Database workflow

- Schema is **Supabase-native**: SQL migrations + RLS + generated types are the source of truth (ADR-0001), in `supabase/migrations/`. Apply via the **Supabase MCP** `apply_migration` (the CLI isn't installed; keep the repo file = applied version).
- `src/lib/db/types.ts` is **generated — do not hand-edit** (it's `.prettierignore`d so regeneration stays churn-free).
- **After any schema change: run `get_advisors` + regenerate types.** The expected, accepted advisor set: the **8 anon capability RPCs** (lint `0028`, by design — never revoke), the **authenticated-only RPCs** (`0029`), the **service-role-only** fns (must appear in NEITHER list), the **deny-all** `rls_enabled_no_policy` INFOs, and the leaked-password WARN (a launch task). The full inventory + the column-lock + MCP-anon-grant lessons: [database-security.md](docs/systems/database-security.md).

---

## Keeping the docs healthy (the anti-bloat contract)

The whole model is **two rules** — that's all you need to remember:

> **1. Every fact has ONE home** — the doc whose question it answers (see the Orient table).
> **2. Edit in place, don't append** — refine the existing line; stale → delete; a shipped narrative → `CHANGELOG.md`; a deferred task → one line under its `ROADMAP.md` bucket.

So in practice: a **new gotcha** goes in its `docs/systems/` doc (NOT here — `CLAUDE.md` changes only for
universal/workflow facts); a **deferred task** goes as a one-liner under its matching ROADMAP overhaul
bucket or the launch checkpoint (never an inline "Deferred:" note); a **shipped feature's** durable facts
update its system doc in place while its verification narrative goes to `CHANGELOG.md`. Each doc's top
blockquote states its own contract (`ROLE` / `BELONGS HERE` · `NOT HERE` / `GROWS BY`) — honor it.

**Other conventions:**
- **Leave WHY-comments** for the next agent — capture non-obvious decisions + what NOT to do; don't narrate the obvious.
- **Backend jobs must be operable + observable from `/admin`** — when you build any backend job (cron, Worker, backup), ship its admin management + health signal in the SAME change (zero silent failures; the admin-portal P8 mandate).
- **Test data integrity as you build** — Vitest for pure logic + a rolled-back Supabase-MCP RPC contract check for new SQL.
- shadcn UI files (`src/components/ui/*`) are authored **without semicolons** by the generator; app code uses semicolons — don't reformat to "match". Markdown is `.prettierignore`d (author docs by hand).
- Prefer editing existing files; reuse the design-system primitives.
