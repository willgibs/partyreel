---
track: billing-locks
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  and its Billing row "Pass expired" where it said "Pass expires" of a past date. Recommended: as built.
- **Where does "lapsed, since when" come from?** Built: the ledger, by the completes' own predicate (her tier a pass's,
  no unconsumed pass live now), never `profiles.tier_expires_at`; since is when her last pass stopped being live (its
  expiry, or its conversion to Pro credit when that came first). A credited host whose subscription event has not
  landed reads lapsed for those seconds, which is true (her uploads are refused then). Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md` (owned): a lapsed pass is refused at the presign's meter too (and the advisories
  still read it not full); the credit's conversion is one call, her profiles row first; the sole-writer line names the
  conversion's clear.
- `docs/systems/database-security.md` (the lane's fact, a read in the frontmatter): the profiles-first rule now covers
  every writer of a pass's row (the "one cycle outside them" sentence deleted, the measured reason in its place); the
  service-role-only inventory names `uploads_windows` and `consume_passes_for_pro_credit`.
- `docs/systems/admin-observability.md` (the lane's fact): the accounts list and page ask one keyset read; a lapsed
  pass reads Pass lapsed, since when, Uploads refused.

## Deferred (ROADMAP one-liners, bucket named)

- Uploads: the three upload advisories (`get_upload_context`, `get_upload_gate`, `get_host_upload_context`) still read a
  lapsed pass as not full, so her album's upload door opens and the presign refuses; reading the completes' predicate
  there is a replacement of the three (a migration).
- Uploads: the completes' allowance refusal reaches a host as "Storage is full for your plan" (`mapHostCheckViolation`,
  `db/mutations/host-media.ts`, maps every "limit" to the room's words) and a guest as the SQL's own "Upload limit
  reached for this plan.", where the presign says each route's allowance sentence.

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
