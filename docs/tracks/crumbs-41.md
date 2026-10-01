---
track: crumbs-41
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "07277c23"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/app/admin/reports/
  - src/components/app/report-review.tsx
  - src/app/admin/albums/[eventId]/
  - src/lib/db/queries/moderation.ts
  - src/lib/db/queries/moderation.test.ts
  - src/lib/moderation/album-pages.ts
  - src/lib/moderation/album-pages.test.ts
  - src/components/admin/metrics-charts.tsx
  - src/components/admin/metrics-charts.test.ts
  - src/lib/format/count.ts
  - src/lib/format/count.test.ts
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/gallery/specimens.generated.json
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/app/api/stripe/webhook/
  - src/lib/stripe/
  - src/lib/db/mutations/account.ts
  - src/lib/db/mutations/account.test.ts
  - src/lib/lifecycle/account-deletion.test.ts
  - src/components/marketing/sections/features/privacy/privacy-faq.ts
  - src/components/marketing/sections/features/privacy/report-review.tsx
  - src/lib/constants/about.ts
  - supabase/migrations/20261001233100_strike_lapse_duration.sql
  - supabase/migrations/20261001233200_deleted_events_index.sql
  - src/lib/reports/strike-lapse-guards.test.ts
  - src/lib/reports/review-promise.test.ts
  - src/lib/lifecycle/deleted-events-index-guards.test.ts
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

Each is built as recommended and listed under Calls as his to overrule.

- **#60: does a child-abuse dismissal that kept no address (never a strike) reopen for 180 days too?** Recommended: no,
  30 like every other dismissal. His words tie the window to the strike ("for as long as its strike counts"), and the
  slip #60 closes is a strike on a well-meaning reporter's address that nothing could take back after day 30; a
  dismissal with no strike has nothing to take back, and its item, if still up, is taken down and held from Albums and
  Forensics (the runbook's path for an item no report names). The strike's window never shortens a reopen below 30
  days, whatever the lapse becomes.
- **Two live subscriptions: when the followed one ends and several others are live, which does the profile follow?**
  Recommended: the one whose plan stores the most (never less room than a plan she still pays for), the newest on a
  tie, with the operator warned that the rest still bill. When the one Stripe read fails, the delivery fails (500) and
  Stripe retries, never a Free guess (billing-caps.md: a paid but unprovisioned host is a 5xx, never a silent 200).
- **Account deletion: which subscriptions does it cancel?** Recommended: every one of its customer's that has not
  ended, immediately: active, trialing, past_due, unpaid, paused and incomplete (an incomplete one can still be paid for
  23 hours). Any failure still blocks the deletion.
- **`reviewed`: does a verdict write it, or does the promise change?** Recommended: neither as worded; the verdict IS
  the review. Dismissed and Actioned each record who decided and when, an open report keeps its item and its album
  until one lands, so "every report is reviewed" (actor-free, as the neutralization doctrine wants) is true of every
  report. `reviewed` stays an unused enum value, documented as such (dropping one rebuilds the type: billing's
  `tier_type` `max` precedent), never a fourth inbox word. What does change is the clause that overclaims: "reviewed
  before anything comes down" has been false since the instant hide (a child-abuse report from a confirmed email hides
  its item at once, pending review), so the three marketing lines saying it take the help center's own exception;
  the legal lines saying the same are named in the Handoff for the pre-launch rewrite.
- **The drill-in's filter words.** The drill-in's All is every status (removed included, as today), where the feed's
  first tab is Active (everything not removed). Recommended: All, then the feed's own four (Pending, Approved, Hidden,
  Removed) in its words; the ROADMAP line named three, and Approved costs nothing and matches the feed.
- **Four-digit ticks: the line is half stale.** `a99390dd` already replaced the fixed 28px with an estimate from the
  data's compact labels, but the axis draws its own rounded ticks (`[3000, 12, 1]` ticks 0, 750, 1.5K, 2.3K, 3K in an
  axis sized for "3K"). Recommended: recharts 3 sizes each YAxis from the labels it actually drew (`width="auto"`),
  the estimate (`compactAxisWidth`) retires, and a Library specimen draws both charts past 1,000, the only place they
  can be seen without the portal's sign-in.

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md`: Reports, the closed strike line's lapse (`lapse_seconds`) and its Undo for
  a strike's whole life; the dismissal's reopen window (#60, `dismissalReopens`, `reopenGuard`); the verdict as the
  review (`reviewed` unwritten). Verifying, the Library's metrics charts specimen.
- `docs/systems/billing-caps.md`: The webhook, the successor subscription and the two warnings.
- `docs/systems/auth-accounts.md`: Deleting an account, every live subscription of the customer cancelled.
- `docs/systems/lifecycle-recovery.md`: the expired sweep and the standby budget's deleted half read
  `events_deleted_idx`.

## Deferred (ROADMAP one-liners, bucket named)

- Performance: `standby_hosts`' outer join to events (`join public.events e on e.id = m.event_id`, each row's host)
  still hashes every event (on crumbs-41's 1,000,000-event stand-in a Seq Scan of every row, most of the function's
  ~250 ms warm, which `events_deleted_idx` cannot serve); each half could carry its event's host (the deleted half from
  its own `d`, the removed half joining its rows by primary key), making the read index-bound end to end; a create or
  replace of `standby_hosts` (from `crumbs-41`).
- Launch checkpoint (the legal rewrite): the Privacy Policy's Reports and safety ("Every report is reviewed before
  anything comes down", "filing one never removes content by itself", "Reports are stored without the reporter's
  identity") and the Terms' moderation paragraph ("reports are anonymous and are reviewed before anything is
  removed") predate the instant hide and the confirmed address a report keeps while open (and its keyed hash after,
  on the worst kind); the rewrite takes them, with `legal-privacy.tsx`'s "never auto-hide" comment (from `crumbs-41`).

## Handoff (replaces the chat report)

Scratch artifacts are in `../partyreel-wt/_scratch/crumbs-41/` (the gate's logs, the proofs, the stand-in's plans).

- **Commits**, 14 on `lp/crumbs-41`, pushed; the work's head is `0229bb9c`, this record on top. launch-prep moved
  after the cut (`a21f6d0b`, `452059ad`, `eb38b6be`, `f6d72a9d`, `11653a5e`: records, build 36, the types
  regenerated and three typed seams dropped in `queries/my-*.ts`, `mutations/guest-media.ts`, `sweeps/album-log.ts`),
  touching none of this lane's reads or paths and conflicting with none: no sync (PROGRAM.md, Sync).
- **Gates at `0229bb9c`**, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (699 files,
  8,387 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (154
  checks, 0 failing; `/design/lab/tools/boom` answers its deliberate 500). Logs `gate-*.log`, `lab-smoke.log`. No
  board, so no `lab:demo`.
- **Red on today's code:** this lane's tests over origin/launch-prep's source fail 48, every item at least once
  (`red-on-base.log`); each migration guard fails with its file removed (`strike-lapse-guards.test.ts`,
  `deleted-events-index-guards.test.ts`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 45 paths, every one under `owns`, this file, or a
  System-doc edit listed above (checked by script against the frontmatter); no exceptions.
- **PREMISE lines** (lab:smoke): about-press (its asks describe `constants/about.ts`) still holds: its asks are where
  the press kit lives and which facts join it, and its drawings render production's About, so they draw the one
  changed conviction body as shipped. disposable-mode (its asks describe `billing-caps.md`) still holds: they read the
  cap model and the meters, and this lane only added the webhook's successor fact.

The items:
- **#60** (`22770b36`): a child-abuse dismissal that is a strike reopens for as long as the strike counts, every other
  dismissal (one that kept no address included) for the 30 days, never less (`dismissalReopens`); the reopen's write
  carries the same rule as an `or()` (`reopenGuard`) and asks the rule's own lapse (`readStrikeLapse`) only for a strike
  past 30 days; a lapsed strike's reopen is refused in words. The closed line keeps "Undo takes it back." for a live
  strike's whole life, the lede says the window, and the Library's 60-day strike line now shows its Undo (localhost,
  1440 and 375).
- **Two live subscriptions** (`53e8ccc7`, `726c2f0a`): a downgrade that would apply reads the customer's subscriptions
  once and grants from the live one that stores the most (`successorSubscription`); a re-pointing grant and a successor
  beside others still live each warn; a failed read is a 500. A deletion cancels every not-ended subscription of the
  customer (`cancelSubscriptionsForDeletion`), any failure blocking it. Proved on the webhook's fixtures and
  `account-cancel.test.ts`; this lane made no Stripe call (no Stripe MCP used).
- **The strike's lapse as a duration** (`22770b36`): `report_strikes` answers `lapse_seconds` (20261001233100); the
  closed line reads it (`StrikeRule.lapseMs`) and `strikeLapseMs` is gone. Live proof red ("FAIL 1: the answer carries
  no lapse_seconds"), then green ("ROLLED BACK: every strike-lapse check held {addresses 2, lapse_seconds 15552000,
  lapses_measured 5}").
- **The drill-in's status filter** (`d0c63247`): `?status=` in the feed's words, each paging 500 on the same keyset
  with the filter kept; All is every status; no link prefetches.
- **The person report's handle** (`354eddff`): the site's absolute `/u/<slug>`, in a new tab.
- **`reviewed`** (`60114ffb`): the verdict is the review (nothing writes `reviewed`, pinned); the privacy FAQ, the privacy
  page's report card and /about's conviction drop "before anything comes down" for the instant hide's exception.
- **Four-digit ticks** (`0b4ee4cf`, `2ab27d11`): the line was half stale (`a99390dd` had sized the axis from the data);
  measured on localhost before, `1.5K` at -1.4 px and `2.3K` at -3.8 px past the chart's edge (`100K` 0.3 px inside);
  after `width="auto"` with 4 px of margin, every tick at least 4.2 px inside at 1440 and 375 (`ticks-before.txt`). A
  Library specimen draws both charts past 1,000 (`admin-metrics-charts`).
- **Soft-deleted events by index** (`a337518a`): `events_deleted_idx (id) include (purge_at, deleted_at)`
  (20261001233200); on a 1,000,000-event stand-in every expired-events read went from a full scan (21-22 ms) to
  index-only (0.2-0.7 ms) and standby_hosts' deleted half to index-only (`plans-*.txt`). Live proof red (FAIL 1), then
  green ("ROLLED BACK: every deleted-events-index check held {deleted_events 49, expired 0}"); `pg_indexes` read after
  shows no `events_deleted_idx`, so nothing persisted.

- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations** (the Orchestrator applies; each header carries its protocol and its rolled-back check):
  - `20261001233100_strike_lapse_duration.sql`: either order is safe, but apply it before or with the deploy: until it
    stands, a closed line says nothing of a strike and every dismissal reopens for 30 days. Drift: report_strikes'
    collapsed md5 `2dd870660580e662101298b550f0502f` (read 2026-10-01). This session's permission classifier refused
    my read of that hash after the green proof, so the apply's step (1) is the first read to confirm nothing persisted
    (the same rolled-back call left no index behind for the other file, read after).
  - `20261001233200_deleted_events_index.sql`: either order; `create index` takes SHARE on events for an instant
    (49 deleted rows live).
  - No Worker, Vercel, Stripe or env changes.
- **Calls his to overrule:**
  - #60: a child-abuse dismissal that kept no address (never a strike) keeps the 30 days; a strike's window never
    shortens them.
  - Two live subscriptions: the profile follows the live plan that stores the most, the newest on a tie; a failed Stripe
    read is a retry, never Free.
  - A deletion cancels every not-ended subscription, an incomplete one included.
  - `reviewed` stays an unused enum value: the verdict is the review.
  - The words: the privacy FAQ "...and every report is reviewed. Review comes before removal, with one exception: a
    report of child abuse from a confirmed email hides the photo or video at once, until it's reviewed..."; the privacy
    card "Each one is reviewed, and only a report of child abuse can hide anything before its review."; /about "Every
    report is reviewed, and only a child-abuse report can hide anything first. A host can remove anything instantly."
  - The drill-in's All is every status, removed included, and its filter takes the feed's Approved too.
  - The axes size themselves (`width="auto"`) with 4 px of slack, and the Library gained the charts' specimen.
  - The index carries `purge_at` and `deleted_at`, beyond the ROADMAP's bare `(id)`.
  - The handle opens in a new tab.
- **The next build's red-team** (the portal cannot sign in on localhost), on disposable data:
  - After 20261001233100: stage a dismissed child-abuse report with a kept `reporter_hash` and `resolved_at` 40 days
    back; on `/admin/reports?status=dismissed` its line reads "A strike on its address until <resolved_at + 180 days>
    UTC; ... Undo takes it back." with an Undo; press it: the report reopens (its item hides again if the dismissal had
    put it back). The same at 181 days: no Undo, "Its strike lapsed ..."; a no-address one at 31 days: no Undo.
  - `/admin/albums/<an album with removed items>`: the Album status row (All, Pending, Approved, Hidden, Removed); Removed
    draws only removed items; Older keeps `?status=`; the network panel shows no prefetch.
  - The People arm: a reported person's @handle opens `<app host>/u/<slug>` in a new tab, never the admin 404.
  - `/admin/metrics`: every tick whole (the Library's `admin-metrics-charts` covers past 1,000).
  - Will's card, once: a disposable host pays Pro in two Checkout tabs (4242), and Sentry shows
    `stripe_grant_repointed_subscription`; cancel the followed subscription immediately in Stripe TEST and
    `profiles.tier` stays `pro` on the other (`stripe_subscription_id`); delete that account and Stripe lists none of
    its subscriptions still billing.
  - After 20261001233200: the next purge run's `expired_events` and `standby_budget` cards stay green on
    `/admin/jobs`.
- **Look at first:** the three marketing lines (his voice, the instant hide's exception said aloud), then #60's
  no-address call.
