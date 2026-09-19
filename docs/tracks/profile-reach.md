---
track: profile-reach
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b30445d9"          # the launch-prep SHA the branch was cut from
board: profile-page     # round two of the board, on the three pieces Will left open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/profile-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/profile-page.json
  - docs/systems/profiles-social.md
  - src/components/social/guest-list.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/event-experience.tsx
  - src/components/marketing/frames/phone-frame.tsx
---

# lp/profile-reach

**Goal.** Round two of `profile-page`, on the three pieces Will left open in his round-one notes (verbatim in
`docs/design/rulings.md`, the fourth batch), while `profile-wiring` lands his eight picks on the real profile and guest
list at the same time. His words: on `list=faces`, "let's add an option to expand that into the full list. For bigger
lists, we should continue to have pagination to expand into groups. I can imagine an edge case with a thousand guests,
and you click "View All", and all of a sudden you have a page 100 screens tall all at once. Could use an exploration on
how to view all from this condensed view (modal, sheet, page, going down existing spot on page, etc)"; on `exists=page`,
"the 'cards/sheets that open' can be used as a 'quick-look' mini version of looking at profiles, with the full page at
its own address as the complete version a second click away. That way if I'm looking at a guest list and click 10
different guests, I can see a little more about each"; on `head=guest`, "Seems like it'd be very easy to get far away from
the original event you scanned if you start clicking guests, risking not getting back in certain cases... maybe not the
best overall solution for our nav in general here." A `defineExploration` round two on the SAME board (`round.n: 2` with
`changed:`; the ledger is what lets it open), three decisions, phone first at 375 with 1440 on the knob, drawn on the
shipped guest list and the board's own `NamesSheet` and `CardSheet` as the bases, with a 240-name fixture so each
option's cost is measured in the frame: (1) `view-all`: how the full list opens from the faces row (in place under the
row with paging, the interim `profile-wiring` ships; a bottom sheet over the album; the centred modal round one drew; its
own page `/e/<token>/guests`); (2) `quick-look`: what a name opens first (a bottom sheet with the face, the name, the
line and the parties as small covers plus "Open full profile"; a popover card at 1440 and the sheet at 375; straight to
the page, no mini); (3) `way-back`: how a profile keeps the scanned event reachable (a "Back to <event>" pill under the
header when arrived from an album; the account menu listing the event; nothing beyond the browser's back). Recut them if
the drawings argue otherwise. Not in this round: any production byte; the eight ruled picks (they are wiring now, draw
on the shipped pieces as they stand at your cut and say so); public counts on a profile (never, by doctrine).

**Binds.** The bible; the privacy doctrine (`profiles-social.md`: attendance is never a capability grant, the graph is
owner-private, no public counts); the reading budget (`pnpm lab:smoke`); every step's options changing its stage (`pnpm
lab:demo --board profile-page`); the portal rule the board documents (a radix portal escapes the frame: draw sheets and
modals as the board's `NamesSheet` does); no em-dashes; the registration exception: this lane edits ONLY its own board's
lines in `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts` and
`src/app/(dev)/design/touchpoints.ts` (the RULINGS row's `ruled`, `why` and `board.note` rewritten for round two: the eight
picks named as wired by `profile-wiring`, the three pieces asked), and nothing else in those files.

**Verify on.** The board at 375 and 1440 with reduced motion honoured, every decision's options and notes reaching the
desk and the composed line, `pnpm lab:smoke --base http://localhost:3135` whole, `pnpm lab:demo --board profile-page
--base http://localhost:3135` pressing every step; the gate (`pnpm design:rules`, the specimen collector, typecheck, lint
with the 8 known warnings, test, build) each on its own exit code; `DESIGN_PREVIEW_KEY` in the environment, never on a
command line.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (lab-only)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head is the tip of `origin/lp/profile-reach` (this commit); the board work landed at `defa8dbe`, merged with
  `launch-prep` at `1d77b7c0` (it had moved one commit, docs-only: `docs/PROGRAM.md`, `docs/design/rulings.md`,
  a new `docs/tracks/lab-tides.md`, `docs/tracks/orchestrator.md`; no conflicts, never rebased).
- Gates on the synced tree, each on its own exit code: `design:rules` 0 (`docs/design/library.md` regenerated,
  confirmed byte-stable on a second run) · specimens 0 (131 specimens, 94 entries, unchanged) · `typecheck` 0 ·
  `lint` 0 (8 known warnings, 0 errors) · `test` 0 (243 files, 2580 tests) · `build` 0 (125 routes) · `lab:smoke`
  0 (447 checks, 0 failing; the board reads 257 words of its 1,200-word budget) · `lab:demo --board profile-page`
  0 (3 steps, 0 failing, every step draws its options).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `docs/design/library.md` ·
  `src/app/(dev)/design/sandbox/profile-page/{album.tsx,board.tsx,fixtures.ts,profile.tsx,reach.tsx,scene.tsx,spec.ts}`
  · `src/app/(dev)/design/touchpoints.ts` · this file. Owned paths, the one registration exception (the
  `profile-page` RULINGS row) and one generated file; nothing else, and `registry.ts`/`boards.ts` needed no edit
  (the board's id and file paths never changed).
- **The three decisions**, each the question and the recommendation:
  1. `view-all`: how should the full guest list open from the faces row? Four options, drawn at 24 names and at
     240 (a quarter of his imagined thousand): expand in place in groups of 24 (`profile-wiring`'s interim,
     paginated as he asked), a sheet over the album, the centred modal round one drew, or its own page.
     **Recommends the sheet**: the only option that keeps the album's own height untouched at either scale with
     no pagination clicks, and it reads as how a phone already shows a list of people rather than a document.
  2. `quick-look`: what should a name in the guest list open first? A bottom sheet on both screens, the same
     card as a popover at 1440 with the sheet kept at 375, or straight to the page with no mini. **Recommends
     the popover-at-a-desk split**: a phone wants the sheet's thumb reach, but a full-width sheet at 1440 hides
     the whole list behind one small card; the popover measured 320x263px, six percent of the screen, a real peek.
  3. `way-back`: how should a profile keep the scanned event reachable? A "Back to <event>" pill under the
     header, one more row in the account menu, or nothing beyond the browser's back. **Recommends the pill**:
     the only option that reaches a signed-out guest too, which most people at a party are, and it costs one
     line under a header that bible 4 already asks to name the host's event.
- One `lab:demo` note, not a defect: `quick-look`'s "sheet" and "adaptive" options draw the same picture at the
  board's default state (screen=375), because that is the whole point of "adaptive": it diverges only at 1440,
  where it becomes the 320x263px popover instead of the full-width sheet. Confirmed by eye in the browser at
  both screens (a marked chip anchoring the popover beside it, the sheet's own drag handle and pinned header at
  375).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `view-all` at 240. It answers his own fear directly (a party four times round one's ordinary
  size), carries the widest measured spread between options (58 to 84 percent of the stage), and its
  recommendation adds a surface over what `profile-wiring` already ships rather than confirming the interim.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round two of the `profile-page` board answered the three pieces
Will's round-one notes left open, on the same board (`round.n: 2`), replacing round one's eight ruled asks
rather than accreting them: how the full guest list opens from the faces row (`view-all`), what a name opens
first (`quick-look`), and how a profile keeps the scanned event reachable (`way-back`). A 240-name fixture sat
beside round one's 24 so a group's cost was measured at both scales, a quarter of Will's own imagined thousand.
Recommended a sheet over the album, a popover at a desk with the sheet kept at a phone, and a "Back to <event>"
pill under the header, the only one of the three that reaches a signed-out guest. No production byte moved; the
registration exception rewrote the `profile-page` RULINGS row for round two.
