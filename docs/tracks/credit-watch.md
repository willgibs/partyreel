---
track: credit-watch
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0ff67f0a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/webhook/
  - src/lib/db/mutations/event-passes.ts
  - src/lib/lifecycle/sweeps/passes
  - src/lib/billing/passes
  - src/app/admin/accounts/
  - supabase/migrations/20261005201000_credit_watch.sql
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20261005181000_billing_integrity.sql
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
---

# lp/credit-watch

**Goal.** The pass-to-Pro credit's last holes closed and watched: a leased claim never refuses for good, a stuck credit shows in /admin, the recompute's seconds window and the sweep's cost, and a portal configuration missing a price caught.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3138 is yours; 3000 is Will's desk. Stripe is TEST mode: confirm `livemode` false before any Stripe MCP call; write nothing to Stripe but TEST fixtures you make and remove.

From the Advisor's review of billing-integrity (applied today, `20261005181000`) and that lane's Deferred lines. Each pinned by a test that fails on the old code:
1. **A leased claim never refuses for good:** `claim_pass_credit` answers `overlap` when another checkout's claim on the same passes merely holds its lease; if that holder dies and its retries run out (three in TEST), neither session grants. Answer `busy` while the other is only leased (overlap only against a granted claim or a converted pass). A migration, `supabase/migrations/20261005201000_credit_watch.sql`, restating the one body (a rolled-back check at its foot); the Advisor reads it before the apply.
2. **A stuck credit shows where the operator looks:** an `/admin/accounts` line read from `pass_credits` (claimed and never granted past an hour; granted and never converted), with its health on /admin/jobs' signals as the program's zero-silent-failures rule asks.
3. **The recompute's seconds:** a recompute landing between a credited checkout's conversion and its subscription event moves her to Free for those seconds; skip a non-Pro profile whose last live passes converted to Pro credit within the hour.
4. **The sweep's cost:** `expired_passes` takes every owner of an unconsumed pass, expired ones included, so long-expired passes are recomputed every night for good; read only owners of a pass live or ahead, plus the `event_pass` labels.
5. **A portal configuration missing a price:** TEST's change-plan configuration listed six retired prices today (every Switch a 500, fixed by the Orchestrator); an `/admin` check that the tagged configuration lists every price `tiers.ts` sells, read with the Stripe client, so the gap shows before a host meets it.

Wiring rigor: the whole gate; the webhook's tests replaying each case.

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

## Where I am

- Done and pushed: `42f3ac00d` (the five items: the claim's busy rule and settled overlap, the stuck credits on
  /admin/accounts with Retry and the `pass_credit` signal, the recompute's Pro-pending skip, the sweep's live-or-ahead
  candidates, the change-plan configuration check), `e13380c01` (billing-caps.md, one pointer line in
  admin-observability.md), `927db4ce3` (the configuration check streams; each stuck half one request). Gates green on
  `927db4ce3`: typecheck, lint, test (1014 files, 12,575 tests); lab:smoke 149/0 on `42f3ac00d`; the rolled-back proof
  RED 0/5, GREEN 5/5 and the pre-flight's five lock races on the SQL as of `42f3ac00d`.
- Mid-flight (on disk, uncommitted): a fresh-eyes red-team found a HIGH: the busy rule widens a double grant when a dead
  holder's grant reached Stripe but its record was lost (the other tab's retry claims past the lapsed lease and grants
  without looking). Fixing at the source: the claim names the orphans it is taken past (other checkouts' lapsed,
  ungranted, unreleased claims on its passes) and the route looks on Stripe's side for their grants before granting
  (found: record and convert that checkout's, release this one; none: grant, then release the orphans). The migration
  is edited for it (orphans; released grants kept out of the overlap; the release's lease refusal dropped).
- Next: the TS for the orphans (`parseClaim`, `honorPassCredit`, a `findGrants` over several sessions), the webhook and
  SQL-facts tests, the MEDIUM (credited-twice claims on the Accounts check, 30 days), the LOWs (the delivery's credited
  flag cleared after the credit, honoured excludes a conversion of none, the released words, the header's
  before-apply line), then the rolled-back proof and pre-flight again (new hashes), the whole gate, and this manifest's
  Questions, Deferred and Handoff.
