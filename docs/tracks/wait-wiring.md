---
track: wait-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
