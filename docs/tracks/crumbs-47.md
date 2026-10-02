---
track: crumbs-47
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "26743369"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/popup.tsx
  - src/components/ui/popup.test.tsx
  - src/components/ui/popup-kinds.ts
  - src/components/ui/popup-back
  - src/components/shared/masonry.tsx
  - src/components/shared/masonry.test.tsx
  - src/components/guest/guest-upload
  - src/lib/guest/use-upload-queue
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/components/social/guest-peek.tsx
---

# lp/crumbs-47

**Goal.** Two guest LOWs from build 38's red-team: Back over a credit's look closing the viewer with it, and the old failure sheet reopening after the flip.

## The brief

Two ROADMAP Now lines from build 38's red-team. Read each there whole, start each with a test that is red on today's code, and name both in your Handoff for the record.

1. **Back over a credit's look** (ROADMAP: "on a phone, Back over a credit's look closes the look AND the viewer in one press"). The look (kind `peek`, a sheet in a hand) takes no Back entry: `popup.tsx` takes one only for the screen and cover shapes, while `masonry.tsx`'s `standsOnAPopup` expects a screen-shaped look. Back should close the look, then the viewer.
2. **The flip's stale sheet** (ROADMAP: "after the flip … the next run's end reopens the OLD failure sheet"). The re-gate never dismisses the refused item, and `guest-upload.tsx` reopens the sheet at any run's end while an item is in error.

**Boundaries.** Tonight's identity board draws `src/components/ui/`, and other boards draw the guest screens. Fix behavior only: change no look, so no board's drawing moves.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; a test red on the old code for each; `pnpm lab:smoke --base http://localhost:3136`; name the phone Back walk and the flip for the next build's red-team in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door (a predicate, a ref and a guard).

- **Which popups hold the phone's Back entry?** By SHAPE: the screen and the cover as before, and now the sheet, the shape
  the look wears in a hand (`isPlaceShape`, `popup-kinds.ts`). Over the photograph viewer (an entry of its own) a layer
  that rises from the foot has to peel one Back a press. Option: by KIND, a `back` column on the one table so only
  `peek` takes it; cost: a board that moves a row's shape must move its flag too, and a sheet drawn for another kind
  would be a hole again. **Recommended and built: by shape.** It also changes the guest album's guest list, where a
  name's look in a hand now closes on Back instead of the page leaving (a gain, said here so it is not a surprise).
- **Does a question over the viewer (a confirm, the Block screen, a form) hold an entry too?** Driven in Chrome with the
  fix in: Back over the viewer's Delete confirm closes the confirm AND the viewer in one press. **Recommended and
  built: no**, a dialog is a question and not a place (the Library's `confirm=dialog`), and Back cancelling the whole
  of it is no loss; the option and its cost (two stacked entries over Settings, a Back while a save is pending) wait in
  the first Deferred line below, for his word.
- **What becomes of the file the flip refused?** It is dropped with the sheet that listed it, or never listed again
  where no sheet saw it fail: no surface reaches it once the page re-gates. Option: hold it and send it for her after
  her confirmation ("1 photo is waiting"); cost: a new flow for a file she may no longer want. **Recommended and
  built: dropped.**

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the floating layer's Back rule says a screen, a cover or a sheet (the look's) in a
  hand is a place the phone's Back closes, Back peeling a layer a press over the viewer, a dialog holding none.
- `docs/systems/guest-flow.md` (a `reads` file, edited for two facts of this lane and nothing else): the viewer's
  paragraph says a popup over it that is a place (the host's credit look) holds an entry of its own; the flip's bullet
  gains the slot's rule (it reports only what failed in front of it: `carriedFailures`; a slot going away under its open
  sheet dismisses what it listed).

## Deferred (ROADMAP one-liners, bucket named)

- Now · Guests: on a phone, Back over a question opened over the viewer (its Delete or Remove confirm, Block's screen
  from the credit's look) closes the question AND the viewer in one press, since a dialog holds no history entry (driven
  in Chrome in `crumbs-47`, where the look began peeling one layer a press); say whether a question over a place holds
  one too, and what Back does while its save is pending (from `crumbs-47`).
- Now · Guests: the failure sheet's heading counts a run by item index (`runBaseline`), so it reads "1 of 0 didn't
  upload" after a Retry that fails again and for a slot that mounts mid-run (the door's run handed to the album, whose
  comment says it counts everything already there); the run's own items are what it should count (`guest-upload.tsx`,
  probed in `crumbs-47`).
- Now · Guests: the viewer's arrow keys step the photograph behind an open modal layer (the credit's look, a confirm),
  since `ownsKeys` in `media-lightbox.tsx` knows sliders, menus and fields but not a dialog above the viewer; a keyboard
  at a narrow window or on a phone reaches it, and the look goes with the step (the viewer now stands through it, the
  masonry guard in `crumbs-47`); the listener should stand down for a layer above it (from `crumbs-47`).
- Now · Guests: a reload while a phone place is open (a screen, a cover, and now the credit's look) leaves that entry's
  `prPopup` marker on a page that forgot the popup, so one Back lands on the same page and closes nothing, and a
  viewer reopened from its address sees `standsOnAPopup()` true, so its walk writes no address until it closes; the
  popup's mount could drop a marker no open popup claims (observed in Chrome in `crumbs-47`, the viewer's reopen not
  driven: a hidden tab runs no rAF).

## Handoff (replaces the chat report)

Logs and captures: `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-47/` (below, `_scratch/`).

- **Commits, pushed:** `870b0f01` (both fixes, their tests and the two docs), `0eba7983` (a step behind the look's scrim
  keeps the viewer, found by driving the look with the keys after the first fix; its tests), then this manifest alone.
  **No sync commit:** launch-prep moved since this branch's base (`e4e04eb0`) to `7ee54758` (`create-wizard` and
  `host-dashboard`'s lab boards under `src/app/(dev)/design/sandbox/` and the Orchestrator's records), nothing under
  this lane's `owns` or `reads` (`git diff --name-only HEAD...origin/launch-prep` has no popup, masonry, guest-upload,
  queue or guest-peek line).
- **Gates on `0eba7983`'s tree, each on its own exit code** (clean tree, nothing but the commits): `pnpm typecheck` 0
  (`_scratch/final2-typecheck.log`), `pnpm lint` 0 (`final2-lint.log`), `pnpm test` 0, 745 files and 8,842 tests
  (`final2-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`final2-build.log`),
  `pnpm lab:smoke --base http://localhost:3136` 0, 138 checks and 0 failing (`final2-smoke.log`). `lab:demo` not run:
  `board: none`. The first typecheck on the work caught one `readonly string[]` into `dismiss`'s `string[]`, fixed before
  the first commit.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, plus this file): every line sits under `owns` or is a
  `docs/systems/` file listed above:
  `src/components/ui/popup-kinds.ts`, `popup-back.ts`, `popup.test.tsx`; `src/components/shared/masonry.tsx` and
  `masonry.test.tsx`; `src/components/guest/guest-upload.tsx` and `guest-upload.test.tsx`;
  `docs/systems/design-system.md`, `docs/systems/guest-flow.md`. `popup.tsx` and the queue (`use-upload-queue.ts`) are
  untouched: the fix needed neither.
- **The items**, each retiring its ROADMAP Now line (found by its opening words, "Guests: on a phone, Back over a
  credit's look" and "Guests: after the flip (An email first"):
  1. **Back over a credit's look** (build 38's red-team, W3 #1 part 2): `isPlaceShape` (`popup-kinds.ts`) now includes
     the sheet, so `PopupContent` takes its Back entry for the look in a hand (`popup.tsx` untouched); `masonry.tsx`'s
     `standsOnAPopup` was already right once the look holds an entry, and two comments in it that called the look
     screen-shaped and a report a place are corrected. **Red on the old code** (`_scratch/red-2.log`): `popup.test.tsx`
     "★ holds one history entry while open, and the phone's Back closes it" and "closed by its own X, it takes its entry
     back with it…", `masonry.test.tsx` "★ a Back over the look closes the look alone, and the next one closes the
     viewer onto the album" (the real `HostCreditLookProvider` over the real `GuestPeek`, at 375) and "the look's own X
     goes Back over its entry…"; green after (`green-2.log`). Pinned beside them (green on both): a dialog holds none, a
     desk's look holds none, and a router refresh while the look is open (Next's patch stand-in) still peels the look
     first and reloads nothing.
     **Driven in real Chrome under `next dev`** (`walk-1-phone-back.txt`): before, one `history.back()` with the look
     open landed on the album with the viewer `closed`; after, Back #1 lands on `prPhoto` at the same `?photo=` with the
     look `closed` and the viewer `open`, Back #2 closes the viewer, and the look's X goes Back over its own entry.
  2. **The flip's stale sheet** (W3 #3): `guest-upload.tsx` now reports only what failed in front of it. The failures
     already in the queue when the slot mounts with nothing running are carried in (`carriedFailures`, held by the item
     so one sent again and refused again is the run's own) and never listed, so a clean run after the gate falls away
     never reopens the old sheet; and a slot going away under its open sheet dismisses what it listed, as every close
     does (the re-gate takes the slot down), without `onFailuresClosed`. A slot that mounts mid-run still owns that
     run's failures. `use-upload-queue.ts` is untouched. **Red on the old code** (`red-4.log`): "★ the re-gate takes the
     slot down under its open sheet, and the refused file goes with it", "★ a refusal that lands while the slot is gone
     is nobody's to report: the next run's end never opens on it" (it reopens "1 of 1 didn't upload", the red-team's
     words) and the same under StrictMode's double effect; guards that pass on both: a mid-run mount, a carried failure
     sent again and refused again, one failure retried while the sheet lists the others (`green-6.log`).
  3. **The step behind the look's scrim** (new, from fix 1): the look now holds an entry, so an arrow key (focus is in
     the look, and the viewer's window listener steps under a modal) took the look and its entry away and the Back
     landed on the viewer's entry still naming the photograph left, which the viewer read as leaving. `masonry.tsx`'s
     popstate no longer closes while a step's address write is waiting and the landing is still on a photograph
     (`id !== null && addressTimer.current !== null`). Red without the guard (`red-6.log`: the stepping test and its
     shared-link twin); the old code passed it (`baseline-step.log`), so this is the first fix's own regression, closed.
     A Back that leaves the viewer while a write waits still closes it (its own test).
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the sheet takes the entry by shape, not by kind; a question over the viewer still holds
  none (a confirm and the viewer close together on Back); the flip's refused file is dropped and never listed again, not
  held for her confirmation; `docs/systems/guest-flow.md` (a `reads` file) edited for two facts of this lane; no sync
  (launch-prep moved with lab boards and records only).
- **Look at first:** `git show 870b0f01 -- src/components/ui/popup-kinds.ts` (the whole of fix 1 is `isPlaceShape`'s one
  line and its comment), then `guest-upload.tsx`'s `carriedFailures` and the two effects under "THE SLOT GOING AWAY IS A
  CLOSE TOO", then the guard in `masonry.tsx`'s popstate (`0eba7983`).
- **For the next build's red-team, the two walks.** This lane drove the first walk's core in Chrome on a throwaway
  probe page (its open, Back, Back and X steps, `walk-1-phone-back.txt`) and the flip only in tests (it needs the host's
  switch, which localhost cannot sign in to); what follows past those is expected, for the red-team to confirm or refute.
  1. **The phone's Back over a credit's look** (a 375 wide window, a same-origin iframe or a real phone; willg97 on a
     disposable event with one confirmed sender's photograph and one name-only sender's): tap a tile on the hub's album
     (history +1, `prPhoto`, `?photo=<id>`); tap the credit's name, so the look rises as a sheet (`data-shape=sheet`)
     and history is +1 again (`prPopup`) with the address unchanged; Back once: ONE popstate, the look closed, the viewer
     open on the same photograph; Back again: the viewer closed onto the hub, no `?photo`. Then the look closed by its X
     (driven in Chrome), by Escape and by a tap on its scrim: each goes Back over its own entry, so ONE Back more closes
     the viewer and never leaves the hub. Expected, pinned in jsdom and not driven in Chrome: with the look open and a
     keyboard, ArrowRight takes the look away, the viewer shows the next photograph, the address follows within a
     second and one Back closes the viewer; Escape closes the look alone. Expected, not driven at all: the look's Open
     full profile (a confirmed sender) reaches `/u/<handle>` and Back returns to the hub with the viewer reopened on
     that photograph; Block from this event closes the look and raises the block screen over the viewer, and Cancel
     leaves the viewer standing; on the guest album at a phone, a name in the guest list opens its look and Back closes
     it with the page staying. Known and expected (Deferred): Back while a confirm is open closes it and the viewer
     together, and a reload with the look open leaves one dead Back. The old build's ledger holds the same walk
     (`_scratch/redteam-38/ledger.txt`, W3 #1 part 2: one Back closed both).
  2. **The flip** (the ledger's W3 #3 recipe: a names-only event, a headless signed-out guest joined with one upload,
     the page frozen with `Page.setWebLifecycleState` after the next pick, the host turning An email first ON, thaw and
     Send inside the window so the presign answers 403): the sheet "1 of 1 didn't upload", the server's line "Confirm
     your email to add photos to this event.", Retry and Not now. Then (a) Retry: it is refused again and the page
     re-gates (the door's "Almost in"); the host turns it OFF; the album's poll clears the gate (about a minute); her
     next Add lands on the same row and NO sheet reopens, and the network shows ONE presign for the new file and none
     for the refused one (build 38 reopened "1 of 1 didn't upload … Confirm your email" and its Retry uploaded the
     refused file); (b) the same through Not now; (c) with the switch ON again, the next refusal still opens the sheet
     once, listing only its own file. A sheet that flashes "1 of 0 didn't upload" between Retry's second refusal and the
     re-gate is the known count quirk (Deferred), not this fix.
