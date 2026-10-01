---
track: crumbs-42
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "11653a5e"            # the launch-prep SHA the branch was cut from
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
  - src/components/app/event-settings/
  - src/components/app/host-add-provider.test.tsx
  - src/components/app/restore-event-button.test.tsx
  - src/components/app/share/event-code-door.tsx
  - src/components/app/qr-preset-picker.tsx
  - src/components/ui/popup.test.tsx
  - src/lib/events/visibility-labels.ts
  - src/lib/events/visibility-labels.test.ts
  - src/lib/dashboard/events-view.ts
  - content/help/your-dashboard-explained.mdx
  - src/lib/content/help-product-doors.test.ts
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

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **The wizard's sample codes** (the brief's ask). The Style step says its swatches are samples ("These are samples.
  Your event's own code comes when you create it, and you can change its style later from Share."), keeping the
  stand-in link. Recommended: say so, since the real link exists only once Create is pressed: encoding it would mean
  creating the event before its style, which `style=step` put up front and which would leave a row behind every
  abandoned wizard. A scanned sample can only 404 (no token is all zeroes, a 32-hex slug is refused), and the very
  next screen is the real code.
- **Review's one heading.** The room draws its own title, the page's one heading, with the queue's amber count beside
  it and Select / Approve all on its row (as the Guests room carries Invite); in a hand the actions take their own row
  under the title. Recommended: yes. Overrule: keep the page's title and only rename the amber label over the grid
  (Waiting), two rows as before.
- **Paused, and Open beside it.** A paused event's card says Paused; a live one still says Open. Recommended: keep
  Open (the brief moved only the word for two states). Overrule: drop Open, so only the exception speaks (a board
  idea below).
- **What the restore says.** "Event restored." over "12 photos and videos are still in its album's Deleted." (a lone
  one "1 photo or video", its kinds uncounted; after the moved link's line when both apply). Recommended: yes.
- **The double name.** In a hand a head's line that repeats its back arrow is drawn for a screen reader only, in
  `PopupHeader` itself so every popup gets the rule; at a desk, where no arrow is drawn, the line stays. Recommended:
  yes.
- **The hold.** A Settings page move made while a save is on its way is drawn at once and its address written once
  the save has landed (its transition committed); a close is never held (an X during a save closes at once, as
  before). Recommended: yes.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: Your events (a card's Open or Paused, `uploadsLabel`); the create flow (the Style
  step's swatches are samples); `?room=` (a page move during a save waits for it to land, and why the commit, not
  the answer); the Review room (credits by its own ids; the room's one heading, and why the actions take their own
  row in a hand).
- `docs/systems/design-system.md` (the popup): a screen's head never says its back arrow's words twice.
- `docs/systems/lifecycle-recovery.md` (restoring): the restore's toast says what `media_still_removed` counts.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Host: a Settings write that throws (a dropped connection) leaves its word busy for good and its overlay
  claiming the unsaved value, since `settings-state.tsx`'s `run` catches nothing; a thrown write could settle as a
  refused one (put back, with a sentence) (from `crumbs-42`).
- Now · Host: `HostUpload` still `router.refresh()`es the hub when a batch drains ("to pull the new rows into the
  server-rendered grid"), though the hub's album is the live store; the refresh re-renders the whole hub for what the
  store already brings, and a sheet opened inside its round trip can reload the page (`refresh-then-write-policy.test.ts`);
  dropping it wants the launch list and the Reel card checked against the store alone (from `crumbs-42`).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-42`; no sync commit.** Cut at 11653a5e. Owns widened before each edit at
  ce4979f0 and 63c3dbbb. Work: cdb5bbec (the upload count), 1dbdaae1 (the restore toast), 43cf32d8 (the double name),
  7ba50326 (the wizard's samples), ec504d70 (Paused), 48569d77 (Review's credits and one heading), 26b33610 (the
  Settings hold), 37ef6b7d (system docs), fc644ede (the hold's comment, its count corrected). launch-prep has since
  moved (f6d72a9d types and three typed seams, eb38b6be build 36, 452059ad and a21f6d0b records and the kit): none
  touches a path of mine or a `reads` doc, it merges cleanly (`git merge-tree`), and a trial merge typechecks (exit
  0, `merged-typecheck.log`, aborted), so no sync (PROGRAM.md "Sync"). The head is in the chat line.
- **Gates on fc644ede** (the head minus this manifest), each on its own exit code, logs in
  `../partyreel-wt/_scratch/crumbs-42/`: `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0, no warnings
  (`gate-lint.log`); `pnpm test` 0, 697 files, 8,357 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build`
  0 (`gate-build.log`; one attempt before it failed fetching Inter and Urbanist from Google Fonts, a network
  blip, `gate-build-fonts-fetch-failed.log`); `pnpm lab:smoke --base http://localhost:3132` 0, 146 checks, 0 failing
  (`gate-labsmoke.log`). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 36 paths, every one under `owns`, this
  manifest, or one of the three system docs above. Owned and untouched: `src/lib/db/queries/events.ts` (item 1 was
  already done, below).
- **PREMISE** (the lab crawl): `disposable-mode`'s asks name `create-event-wizard.tsx` and `event-ready`'s name
  `host-app.md`, `event-settings-sheet.tsx`, `create-event-wizard.tsx` and `event-code-door.tsx`. Their asks still
  hold: disposable-mode's `create` is a new step after the name (my edit is the Style step's line); event-ready's
  `create` is the beat after Create (untouched), `guide` walks Settings' pages and words (unchanged; only when a
  move's address is written changed), `door` draws "a Paused pill" (the badge still says Paused, now read from
  `uploadsLabel`), and `needs`' frames draw every card accepting uploads (Open, as before; its `dashboard.tsx` types
  the card's word itself, so a paused fixture there would still read Closed). `list` reads host-app.md's launch list,
  which I did not touch.

**The items** (each test red on the old code, its log in the scratch dir):
- Item 1, a malformed dashboard id: already done by crumbs-31 (b3e6f3a4): `getEvent` answers a non-uuid null before
  any read (`isUuidShape`, pinned in `src/lib/db/queries/events.test.ts`), and the hub, Review, Guests, the reel's old
  room, the print sheet and the five `[eventId]` API routes all decide on it; the alias (build 35 and 36) carries it.
  No change; the ROADMAP's Errors line is stale, retire it.
- Item 2, Review's credits: the room reads `readAlbumAttribution` by the pending ids (with the address), once the
  queue is read, none when it is empty, never `getUploaderIdentities`' whole album (`review/page.test.tsx`;
  `red-2-review-credits.log`). The neighbour "no test covers `useReviewTriage`" is stale:
  `use-review-triage.test.tsx` (since 890b224c, 2026-09-25) holds 27 cases; retire it.
- Item 3, a save and a second tap: the panel draws a move at once and writes its address once every save has landed
  (`settings-state.tsx`'s `afterSaves`, the call made inside `useTransition` with a sync callback;
  `event-settings-sheet.tsx`'s `SettingsPanel`); four pins red on the old panel (`red-3-save-hold.log`). ★ Landed is
  the save's transition COMMITTED: a throwaway probe (a revalidating Server Action and native writes, under `next
  dev`, never committed) reproduced the hazard (a write in the round trip and a second 10ms after the answer:
  reload) and showed the answer is too early (one write a task after it, then a second 20ms later: reload; 40 and
  80ms: the save's data dropped), while two writes 0 to 80ms after the commit were safe in 31 of 31 (15 with the
  provider's sync callback; 26b33610's message says 27, a miscount fc644ede's comment corrects), and a close during
  a save still drew in about 20ms.
- Item 4, Paused: `uploadsLabel` (`lib/events/visibility-labels.ts`) words whether guests can add, Open or Paused;
  the dashboard's card and the hub code's badge read it; the dashboard article says Open or Paused
  (`dashboard/page.test.tsx`, `help-product-doors.test.ts`; `red-4-paused.log`, `red-4b-help-article.log`).
- Item 5, Review's one heading: the room's `RoomHead` (above); the page draws no heading; FeedSectionHeader's
  `amber`, now without a caller, is gone (`review-room.test.tsx`, `review/page.test.tsx`; `red-5-one-heading.log`).
  Measured on the Library's specimen at 375: the first tile at 758 in both faces (it moved 36px on Select while the
  actions shared the title's row).
- Item 6, the upload count: gone from the provider, the panel and the gallery (`host-add-provider.test.tsx` pins the
  provider's four keys; `red-6-upload-count.log`).
- Item 7, what a restore leaves in Deleted: the toast says it (`restore-event-button.test.tsx`;
  `red-7-restore-toast.log`). No migration: the live `restore_event` (md5 bbf9f7b9, 3,422 bytes, byte-equal to
  20260929140000's body) already counts what her Deleted shows, never a withdrawal, a takedown or an asked row
  (20260928140000, pinned in `migration-guards.test.ts`); the ROADMAP's count line is stale, retire it.
- Item 8, the double name (`popup.test.tsx`; `red-8-double-name.log`).
- Item 9, the wizard's samples (`create-flow.test.tsx`; `red-9-sample-codes.log`).

**Local** (:3132): the Library's ReviewSection specimen at 1440 and 375 (the head in every state: queue, Select,
caught up, a guest's upload behind the line), and the Settings specimen saving a word through the provider's
transition (the sentence at once and after the round trip). The wizard and the hub cannot run signed in here, so
**for build 37's red-team**, signed in on the alias as willg97, at 1440 and 375:
1. Settings: on What guests can add, flip Videos (or Review) and at once tap the back arrow, then a row, inside the
   save: the pages move at once, the page never reloads, the address ends on the last row's `&setting=`, and the
   hub's cards show the save (the Review card's face). Repeat with two quick taps right after the switch.
2. Settings at 375: the bar reads the event's name on its arrow and "Settings", with no second name under it; at
   1440 the panel's head says Settings over the event's name.
3. Review with a queue: one heading, Review with its amber count and Select / Approve all on its row (under it at
   375); Select and Cancel move no tile; caught up and review off show the title alone; the peek's credits name the
   uploaders (an address under a confirmed guest's name).
4. Dashboard: pause uploads on an event (What guests can add: Nothing, for now): its card and row read Paused; the
   hub's code wears its Paused pill.
5. Restore: remove one photo of an event, delete the event, restore it from Deleted: the toast's second line reads
   "1 photo or video is still in its album's Deleted.", and the album's View, Deleted lists it.
6. The wizard: New event, a name, Style: the line says the codes are samples; Create's beat draws the real code.
7. `/dashboard/not-a-uuid`, `/review` and `/print` under it: "We couldn't find that event", titled Event not found,
   and no new Postgres 22P02 in Sentry.

- Assets requested from Will: none.
- Board ideas: whether a live event's card needs a word at all (Open on every card, where only Paused is news);
  and the Review room's head (the page's title with its count and its actions on one row) as the shape of every
  room's head, Guests' count beside its title.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (item 7's count needed none, above).
- Calls his to overrule: the six under Questions, each built as recommended (samples in the wizard; Review's title
  carrying its count and actions; Open kept beside Paused; the restore's words; the repeated line dropped in a
  hand; a page move held for a save, a close never).
- Look at first: red-team step 1 (the hold against the real hub: the one change whose proof is a probe, not the
  hub), then the Review room's head at 375 (the one redesign).
