---
track: crumbs-91
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/shared/album-order.ts
  - src/lib/shared/album-order.test.ts
  - src/lib/event/zone-morning.ts
  - src/lib/event/zone-morning.test.ts
  - src/components/guest/gallery-order.ts
  - src/components/guest/gallery-order.test.tsx
  - src/lib/event/hub-album.ts
  - src/lib/event/hub-album.test.ts
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/guest/event-experience.tsx
  - src/app/(app)/dashboard/[eventId]/as-guest.server.ts
  - src/app/(app)/dashboard/[eventId]/as-guest.server.test.ts
  - src/components/app/share/as-guest-view.tsx
  - src/components/app/share/as-guest-view.test.tsx
  - src/lib/security/abuse-rate-limit.ts
  - src/lib/security/abuse-rate-limit.test.ts
  - src/app/api/r2/presign-upload/
  - src/components/guest/file-dropzone.tsx
  - src/components/app/host-upload.tsx
  - src/components/app/host-upload.test.tsx
  - src/components/app/event-settings/settings-state.tsx
  - src/components/app/event-settings/settings-state.test.tsx
  - src/components/app/event-settings/settings-state-unpark.ts
  - src/components/app/event-settings/settings-state-unpark.test.tsx
  - src/app/(dev)/design/(shell)/lab/tools/motion/motion-playground.tsx
  - scripts/compute-model/
  - src/lib/guest/device-tickets.test.tsx
  - src/lib/guest/use-welcome-seen.ts
  - src/lib/guest/use-welcome-seen.test.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-card.test.tsx
  - src/components/app/event-card-qr.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/lib/shared/tile-size-cookie.ts
  - src/lib/shared/tile-size-cookie.test.ts
  - src/lib/event/zone.server.ts
  - src/app/(dev)/design/(shell)/library/compositions/pricing-demos.tsx
  - src/components/app/pricing/leave.ts
  - src/lib/db/mutations/events.ts
  - src/lib/db/mutations/events.test.ts
  - supabase/migrations/20261008030000_crumbs_91.sql
  # claimed at boot: AY1's other readers of the turn (the hub's Sort, the zone's words, the pins of the old morning)
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/event-feed/event-gallery.test.tsx
  - src/components/guest/party-zone.tsx
  - src/app/(guest)/e/[token]/page.first-paint.test.tsx
  - src/lib/disposable/reveal.ts
  - src/lib/disposable/album-style.test.ts
  # claimed at boot: line 3's new home on the host's side, line 4's Table, line 8's radio cards
  - src/components/app/file-dropzone.tsx
  - src/components/app/file-dropzone.test.tsx
  - src/components/app/dashboard/events-table.tsx
  - src/components/app/dashboard/events-table.test.tsx
  - src/components/app/event-settings/door-page.tsx
  - src/components/app/event-settings/door-page.test.tsx
  - src/components/app/event-settings/camera-settings.tsx
  - src/components/app/event-settings/camera-settings.test.tsx
  - src/components/app/event-settings/radio-cards.tsx
  - src/components/app/event-settings/radio-cards.test.tsx
  # claimed at boot: line 2's store (a burst's files counted in one read and one write), line 12's last specimen,
  # line 13's comment, and the migration's pins of the bodies it replaces
  - src/lib/security/abuse-rate-limit-store.ts
  - src/lib/security/abuse-rate-limit-store.test.ts
  - src/app/(dev)/design/(shell)/library/foundations/elevation-legend.tsx
  - src/app/(app)/dashboard/[eventId]/actions.ts
  - src/lib/db/mutations/event-doors-migration.test.ts
  - src/lib/db/restores-at-once-migration.test.ts
  # claimed in the work: what the lines' own changes reach (line 15's last pin, line 12's specimen artifact, line 2's
  # store mock beside the phone copy's presign, line 8's retired `Choice` named by a board's comment)
  - src/lib/db/mutations/events-create-key.test.ts
  - src/app/(dev)/design/gallery/specimens.generated.json
  - src/app/api/r2/phone-copy.test.ts
  - src/app/(dev)/design/sandbox/customize/settings.tsx
  # claimed in the work: AY1's last words of a turn at 9 am (comments only)
  - src/lib/event/zone.ts
  - src/components/app/event-settings/party-zone.tsx
  - src/components/app/create-event-wizard/add-step.tsx
  - src/components/guest/event-experience-wait.ts
  - src/components/shared/album-window-news.test.tsx
  # claimed after the sync (create-wizard-wiring-2 integrated): the hub hands its album her word on adding (AY1), and
  # line 12's retired chip leaves the share test's second assertion
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/new/create-flow.test.tsx
  # claimed at the second sync (brand-marks-wiring integrated): line 12's card chip leaves the needs-you test
  - src/components/app/dashboard/needs-you.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
---

# lp/crumbs-91

**Goal.** Will's AY1 answer wired (an album's order turns at her close, never on a date), and Immediate's small lines no wiring lane takes, each fixed at its source.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3138 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**First, Will's answer to call AY1 (2026-10-07, in chat; the Immediate line "Guests: an album's order turns when its host closes adding, never on a date"):** today the album turns from newest first to the night in order at 9 am the morning after its last day or at its develop (`lib/shared/album-order.ts`'s `albumTurnAt`, the page's `guestAlbumOrder`, the browser's `gallery-order.ts`), and an undated album never turns. His keepsake note: "we need to be very careful about how we're flipping event UI after an event ends ... let's say I create an event for a trip with friends and I simply put in a single date on there, but wanted to stay open for the entire week." So the turn becomes the album's state: it reads in order once its host closes adding (`accepting_uploads` false, the closed state the guest sync already sends live) and newest first while it is open; reopening turns it back; an undated album turns the same way; a Disposable's develop, her own chosen moment, still turns its album (the Orchestrator's call, his to overrule); the demo never turns; her own chosen order still wins (`pr_album_sort`). One moment for every reader still holds (PRD: "One moment for every guest"). The host's Sort follows the same rule (`hub-album.ts`). Rewrite guest-flow.md's "The album's order turns" lines in place; the `morningAfter` instant stays only where something else reads it.

**Then Immediate's lines (each quoted by its opening words in `docs/ROADMAP.md`; the Orchestrator retires each at your record):**
1. "Auth: around 19:19Z on 2026-10-06": a read; try once to reproduce, and if it does not, say what you checked in a line (the Orchestrator moves it on).
2. "QA hardening: a per-guest `presign` abuse kind".
3. "Host: `guest/file-dropzone.tsx` is rendered only by the host's manual add" (move it to the host's side; claim its new path in your manifest at boot).
4. "Dashboard: the Table at 375 shows no needs-you dot" (find the Table's row; claim it at boot).
5. "Settings: her own \"An email first\"" (the `events_email_held` trigger: a migration, below).
6. "Settings: the save's nudge (`settings-state-unpark.ts`)".
7. "Storage sums: the restores take their rows without waiting" (NOWAIT and SKIP LOCKED: the migration, below).
8. "Design: Settings' radio cards are each a Tab stop" (claim the radio group's file at boot).
9. "The lab and the kit: `pnpm compute:model`'s lab-demo scenario reads 24.5 calls".
10. "The lab: the motion playground".
11. "Code hygiene: `device-tickets.test.tsx` still pins the welcome".
12. "Code hygiene: `EventCard`'s dashboard-only props".
13. "Code hygiene: drop `resolveRowStep`'s legacy pixel-width mapping".
14. "Code hygiene: five stale comments" (all but `server-pipeline.ts:544`, no-signal-wiring's).
15. "Code hygiene: retire crumbs-88's typed seam".
16. "Host: pin See it as a guest's two new facts in its own tests" (`as-guest.server.test.ts` and `as-guest-view.test.tsx`).
A file a line needs that your manifest lacks: claim it in your manifest at boot (`src/lib/track-manifests.test.ts` refuses a path another lane owns; then it is an exception, listed with why).

**The migration, one file for lines 5 and 7:** **The migration, `supabase/migrations/20261008030000_crumbs_91.sql`:** start from `restore_media`, `let_back_in` and the `events_email_held` trigger function's newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. partyreel.com's live build (milestone 39) shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**`as-guest-view.tsx`'s `GuestBar`:** create-wizard-wiring-2 may list a one-line exception there (its corner says "Make one like this"); leave that line to it.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- AY1's Disposable: a reached develop turns its album into the night's order whether or not she has closed adding,
  and a reopen after the develop keeps it in order. Recommended: keep (the Orchestrator's call, built).
- The host's Sort: her departure is kept for the visit only, where a guest's is remembered per album on the device
  (`pr_album_sort`), so her hub opens each visit on the order her guests meet. Recommended: keep.
- Settings' radio cards: an arrow onto a door gate that reaches nobody writes the door at once, as a tap does
  (WAI-ARIA's selection following focus); a gate that would reach anyone asks first, however she got there.
  Recommended: keep.
- The compute model's lab demo: re-baselined (9 to 27 calls, 210 to 410 ms a step) rather than stubbed, since no
  frame calls an API any more; a step is the demo's own four loads plus production links prefetching inside frames.
  Recommended: keep (`2d77d98c2` says the measure).

## System-doc edits (in place, owned facts only)

- guest-flow.md: "The album's order turns" rewritten for AY1 (her close, a develop, never a date; the hook's live
  word; the zone for words alone; the host's Sort on the same rule).
- disposable-mode.md: the default develop's line (its 9 am no longer the album's turn; `developToKeep` is
  Customize's).
- host-app.md: Create's key (no keyless branch for a missing column), the email memory (the trigger hears the step,
  her own write clears it), the party's zone (never the album's order).
- database-security.md: `email_held`'s trigger columns, the restores in the lock-order paragraph (NOWAIT, SKIP
  LOCKED), and the `presign` kind under Rate limits.
- design-system.md: a Radix radio group's own Tab stop (a Gotchas line).
- testing-verification.md: a kill by port wipes a walk's cookies (item 1's cause).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · The lab and the kit: the kit kills servers by port the broad way (`lsof -ti tcp:$PORT | xargs kill` in
  `capture.sh`, `capture-all.sh`, `gate-lane.sh`, `demo-rerun.sh`, pinned by `gate-dev-cache-policy.test.ts`), which
  also kills a walk's headless Chrome's network service and wipes its cookies; kill the listener alone
  (`-sTCP:LISTEN`, `kit_port_pids`) (crumbs-91, red-team 56b's vanished cookies).
- Upcoming · The guest's album: an album open across her close turns its order at the sync's word (AY1) but keeps
  its Add and its open words until a reload (`event-experience.tsx`'s `canUpload` reads the render's
  `accepting_uploads`, the camera alone the live word); say the close from the live word too (crumbs-91).
- Upcoming · The host app: Settings: after a password's first set, a page that never saw her own write of "An email
  first" elsewhere says names only are back while the step stays on (the trigger kept her word, 20261008030000) until
  a reload; read the step from `set_event_password`'s answer (crumbs-91).
- Upcoming · Security and abuse: QA hardening: the presign budget checks and counts in two round trips, so one
  ticket's simultaneous bursts can all pass inside one; an atomic count-and-insert RPC (an advisory lock on the
  requester) would close it (crumbs-91).
- Upcoming · Code hygiene: `EventCard`'s `variant` has no caller passing it (the profile hands its own marker as
  `action`; the marketing teaser draws its own card), and its `data-static` comment still says a host management card;
  fold the guest marker into the profile's action (crumbs-91).
- Before launch · Legal: the privacy page (`legal-privacy.tsx`) says the welcome's flag lives in local storage and
  counts three cookies; `pr_welcome_<qr>` is a year's cookie now, beside `pr_tile_size`, `pr_album_sort` and
  `pr_album_w` (crumbs-91).

## Handoff (replaces the chat report)

- **Commits, pushed:** work `6a817c5a6` (AY1 and the Immediate lines), `2d77d98c2` (the lab demo's line),
  `f5cec6227` (item 1's doc line); syncs `8c0b907c7` (f60bd5542, create-wizard-wiring-2) and `1e15d19c5`
  (ec01d2013, brand-marks-wiring and guests-room-wiring; `needs-you.test.tsx` resolved by keeping launch-prep's live
  dot and dropping the card chip this lane removed); this manifest last.
- **Gates on the synced tree `1e15d19c5`, each its own exit code:** `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test`
  0 (1,113 files, 14,218 tests), `NEXT_PUBLIC_SITE_URL=http://localhost:3138 zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3138` 0 (203 checks); `lab:demo` reaches no board of this lane's. After
  them only `testing-verification.md` and this file moved (the doc-reading policy tests green on them).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` (80 paths) = owned paths + this file + the six
  system docs above, and one exception: `src/app/(dev)/design/sandbox/brand-marks/palette/menu.tsx` (brand-marks-r2's),
  its two `itemsLabel` props removed because `EventCard` no longer takes them (line 12); nothing else drawn changes.
- **AY1:** `albumOwnSort` (`lib/shared/album-order.ts`) is the one rule: in order once `accepting_uploads` is off or a
  develop is reached, newest first while open, the demo never; `GuestAlbumOrder` is `{own, chosen}` (`morningAfter`
  gone: nothing else read it). The guest page reads it off the row (the zone now read only where a develop time is
  said), `useGuestAlbumOrder` follows the sync's word on adding (`open`) and a develop's instant, See it as a guest and
  the hub's Sort (`event-gallery.tsx`, handed `acceptingUploads` by the hub's page) open on it. Walked on `:3138`:
  a guest at 375 turned to "Oldest first" on the sync after the host's close (48 s) and back on the reopen (11 s);
  a reload, a guest at 1440 (dark), the hub and See it as a guest each read the album's own; no console error.
- **The items:** (1) reproduced, cause found: `lsof -ti tcp:<port>` lists a walk's Chrome's network service, so a
  kill by port wipes every in-memory context's cookies at once (localStorage kept; a guest's httpOnly ticket returns
  at its heal), proved by killing my dev server by port under three open contexts (every cookie gone in 10 s;
  `lsof -ti tcp:3138` named Chrome's `NetworkService` helper beside `next-server`); `-sTCP:LISTEN` names the server
  alone; (2) `presign`: 1,000 files an hour a ticket, one read and one write a burst, counted before
  presigning, 429 with Retry-After, fails open; a walked guest upload wrote one `presign` row; (3) the dropzone is
  `components/app/file-dropzone.tsx`, "Click to choose, or drag them here" at a desk and "Tap to choose" on a touch
  phone (both walked); (4) the 375 Table's fold wears the needs-you dot (walked: "20 to review"); (5) and (7) the
  migration below; (6) the nudge goes on every 4 s after the early four until the commit lands, at most 5 minutes;
  (8) Settings' four radio groups are Radix groups (`radio-cards.tsx`), one Tab stop, arrows moving and choosing
  (walked on the album styles); (9) the lab demo's line, above; (10) the motion playground points at
  `/design/library/foundations#radius`; (11) `device-tickets.test.tsx` reads the welcome's cookie, the legacy put-down
  gone; (12) `EventCard`'s dashboard-only props and `event-card-qr.tsx` gone with their specimens (the artifact
  regenerated); (13) `LEGACY_WIDTH_STEP` gone; (14) the four stale comments; (15) crumbs-88's seam retired, its 42703
  pin with it; (16) See it as a guest's two facts pinned in both its tests.
- **The migration, `supabase/migrations/20261008030000_crumbs_91.sql`, not applied:** md5 `5574e613bed484eb8bf8dc93ae039508`.
  `restore_media` takes the item NOWAIT right after her row (callers: `restoreMedia` in `lib/db/mutations/media.ts`,
  `restoreMediaAction` in `dashboard/[eventId]/actions.ts`, whose words already make a 55P03 a retry); `let_back_in`'s
  restore SKIP LOCKED (callers: `letBackIn` in `lib/db/mutations/event-blocks.ts`, `letBackInAction` in
  `dashboard/[eventId]/guests/actions.ts`; a skipped row stays in her Deleted, out of `restored`); `events_email_held`
  fires on `gate, require_verified_email` and a client role's write clears the memory (fires on `updateEvent`,
  `set_event_door`, `set_event_password`, `block_from_event`). Live drift read equal on 2026-10-07 (restore_media
  `f4ad56caa8b4a4176e55c28bcd434c93`, let_back_in `7383a75e041e739347d9f61e36ad122c`, events_email_held
  `e8946631499647c941bc6a84acb04755`); RED then GREEN proved in one rolled-back call each (rows at the file's foot);
  the pre-flight's races and stress in its header (0 deadlocks after). An expand: no signature, argument or answer
  moves, so it applies in any order with any build; advisors: no delta expected.
- **Test data, listed for deletion:** "crumbs-91 (disposable)" (`2dd94b2e-26af-41a7-9a41-ab6028eabc74`, willg97's: 8
  photos seeded by `scripts/seed-demo-event.mjs`, 1 a walked guest upload; guest rows Ana R., Theo M., "crumbs-91
  Guest", "crumbs-91 Desk"); one `presign` row in `action_attempts` (ages out). willg97's dashboard Display went to
  Table for the walk and back to Gallery.
- Assets requested from Will: none
- Board ideas: Settings: confirming a consequence line by keyboard unmounts it and drops focus to the page; hand it back
  to the card it asked about.
- Proposed migrations / Worker / Vercel / Stripe / env changes: the migration above; nothing else.
- Calls for Will: a guest's own uploads are capped at 1,000 files an hour on her ticket (a twentieth of the host's
  hourly breaker; past it she waits, told in her words); AY1's Disposable: a reached develop puts its album in the
  night's order even while it takes uploads.
- Look at first: a guest's album open while the host closes adding (it turns on its next sync), then her hub's Sort and
  See it as a guest; Settings' album styles by keyboard; the dashboard's Table at 375.
