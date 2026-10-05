---
track: billing-locks
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "75f3ce9f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261005130000_billing_locks.sql
  - src/lib/db/mutations/event-passes
  - src/app/api/stripe/webhook/
  - src/lib/upload/server-pipeline-meter
  - src/app/admin/accounts/
  - src/lib/db/queries/accounts
  - src/lib/db/queries/month-uploads
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - docs/systems/database-security.md
  - docs/PRICING.md
---

# lp/billing-locks

**Goal.** Three billing crumbs from the ROADMAP, each on the database's own terms: the Stripe webhook's pass-for-Pro-credit conversion takes the host's profile row first, as the upload completes do, so the two can never deadlock; the presign meter refuses a lapsed pass up front, as the completes already do; /admin/accounts reads every listed host's uploads in one call, and a lapsed pass reads truly where it read "0 B".

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3131 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate. Stripe is TEST mode; nothing of yours calls Stripe's API.

**Read first:** `docs/systems/billing-caps.md` (★ the Stripe webhook is the sole writer of `profiles.tier` and `storage_cap_bytes`; never trust the client for entitlements) and `docs/systems/database-security.md` (definer rules, grants, the apply protocol, the row cap).

**The fixes**, each pinned by a test that fails on the old code:
1. **A lock-order cycle.** `consumeLivePassesForProCredit` (`src/lib/db/mutations/event-passes.ts`, from the Stripe webhook) writes `event_passes` then `profiles`, while the upload completes take `profiles` then the pass's row: a cycle Postgres detects and breaks by failing one side (retried, never corrupt, but a webhook or an upload fails for no reason of hers). One service-role RPC that takes the host's `profiles` row first, then converts her live passes, in one transaction; the webhook calls it and stays the sole writer it is.
2. **A lapsed pass uploads, then is refused.** Until the nightly recompute, the presign's meter (`meter_upload`, called by `src/lib/upload/server-pipeline-meter.ts`) presigns a lapsed pass's upload and the bytes go up, then the complete refuses it. Refuse it at the presign as the completes do, with the same words, so nothing is sent for nothing. A function replacement starts from its newest definition in `supabase/migrations/`.
3. **`/admin/accounts` makes 50 `uploads_used` calls a page view** (`src/app/admin/accounts/uploads.ts`, `src/lib/db/queries/accounts.ts`): one set-returning read for the page's hosts (keyset or id list, clamped to 1,000), each figure exactly what `uploads_used` answers for that host, under a parity test. And a lapsed pass reads "0 B" of its allowance while its uploads are refused: say what is true (lapsed, uploads refused, since when).

**The migration** is exactly `supabase/migrations/20261005130000_billing_locks.sql`, with its rolled-back contract check at its foot, run through the Supabase MCP inside `begin; ... rollback;` (or a DO block ending in a deliberate raise). The Orchestrator applies it after the Advisor reads it; nothing of yours writes to the database. Every new function revokes from `public` before it grants exactly; definer bodies pin `search_path = ''`.

Out of scope (later lanes): renaming the uploads meter's wire names, and the idempotent complete. Wiring rigor: the whole gate.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **What does a host whose pass lapsed read when she uploads?** Built (the brief's "the same words"): the presign
  refuses it as the allowance (the wire's `'monthly'`), so she reads "You've hit this plan's upload limit for now." and
  a guest "This album has hit its upload limit for now.", until the nightly recompute moves her to Free. Recommended:
  keep for now (a day at most, and the Plan card says her pass ended). The alternative is a host-only sentence that
  names the cause ("Your Event Pass has ended. Renew it to keep collecting."): a new meter reason and one host-route
  case, the guest's words unchanged.
- **How does the operator read a lapsed pass?** Built: the list's Uploads cell says `PASS LAPSED` and the day it ended,
  its Allowance cell "Uploads refused", the row tinted as an account at its limit; the account's page says "Her pass
  ended <minute UTC>: new uploads, hers and her guests', are refused until the nightly recompute moves her to Free.",
  and its Billing row "Pass expired" where it said "Pass expires" of a past date. A pass converted to Pro credit whose
  Pro plan has not landed (her uploads refused too) reads `PRO PENDING` and "Her passes became Pro credit <minute UTC>
  and her Pro plan has not landed yet: new uploads, hers and her guests', are refused until it does." Recommended: as
  built.
- **Where does "lapsed, since when" come from?** Built: the ledger, by the completes' own predicate (her tier a pass's,
  no unconsumed pass live now), never `profiles.tier_expires_at`; since is when her last pass stopped being live (its
  expiry, or its conversion to Pro credit when that came first, which the read says apart). Each row also answers the
  tier and cap its figure was read with, and the page holds the figure to that plan's allowance, so a plan that moved
  since the list's read never pairs one plan's figure with another's allowance. Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md` (owned): a lapsed pass is refused at the presign's meter too (and the advisories
  still read it not full); the credit's conversion is one call, her profiles row first; the sole-writer line names the
  conversion's clear.
- `docs/systems/database-security.md` (the lane's fact, a read in the frontmatter): the profiles-first rule now covers
  every writer of a pass's row (the "one cycle outside them" sentence deleted, the measured reason in its place); the
  service-role-only inventory names `uploads_windows` and `consume_passes_for_pro_credit`.
- `docs/systems/admin-observability.md` (the lane's fact): the accounts list and page ask one keyset read, each row
  held to the plan it was read with; a lapsed pass reads Pass lapsed (or Pro pending), since when, Uploads refused.
- `docs/systems/billing-caps.md` also says the credit grant's idempotency as Stripe keeps it (at least 24 hours,
  against a delivery's three-day retry), where it said a retry never double-grants.

## Deferred (ROADMAP one-liners, bucket named)

- Uploads: the three upload advisories (`get_upload_context`, `get_upload_gate`, `get_host_upload_context`) still read a
  lapsed pass as not full, so her album's upload door opens and the presign refuses; reading the completes' predicate
  there is a replacement of the three (a migration).
- Uploads: the completes' allowance refusal reaches a host as "Storage is full for your plan" (`mapHostCheckViolation`,
  `db/mutations/host-media.ts`, maps every "limit" to the room's words) and a guest as the SQL's own "Upload limit
  reached for this plan.", where the presign says each route's allowance sentence.
- Pricing: the pass-to-Pro credit's balance grant is idempotent only for Stripe's key window (at least 24 hours) while a
  delivery retries for three days, so a conversion that fails for more than a day grants the balance again; dedupe on
  Stripe's side (`metadata.pass_credit_session` on the grant, read back with `customers.listBalanceTransactions`
  before granting).
- Pricing: a replay of a credit delivery consumes a pass bought after the conversion (a day-old pass checkout paid
  after going Pro) with no credit for it; the conversion should take only the passes the checkout credited.
- Pricing: `recomputePassEntitlement` reads the ledger and writes the profile in two requests, so a recompute racing a
  conversion can put back the chain fields it just cleared until the subscription event lands; one SQL recompute under
  the profiles lock would close it.

## Handoff (replaces the chat report)

- **Commits:** the work is six commits on `lp/billing-locks`, `e1e24bec9` to `df035fa2b`, pushed; this Handoff is the
  manifest alone on top. No sync: launch-prep moved (crumbs-76 and crumbs-78 merged, uploads-idempotent cut) but nothing
  that landed touches this lane's paths or reads (`comm` of the two diffs empty; uploads-idempotent claims no path of
  this lane and reads `server-pipeline-meter.ts`, which this lane left as it was).
- **Gates on `df035fa2b`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (no warning); `pnpm test` 0
  (946 files, 11,817 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0
  (145 checks, 0 failing; dev server killed by port after). Logs in `../_scratch/billing-locks/gate2-*.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under an `owns` prefix or this file,
  but two system docs listed under System-doc edits: `docs/systems/admin-observability.md` (its accounts fact) and
  `docs/systems/database-security.md`, a `reads` entry in the frontmatter, edited only where its facts were this lane's
  (the "one cycle outside them" sentence, false once the conversion takes the profiles row first, and the inventory's
  two new functions). `src/lib/db/queries/month-uploads` is owned and untouched.
- **1. The conversion's lock order** (`supabase/migrations/20261005130000_billing_locks.sql` §1,
  `src/lib/db/mutations/event-passes.ts`, `src/app/api/stripe/webhook/route.ts`): `consume_passes_for_pro_credit`
  takes the host's profiles row FOR UPDATE, then consumes every unconsumed pass and clears `tier_expires_at` and
  `event_slots`, one transaction; the webhook makes that one call and patches no chain itself. Pinned: the route test
  "grants the balance once ... never patches the chain itself" fails on the old route (two profile patches), the
  mutation test fails on it (`from("event_passes")`), and `event-passes-migration.test.ts` holds every SQL writer of a
  pass's row to the same host's profiles lock first. ★ A finding: as shipped, the two writes NEVER deadlocked (two
  PostgREST requests, two transactions); joined in their order they do (`40P01`, measured in the two-session run,
  `../_scratch/billing-locks/pre/locks.log`); the present-day defect was the half state between them (a reader saw her
  passes consumed with her chain still set). ROADMAP's line called it a cycle Postgres detects.
- **2. The meter's lapsed pass** (§2): `meter_upload` refuses a pass holder with no live pass as the allowance
  (`'monthly'`), the completes' predicate over the same rows, after the allowance and before the room, no lock; its
  `pg_get_functiondef` diff against 20261004100000 is that one block. Pinned in `server-pipeline-meter-migration.test.ts`
  (the predicate compared with both completes'), red without the file.
- **3. The accounts read** (§3, `src/lib/db/queries/accounts.ts`, `src/app/admin/accounts/`): `uploads_windows` answers
  every listed host in one keyset read (1 call a page view, was 50), each figure `uploads_used(host, her own tier)`
  called per row, with the plan it was read with (the page holds the figure to that plan's allowance), the lapsed
  flag, since when, and whether it was a conversion; 1,000 hosts in 22 ms on the stand-in. A lapsed pass reads
  `PASS LAPSED` (or `PRO PENDING`), its date and "Uploads refused", never "0 B"; the account's page says what lifts it.
  Pinned: `reads.test.ts` "in ONE call" and the page tests fail on the old code; `accounts-migration.test.ts` holds
  parity by construction and the lapsed predicate to the completes'.
- **The proofs:** the rolled-back proof at the file's foot, run on the live schema through the Supabase MCP with both
  INVOKER bodies as the service role: RED 0/6 without the file's statements (the meter admits a lapsed pass both
  writers refuse), GREEN 6/6 with them, nothing persisted (meter_upload still at `00a25a03`, no fixture row). The
  pre-flight on a throwaway Postgres 17 cluster: RED 0/8, GREEN 8/8 (`../_scratch/billing-locks/pre/contract.sql`); a
  grant slipped to authenticated still fails 42501 on event_passes. Before the apply, live PostgREST answers both new
  names PGRST202 (`../_scratch/billing-locks/probe.mjs`), which the accounts read turns into "No reading" per row.
- **Red-team** (a fresh-eyes agent over the diff): no HIGH; acted on its LOW and NIT findings (the row's own plan, Pro
  pending, the proof as the service role, the writer rule broadened to delete and insert and tied to the same host,
  the mapping inside the try) in `91efb046d`; its MEDIUM, the grant's idempotency window, is older than this lane, now
  said truly in the code, the docs and the migration's apply note, and deferred with its fix; a negative `p_limit` stays
  an error (the row-cap rule's exact clamp text).
- Assets requested from Will: none.
- Board ideas: the host's own surfaces could say a lapsed pass's truth as the operator's page now does (the Plan card,
  and the storage ring's uploads line, which waits on a pass figure today: billing-caps.md).
- **Proposed migration:** `supabase/migrations/20261005130000_billing_locks.sql`, ★ applied BEFORE the lane's code
  deploys (a deploy ahead of it fails every credited delivery after the balance grant, and past a day a retry grants
  again; every accounts row reads No reading). Then `get_advisors` (expected unchanged: both new functions INVOKER and
  the service role's alone), regenerate `src/lib/db/types.ts`, and drop the two typed seams (`passCreditDb`,
  `uploadsWindowsDb`). ROADMAP's line 42 (the accounts calls and the lapsed "0 B") and lines 58 and 59 are done. No
  Worker, Vercel, Stripe or env change.
- Calls his to overrule: both new functions are SECURITY INVOKER (least privilege), not DEFINER; the lapsed refusal at
  the presign speaks the allowance's words (no new reason); the operator's words `PASS LAPSED`, `PRO PENDING` and
  "Uploads refused"; the grant's Stripe-side dedupe left to a later crumb rather than added to this payment path.
- **Look at first:** the migration file (the Advisor's read), then, after the apply, `/admin/accounts` and an account
  page on the desk at 3000 under the operator's sign-in (its TOTP is Will's): one read for the page, and a lapsed row's
  words (staging one needs an `event_pass` profile whose passes have ended; there is no pass row live today).
