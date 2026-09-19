---
track: profile-reach
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board profile-page` ok (N steps)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines (exceptions and why)
- The decisions, one line each: `<id>: the question; the recommendation and why`
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
