---
track: host-followons
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

None open. Every call I took without asking is under "Calls his to overrule" below, each with the answer built.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md` (the invariant at 400-405, this lane's alone this round): THE HOST SEES A CONFIRMED GUEST'S ADDRESS now names the Guests room beside the viewer (`GuestList`'s host-only `emails`, read by `getConfirmedGuestAddresses`, which proves the host itself; the room its one importer, the album never passing it, both pinned), with his words of 2026-09-23 after those of 2026-09-22; "A guest never sees another guest's address." kept.
- `docs/systems/billing-caps.md`: the cap model's meter line (the meter, account page, plan facts and storage guard read `host_storage_summary` through `readHostStorageSummary`; service-role, the `getUser()` id; the admin view's HEAD count; the parity pin; a failed read throws); a new invariant beside the one-row assertion (a quantity above 1 is a Sentry warning, never a bigger cap); the provisioning gotcha lists every status and says why `incomplete` changes nothing.
- `docs/systems/profiles-social.md`: the one-list invariant (profile cards deduped, 150 ids per `.in()`, batches in parallel, exactly four columns; the Guests room's address with its rule's home in guest-flow.md; `queries/social.ts` reads no address and its outputs are pinned address-free).
- `docs/systems/host-app.md`: the welcome section (`resolveDashboardEntry`; a guest-made account never takes the tour: `isGuestFirstVisit`, `MarkWelcomedOnMount`; a nameless one names itself and skips the tour).

## Deferred (ROADMAP one-liners, bucket named)

- Now: Lifecycle: the over-cap sweep (`api/cron/purge/route.ts:750-764`) sums active bytes from an unpaged media read that PostgREST caps at 1,000 rows, so a lapsed account past a thousand items reads short (it can clear its own grace while still over the cap) and its auto-reduce chooses from the first thousand; read `host_storage_summary` there and page the reduce's candidates.
- Now: Billing: the webhook keys a downgrade on the customer alone, so a second subscription's `incomplete_expired` or deletion (two Checkout tabs, a stale session) would put a host whose other subscription is active on Free; downgrade only when the event's subscription is the profile's `stripe_subscription_id` (or the profile holds none).
- Now: Social: `adminCoverUrls` (`queries/social.ts`) reads every approved photo of the events it covers, newest first, in one read capped at 1,000 rows, so one busy album can leave the others' cards without a cover; take the newest per event (a limit-1 read each, or a DISTINCT ON function).

## Handoff (replaces the chat report)

**Commits.** Work: `e5ec86b8` (everything below), `46f47bc7` (`rules.generated.json` regenerated on the synced tree: GuestList's contract lines moved by two), `73ca4cdf` (`accounts.ts`'s stale header line). Sync: `4cf24e67` (launch-prep at `9dd4fc3e`, the In flight rows; no conflict; 0 behind at handoff). All pushed to `origin/lp/host-followons`.

**Gates on the synced tree `73ca4cdf`, each on its own exit code** (logs `f1-*` to `f7-*.log` in the lane's scratch): `pnpm design:rules` 0 (1983 contracts on 168 components from 125 contract tests, 18 policies) · `collect-specimens` 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (0 errors, 9 warnings, none in a touched file) · `pnpm test` 0 (365 files, 4106 passed, 1 skipped: `influences.test.ts`'s conditional `runIf(exploring)` case) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3132` 0 (507 checks, 0 failing). No board, so no `lab:demo`.

**Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 27 paths before this file): all inside `owns` except two GATE OUTPUTS regenerated by `pnpm design:rules` (`docs/design/library.md`'s counts, `rules.generated.json`: GuestList's contract grew from 8 guards to 15) and the four `docs/systems/` files listed above.

```
docs/design/library.md
docs/systems/billing-caps.md
docs/systems/guest-flow.md
docs/systems/host-app.md
docs/systems/profiles-social.md
src/app/(app)/dashboard/[eventId]/guests/page.tsx
src/app/(app)/dashboard/page.tsx
src/app/(app)/welcome/mark-welcomed.test.tsx
src/app/(app)/welcome/mark-welcomed.tsx
src/app/(app)/welcome/page.tsx
src/app/(dev)/design/rules/rules.generated.json
src/app/api/stripe/webhook/route.test.ts
src/app/api/stripe/webhook/route.ts
src/components/app/welcome-flow.tsx
src/components/social/guest-list.test.tsx
src/components/social/guest-list.tsx
src/lib/billing/storage-summary.test.ts
src/lib/db/queries/accounts.ts
src/lib/db/queries/guest-addresses.test.ts
src/lib/db/queries/guest-addresses.ts
src/lib/db/queries/social.guest-identity.test.ts
src/lib/db/queries/social.ts
src/lib/db/queries/storage.ts
src/lib/stripe/provision.test.ts
src/lib/stripe/provision.ts
src/lib/welcome.test.ts
src/lib/welcome.ts
```

**The items.**
- 1, the Guests room's addresses: `src/lib/db/queries/guest-addresses.ts` (`getConfirmedGuestAddresses(eventId, userIds)`: `server-only`, admin client, PROVES THE HOST ITSELF (the signed-in user must be the event's host, else an empty map and `guests` never read), `guests.email` on `verified_at` rows only, never the host's own row, never `pending_email`, keyset pages by `event_id` past the 1,000-row cap, narrowed in memory to the listed ids so the payload holds no address it does not show, one per person by the newest proof). The room (`dashboard/[eventId]/guests/page.tsx`) reads it for its profile cards only, beside `withAvatarUrls`, and passes `emails` to `GuestList`, which draws the address under a confirmed name in the chips and the opened names panel (never an unverified entry; the faces row names nobody). Still nothing while the guest list is off. `social.ts`'s header now says where a confirmed address goes and that it never leaves `social.ts`.
- 2, the pins (`social.guest-identity.test.ts`, `guest-addresses.test.ts`, `guest-list.test.tsx`): `social.ts`'s code names no `email`, `uploaderEmail` or `pending_email` (whole words); every read a guest or a public page renders is run against planted addresses (guest rows, embedded rows, profiles) and none leaves under any key; `getProfileCards` selects exactly `id, display_name, slug, avatar_updated_at`; the newest `get_public_profile` definition (whatever migration holds it) has no address key and names no email identifier but `email_confirmed_at` and `require_verified_email`; the album page's `<GuestList` carries no `emails` and no spread, and no file in the tree but the Guests room passes one; the Guests room is `guest-addresses.ts`'s only importer. The fake's `.in()` now filters, so batches must really merge.
- 3, `getProfileCards`: deduped, 150 ids per `.in()` (`PROFILE_CARD_BATCH`), the batches in parallel, one map; 400 ids = three reads of at most 150 and 400 cards back; a repeated id read once.
- 4, the storage aggregate: `getHostStorageSummary` → the new `readHostStorageSummary(hostId)` (`host_storage_summary` on the admin client with the `getUser()` id; `cache()`, zeros signed out, the same shape; a missing row is zeros, a bigint as text a number; a failed read throws). `getAccountDetail` reads the same function and counts its items with an exact HEAD count (both were an unpaged row read capped at 1,000). `storage-summary.test.ts` rewritten, with the parity pin reading the newest definitions of both functions: the same join and host filter, the aggregate's active filter equal to `host_active_bytes`' conjuncts, the standby filter its exact negation, both SECURITY DEFINER with an empty search_path and EXECUTE revoked from every client role. `tallyStorageRows` stays exported (the brief's add-never-change).
- 5, the quantity warning: `subscriptionQuantityWarning(event)` in `provision.ts` (created or updated only; the largest item quantity; `quantity` missing counts as 1); the webhook's subscription branch calls `captureWarning("billing", "stripe_subscription_quantity_above_1", {subscriptionId, customerId, quantity, eventType})` before provisioning, which writes exactly what a quantity of 1 writes.
- 6, `incomplete` never downgrades: `resolveSubscriptionUpdate` returns null for it (no write, no recency stamp); a deletion downgrades whatever its status; `incomplete_expired`, `canceled`, `unpaid` and `paused` downgrade; `active`, `trialing`, `past_due` grant. Tests for every status on both events, the race itself, and a new route test (`webhook/route.test.ts`: `incomplete` writes nothing, `active` then a same-second `incomplete` ends on Pro, `incomplete_expired` downgrades and recomputes passes, the warning fires once and the two writes are equal).
- 7, a guest-made account's first visit: `resolveDashboardEntry` and `isGuestFirstVisit` in `welcome.ts` (the name first; then an unwelcomed account hosting no live event and holding a Guest card renders its dashboard; everyone else unwelcomed takes the tour); the dashboard renders `MarkWelcomedOnMount` (`src/app/(app)/welcome/mark-welcomed.tsx`: `markWelcomedAction` from a client effect in a transition, once even under Strict Mode, a failure left for the next visit to retry); `/welcome` passes `needsWelcome={false}` to such an account, so a nameless one names itself and goes straight to the dashboard. The empty events teaser is untouched.

**Verified.** Read-only against the shared database with the service-role key (scripts in the lane's scratch, no writes): `host_storage_summary` answers one row per host, equal to a paged hand tally of active and Deleted bytes for every host with events, and one row of zeros for an unknown host; the account view's HEAD count under the inner-embed filters equals the hand count; the address read's filters and its keyset second page parse against the live schema (counts and masked domains only printed). Local, dev on :3132: the Guests room's list rendered by a throwaway page (deleted before the gate) with seven profile cards, two unverified names and a 30-guest party, at 1440 (light and dark) and 375 (no horizontal scroll: `scrollWidth` 375 with the list and the opened names panel, 24 at a time with addresses, all inside the 16px gutters); every chip with an address measures 46px with the face 11px clear on every side; a signed `incomplete` subscription delivery to the local webhook answers 200 and writes nothing (the old code would have tried a Free write for an unknown customer and 500'd), a forged signature 400; `/dashboard`, `/welcome` and a Guests room redirect an anonymous caller to `/login`. Every pin above was mutation-checked (unchunked reads, a spread profile row, the old `incomplete` rule, a drifted SQL filter, no Strict Mode guard: each turns its test red).

**Not verified, the red-team's** (localhost cannot mint a session): the signed-in surfaces, under "Look at first". One Sentry warning ("stripe signature verification failed") may have left local dev from the forged-signature check.

**Assets requested from Will:** none.

**Proposed migrations / Worker / Vercel / Stripe / env changes:** none (`host_storage_summary` is applied; no type change).

**ROADMAP Now lines this closes (quoted):**
- "Social: `getProfileCards` hydrates the guest list by one `.in()` of user ids, so a party with several hundred confirmed guests builds a long URL; chunk it (the counts themselves are event-keyed)."
- "Billing follow-ons: a SECURITY DEFINER `host_storage_summary()` returning active and Deleted bytes in one aggregate, to replace the paged row read behind the storage meter and the storage guard for very large albums."
- "Billing follow-ons: the webhook warns (Sentry) on a subscription item with quantity above 1 (the old portal stepper's multiples, which provisioning reads as one cap)."
- "Host: the Guests room shows a confirmed guest's address under the name, to the host alone (Will, 2026-09-23: "Guests should not see other confirmed guests' emails, making them more comfortable knowing only the host sees it"); `host-followons` wires it with the pins that keep every guest-facing payload address-free."
- "Dashboard: an account a guest just made through the capture lands first on the host tour ("Create my first event", `welcome-flow.tsx`) before the Guest card the capture promised it; a guest-made account's first visit could lead with that card."
- And one fragment of the Housekeeping line on comments that state retired facts: "`queries/accounts.ts`'s "only cross-host profiles reader"" (the rest of that line stands).

**Calls his to overrule.**
- The address sits in the chip itself: a two-line capsule (the name, the address under it in the caption step), its face moved in so it stays concentric (11px clear); the unverified chips stay one line.
- A long address shortens FROM THE MIDDLE as text (at most 30 characters drawn, a domain at most 20, a cut never ending on the address's own punctuation: "priya.raman.1987…@outlook.com"), the whole address in the title and for screen readers; an ordinary one draws whole, once.
- One address per confirmed person: the one on their newest proved row (two devices, two addresses: the later proof wins).
- The address is `guests.email` as stamped at the mint (what the viewer's credit shows), never the account's current sign-in address.
- `getConfirmedGuestAddresses` proves the host itself, beyond the brief's "only after `getEvent`": a wrong caller gets nothing.
- An address read that fails breaks the room (the error boundary's retry) rather than drawing confirmed chips with no address, the state his 2026-09-22 words warn against.
- `paused` downgrades with the other non-active states (as before; the brief named `incomplete_expired`, `canceled` and `unpaid`).
- The quantity warning fires on every created or updated delivery of such a subscription (a renewal included, until the operator settles it in Stripe), reports the largest item quantity, and never fires on a deletion.
- "Hosts nothing" counts live events only (an event in the bin does not make an unwelcomed account a host).
- A nameless guest-made account names itself at `/welcome` and then skips the tour (the brief said only that it still goes to `/welcome`).
- The marker is its own client module in `welcome/`, not an export of `welcome-flow.tsx`, so the dashboard never bundles the tour's pictures; its test is a behaviour test rather than a `@contract-for`, which would have needed a `for` line in `component-notes.ts` (outside the lane).
- The admin account view's item count is exact now (it stopped at 1,000).

**Look at first** (the alias, after the merge):
1. The Guests room of an event with the guest list on, as its host, after a guest with a confirmed email has an APPROVED upload there (none of today's disposable list-on events has one): the address under the name, in the chips and, past twelve guests, in the opened panel; an unconfirmed guest's chip with none; the same guest's album page (as the guest, and as another guest) shows no address anywhere, including the page source.
2. A fresh guest-made account (a guest confirms through the capture after uploading, with Google through the account chooser): its first `/dashboard` renders with the Guest card leading, no tour; reload: still the dashboard (`welcomed_at` set). A brand-new account with nothing still gets the tour.
3. A Pro Checkout on the alias (Will's clicks): the Supabase MCP shows `tier = pro` after both `customer.subscription.created` (`incomplete`) and `.updated` (`active`) land, in either order.
4. The storage meter and the plan sheet's facts on a host with media show the same bytes as before (47,093,782 active and 2,491,989 Deleted for the host with media today).
