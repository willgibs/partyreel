---
track: floating-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b3291f81"         # the launch-prep SHA the branch was cut from
board: floating-surfaces # retired by this lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/
  - src/app/(dev)/design/sandbox/floating-surfaces/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/library/components/
  - src/app/(dev)/design/(shell)/library/patterns/
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/catalog.test.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/rules/influences.test.ts
  - docs/specs/floating-surfaces.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/globals.css
  - src/app/theme.css
  - src/lib/utils.ts
  - docs/reviews/floating-surfaces.json
---

# lp/floating-wiring

**Goal.** Not an exploration. Every step of the `floating-surfaces` board is answered, so this lane
ships the picks as working versions and retires the board. What comes back: Card's anatomy living in
`ui/dropdown-menu.tsx` and worn by the nine real menus, the standing submenu bug fixed, one corner and
one entrance family across the whole floating layer, `select.tsx` inside the floating-layer contract,
bible 15's first test, and the board gone. **Not in this round:** any glass or translucency, any new
exploration, and any change to the two shadow tokens `light-wiring` just landed (you read them, you do
not move them).

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's answers are in
`docs/reviews/floating-surfaces.json` round 7 and his rulings in `docs/design/rulings.md`. Read both
before you write anything: his notes carry constraints the option ids do not.

## What he ruled, and what each answer means here

- **`direction=card`.** Card is the shape: a title row, labelled groups, an icon rail, a footer rail.
  `DropdownMenuGroup` has no product call site today, so the groups are NEW markup at each of the nine
  menus, not a refactor of existing ones.
- **The group labels come from Glass, the surface does not.** His words: "I like the more subtle group
  labels from Glass. I also do think the glassy background would be more visually pleasant than the
  flat being used in Card now. However, I prefer not to create a one-off instance of glass here."
  So take Glass's label treatment only (sentence case, no tracking, `text-foreground` at 70 percent,
  tighter padding, the submenu's own label included) and ship the surface flat. ★ **No
  `backdrop-blur`, no translucency, anywhere in this lane.** He banked a dedicated Glass exploration
  by name; a one-off here is the thing he asked us not to do.
- **`submenu=keep`, and a hard ceiling.** "Yes, this unlocks much more comprehensive menus than
  limiting to a single list of everything included. However, we should not allow an additional third
  level of nesting. That gets too complicated." Cap the depth at two levels and pin the cap with a
  contract. No rule exists today, so it lands unviolated: write the test that makes a third level
  impossible to compose, not a lint note.
- **`radius=nested`, confirmed by `roundness=nested`.** 8px panel, 4px rows. His confirming note:
  "Still no visual difference, but let's go with your pick for now. We can always adjust later once we
  start implementing everything into the app." So it ships as one token pair the app can retune, not
  as numbers typed into nine files.
- **`entrance=by-frequency`.** The entrance is chosen by how often a surface is opened, per bible 12's
  frequency law: the menus a host opens fifty times a night are instant, the rare ones may have a
  beat. Write down which surface got which and why, in the component's own comment.
- **The shadow ask left this board inside round 7**, answered by the light board's `depth=both`. The
  floating layer takes `--shadow-layer`. `light-wiring` already did that sweep, including `select`,
  the nav indicator and the toast: read `src/lib/elevation-policy.test.ts` and do not re-do it.

## The standing product bug this lane fixes

`ui/dropdown-menu.tsx`'s `SubContent` has no `Portal`, so **every nested submenu paints nothing**. It
has been on Will's queue as a product bug waiting for this wiring round. Fix it with the submenu work
and pin it, since `submenu=keep` is worthless while the thing does not render.

## Retiring the board (atomic, and the checklist is not optional)

`BOARD_COMPONENTS` is typed `Record<SandboxId, BoardEntry>` and `SandboxId` lives in `touchpoints.ts`,
so these edits cannot be split: drop the entry alone and tsc fails; delete the directory alone and the
import fails. `light-wiring` did this at `b18d7f55` on 2026-09-17 and is the model to copy.

1. `src/app/(dev)/design/sandbox/floating-surfaces/` (12 files), deleted.
2. `sandbox/registry.ts`: the import and the array member, plus the header prose that counts boards.
3. `(shell)/lab/boards.ts`: the import and the map entry, plus its header prose.
4. The standing-board examples: check `_data/links.test.ts`, `_data/catalog.test.ts`,
   `_data/docs.test.ts`, `registry.test.ts` and `rules/influences.test.ts` for `floating-surfaces`
   used as an example id and re-point each at a board that still stands.
5. `docs/specs/floating-surfaces.md` cut to its ruling, the header rewritten from a standing proposal
   to what shipped.
6. `pnpm design:rules` regenerates `docs/design/library.md` and `rules.generated.json`. Both are
   GENERATED: never hand-edit them, and add them to `owns` at handoff with that reason.

★ **The retirement exception.** Two files stay in the Orchestrator's `owns` and you edit only your
board's own lines in them: `src/app/(dev)/design/touchpoints.ts` (both unions, the `board` block gone,
`ruled` and `shipped` rewritten so `ruled` no longer contains the word "open", `lives` pointed at what
landed, and `why` at most 170 characters on ONE line) and `touchpoints.test.ts` (the standing list).
List both in your lane check as the exception.

★ **Not yours, at all:** `bible.ts` (rule 15 is the Orchestrator's to flip), `docs/reviews/`,
`docs/design/rulings.md`, `docs/ASSETS.md`, and the CHANGELOG / STATUS / ROADMAP / PROGRAM files.
Bible 15's first TEST is yours to write; its status line is not.

**Verify on.** The nine real menus at 1440 and 375, in dark and in light, with reduced motion
honoured: every group label, every submenu opening and painting, the corner on panel and rows, the
entrance per surface. The floating layer over a busy page. `pnpm lab:smoke` (exit 1 is normal: two
glow boards are over the reading budget on purpose) and `pnpm lab:demo` with the board gone from the
list, which is the retirement working.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: typecheck ok, lint ok, test ok (N), build ok (M routes); `pnpm lab:smoke`; `pnpm lab:demo`
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- What landed, one line per part; which entrance each surface got and why; every menu that gained groups
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
