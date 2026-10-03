---
track: wait-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-empty-state
  - src/components/guest/upload-tracker
  - src/lib/guest/upload-tracker
  - src/components/guest/upload/stack-tile
  - src/components/guest/upload/failure-sheet
  - src/components/guest/event-experience
  - src/components/guest/gallery-live
  - src/components/guest/guest-upload
  - src/components/guest/save-account-prompt
  - src/lib/album/store
  - src/app/(guest)/e/[token]/page
  - src/components/app/event-settings/camera-settings
  - src/components/app/event-settings/adds-page
  - src/components/app/event-feed/event-hub-head
  - src/components/app/event-feed/event-gallery
  - src/lib/disposable/
  - src/lib/validation/event
  - src/lib/db/mutations/events
  - supabase/migrations/20261003100000_
  - docs/systems/disposable-mode.md
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/the-wait/
  - docs/reviews/the-wait.json
  - docs/systems/database-security.md
  - src/lib/guest/camera/
---

# lp/wait-wiring

**Goal.** Wire the-wait's picks: one waiting experience for every album that holds photos back (the guest's one question of time, Settings' album styles, her contact sheet, the host's cover as her guests see it, "Disposable" as the preset's name, approval never with a develop).

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (the-wait r1, his desk on build 45, 2026-10-03), in full:**
- model=time: "For the guest screens, I like one question of time where there's only a small distinction between disposable and reviewed. However, the option 2 album styles settings design seems far superior - cleaner design/presentation, difference feels more clear. So this selection still keeps 2's settings design. Your call if another exploration helps synthesize even more!" (The Orchestrator's call: no further exploration; this lane synthesizes it, and Will judges it on the alias.)
- wait=sheet.
- arrival=? (the-wait r2 explores it after you merge; keep today's arrival.)
- cover=guests: "This feels the most bespoke, continues the guest experience into a similar host experience for a cohesive idea, and feels the most 'disposable' plus develop. however, we should consider how annoyingly long that grid could become in huge events, maybe consider a max visual size then just let the count increase. The look UI should be more polished - definitely not a hold to peek so it's easy to scroll. Expect most hosts to want to look, ut also provide them the disposable experience a bit too, more fun that way. can have some delights in here, otherwise all work no play is a boring consumer product."
- name=disposable.
- both=never: "If we allow this, I'd expect a large majority of hosts to enable approval as a safety measure but forget to approve everything prior to the disposables developing, leading to a bad guest experience. Setting the develop date provides time to review prior to the reveal and the date can always be pushed back by the host if more review time is needed. 'oh no they're about to approve, i'll push it back one hour' and guests seeing that and waiting a bit longer feels superior to guests getting nothing at the reveal due to forgetting to approve. approval can remain on live, where it serves a real benefit to moderation."
- Settled with him the same night: when an album switches from approve-each to a develop time, its held photos join the roll (approved and sealed, developing with everyone's, removable before it), and the switch's confirm line says so.

**Build:**
1. **The guest screens (`time`):** one question of time, a small distinction between disposable and reviewed, as the board draws it, across the cover, the Add slot, the keep, the failure sheet and her tracker.
2. **Her wait (`sheet`):** the contact sheet, inside the album's empty and waiting state (`gallery-empty-state.tsx`, her tracker, `stack-tile`). The sync's waiting count (`GuestFullSync.waiting`: everyone's, as a number and minutes, never an id) reaches the page through `lib/album/store.ts` and `GalleryLive`, so a guest with none of her own reads what waits (crumbs-52's deferred ROADMAP line: retire it).
3. **Settings (option 2, `styles`):** an "Album style" of picture cards (Live, Reviewed, Disposable), each a mini-album picture, then the develop time, switches and Customize, replacing `CaptureAndReveal`'s two questions on the adds page.
4. **The host's cover (`guests`):** her hub's head draws what her guests see before the develop. The grid is capped at a size and the count climbs past it. Look lifts it into a scrollable, polished view (never hold-to-peek), and Cover it restores. A delight or two. It lives in `event-hub-head.tsx`. Any hub-page line it needs is an accepted exception, since `rooms-wiring` owns the hub page: keep it to one line.
5. **"Disposable"** names the preset (the album's camera with a develop time) everywhere the board says: Create's card (read-only words for later), the cover's "Disposable · develops 9 am", the morning line, Settings, the help.
6. **Approval never stands with a develop:**
   - Settings keeps only the develop time for a disposable, plus a lift-the-cover note.
   - A CHECK refuses the pair: one migration in `supabase/migrations/20261003100000_*.sql`, which you write and never apply. It holds `not (moderation_mode = 'hold_for_approval' and develops_at is not null)` (confirm the enum's spelling), and normalizes any test row holding both first, its pending rows approved and sealed.
   - `updateEvent` refuses it in words.
   - Switching to a develop time approves and seals the held photos (the answer above), in one transaction with the switch.
   - The develop time can still move later.

**Constraints:**
- The leak invariants never move: no sealed or held id leaves the server for anyone but its uploader (`docs/systems/disposable-mode.md`).
- Red first for every behaviour.
- A rolled-back Supabase-MCP check of the migration's statements.
- `take-home-wiring` owns `live-gallery.tsx`, the guest dock and the export. `rooms-wiring` owns the hub page, the cards row, the sheets and the review and guests routes.
- Your doc lines in `guest-flow.md` and `disposable-mode.md` are yours. List take-home's and rooms' crossings in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3132`; `pnpm lab:demo --board the-wait` at 1440 and 375 (its PREMISE moves under it: report what its drawings no longer match); Vitest red first for the CHECK's refusal (and its rolled-back MCP check), the switch's held photos joining the roll, the waiting count on the page with no id, the capped cover grid; captures at 375 and 1440 of a guest's wait on a disposable and a reviewed album, Settings' album styles, and the host's cover covered and looked, in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is built; each is Will's to overrule.

- Hub page lines: two, not one (`develop={event}` on `HubCover`, whose stills hide what waits, and on `EventGallery`,
  whose album is covered). Recommended: accept both; one line would need a provider in rooms' page.
- Leaving approval for "right away" also releases what is held, in the same save (`events_hold_released` fires on any
  exit from approval, as Settings' consequence line already says). Recommended: yes.
- The sheet stands over the album's rows wherever photos wait, photos already showing or not (a reviewed album half
  let in). Recommended: yes; the-wait r2's arrival may refine it.
- The cover's word over the name: a camera album with a develop time says "Disposable · develops at 9 am" (the morning
  after, "developed at 9 am"), free uploads with one say "Develops at 9 am", and a reviewed album says nothing (the
  small distinction). Recommended: as built.
- "Developing" is every wait's one word, the marketing album's review mock and six help articles included.
  Recommended: yes.
- Look lifts the host's cover for the visit only; a reload covers it again ("provide them the disposable experience a
  bit too"). Recommended: yes.
- The host's cover only on an album with a develop time ahead; a reviewed album's hub is unchanged (Review is her
  check). Recommended: yes.
- The owner on her own guest page meets the guests' sheet (`albumWaits` asks by the event). Recommended: yes.
- The album's rule moved from the Add slot into the wait: said before anything waits, then the sheet's clock says it,
  once (measured on the real page: the slot said it over the sheet, twice). Recommended: yes.
- See it as a guest gains the wait (a crossing into rooms-wiring's merged view): without it, a waiting album read
  there as the empty album no guest sees. Recommended: yes.
- A camera turned on after a develop time was set: her cover's count can under-read the shots between
  (`host-cover.ts`; the guests' own sheet counts the seal itself). Recommended: accept, it is rare.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`: the cover's word over the name; the keep's and the failure sheet's words; the empty state's
  `albumWaits` and its yield; the album's wait (the contact sheet, its cap, hers lit, the rule's one place); the
  tracker's "Developing", her pictures and `herShotsOf`.
- `disposable-mode.md`: the open-this list; Disposable as the preset and the album styles; approval never with a
  develop (the CHECK, its two triggers under "Develop is a write"); waiting reaching the page as numbers; the camera's
  "Developing"; "The host's control, and her cover".
- Crossings: `host-app.md`'s See it as a guest line names the guests' wait (one clause); ROADMAP's crumbs-52 guest
  line retired (the brief's).

## Deferred (ROADMAP one-liners, bucket named)

- Host: Settings' rail sentence for What guests can add (`guest-experience-summary.ts`) names no album style and keeps
  two clauses the CHECK makes unreachable ("held for your approval and hidden until the album develops.", "developed;
  new ones wait for your approval."): name the style (Live, Reviewed, Disposable) and drop them (from `wait-wiring`).
- Host: the Review room's "Turn on review" on an album with a develop time now meets the refusal's words after the
  press; it could say why before it, or stand aside there (from `wait-wiring`).
- Code hygiene: `masonry.tsx`'s tile observer cancels unfinished downloads in its ref cleanup, which StrictMode's extra
  ref cycle runs at mount, so a tile that mounts with its link already held loses its `src` under `pnpm dev` (the hub's
  Look draws no photographs locally; production is unaffected): cancel on unmount only (from `wait-wiring`).
- The lab and the kit: the album-scale lab's host surface could take a develop time (`?develop=1`) and draw the host's
  cover over a thousand photographs, as this lane's captures did with an uncommitted knob (from `wait-wiring`).

## Handoff (replaces the chat report)

- Commits: fc2dfd7a (the six builds), 27f1cf0e (`albumWaits` by the event), 9256aeea (the rule moved into the wait),
  6006851b (See it as a guest's wait; the eyebrow on the label step's tracking), d4e6ac05 (crumbs-52 retired,
  host-app.md's clause); syncs d6cf9893 (launch-prep 8c2dce39) and accd5253 (9d3bf168), both without conflicts; WIP
  notes 693ca4fb, eb06771b. The head is in the chat line (this file alone after d4e6ac05).
- Gates on d4e6ac05 (launch-prep 9d3bf168 merged in), each its own exit code, logs in `_scratch/wait-wiring/`:
  typecheck 0 (`typecheck-8.log`), lint 0 (`lint-8.log`), test 0, 833 files and 9,826 tests (`test-8.log`), build 0
  (`build-3.log`), lab:smoke 0, 166 checks (`lab-smoke-3.log`); lab:demo `--only the-wait.<step>` for model, wait,
  arrival, cover, name and both at 1440 and at 375, twelve runs, 0 failing (`lab-demo3-*.log`; the board is answered,
  so the desk lists no open step and each was named); the boards the change reaches, at 1440 and 375: create-wizard's
  open `add` (4 steps), 0 failing (`lab-demo3-reached-*.log`).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: owned paths and this file, with these exceptions:
  the hub page (two lines, the first question); See it as a guest (`as-guest-view.tsx` and its test, its page's two
  fields: the crossing); `e/[token]/card/card.test.tsx` (its mock follows `albumWaits`); `entry-modal.test.tsx` (one
  line, the keep's words); the marketing review mock (`review-switch.tsx`, `album-copy.ts`, `mock-parity.test.ts`:
  "Developing"); six help articles (the labels moved, `help-ui-labels` pins them); `docs/ROADMAP.md` and
  `docs/systems/host-app.md` (one line each); `src/lib/guest/waiting-on-arrival.server.ts` and its test deleted
  (replaced by `lib/disposable/waiting.server.ts`).
- Items: the guest's one question of time on the cover, the Add slot, the keep, the failure sheet and her tracker
  ("Developing", told apart by the clock alone); the contact sheet over the album (the sync's numbers through
  `store.ts` and `GalleryLive`, hers lit from her tracker, capped with the count climbing, the empty album yielding,
  the owner and a guest with none of her own included); Settings' Album style (three picture cards, then the develop
  time and the look note, the switches, Customize; `CaptureAndReveal` inside Customize's own mix); the host's cover
  (her guests' sheet in her album's place, Look into her scrollable album with Cover it inline and as a pill, Develop
  now asked first, a develop's light on Look, the hub's stills held to what guests see); Disposable named on the cover,
  the morning after, in Settings and the help, its words in `album-style.ts` for Create's add step (create-wizard r3
  draws them); approval never with a develop (`updateEvent` refuses in words, the CHECK, a switch into a develop time
  approving and sealing what is held in the same save, the develop time still movable).
- Proposed migration: `20261003100000_approval_never_with_a_develop.sql` (apply protocol in its header: the drift
  read, nine events triggers today, no row holding both; advisors delta none; no types). Its rolled-back MCP check:
  red 6 of 7 on today's schema (the control true), green 7 of 7 with the file, nothing persisted
  (`_scratch/wait-wiring/sql/check-results.txt`). No Worker, Vercel, Stripe or env change.
- Captures after the sync, `_scratch/wait-wiring/cap/out2/` (real page, seeded with real uploads, staged by SQL,
  deleted after: R2 objects removed, rows purged, events soft-deleted): `guest-disposable-{375,1440}{,-sheet,-full}`
  (24 sealed, 6 hers lit, "Disposable · develops Sunday at 9 am"), `guest-reviewed-{375,1440}{,-sheet,-full}` (18
  held, "As Will Gibson lets them in"), `settings-styles-*`, `settings-disposable-*` (and `-look`),
  `settings-reviewed-to-disposable-1440` (the switch's line: "3 photos under review join the roll", Add them to the
  roll); `host-cover-{375,1440}-{covered,looked,looked-scrolled,covered-again}` and `host-cover-{375,1440}-n1145-covered`
  (1,145 counted, +968 and +1,052 folded), from the album-scale lab's host surface with an uncommitted develop knob,
  "looked" with StrictMode off (the Deferred dev artifact). Before the sync: `cap/out/guest-reviewed-letin-*` (all let
  in: the rule in the wait's place).
- PREMISE drift, the-wait: its premise says her photo waits in her round while the album reads as the empty state, a
  sealed one "Waiting to develop", the sync's waiting drawn nowhere, and Settings' as-built control the real
  `CaptureAndReveal`; production now draws the sheet, says "Developing" everywhere and leads Settings with Album
  style. `model.ts` quotes "Waiting for approval" and "Waiting to develop" as production's words; the `both` step's
  other options are refused by the CHECK now; its cover quote keeps a 0.14em eyebrow production dropped; its tracker
  (production's) now says "developing". Create-wizard r3's premise (drawn in the-wait's model) matches production.
- Assets requested from Will: none.
- Board ideas: the-wait r2 (the arrival) can start from the sheet as wired: the moment the develop turns its dark
  squares into the album is the one transition the board left open.
- Calls his to overrule: the eleven under Questions.
- Look at first: the migration (for the Advisor); `event-gallery.tsx` with `event-hub-head-cover.tsx` (the host's
  cover); `gallery-empty-state-wait.tsx` (the sheet, the rule, the yield); the as-guest crossing.
