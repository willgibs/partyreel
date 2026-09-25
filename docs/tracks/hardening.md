---
track: hardening
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/lib/security/abuse-rate-limit
  - src/app/(app)/account/email-actions
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

- **Two LIVE subscriptions (both Checkout tabs paid).** The brief's rule covers the stale tab; it cannot cover a host who
  pays in both. The profile follows the last grant's subscription, so cancelling that one drops them to Free while the
  other still bills (its next renewal re-grants), and account deletion cancels only the followed one. Recommended:
  defer (the Deferred line below); not built, beyond the brief.

## System-doc edits (in place, owned facts only)

- none: this lane owns no system doc; the five lines for the Orchestrator are under Handoff, "Doc lines".

## Deferred (ROADMAP one-liners, bucket named)

- Now: Billing: a host who pays in both Checkout tabs holds two live subscriptions and the profile follows the last
  grant's, so cancelling that one drops them to Free while the other bills, and account deletion cancels only the
  followed one; on a downgrade of the followed subscription, list the customer's other live subscriptions (one Stripe
  read) and grant from one, and warn the operator when a grant re-points a profile away from a still-set subscription
  (from `hardening`).
- Now: Dates render in the runtime's locale (`formatEventDate` in `src/lib/utils.ts`, the claim card's
  `formatUploadTimestamp`, the profile's joined date), the SSR/hydration drift `formatCount` closed for counts; one
  pinned date formatter (from `hardening`).

## Handoff (replaces the chat report)

- **Commits** (all pushed to `origin/lp/hardening`): `71795875` billing · `dc965a4d` breaker · `27e4c198` counts ·
  `2ffffc23` unlock cookie · `bd833ae8` one version read per request · `c3c5afd5` **sync** (merges `origin/launch-prep`
  at `0ab2960c`, as the fifth fix asked) · `0b835ecf` the fifth fix's owns · `b9bbb955` `email_change` · `37bb266c`
  comments after the sync. `launch-prep` has since moved to `055baee9` (album-window, `eefe54d7`): it touches none of
  this lane's reads or files, `git merge-tree` is clean, and it keeps the unlock pin true (only the two unlock files
  name the cookie; every importer imports `isUnlocked` alone), so no second sync. The head is this manifest commit.
- **Gates on `37bb266c`**, each on its own exit code: `pnpm typecheck` 0 (after `rm -rf .next/dev`, the documented
  stale validator naming reel-teardown's deleted routes), `pnpm lint` 0 (6 warnings, all in untouched lab/marketing
  files), `pnpm test` 0 (470 files, 5,172 tests), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3137` 0 (279 checks, 0 failing). Board: none, so no `lab:demo`. The same gate
  was green on `b9bbb955`, before a comments-only commit.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, except
  `src/lib/db/queries/jobs.ts` (2 lines, the run summary's `breakerTripped`: jobs.ts is the one place a run row's
  counts become a `JobRunSummary`; catalog.ts names and reads the flag).
- **1. Billing** (retire ROADMAP "Billing: the webhook keys a downgrade on the customer alone, …"):
  `resolveSubscriptionUpdate` names the subscription a downgrade ends (`endsSubscriptionId`); `applyEntitlement` carries
  `stripe_subscription_id is null or = it` in the same WHERE as the recency guard (atomic); a declined one is a 200 that
  writes nothing, stamp included (`superseded`); a missing profile is still a 500. The Event Pass checkout's pointer
  clear now skips a Pro profile. `route.test.ts` moved onto the in-memory PostgREST and asserts the row the table
  holds: the stale subscription dies and the live one keeps Pro; the live one dies and the host goes Free; the race in
  delivery order and the other order; recency first; the stale pass checkout. Mutation-checked (guard off: 4 fail;
  pass guard off: 1). The `or=(…eq."<id>")` grammar was checked read-only against the live PostgREST.
- **2. Security** (retire ROADMAP "Security: changing an event's password evicts nobody …"): the cookie's MAC covers a
  password version, a sha256 of the stored bcrypt hash read server-side per check and never in the cookie;
  `isUnlocked(eventId)` kept its signature, so no call site changed; the unlock route reads the state BEFORE the bcrypt
  check and signs for it; one read per request, memoized on the request's cookie store (measured on the dev server: 3
  reads per gallery poll and 5 per album sync before, 1 after). No migration. Tests: `unlock-token.test.ts`,
  `unlock-cookie.test.ts` (with a structural pin: nothing else signs, verifies or names the cookie, so every
  `isUnlocked` answer is bound), `src/app/api/guests/unlock/route.test.ts` (the mid-unlock change both ways;
  mutation-checked). Live on :3137 against the real database, with a disposable password event set and changed through
  the real `set_event_password` / `clear_event_password` as the Pro host: a fresh cookie opens the page, the gallery
  poll, the album sync, manifest and media, the export and the guest mint; after a re-save of the SAME word (hash
  fingerprint `29fb00…` to `eea072…`) the old cookie is refused on every one; a legacy `{eid,exp}` cookie signed with
  the real secret is refused; after a clear and a new password the older cookie is refused, the old word 401s and the
  new one opens it; the browser's password gate unlocked, and came back on reload after a change. The probe event is
  soft-deleted (`54592d23…`, purge 2026-10-25).
- **3. Admin** (retire ROADMAP "Admin: an orphan circuit-breaker trip closes its run `ok` …"): `BREAKER_TRIPPED_KEY` +
  `countsBreakerTripped`; `jobHealth` reads `breakerTripped` as `attention` (failure, pause and missed outrank it).
  `catalog.test.ts` drives the sweep's own `OrphansTally` through `sanitizeCounts` to attention and type-pins the key.
- **4. Counts** (retire ROADMAP "Counts: three surfaces still print a raw count past 999 …"): `formatCount` on the
  delete-account sheet (binned and held), the claim card (row, confirmation title, toast) and the chips' badge; tests
  pin 1,249 on each.
- **5. `email_change`** (the Orchestrator's fifth fix): a kind per ACCOUNT (an HMAC of the user id in its own `a-acct:`
  domain), six an hour, requests and code attempts on one budget, each counted before the work, failing CLOSED;
  enforced right before each call reaches Supabase Auth in `requestEmailChangeAction` and `confirmEmailChangeAction`,
  refusing in their shape (`rate_limited` with `seconds: 3600`, or `error` when the limiter cannot answer); a
  malformed, same-address or signed-out call spends nothing. No migration (`action_attempts.kind` is free text); the
  live `action_rate` counted the kind per account in a rolled-back transaction (6 for the account; 0 for another
  account, another kind, a 61-minute-old row). Tests: `email-actions.test.ts`, `abuse-rate-limit-store.test.ts` (new,
  in-memory PostgREST), `abuse-rate-limit.test.ts`; mutation-checked. `src/lib/track-manifests.test.ts` green.
- **Live red-team still owed, on the alias** (sign-in is allow-list gated, so not on localhost, and no lane deploys):
  from one signed-in account, seven email-change requests inside an hour; the seventh reads "Too many tries for now.
  Try again in an hour." and sends nothing. The unlock sign-out is proven locally against the real database.
- **Doc lines** (the Orchestrator writes them; this lane owns no system doc):
  - `billing-caps.md`, The webhook: "★ **A downgrade lands only on the profile following the subscription it ends** (or
    following none): one customer can hold two subscriptions (two Checkout tabs, a stale session), so
    `resolveSubscriptionUpdate` names it and the write carries 'is null or is that one' in the same WHERE as the recency
    guard; a declined one is a 200 that writes nothing. The pass checkout's pointer clear skips a Pro profile (a pass
    session lives a day)."
  - `admin-observability.md`, beside "A run that stopped early": "**A tripped orphan breaker reads attention too:** it
    deletes nothing, fires its Sentry error and the email, and closes its run `ok` carrying `breaker_tripped`, which
    `jobHealth` reads as `attention` (a failure, a pause or a missed run outranks it)."
  - `guest-flow.md`, replacing "The unlock cookie is a signed HMAC of `{eid,exp}`": "**The unlock cookie is a signed
    HMAC of `{eid, exp}` and the event's password version** (a sha256 of the stored bcrypt hash, read server-side once
    per request, never in the cookie), so any `set_event_password` (a fresh salt, even for the same word) or
    `clear_event_password` signs everyone out; the unlock route reads the state before the bcrypt check, so a change
    landing mid-unlock can only fail closed, and a failed read fails closed and is reported." And "The bcrypt hash
    never leaves the DB (RPCs expose `has_password` only)" becomes "The bcrypt hash never reaches a browser: guest RPCs
    expose `has_password` only, and the server reads it only to derive (`has_password`, the cookie's version)."
  - `auth-accounts.md`, the ★ `email_exists` line's last sentence: "The account's own inbox staying silent still tells,
    so the account's `email_change` limit (six calls an hour, requests and code attempts on one budget, fail closed)
    bounds that probe."
  - `database-security.md`, Rate limits: "The account kinds (`email_change`) key on the signed-in user's id (HMAC'd, in
    its own domain), have no breadth, and fail CLOSED like the public forms: the limiter is the only bound on the
    `email_exists` oracle."
- Assets requested from Will: none.
- Board ideas: the parent Purge sweep card stays Healthy on a breaker trip (the Orphan sweep card and the bell say
  attention); `purgeRunVerdict` could carry the flag up the way it carries `stopped_early`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The pass checkout's pointer clear skips a Pro profile (beyond the brief's text; without it a stale pass session
    paid after going Pro re-opens this very downgrade).
  - A re-save of the same password signs everyone out too (bcrypt salts afresh; keeping them in needs the plaintext).
  - An unreadable password state fails closed (the password step, and a Sentry warning), never a 500 at the venue.
  - Every unlock cookie minted before this deploy is refused once (no real users).
  - `email_change` at six an hour, not five (an honest change is three calls: a change plus one full redo), and it
    fails CLOSED with the action's own retry line and a `captureError`.
- Look at first: `applyEntitlement` in `src/app/api/stripe/webhook/route.ts` (the `.or` guard and `superseded`), the
  per-request memo in `src/lib/events/unlock-cookie.ts`, and the read-before-check order in
  `src/app/api/guests/unlock/route.ts`.
