---
track: hardening
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "960c3b1d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/stripe/provision
  - src/app/api/stripe/webhook/
  - src/app/admin/jobs/catalog
  - src/lib/events/unlock-
  - src/app/api/guests/unlock/
  - src/app/admin/accounts/[id]/delete-account-control
  - src/components/app/dashboard/claims-card
  - src/components/app/dashboard/filter-chips
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/format/count.ts
  - src/lib/env.ts
  - src/lib/lifecycle/sweeps/orphans.ts
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/hardening

**Goal.** Close four correctness gaps the ROADMAP names, before launch: a billing webhook that could put a paying host on Free, a password change that evicts no one already unlocked, an orphan-sweep breaker trip that reads Healthy, and three screens that print a raw count past 999.

## The brief

Four fixes, each with its tests; each line is quoted from `docs/ROADMAP.md`, whose lines you retire in your Handoff (the Orchestrator deletes them at the record).

1. **Billing:** "the webhook keys a downgrade on the customer alone, so a second subscription's `incomplete_expired` or deletion (two Checkout tabs, a stale session) would put a host whose other subscription is active on Free; downgrade only when the event's subscription is the profile's `stripe_subscription_id` (or the profile holds none)."
   - `src/lib/stripe/provision.ts`, with the webhook route's tests (`src/app/api/stripe/webhook/`).
   - The webhook stays the sole writer of `profiles.tier` and `storage_cap_bytes`.
   - Test the two-tab race both ways: the stale subscription dies and the live one keeps Pro; the live one dies and the host goes Free.
   - Stripe stays TEST; you need no Stripe MCP call (if you make one, confirm `livemode` is false first).
2. **Security:** "changing an event's password evicts nobody already unlocked for up to 12 hours (the unlock cookie signs `{eid, exp}`, not the password); bind it to a password version so a change signs everyone out."
   - Keep every verify call site unchanged: the unlock helpers (`src/lib/events/unlock-cookie.ts`, `unlock-token.ts`) are used by the guest page, the gallery poll, the export, the new album reads and a reel route `reel-teardown` is deleting tonight.
   - So the version is either something the helper can read itself (a server-side fingerprint of the stored password state), or it is added as an optional argument the helpers fall back without. Prefer the first.
   - A migration is a Question with its SQL. The Orchestrator applies migrations.
   - Test that a password change invalidates an outstanding cookie, and that a cookie signed before the change is refused everywhere the helper answers.
3. **Admin:** "an orphan circuit-breaker trip closes its run `ok` (the Sentry error and the email fire), so the Orphan sweep card reads Healthy beside it; read `breaker_tripped` as `attention` in `jobHealth`" (`src/app/admin/jobs/catalog.ts`).
4. **Counts:** "three surfaces still print a raw count past 999: `src/app/admin/accounts/[id]/delete-account-control.tsx:41,48` (the confirmation's event counts), `src/components/app/dashboard/claims-card.tsx` (the claim card's photo counts and its toast) and `src/components/app/dashboard/filter-chips.tsx:73` (lab-only today); route each through `formatCount` (`src/lib/format/count.ts`)."

You own no system doc: `billing-caps.md`, `admin-observability.md` and `guest-flow.md` belong to `reel-sweep` tonight, so put each fact's line (the downgrade rule, the breaker's health, the unlock cookie's version) in your Handoff and the Orchestrator writes them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; the webhook's two-subscription tests; the unlock cookie refused after a password change on a local password event, and every existing unlock test green; the Orphan sweep card reading attention on a tripped run in `catalog.test.ts`; `formatCount` on the three surfaces.

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
