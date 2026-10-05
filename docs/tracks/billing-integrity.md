---
track: billing-integrity
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/webhook/
  - src/lib/db/mutations/event-passes.ts
  - src/lib/lifecycle/sweeps/passes
  - src/lib/billing/passes
  - src/lib/db/mutations/host-media.ts
  - src/lib/db/mutations/guest.ts
  - src/app/api/r2/presign-upload/
  - src/app/api/host/r2/presign-upload/
  - src/lib/upload/
  - supabase/migrations/20261005181000_billing_integrity.sql
  - docs/systems/billing-caps.md
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - supabase/migrations/20261005130000_billing_locks.sql
  - src/lib/constants/tiers.ts
---

# lp/billing-integrity

**Goal.** Money and the meter tell one truth: the pass-to-Pro credit granted once ever, a replay never consuming a later pass, the pass recompute one SQL under the profiles lock, the upload advisories reading the completes' own predicate, and each allowance refusal in its true words.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk. Stripe is TEST mode: confirm `livemode` false before any Stripe MCP call, and write nothing to Stripe but TEST fixtures you make and remove.

**What this is.** Five holes in money and the meter, from ROADMAP "Now" (their provenance in git; `billing-caps.md` and `uploads-and-r2.md` are the system docs). Each fix pinned by a test that fails on the old code:
1. **The pass-to-Pro credit can be granted twice.** The webhook grants the prorated pass credit as Stripe customer balance under the idempotency key `pass-credit-<session>` (`src/app/api/stripe/webhook/route.ts`, near line 267), which Stripe honors for at least 24 hours, while Stripe retries a failing delivery for three days: a conversion failing past a day grants the balance again. Make the grant once ever per checkout session (recommended: our own durable claim keyed by the session, taken before the grant and read on every retry, with the balance transaction carrying the session in its metadata, so a claim lost mid-call is found on Stripe's side before granting again).
2. **A replayed credit delivery consumes a pass bought after the conversion** (a pass checkout paid a day after going Pro is consumed with no credit for it): the conversion takes only the passes its checkout credited (the session names them).
3. **`recomputePassEntitlement` reads the ledger and writes the profile in two requests**, so a recompute racing a conversion can put back the chain fields the conversion cleared until the subscription event lands: one SQL recompute under the profiles lock (billing-locks' order: profiles first).
4. **The three upload advisories (`get_upload_context`, `get_upload_gate`, `get_host_upload_context`) read a lapsed pass as not full**, so her album's upload door opens and the presign refuses: they read the completes' own predicate (one home for "may this account still add"), so the door, the presign and the complete agree.
5. **The allowance refusal's words:** a host gets "Storage is full for your plan" for every refusal containing "limit" (`mapHostCheckViolation`, `src/lib/db/mutations/host-media.ts`), a guest the SQL's own "Upload limit reached for this ..." text: each refusal says which line was met (the uploads line or storage) in the product's voice, for both.

The SQL in one migration, `supabase/migrations/20261005181000_billing_integrity.sql`, per `database-security.md` (owner-only grants; a rolled-back Supabase MCP check of each transition, kept commented at the file's foot); the Orchestrator has the Advisor read it against the live schema before applying it. Wiring rigor: the whole gate; the webhook's tests replaying each delivery (a retry inside and past 24 hours, a replay after a later pass, a recompute racing a conversion); the advisories against the completes on a lapsed pass in the rolled-back check.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

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
