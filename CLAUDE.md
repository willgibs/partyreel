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
domain**. The full product is **built and live at partyreel.com with ZERO real users** (Stripe TEST
mode; the launch switches deliberately unspent): the project is in **pre-launch continuous elevation**
under the active **elevation program** ([`docs/PROGRAM.md`](docs/PROGRAM.md)) — work rides the
`launch-prep` branch, and each goal still becomes its own small plan (plan → build → verify live →
record).

**Core loop:** host creates an event → gets a QR (the single `/e/[qr_token]` link) → guests scan + upload
(no app/account) → host curates → the link doubles as the shareable album → guests become future hosts.

---

## Orient — the docs, and what each answers

Read the ONE doc whose question matches your task. Don't read everything; load depth on demand.

| Your question | Read |
| --- | --- |
| How do we work here? (this file) | `CLAUDE.md` — workflows, universal rules, the map |
| What exists + its invariants + the gotchas? | the [`docs/SYSTEMS.md`](docs/SYSTEMS.md) index → the **`docs/systems/<x>.md`** deep doc |
| The whole-picture architecture / data flow? | [`docs/systems/architecture.md`](docs/systems/architecture.md) |
| How do I verify live? (test-tool blind-spots) | [`docs/systems/testing-verification.md`](docs/systems/testing-verification.md) |
| Where are we right now? (era, program position, live state, Will's queue) | [`docs/STATUS.md`](docs/STATUS.md) |
| What assets are requested, delivered, wired? (Will's running list) | [`docs/ASSETS.md`](docs/ASSETS.md) |
| What is every open track claiming, and what did a track hand off? | [`docs/tracks/`](docs/tracks) — one manifest per `lp/<track>` branch |
| What program is running + its rules? (roles, gates, protocol depth, init templates) | [`docs/PROGRAM.md`](docs/PROGRAM.md) |
| What might be next? (provisional) | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Why was a decision made? | [`docs/adr/`](docs/adr) — rationale at decision time (a later ADR or change may have superseded it; the system docs are current truth) |
| What shipped, when? (history) | [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — off the orient path; read only for history |
| Product vision / pricing model | [`docs/PRD.md`](docs/PRD.md) · [`docs/PRICING.md`](docs/PRICING.md) |

Off the orient path (open on demand, like CHANGELOG): [`docs/decisions/`](docs/decisions) (ratified
options-docs, mostly tombstoned to git history) · [`docs/specs/`](docs/specs) (settled product specs)
· [`docs/perf/`](docs/perf) (measured baselines).

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
3. **Plan — ask a LOT of clarifying questions here; be cautious now so you can be bold later.** For anything non-trivial, converge on the EXACT path BEFORE building: surface every open product/UX/strategy/scope decision and resolve it with the human (AskUserQuestion) up front. A confident agent executing the *wrong* strategy is the expensive failure, so over-ask now rather than run toward a goal on a bad plan. Write a short plan, name the trade-offs + your recommendation, and get explicit alignment before the first line of code. Reuse the DRY single-sources (below). (This caution is the front-loaded counterpart to step 7's high agency: direction questions belong HERE.)
4. **Build** — leave WHY-comments for the next agent; pull from the Library (`/design/library`: what binds you, every component with its contract, the bible on `/design/library/rules`; the rule set levelled in [`docs/design/README.md`](docs/design/README.md), Will's rulings in [`docs/design/rulings.md`](docs/design/rulings.md); the Lab at `/design/lab` is the desk and the boards); reuse `src/components/ui` + `src/components/shared`; use the MCPs directly. **The design law is short on purpose: the bible (22 rules, Will's), a component's contracts and the policies bind; everything else on the site is precedent you may break.** **Rising tides (bible 22): judge every section, component, flow and line from the ground up**, asking what the perfect version would be if it did not exist yet, then build that: elevate what already points there, rework what does not, and raise the global system as you go; the call is yours each time, prototyped in the lab first, then wired (Will, 2026-09-12 and 2026-09-14). Design as if design resources are unlimited: Will makes any image, video, SVG, 3D or generative asset, so ask for exactly what the design needs in your manifest's Handoff and ship the manifest's stand-in meanwhile (Will, 2026-09-14). Go past "correct": **proactively propose a creative DELIGHT** (the "feels like magic" bar, our differentiator) — apply the `/emil-design-eng` skill + animate-by-frequency (high-freq instant, occasional standard, rare delightful). See [`docs/systems/design-system.md`](docs/systems/design-system.md) "craft guidance stack".
5. **Test (internal)** — Vitest for pure logic + a **rolled-back Supabase-MCP RPC contract check** for any new SQL (run RPCs inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists); run `pnpm typecheck && lint && test && build`. After any DDL run **`get_advisors`**.
6. **Verify antagonistically — the bar is "force a break", not "prove a success"** (the most important step). **Red-team your own change**: force the error cases, the cross-tenant/escalation/abuse paths, malformed inputs, and the catastrophic-fault paths — never just the happy path; drive via curl + the Supabase/R2 MCPs (local) and the Chrome MCP (live), seed/inspect freely, break things on purpose (test data is disposable). Local FIRST, then live for the allow-list-gated flows + a final pass — the full policy + the test-tool blind-spots live in "Local dev vs live testing" below.
7. **Commit + ship as you go (high agency) — on the elevation-program branch protocol.** Commit early and often on your own initiative the moment gates are green, but to YOUR branch per the canonical Git rules below ("Universal gotchas → Git"): Agents/tracks → their own `lp/<track>`; only the Orchestrator merges `launch-prep` and runs milestone merges to `main`. After an integration push, confirm the preview deploy is READY at the intended SHA (Vercel MCP) before red-teaming.
8. **Record (subtractively)** — update the owning `docs/systems/` doc **in place** (refine the line; don't append a dated block); move any shipping narrative to [`CHANGELOG.md`](docs/CHANGELOG.md); prune what your change made stale; log any new deferred task as a **one-liner under its ROADMAP bucket**. See "Keeping the docs healthy".

**Two-phase posture — clarify hard, then execute boldly.** FRONT of a task (planning, step 3): ask lots of clarifying questions and settle the exact strategy with the human before building — high caution, low presumption on direction; nail the foundation before moving. ONCE the path is aligned (execution, steps 4-8): high agency — carry it all the way through (build → test → commit + deploy → red-team → `pnpm build` → report) without pausing for permission, and don't re-litigate a settled plan mid-flow. The bright line: direction/strategy questions belong UP FRONT; during execution, only stop if you hit a genuinely NEW decision that could branch from the agreed goal — then ask (AskUserQuestion). Bold execution is earned by a well-clarified plan, never a substitute for one: start from the right foundation, then grow from it. **High agency INCLUDES the human as a targeted instrument, not just solo work:** for the few critical-verification steps you genuinely can't drive yourself (file uploads, password/OTP entry, a logged-out flow), never skip or silently downgrade the test to stay autonomous — set it up and hand off the SMALLEST precise action (stage the data, pull the field up in Chrome, give the exact tap/email), verify the result, then resume solo. The aim is the verified outcome with minimal, well-targeted human friction — NOT autonomy as the goal itself. (Don't overcorrect into routine hand-offs either: solo by default; reach for the human only where a real boundary or a real-device need blocks the next goal.) **A second, distinct trigger to reach for the human: a test result that smells NON-human — a timing/race artifact, or a limitation of the test TOOLING itself rather than a real product bug.** Before you build instrumentation or "fix" working code to chase it, STOP and hand the human the 10-second look ("does X actually show on your screen?"); a quick human eyeball confirms reality far cheaper than more tooling. The specific test-tool blind-spots (and why a *working* feature can read as broken) live in [`docs/systems/testing-verification.md`](docs/systems/testing-verification.md).

---

## Sessions & roles — Orchestrator / Agent

Every top-level session is an **Agent** unless Will's first prompt designates it **the Orchestrator**
(max ONE at a time, seated in the repo root). **Assume you are an Agent.**

- **Agents** work in a worktree on their own `lp/<track>` branch, which they CREATE THEMSELVES at
  boot from `origin/launch-prep` — Will states only the goal; the **Agent boot sequence** in
  [`docs/PROGRAM.md`](docs/PROGRAM.md) is the first thing to run (it handles the app's
  worktree-toggle cutting from `main`, cleans up the auto-birth branch, and covers a session opened
  in the repo root by creating its own worktree). Orchestrator-spawned tracks live at
  `../partyreel-wt/<track>`. Full build/test/push rights on their own branch; the hard prohibitions
  are in the Git rules below. Handoff = the manifest's Handoff + Record sections filled, `status: handed-off`, pushed; no live
  Orchestrator needed.
- **Every track has a manifest**, `docs/tracks/<track>.md`: its claimed path prefixes, rulings,
  handoff and record ([`docs/tracks/README.md`](docs/tracks/README.md)). Read the directory to see
  what every open track is working on; the boot sequence creates yours before any other work, and
  `pnpm test` refuses two live claims that overlap.
- **The Orchestrator** alone integrates, applies migrations, deploys, and runs milestone merges; it
  closes every round succession-ready. Duties, seat-in, and both init templates:
  [`docs/PROGRAM.md`](docs/PROGRAM.md).
- A repo-root session WITHOUT the designation shares the Orchestrator's working tree: read and advise
  freely, but make NO commits or edits there — for real work, self-create a worktree per the Agent
  boot sequence and do everything inside it.
- Worktree sessions inherit no out-of-repo memory BY DESIGN — the repo (this file + `docs/`) is the
  whole context; if something an agent needs is missing from it, that's a doc bug to report.

---

## Commands

```bash
pnpm dev            # next dev (Turbopack) on :3000
pnpm build          # production build
pnpm lint           # eslint  (NOTE: `next lint` was removed in 16 — use this)
pnpm typecheck      # next typegen && tsc --noEmit  (run before every commit)
pnpm format         # prettier on your CHANGED files only (scripts/format-changed.mjs) — NOT the whole repo
pnpm test           # vitest run — unit tests for the pure data-integrity layer
pnpm db:types       # supabase gen types → src/lib/db/types.ts  (needs CLI + link)
pnpm db:push        # supabase db push                          (needs CLI + link)
```

Node is pinned in `.nvmrc` (22.21.1); package manager is **pnpm** (9.14.4). Run
`pnpm typecheck && pnpm lint && pnpm test` before committing — all must be clean. Formatting is NOT in the
gate (editors format per-file on save).

**Prettier is scoped on purpose — NEVER reformat the whole repo.** `pnpm format` formats only your CHANGED
files ([`scripts/format-changed.mjs`](scripts/format-changed.mjs)). `prettier --write .` is a footgun here: the
repo isn't kept repo-wide prettier-clean, so it rewrites ~90 drifted files, AND `prettier-plugin-tailwindcss`
can MANGLE a dynamic className — `${cond ? " x" : ""}` loses its leading space, yielding a broken concatenated
class (it bit `masonry.tsx`, 2026-06-22). `pnpm format:all` is wired to refuse. After any format, eyeball
dynamic classNames in the diff, and prefer `cn()` over `${… ? " x" : ""}` for conditional classes.

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
| Payments   | Stripe (`stripe@22.2.0`)             | wired, live-verified (TEST mode) |
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

## Local dev vs. live testing — local FIRST, then live

Test everything you can on localhost; it makes your review MORE comprehensive, not less. `pnpm dev` +
`.env.local` runs server routes, API handlers, RPCs, and DB logic against the **real** Supabase/R2 (the
service-role admin client, presign, queries all work locally), so red-team that surface locally first
(fast, full control, no deploy); `pnpm dev` + the **Preview MCP** covers pure UI/render. What localhost
genuinely CANNOT do is the flows gated by external allow-lists: **sign-in** (Supabase redirect), **upload**
(R2 CORS + `NEXT_PUBLIC_SITE_URL`), **email** round-trips, and **checkout** (Stripe redirect) — not in any
allow-list by design; don't "fix" that by adding localhost. For those, and for a final adversarial pass,
deploy and drive the **Chrome MCP** — **while the elevation program runs, the live target is the
`launch-prep` preview alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`, allow-listed in
Supabase/R2 like prod); partyreel.com is verified at milestone merges. (Agent `lp/*` branches deploy
review previews too, but those aliases are NOT allow-listed — the gated flows fail there by design; the
red-team target stays the `launch-prep` alias.)

**NEVER skip, shorten, or silently downgrade the live red-team.** That silent pivot — quietly settling for
the local pass when a live flow won't cooperate — is a real failure mode; sign in and continue, or surface a
true blocker loudly. The one carve-out (Will, 2026-09-14): an EXPLORATION round that ships no production byte (a lab
board) verifies its board on its preview at 1440 and 375 with reduced motion honoured and moves on; the red-team
belongs to the wiring round.

The live pass runs in the test browser profile, and you have a **standing Google sign-in privilege across
the Partyreel accounts** (host/guest/admin switching is routine, so this keeps live testing automated): if
the session is logged out, **SELF-SERVE — click "Continue with Google" and pick the right account**
(`willg97@gmail.com` host, `partyr33l@gmail.com` admin). The account CHOOSER is not credential entry, so
it's allowed; the safety rule still bars typing a **PASSWORD/OTP**, so STOP and ask Will ONLY if Google
itself demands one.

**Live/DB testing is authorized + expected** — disposable test data only (host `willg97@gmail.com`,
operator/admin `partyr33l@gmail.com`); seed/mutate/inspect prod via the Supabase/R2 MCPs. Heads-up: the test
tooling has blind spots that make a *working* feature read as broken (Chrome-MCP toast/DOM gaps, the Vercel
dev Toolbar overlay) — see [`docs/systems/testing-verification.md`](docs/systems/testing-verification.md).

---

## Secrets & env vars

When you introduce a new secret/env var, put it in **all three**: (1) `.env.local` (gitignored), (2) the
Vercel project env as **NON-sensitive** — regardless of how secret it is, so values stay swappable (the
critical ones get flipped to "Sensitive" later, a [`docs/ROADMAP.md`](docs/ROADMAP.md) launch-checkpoint task), and (3) `src/lib/env.ts`
(zod-validated, `.optional()` + a lazy `assert*Env()`). Keep `.env.local` and Vercel in sync. Manage
Vercel env vars **autonomously via the Vercel REST API** (curl + `$VERCEL_TOKEN`; verified 2026-08-05):
the token is TEAM-scoped to the P3 "Partyreel Team" — deliberately narrow, and it means the `vercel` CLI
CANNOT run on it (link/env/whoami all resolve the user first and 404; mint an account-scoped token only if
CLI ergonomics are ever needed). Read: `GET api.vercel.com/v9/projects/partyreel/env` (+`/{id}` for a
decrypted value); write: `POST /v10/projects/partyreel/env?upsert=true` with rows
`{key, value, type: "encrypted", target: [...], gitBranch?}`. The Vercel MCP can't write env vars. Cloudflare Worker secrets: `wrangler secret put`
(write-only). Deploy auth: `gh` → `willgibs/partyreel`; Vercel → the `VERCEL_TOKEN` (scoped to the P3
"Partyreel Team", since the 2026-08-05 hosting migration); `wrangler` → the P3 Cloudflare "Partyreel Team"
(partyr33l OAuth, restored 2026-08-06 — R2 bucket-config ops like CORS ride `wrangler r2 bucket cors
list/set`). ★ Work on OTHER projects (QRCDN) can silently re-login wrangler to the personal account, which
has NO access to our Workers/R2 — `wrangler whoami` BEFORE any Worker deploy or bucket-config op. Never
commit a real secret value to git.
**`git push` auth runs through the `gh` credential helper** (`gh auth setup-git`, configured globally), so
pushes use `gh`'s token with NO macOS-keychain prompt. If a `git-credential-osxkeychain` dialog ever appears
(e.g. after a `gh` re-auth), re-run `gh auth setup-git`. The Vercel project link lives in gitignored
`.vercel/project.json` (project `prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB`, org `team_ht9qAVBQVZf60dpGNJUwmaj5`).

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

**Tailwind v4** — CSS-first: `@import "tailwindcss";` in `globals.css`, tokens in `@theme` and dark via `@custom-variant` (both in `src/app/theme.css`, imported by `globals.css`; the design lab compiles its own utilities from a second entry that references `theme.css`, pinned by `css-source-policy.test.ts`). No `tailwind.config.js`; PostCSS uses only `@tailwindcss/postcss`. Theme is global via `next-themes`. Translate utilities set the STANDALONE `translate` property — `transform: none` won't clear them; clear with `translate-x-0` / `translate: none`.

**zod v4** — top-level `z.url()` (not `z.string().url()`); `error.issues` (not `.errors`). See `src/lib/env.ts`.

**Postgres / plpgsql** — ★ integer literals are **int4**, so `2 * 1024 * 1024 * 1024` (2 GB) overflows int4 even when assigned to a `bigint` constant (during DECLARE init, before the body). Force `2::bigint * 1024 * 1024 * 1024`. Full detail: [database-security.md](docs/systems/database-security.md).

**Dependencies / pnpm** — `shadcn` (the CLI) is a real **build** dependency (`globals.css` does `@import "shadcn/tailwind.css"`); don't remove it. One `zod` is pinned via `pnpm.overrides` (the shadcn CLI pulls a second copy that breaks `zodResolver` typing) — keep it. The radix-nova registry has no `form` item — `src/components/ui/form.tsx` is hand-authored (semicolon-free like the other generated UI).

**Copy** — NO em-dashes (`—`) in user-facing copy (marketing, app UI, API/DB/validation messages, email templates); it reads as an AI tell. Recast with a comma/parens/colon/two sentences. A Vitest AST guard ([no-em-dash-policy.test.ts](src/lib/no-em-dash-policy.test.ts)) enforces this across `app`+`components`+`lib` (comments + internal docs are exempt). All copy is open (bible 21): any line may be rewritten by the round that touches its section; the voice itself is the `brand-voice` exploration's (`docs/specs/brand-voice.md` until Will rules it into `docs/systems/`).

**Git — the elevation-program branch protocol (2026-07-02; THE canonical statement — operating depth in [`docs/PROGRAM.md`](docs/PROGRAM.md)).** Agents/tracks/subagents commit ONLY to their own `lp/<track>` branch (self-created at boot from `origin/launch-prep` per the PROGRAM.md boot sequence, worked in a worktree) and may push it freely for durability — an `lp/*` push deploys its own preview at `partyreel-git-lp-<track>-partyreel.vercel.app` only when the track's manifest says `status: handed-off`, the commit message carries `[preview]`, or the branch has no manifest (never on every push: twelve boards building every push hit Vercel's 100-deployments-a-day cap on 2026-09-14) (Will's review surface + the Agent's own live UI checks; deliberately in NO auth/CORS allow-list, so sign-in/upload/checkout/email fail there BY DESIGN — never "fix" that by allow-listing lp aliases — and it talks to prod Supabase/R2, so disposable-test-data rules apply; the branch gate is [`scripts/vercel-ignore-build.mjs`](scripts/vercel-ignore-build.mjs) via `vercel.json`'s `ignoreCommand`). **Only the Orchestrator**: merges into `launch-prep` (the integration branch; its preview at `https://partyreel-git-launch-prep-partyreel.vercel.app` is built ON REQUEST since 2026-09-11 — put `[preview]` in the commit message of the push a walk needs, because building every push was most of a Vercel storage overage) and pushing its record commits with `[skip ci]` re-running the full gate on the merged tree, applies DB migrations (Agents write the SQL file only — the DB is shared prod state), deploys Workers, and mutates Vercel/Stripe/Supabase config; `src/lib/db/types.ts` is generated, never hand-edited — propose instead. After an integration push, confirm the preview deploy is READY at the intended SHA before red-teaming. `main` is FROZEN except milestone merges (`--no-ff`, tagged `milestone-<n>`, prod-verified at the merge SHA) and true hotfixes (fix on `main` → verify → back-merge to `launch-prep` the same session). Unchanged guardrails: tests green before any commit; never `git add -A` (stage explicitly); never commit secrets; never skip hooks (`--no-verify`) or force-push; `Co-Authored-By` trailer on every commit. **CI is not the gate, the local four steps are** (the CI budget round, 2026-09-15: agent pushes spent a month of GitHub Actions minutes in two days): `ci.yml` runs on `main` and `launch-prep` pushes that touch code and on PRs to `main`; an `lp/*` push runs it only when its commit message says `[ci]`; a docs-only push is skipped. **Docs under the program:** Agents never edit `docs/CHANGELOG.md`, `docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md` or `AGENTS.md`; a track's record and its ROADMAP one-liners live in its manifest (`docs/tracks/<track>.md`) and the Orchestrator folds them at integration; a `docs/systems/*.md` line may be refined in place only for a fact inside the track's owned paths, listed in the manifest so it is read by eye at the merge (a clean doc merge reconciles text, not facts). (When the program ends this reverts to a deliberate post-program decision — the teardown checklist is in [`docs/ROADMAP.md`](docs/ROADMAP.md).)

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
| Universal per-file media limits (the numbers live in the file, never here) | `src/lib/media/limits.ts` |
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
- `src/lib/db/types.ts` is **generated — do not hand-edit**, but DO **read it as the fast source of truth for table + column names before hand-writing SQL or `.from(...)` queries** (don't assume column names like `owner_id`/`created_at`; or introspect live via the Supabase MCP). It's `.prettierignore`d so regeneration stays churn-free.
- **After any schema change: run `get_advisors` + regenerate types.** The expected, accepted advisor set: the **4 anon READ RPCs** (lint `0028`, by design — never revoke; the guest write/password RPCs were server-mediated to service-role-only, ADR-0016), the **authenticated-only RPCs** (`0029`), the **service-role-only** fns (must appear in NEITHER list), the **deny-all** `rls_enabled_no_policy` INFOs (leaked-password protection is now ENABLED, so that WARN is cleared). The full inventory + the column-lock + MCP-anon-grant + server-mediation lessons: [database-security.md](docs/systems/database-security.md).

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

Under the elevation program an Agent records in its track manifest (`docs/tracks/<track>.md`), never in
CHANGELOG / STATUS / ROADMAP; the Orchestrator folds it at integration.

**Other conventions:**
- **Design law is the bible on `/design/library/rules` (22 rules, Will's; source `src/app/(dev)/design/rules/bible.ts`) plus each component's contract (a test that opens with `// @contract-for: <path>`, shown on the component's library row). Nothing else is a rule.** A contract guards a component's function (structure, accessibility, single sources, its engine), never its look; never add a rule for one page or one look, and never pin copy with a test. A ★ in a doc marks a landmine (a silent breakage if reverted), never a design decision. A rule that blocks better work is a finding, not a wall: say so in your manifest and build the better thing in the lab; the Orchestrator lands the change, and the bible changes only by Will's ruling (2026-09-12).
- **Leave WHY-comments** for the next agent — capture non-obvious decisions + what NOT to do; don't narrate the obvious.
- **Backend jobs must be operable + observable from `/admin`** — when you build any backend job (cron, Worker, backup), ship its admin management + health signal in the SAME change (zero silent failures; the admin-portal P8 mandate).
- **Test data integrity as you build** — Vitest for pure logic + a rolled-back Supabase-MCP RPC contract check for new SQL.
- shadcn UI files (`src/components/ui/*`) are authored **without semicolons** by the generator; app code uses semicolons — don't reformat to "match". Markdown is `.prettierignore`d (author docs by hand).
- Prefer editing existing files; reuse the design-system primitives.
