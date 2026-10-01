---
track: crumbs-41
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "07277c23"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/admin/reports.ts
  - src/app/admin/reports/
  - src/app/admin/albums/[eventId]/
  - src/components/admin/metrics-charts.tsx
  - src/lib/db/queries/reports.ts
  - src/app/api/stripe/webhook/
  - src/lib/stripe/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/trust-safety-forensics.md
  - docs/systems/admin-observability.md
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/database-security.md
---

# lp/crumbs-41

**Goal.** Eight lines across the admin portal, billing and the data layer: Will's call #60 (a child-abuse dismissal reopenable for as long as its strike counts), a host left holding two live subscriptions by two Checkout tabs, the strike's lapse as a duration, the album drill-in's status filter, the person report's handle link, the report status no code writes, the metrics chart's four-digit ticks, and an index for soft-deleted events.

## The brief

Eight ROADMAP lines (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **Will's call #60, the way back from a child-abuse Dismiss** (his decision, 2026-10-01): "a child-abuse dismissal stays reopenable for as long as its strike counts (180 days; other kinds keep the 30-day `closed=window`)". Today every closed report reopens within 30 days (`closed=window`: `src/lib/admin/reports.ts`, `src/app/admin/reports/actions.ts`), while a dismissed child-abuse report's strike lives 180 days (`report_strikes`, the strike rule's one home; his call B). Let the reopen ask the strike rather than keep a second clock: a child-abuse dismissal reopens for as long as its strike is live, every other kind and verdict keeps 30 days, and wherever the window is enforced (the action, any SQL guard) moves with it. The closed line crumbs-36 wrote ("A strike on its address until ... Undo takes it back.") and its 30-day caveat say the new truth.
- **Two live subscriptions** (from `hardening`): "a host who pays in both Checkout tabs holds two live subscriptions and the profile follows the last grant's, so cancelling that one drops them to Free while the other bills, and account deletion cancels only the followed one; on a downgrade of the followed subscription, list the customer's other live subscriptions (one Stripe read) and grant from one, and warn the operator when a grant re-points a profile away from a still-set subscription". The webhook stays the sole writer of `profiles.tier` and `storage_cap_bytes` (`billing-caps.md`), and an account deletion cancels every live subscription of its customer. Stripe is in TEST mode: confirm `livemode` is false before any Stripe MCP call, and prove the fix with the webhook's own tests and fixtures, never a charge.
- **The strike's lapse as a duration** (from `crumbs-36`): "`report_strikes` could answer the lapse as a duration beside `fresh_lapses_at`, so no reader derives it (`strikeLapseMs` rounds the distance to the minute); a migration".
- **The drill-in's status filter** (a board idea from `crumbs-37`): "the album drill-in could take the Albums feed's status filter (All, Pending, Hidden, Removed), so an operator meets a big album's held or removed items without paging through the rest". It rides crumbs-37's 500-a-page keyset (`src/app/admin/albums/[eventId]/page.tsx`), each filter paging the same way, and no portal link prefetches (`admin-prefetch-policy.test.ts`).
- **The person report's handle** (from `crumbs-39`): "`reports/person-report-list.tsx`'s `@handle` link is a relative `/u/<slug>`, which the admin host's allow-list (`lib/surface`) answers with its 404; it wants the app's absolute address in a new tab".
- **The status no code writes**: "`report_status`'s `reviewed` is written by no code path while the marketing and legal copy promise every report is reviewed; a verdict writes it, or the promise changes." Find what each promise says and what an operator's verdict means today, recommend under Questions and build it. No lane edits the legal pages (they are rewritten once, before launch): name any legal line your answer leaves stale in your Handoff.
- **Four-digit ticks**: "`DistributionChart` hard-codes `YAxis width={28}` (`metrics-charts.tsx`), so a four-digit tick renders as its last three digits the day a count reaches 1,000".
- **Soft-deleted events by index** (from `crumbs-37`): "`standby_hosts`' deleted-event half and `expired_events` find soft-deleted events by a scan of `events` (no index on `deleted_at`); a partial index `on events (id) where deleted_at is not null` keeps them index reads past about a million events". `20261001151000_removed_media_index.sql` is the model for its proof: each reader's plan on a stand-in, before and after, inside a rolled-back transaction.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition and the live body (md5-check it, as crumbs-38's headers do); a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: two lanes write migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proofs on the live schema, red first;
- on localhost, the Library's report queue specimen and the metrics charts at 1,000 and more.

The portal cannot run signed in on localhost, so name its steps for the next build's red-team in your Handoff.

**Will's desk is up** with six boards (`locked-door`, `event-ready`, `privacy-hero`, `disposable-mode`, `demo-framing`, `about-press`); none describes the portal or billing. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, so don't touch their files:
- `crumbs-42` owns the host app: `src/app/(app)/dashboard/`, the hub's rooms (`components/app/event-feed/`), `host-add-provider.tsx`, `host-upload.tsx`, `restore-event-button.tsx`, the create wizard, `ui/popup.tsx`, `queries/events.ts`, `mutations/media.ts`, and `restore_event`;
- `crumbs-43` owns the guest pages: `components/guest/`, the photo viewer (`components/shared/media-lightbox*`), `lib/history-entry.ts`, `ui/popup-back.ts`, `lib/guest/`, `components/likes/`, `social/guest-list.tsx`, `queries/guest-events.ts`, and `get_event_by_qr_token`, `create_guest` and `profiles_album_note`.

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
