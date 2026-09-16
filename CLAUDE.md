@AGENTS.md

# Partyreel — agent operating guide

> The only file auto-loaded every session, so it stays lean: the workflow, the universal rules and a
> map to everything else; depth loads on demand from `docs/`. The `@AGENTS.md` import is
> load-bearing: this is **Next.js 16**, with breaking changes from older Next.

Partyreel is a guest-powered event media platform: a host creates an event and shares a **QR code**;
guests scan it and upload photos and videos from their phones with no app and no account (a verified
email when the host requires one); the host curates; the link doubles as the shareable album; every QR
exposes Partyreel to future hosts. Marketing site, host app, guest links and the admin portal live on
one domain. The product is built and live at partyreel.com with zero real users (Stripe TEST mode; the
launch switches deliberately unspent) under the **elevation program** ([`docs/PROGRAM.md`](docs/PROGRAM.md)):
work rides `launch-prep` in rounds, each a catalog in the lab, Will's verdicts, then the wiring.

## Orient — the docs, and what each answers

| Your question | Read |
| --- | --- |
| How do we work here? | this file |
| What exists, its invariants, the gotchas? | [`docs/SYSTEMS.md`](docs/SYSTEMS.md) → the `docs/systems/<x>.md` deep doc; the whole picture in [`architecture.md`](docs/systems/architecture.md) |
| How do I verify live? (the test tools' blind spots) | [`docs/systems/testing-verification.md`](docs/systems/testing-verification.md) |
| Where are we right now? (the round, live state, Will's queue) | [`docs/STATUS.md`](docs/STATUS.md), a snapshot replaced at every round close |
| What is every open track doing? | [`docs/tracks/`](docs/tracks): one manifest per open `lp/<track>` branch, deleted at its merge |
| What program is running: roles, the round, the rules? | [`docs/PROGRAM.md`](docs/PROGRAM.md) |
| What might be next? (provisional) | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| What shipped in the last two rounds? | [`docs/CHANGELOG.md`](docs/CHANGELOG.md); `git log` for anything older |
| What binds design work? | the Library at `/design/library` (the bible, every component's contracts, the policies), levelled in [`docs/design/README.md`](docs/design/README.md); Will's rulings in [`docs/design/rulings.md`](docs/design/rulings.md) |
| What assets has Will been asked for? | [`docs/ASSETS.md`](docs/ASSETS.md) |
| Product vision / pricing | [`docs/PRD.md`](docs/PRD.md) · [`docs/PRICING.md`](docs/PRICING.md) |

The system docs are the load-bearing layer (what exists and don't-revert) and win over the ROADMAP
(provisional) and `docs/adr/` (point-in-time rationale, being folded into them); keep them in sync.

## The working loop

1. **Orient**: STATUS, then the system doc the task touches.
2. **Doc-check**: CURRENT docs for the libraries the task touches via the Context7 MCP (Next 16,
   Tailwind v4, zod v4 and Supabase SSR drift in ways that look like your code is wrong).
3. **Plan, asking hard**: surface every open product, UX or scope decision before building; an agent
   writes them in its manifest under "Questions" with a recommended answer and the Orchestrator asks
   Will. A confident agent executing the wrong strategy is the expensive failure.
4. **Build** from the Library (`/design/library`: what binds you; the kit at `src/components/lab` for
   a board; `src/components/ui` and `src/components/shared` for the product). The design law is short
   on purpose: the bible (22 rules, Will's), a component's contracts and the policies bind; everything
   else is precedent you may break. Rising tides (bible 22): judge every section, component, flow and
   line from the ground up, in the lab first, then wire. An exploration is a catalog of polished
   variants to pick from, not a paper, and every ask carries its context. Design as if design
   resources are unlimited: ask for the exact asset in your Handoff and ship the stand-in meanwhile.
   Propose a creative delight (the `/emil-design-eng` skill; animate by frequency). Leave WHY-comments.
5. **Test**: Vitest for pure logic; a rolled-back Supabase-MCP RPC check for new SQL; `pnpm typecheck
   && pnpm lint && pnpm test && pnpm build`; `get_advisors` after any DDL.
6. **Verify antagonistically**: force the error cases, the cross-tenant and abuse paths, malformed
   input; local first (curl, the Supabase and R2 MCPs), then live for the allow-list-gated flows. A
   lab-only round verifies light instead: the board at 1440 and 375, reduced motion, the gate.
7. **Commit and hand off** on your own `lp/<track>` the moment the gate is green; only the
   Orchestrator merges, deploys and mutates config.
8. **Record subtractively**: the owning `docs/systems/` doc refined in place (a fact inside your lane,
   listed in the manifest); the manifest's Record and Deferred lines; nothing else.

Clarify hard up front, then execute boldly without re-litigating the plan; stop only for a genuinely
new decision. The human is a targeted instrument for what you cannot drive (a file upload, a password,
a logged-out flow): stage it, hand off the smallest action, resume. A test result that smells
non-human (a timing artifact, a tool limitation) gets a 10-second human look before you build tooling.

## Sessions & roles

Every top-level session is an **Agent** unless Will's first prompt designates it **the Orchestrator**
(max one, in the repo root). Agents work in a worktree on their own `lp/<track>` branch created at boot
from `origin/launch-prep` ([`docs/PROGRAM.md`](docs/PROGRAM.md) "Agent boot"), with a manifest at
`docs/tracks/<track>.md` (its lane, its questions, its handoff; `pnpm test` refuses two live claims that
overlap). A repo-root session without the designation shares the Orchestrator's tree: read and advise,
never edit or commit there. Worktree sessions have no out-of-repo memory by design: the repo is the
whole context, and a fact an agent needed and could not find is a doc bug to report.

## Commands

```bash
pnpm dev            # next dev (Turbopack) on :3000; `rm -rf .next/dev` first when a CSS edit does not show
pnpm build          # production build
pnpm lint           # eslint (`next lint` is gone in 16)
pnpm typecheck      # next typegen && tsc --noEmit
pnpm format         # prettier on your CHANGED files only; never the whole repo (it mangles dynamic classNames)
pnpm test           # vitest run
pnpm design:rules   # regenerate the rules artifact after a contract, policy or `for` line changes
pnpm lab:smoke --base <url>    # crawl every lab route against a running server
pnpm new-board <id> "<title>"  # scaffold a catalog board
```

Node `.nvmrc` (22.21.1); pnpm 9.14.4. The gate before every commit: `pnpm typecheck && pnpm lint &&
pnpm test`, plus `pnpm build` before a handoff. Formatting is not in the gate.

**Stack (pinned; verify against current docs before upgrading):** Next.js 16.2.6 (App Router, `src/`,
TS) · React 19.2.4 · Tailwind v4 (CSS-first) · shadcn radix-nova 4.8.2 + `radix-ui` 1.4.3 · lucide-react
· Supabase (`@supabase/ssr` 0.10 + `-js` 2.106) · zod v4 · sonner · Cloudflare R2 (`@aws-sdk/client-s3`)
· Stripe 22 (TEST mode, live-verified) · Vitest 4.

**MCP tooling:** Context7 (library docs: the first stop for "how does X work in this version") ·
Supabase (schema and DB ops; project `ddafaemglzmuekbtjwzn`; the CLI is not installed, migrations land
via `apply_migration`; MCP-created RPCs inherit an `anon` EXECUTE grant: [database-security.md](docs/systems/database-security.md))
· Cloudflare R2 (account `8bd90d2f6a374d6cdff2f379e929b060`, bucket `partyreel`; cannot mint tokens or
set CORS) · Vercel (deploys and logs; never env vars or domains) · Stripe (acct `acct_1TcStrPtjqmVkBwk`;
one mode per key, check `retrieve_balance` → `livemode` first; [billing-caps.md](docs/systems/billing-caps.md))
· shadcn (no `form` item in radix-nova; ours is hand-authored) · the browser pane and Chrome for UI.

## Local dev vs. live testing

Local first: `pnpm dev` with `.env.local` runs every server route, RPC and query against the real
Supabase and R2. What localhost cannot do is the allow-list-gated flows: sign-in, upload (R2 CORS),
email round-trips, checkout. For those, and a final adversarial pass, drive the Chrome MCP against the
`launch-prep` alias (`https://partyreel-git-launch-prep-partyreel.vercel.app`, allow-listed like prod;
`lp/*` aliases are not, by design). Never skip or silently downgrade the live red-team; the one
carve-out is a lab-only round. Google sign-in through the account CHOOSER is authorized
(`willg97@gmail.com` host, `partyr33l@gmail.com` admin); never type a password or OTP. Live and DB
testing is expected, with disposable test data only; the test tools' blind spots (a working feature
reading as broken) are in [testing-verification.md](docs/systems/testing-verification.md).

## Secrets & env vars

A new secret goes in all three: `.env.local`, the Vercel project env as NON-sensitive (flipped at the
launch checkpoint), `src/lib/env.ts` (zod, `.optional()` + a lazy `assert*Env()`). Vercel env vars via
the REST API with `$VERCEL_TOKEN` (team-scoped to the P3 Partyreel Team; the `vercel` CLI cannot run on
it): read `GET api.vercel.com/v9/projects/partyreel/env`, write `POST /v10/projects/partyreel/env?upsert=true`.
Deploy auth: `gh` → `willgibs/partyreel` (`git push` runs through its credential helper); `wrangler` →
the P3 Cloudflare team, and `wrangler whoami` before any Worker deploy (other projects re-login it to
the personal account). Never commit a secret.

## Universal gotchas (per-system ones live in `docs/systems/`; ★ marks a landmine)

- **Next.js 16**: `params` and `searchParams` are Promises (`await params`); `cookies()` / `headers()`
  are async; middleware is `src/proxy.ts` exporting `proxy` on the Node runtime (no `runtime` config);
  read `node_modules/next/dist/docs/` when unsure.
- **Supabase / auth**: ★ authorize with `supabase.auth.getUser()`, never `getSession()`; the proxy
  refreshes cookies and is not a security boundary. `@supabase/ssr` with `getAll` / `setAll`; clients in
  `src/lib/supabase/{client,server,middleware,admin}.ts` (admin = service-role, `server-only`).
- **Tailwind v4**: CSS-first; tokens in `@theme` and the dark variant in `src/app/theme.css`; no
  `tailwind.config.js`; the lab compiles its own utilities from `src/app/(dev)/design/design.css`
  (pinned by `css-source-policy.test.ts`); translate utilities set the standalone `translate` property.
- **zod v4**: `z.url()`, `error.issues`. **Postgres**: ★ integer literals are int4; write `2::bigint * …`.
  **pnpm**: `shadcn` is a real build dependency; one `zod` via `pnpm.overrides`; `src/components/ui/*`
  is semicolon-free by the generator and app code uses semicolons; reformat neither to match.
- **Copy**: no em-dashes in user-facing copy (an AI tell; `no-em-dash-policy.test.ts` enforces it);
  all copy is open (bible 21); no mono face anywhere (bible 7; `two-faces-policy.test.ts`).
- **Git, the program's branch protocol** (depth in [`docs/PROGRAM.md`](docs/PROGRAM.md)): agents commit
  only to their own `lp/<track>` and may push it freely; an `lp/*` push builds a preview only on
  `[preview]` and runs CI only on `[ci]`, both the Orchestrator's to add; CI is not the gate, the four
  local steps are; only the Orchestrator merges into `launch-prep` (its alias builds on `[preview]`,
  once per round close; record commits say `[skip ci]`), applies migrations, deploys Workers and
  mutates config; `src/lib/db/types.ts` is generated, never hand-edited; `main` is frozen except
  milestone merges (`--no-ff`, tagged) and true hotfixes. Always: tests green before a commit; stage
  explicitly (never `git add -A`); never commit a secret; never `--no-verify` or force-push; the
  `Co-Authored-By` trailer on every commit.

## Security guardrails (non-negotiable)

- RLS is the security boundary: re-verify with `getUser()` in every Server Function and route handler
  AND rely on RLS / SECURITY DEFINER RPCs ([database-security.md](docs/systems/database-security.md)).
  Anonymous guests use capability tokens validated inside security-definer RPCs; `anon` never gets
  direct table access. The service-role key is server-only (`src/lib/supabase/admin.ts`); never `NEXT_PUBLIC_`.
- ★ Never expose raw R2 keys or URLs to the browser; presign server-side ([uploads-and-r2.md](docs/systems/uploads-and-r2.md)).
- ★ Never trust the client for tier or entitlements: the Stripe webhook is the sole writer of
  `profiles.tier` / `storage_cap_bytes` ([billing-caps.md](docs/systems/billing-caps.md)).
- ★ Host table writes are COLUMN-locked: revoke at the table level first, then re-grant legit columns.
- Events have no end date; deletion is the only lifecycle exit (the anti-abuse core).

## DRY single-sources (never duplicated), and the database

`src/lib/constants/tiers.ts` (pricing and tier limits; mirrored by the `public.tier_limits()` SQL
function, a parity test guards it) · `src/lib/media/limits.ts` (per-file media limits) ·
`src/lib/r2/keys.ts` (R2 object keys) · `src/lib/r2/delete.ts` (bulk delete and list) · `src/lib/db/*`
(all DB access; never inline SQL in components) · `src/lib/env.ts` (env vars) · `src/lib/utils.ts` (`cn()`).
Schema is Supabase-native: SQL migrations in `supabase/migrations/` + RLS + generated types
(`src/lib/db/types.ts`: generated, and read it for table and column names before writing SQL). After
any schema change: `get_advisors` and regenerate types; the accepted advisor set is in
[database-security.md](docs/systems/database-security.md). A backend job ships its `/admin` management
and health signal in the same change (zero silent failures).

## Keeping the docs healthy

Two rules: **every fact has one home** (the doc whose question it answers) and **edit in place, never
append** (refine the line; stale → delete; a shipped narrative → the round's CHANGELOG entry; a deferred
task → one line under its ROADMAP bucket). **Nothing under `docs/` is history: the current round and the
one before; git holds the rest.** A new gotcha goes in its `docs/systems/` doc, never here. The design
law is the bible plus each component's contract (a test opening with `// @contract-for: <path>`); a
contract guards function, never look; never pin copy or a look with a test; a rule that blocks better
work is a finding for your manifest, not a wall. Under the program an agent records only in its
manifest. Markdown is `.prettierignore`d; author docs by hand.
