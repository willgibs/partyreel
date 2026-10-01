---
track: crumbs-42
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "07277c23"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/
  - src/components/app/event-feed/
  - src/components/app/host-add-provider.tsx
  - src/components/app/host-upload.tsx
  - src/components/app/restore-event-button.tsx
  - src/components/app/create-event-wizard.tsx
  - src/components/ui/popup.tsx
  - src/lib/db/queries/events.ts
  - src/lib/db/mutations/media.ts
  - src/lib/events/share-urls.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/design-system.md
  - docs/systems/database-security.md
---

# lp/crumbs-42

**Goal.** Nine host-app lines: a malformed dashboard id answered by the not-found screen instead of a crash, Review reading only the credits it shows, a Settings save that a quick second tap cannot reload, Paused rather than Closed on the dashboard card, Review's one heading, the upload count nobody reads, what a restore leaves in Deleted, the settings head's double name, and the wizard's sample codes.

## The brief

Nine ROADMAP lines (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **A malformed dashboard id**: "`/dashboard/<not-a-uuid>` crashes into the app's boundary with a Postgres `22P02` (two server events and one `render:app` per visit) where `notFound()` is the truth; `getEvent` (`queries/events.ts`) refuses a malformed id before the query". The hub and every room draw the app's own not-found, as an unknown id does since crumbs-28, and no Sentry event fires.
- **Review's credits** (from `crumbs-38`): "Review reads the whole album's attribution (`getUploaderIdentities(event.id)`) to credit its queue alone; `readAlbumAttribution` by the pending ids would read only what it shows". Its ROADMAP neighbour "no test covers `useReviewTriage`" may already be untrue (`use-review-triage.test.tsx` exists): retire that line if so, or cover it.
- **A save and a quick second tap** (from `crumbs-24`): "every Settings save revalidates the hub, and a tap that moves the address during its round trip followed by a second within about 40 ms of its answer reloads the page (within about 120 ms, the save's data is dropped) ... hold the panel's page moves while a save is in flight if it is ever met". The hold belongs to the panel; `lib/history-entry.ts` and `ui/popup-back.ts` are crumbs-43's.
- **Paused** (from `event-ready`): "the dashboard card says Closed for paused uploads (`statusLabel`, `app/(app)/dashboard/page.tsx`) while the hub's Settings card words the gate Only people already in as \"Private · Closed\" (`doorLabel`): one word, two states; the card could say Paused, the code's own word".
- **Review's one heading** (from `crumbs-7`): "the Review room says \"Review\" twice at its top (the page's heading and the section's amber label over the grid)".
- **The upload count nobody reads** (from `crumbs-36`): "`HostAddProvider`'s `uploadingCount` and `setUploadingCount`, and `HostUpload`'s `onUploadingCountChange`, have no reader since the floating Add pill retired; removing them takes `event-gallery.tsx`'s `onUploadingCountChange={add?.setUploadingCount}`". The guest side's own counts (`event-experience.tsx`, `guest-action-dock.tsx`) are crumbs-43's and stay.
- **What a restore leaves in Deleted**, two lines as one: "`restore_event`'s `media_still_removed` (20260729190000, line 441) counts a guest's withdrawals too ... a future \"N items stay in Deleted\" line must count `removed_by_uploader = false` only", and "the restore toast never reads `mediaStillRemoved` (`restore-event-button.tsx`), so an event restored with media still removed says nothing of it". The count is a migration replacing `restore_event`; the toast says what stays in Deleted, in the product's voice.
- **The settings head's double name** (from `event-settings`): "the settings kind's head in a hand says the event's name twice (the back arrow and the line under the bar); popups could drop the line wherever the back arrow names it".
- **The wizard's sample codes**: "the wizard's QR swatches encode `/e/` plus 32 zeroes (`previewJoinUrl`), a 404 when a host test-scans one; say they are samples, or encode the real link once the event exists". Recommend under Questions and build it.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition and the live body (md5-check it, as crumbs-38's headers do); a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: two lanes write migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proof on the live schema, red first;
- on localhost, the create wizard and the Library's specimens of the hub's pieces.

The hub, Review and Settings cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `event-ready` describes what a host is told when the event is ready (the hub and the dashboard card among its frames) and `locked-door` the guest's door. Change no word or behaviour their asks describe beyond the lines above. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, so don't touch their files:
- `crumbs-41` owns the admin portal (`src/app/admin/`, `lib/admin/`, `components/admin/`), billing (`api/stripe/webhook/`, `lib/stripe/`), `queries/reports.ts`, and `report_strikes` and the reports' SQL;
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
