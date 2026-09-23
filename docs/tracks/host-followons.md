---
track: host-followons
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6d27b17a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/welcome/
  - src/app/(app)/actions.ts
  - src/components/app/welcome-flow.tsx
  - src/components/app/welcome-flow.test.tsx
  - src/lib/welcome.ts
  - src/lib/welcome.test.ts
  - src/components/social/guest-list.tsx
  - src/components/social/guest-list.test.tsx
  - src/lib/db/queries/social.ts
  - src/lib/db/queries/social.guest-identity.test.ts
  - src/lib/db/queries/guest-addresses.ts
  - src/lib/db/queries/guest-addresses.test.ts
  - src/lib/db/queries/storage.ts
  - src/lib/billing/storage-summary.test.ts
  - src/lib/db/queries/accounts.ts
  - src/app/api/stripe/webhook/
  - src/lib/stripe/provision.ts
  - src/lib/stripe/provision.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - docs/systems/profiles-social.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
  - src/lib/db/types.ts
  - supabase/migrations/20260923140000_host_storage_summary.sql
  - supabase/migrations/20260604002059_active_bytes_cap_meter.sql
  - src/lib/db/queries/guest-events-admin.ts
  - src/lib/media/uploader-identity.ts
---

# lp/host-followons

**Goal.** The rulings round's host-side loose ends: Will's ruling that the host's Guests room shows a confirmed guest's address (and no guest ever sees one), the pins that keep every guest-facing payload address-free, `getProfileCards` in chunks, the storage meter and the storage guard on the applied `host_storage_summary`, the webhook's quantity warning, a fix so a subscription passing through `incomplete` never downgrades a paying host, and a guest-made account's first dashboard visit. Production code, verified locally; the Orchestrator red-teams it on the alias and ships it in milestone 27.

## The brief

**Will's words (2026-09-23), verbatim.** "please complete any pending items related to this round from the roadmap, then let's get main current." And his ruling on the Guests room: "Guests should not see other confirmed guests' emails, making them more comfortable knowing only the host sees it. Exposing emails publicly would go from a safety feature to privacy concern - the host assumes responsibility of ensuring that safety." His reason for showing the host a confirmed address at all (2026-09-22, `docs/systems/guest-flow.md:400-405`): "If I'm a verified guest on 'fakeemail@domain.com' but the host only sees a verified badge, it implies far more safety than it should." The Orchestrator ships milestone 27 (partyreel.com) after this lane merges and the alias is red-teamed.

### 1. The Guests room shows a confirmed guest's address, to the host alone

The room (`src/app/(app)/dashboard/[eventId]/guests/page.tsx`) proves the host with `getEvent` and renders `GuestList` (`src/components/social/guest-list.tsx`) from `getEventGuestList(id, {includeUnverified: true})`. A confirmed guest is a card (name, avatar, `/u/slug`); an unconfirmed one carries `UnverifiedMark`; past 12 guests the room becomes a faces row opening a names panel. No address shows anywhere today. The host's viewer already shows a confirmed address under the uploader's name (`getUploaderIdentities` → `resolveUploaderIdentity` → `uploaderEmail`, verified rows only).
- A new `src/lib/db/queries/guest-addresses.ts` (`import "server-only"`, the admin client, called only AFTER the page's `getEvent` has proved the host, verified rows only (`guests.verified_at` set, `guests.email` present, never the host), keyed by `user_id`, keyset-paged past PostgREST's 1,000 rows) feeds a host-only `emails` prop on `GuestList`. The album page never passes it. `social.ts` keeps its header's promise that no address leaves that module.
- The address sits under a confirmed guest's name, in the room's list and its names panel alike. An unconfirmed guest's typed address never shows (it is unproved; `guests.pending_email` is inert by rule).
- The room shows nothing while the event's public guest list is off (`getEventGuestList` answers null), so the addresses show only while it is on. Leave that gating as it is: whether the host's room lists its guests regardless of the switch is a question on the new `event-safety` board, since blocking and a waiting queue need the room either way.
- `docs/systems/guest-flow.md`'s invariant (lines 400-405, yours alone in this round) names the room beside the viewer, with his words of 2026-09-23; keep "A guest never sees another guest's address".

### 2. The email-safety pins

Close the gaps in the existing pins (`src/lib/db/queries/social.guest-identity.test.ts`, `src/lib/r2/grid-items.email-safety.test.ts` belongs to another lane): ban `email` and `uploaderEmail` from `social.ts`'s output alongside `pending_email`; pin `getProfileCards`' profile columns to exactly `id, display_name, slug, avatar_updated_at` (`profiles` has an `email` column); a pin that the latest `get_public_profile` definition returns no address key and reads no `.email` beyond `email_confirmed_at`; a pin that the album page (`src/app/(guest)/e/[token]/page.tsx`) never passes `emails` to `GuestList`. Tests read source or call the functions with fakes; nothing pins a look.

### 3. `getProfileCards` in chunks

"Social: `getProfileCards` hydrates the guest list by one `.in()` of user ids, so a party with several hundred confirmed guests builds a long URL; chunk it." (`social.ts:135-162`; one `.in()` with no range is also silently capped at 1,000 rows.) Dedupe the ids, read batches of at most 150 in parallel, merge into the one map; a test with 400 ids asserts three `.in()` calls of at most 150 and 400 cards back (the fake already records `.in` calls).

### 4. The storage aggregate

"Billing follow-ons: a SECURITY DEFINER `host_storage_summary()` returning active and Deleted bytes in one aggregate, to replace the paged row read behind the storage meter and the storage guard for very large albums." The Orchestrator has APPLIED it (`supabase/migrations/20260923140000_host_storage_summary.sql`; `types.ts` carries it): `host_storage_summary(p_host_id uuid) returns table (active_bytes bigint, standby_bytes bigint)`, service-role only, the definitions of `tallyStorageRows`. Rewire `getHostStorageSummary` (`src/lib/db/queries/storage.ts`) to call it through the admin client with the `getUser()` id (keep `cache()`, the zeros for a signed-out caller, and the `{activeBytes, standbyBytes}` shape the unowned Stripe route tests mock); rewrite `src/lib/billing/storage-summary.test.ts`; add a pin that the function's active filter matches `host_active_bytes` (read both migration files). The admin's account view (`src/lib/db/queries/accounts.ts:95-103`) has the same unpaged read: move it to the function too.

### 5. The webhook warns on quantity above 1

"Billing follow-ons: the webhook warns (Sentry) on a subscription item with quantity above 1 (the old portal stepper's multiples, which provisioning reads as one cap)." A pure helper in `src/lib/stripe/provision.ts` returns `{subscriptionId, customerId, quantity}` for a created or updated subscription whose any item's quantity exceeds 1; the webhook (`src/app/api/stripe/webhook/route.ts`, the subscription branch) calls `captureWarning("billing", "stripe_subscription_quantity_above_1", ...)`; the entitlement is unchanged; the helper's test in `provision.test.ts`.

### 6. A paid host must never land on Free (found by the plan's review; fix it before the milestone)

`resolveSubscriptionUpdate` (`provision.ts:54-64`) writes Free for any status outside active, trialing and past_due, `incomplete` included. Stripe Checkout's subscription passes through `incomplete` on its way to `active`; the webhook's recency guard (`route.ts:95-99`) admits same-second events in either order; and two TEST endpoints (the alias's and partyreel.com's) write the one database. So the `incomplete` write can land after the `active` one and leave a paying host on Free. Make `incomplete` no change at all (return null: neither a grant nor a revocation, the first payment is in flight); `incomplete_expired`, `canceled`, `unpaid` and a deletion still downgrade. Tests for each status. Say it in `docs/systems/billing-caps.md`.

### 7. A guest-made account's first visit

"Dashboard: an account a guest just made through the capture lands first on the host tour ('Create my first event', `welcome-flow.tsx`) before the Guest card the capture promised it; a guest-made account's first visit could lead with that card." The redirect is `src/app/(app)/dashboard/page.tsx:111-119` (no name, or no `welcomed_at`, per `src/lib/welcome.ts`); `welcomed_at` is set only when someone leaves the tour (`src/app/(app)/actions.ts`). An account with no hosted events and at least one Guest card (both already loaded on the dashboard) renders its dashboard on the first visit and is marked welcomed (a server action from a client effect: `after()` in a server component cannot read cookies); a nameless account still goes to `/welcome`; the empty events teaser keeps the host pitch. Tests on the pure decision in `welcome.ts`.

### Boundaries

- **Other lanes run now; never edit their files.** `guest-followons` owns `src/components/guest/`, `src/app/(guest)/`, `src/lib/guest/`, `src/app/api/guests/`, `src/lib/events/`, `src/lib/validation/event.ts`, `src/lib/db/mutations/{events,guest}.ts`, `src/lib/db/queries/{guest-events,guest-events-admin}.ts`, `src/lib/media/uploader-identity.ts`, `src/lib/event/gallery-items.ts`, `src/lib/r2/grid-items.ts`, `src/components/shared/media-lightbox.tsx`, `src/components/app/{media-grid,event-settings-form}.tsx`, `src/components/app/event-feed/`'s three files, `src/app/(app)/dashboard/actions.ts`, the migration-guards test and the rest of `docs/systems/guest-flow.md`. It collapses the album page's casts onto `social.ts`'s functions and `guest-events-admin.ts` imports `getEventGuests`; the album page imports `needsDisplayName`. **Keep every exported signature of `social.ts`, `welcome.ts` and `storage.ts` exactly as it is**; add, never change.
- No `apply_migration`, no Stripe, Vercel or Supabase config: the Orchestrator's. No new migration is expected here; if one is needed, write it and say so in the Handoff.
- Say in your Handoff which ROADMAP Now lines your work closes (quote each), and anything you found and did not fix as a Deferred line.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
