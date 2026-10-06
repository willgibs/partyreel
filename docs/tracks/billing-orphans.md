---
track: billing-orphans
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261006120000_billing_orphans.sql
  - src/lib/billing/
  - src/lib/stripe/
  - src/app/api/stripe/
  - src/app/admin/accounts/
  - src/app/admin/jobs/
  - src/lib/jobs/
  - src/app/api/cron/spend-watch/
  - src/components/app/pricing/
  - src/lib/db/queries/pass-credits.ts
  - src/lib/db/queries/pass-credits.test.ts
  - src/lib/db/queries/event-passes.ts
  - src/lib/db/queries/accounts.ts
  - src/lib/db/queries/accounts-migration.test.ts
  - src/lib/db/mutations/event-passes.ts
  - src/lib/db/mutations/event-passes.test.ts
  - src/lib/db/mutations/event-passes-migration.test.ts
  - src/lib/db/billing-orphans.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/billing-caps.md
  - docs/systems/database-security.md
  - src/lib/constants/tiers.ts
---

# lp/billing-orphans

**Goal.** Milestone 38's billing line closed: an orphan's pass-credit grant adopted as one SQL function under her profiles lock (two orphans flagged, a released claim refused), the change-plan configuration watched at its source (the spend watch's daily run and /admin's health line name a missing price), and the Plan card saying her credited Pro is on its way. One migration, written here and applied by the Orchestrator through the Advisor.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control and its health signal, zero silent failures); cost designed like the architecture; production is the working version.

**Why now.** Money and the meter must tell one truth before milestone 38 ships (billing-integrity and credit-watch landed the pass-to-Pro credit once ever, a leased claim answering busy, a stuck credit on `/admin/accounts` with Retry). The Advisor's Q38 and credit-watch's second red-team pass left one hole tagged for milestone 38, and the change-plan path two blind spots. Read `docs/systems/billing-caps.md` (its ★ lines) and `docs/systems/database-security.md` first; the newest definition of each function you replace is in `supabase/migrations/` (`20261005181000_billing_integrity.sql`, `20261005201000_credit_watch.sql`).

**The work (each line retired from the ROADMAP in your Handoff):**
1. **The orphan's grant as one transaction (milestone 38's line):** adopt an orphan's grant (record, convert, this claim's release) as one SQL function under her `profiles` lock, so a failure between them never leaves the orphan granted and unconverted until a retry or the operator's Retry; flag two orphans both holding grants; and have `record_pass_credit_grant` refuse a released claim. A migration: `supabase/migrations/20261006120000_billing_orphans.sql`, starting from each function's newest definition, its grants exact (CLAUDE.md's ★ lines: revoke from `public` first, then grant exactly), with rolled-back proofs through the Supabase MCP (`begin; … rollback;`: the old code's failure shown, the new one's refusal and its success) in your Handoff. You never apply it: the Orchestrator does, after the Advisor reads it.
2. **The change-plan configuration watched at its source:** today it is read live on each `/admin/accounts` view (`portal-check.ts`) and rings no bell, and a portal configuration missing a current price shows only as a Sentry error and a generic toast at the change-plan route. Read it in the spend watch's daily run and raise it as that run's other checks raise (the bell, the ops mail), and make `/admin`'s health line say which price `tiers.ts` sells that the tagged configuration lacks. Name the configuration's TEST id from the code, never a secret.
3. **Her own words while a credited Pro lands:** the Plan card (`components/app/pricing/plan-card.tsx`) reads a lapsed pass while her credited Pro lands (seconds, or longer when its webhook is delayed): a line that her Pro is on its way, and what to do if it never lands.

Not now: dropping `consume_passes_for_pro_credit(uuid)` is a contract migration after milestone 38 (its ROADMAP line stays). Stripe stays in TEST: confirm `livemode` is false (`list_available_accounts_or_orgs`) before any Stripe MCP call; never a live key.

**Starts from.** CLAUDE.md's working loop and security guardrails (the Stripe webhook is the sole writer of `profiles.tier` and `storage_cap_bytes`; never trust the client for tier or entitlements), and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; the SQL proofs above; the spend watch's run read against a TEST configuration with a price missing and with none missing (no write to the live configuration: a stub at the reader, or a TEST configuration of your own, deleted after); the Plan card's line at 375 and 1440 on both grounds.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

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
