---
track: floating-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7534d02f"         # the launch-prep SHA the branch was cut from
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
  # THE NINE MENUS (Q1). The goal says Card is "worn by the nine real menus" and
  # that the groups are new markup AT each of them, but no call site was listed
  # above. Added here with that reason; the guest account menu is voice-picks'
  # and was left alone.
  - src/components/app/user-menu.tsx
  - src/components/app/notification-bell.tsx
  - src/components/app/event-qr.tsx
  - src/components/admin/admin-nav.tsx
  - src/components/admin/operator-alerts.tsx
  - src/components/admin/triage-status-control.tsx
  - src/components/social/profile-actions-menu.tsx
  # The operator nav's grouping is a property of a SURFACE, so it belongs in the
  # single source rather than as a second copy inside the menu (Q2).
  - src/lib/admin/nav.ts
  - src/lib/admin/nav.test.ts
  # GENERATED, never hand-edited: `pnpm design:rules` and the specimen collector.
  - docs/design/library.md
  - src/app/(dev)/design/rules/rules.generated.json
  - src/app/(dev)/design/gallery/specimens.generated.json
  # The owning system doc, refined in place for this lane's facts.
  - docs/systems/design-system.md
  # The retirement exception, my board's own lines only: the two unions and the
  # ruling row; the standing list; and the board's iframe scene route in the
  # smoke's SCENES (light-wiring did the same line for type-scale at b18d7f55).
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - scripts/lab-smoke.mjs
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

Each was answered with its recommendation and carried on, per the boot rules. None needs Will.

1. **The lane owned no menu.** The goal says Card is "worn by the nine real menus" and that the groups
   are NEW markup at each of them, but `owns` listed only `src/components/ui/`. **Taken:** the seven
   call sites I touched are listed in `owns` above with that reason. `src/components/guest/guest-account-menu.tsx`
   is the eighth and is `voice-picks`', so it was left alone (see Deferred); the ninth is the marketing
   nav, which is a primitive rather than a call site and was wired inside `ui/navigation-menu.tsx`.
2. **The corner and the entrance were meant to land in `globals.css`, which is a `read` this round.**
   **Taken:** they land as ONE module, `src/components/ui/floating-layer.ts`, deriving the row's corner
   from `--radius-float` rather than duplicating it. Nothing in `globals.css` or `theme.css` moved, and
   the contract is now something a test can hold, which is what bible 15 never had. The one knob I could
   not put there is the marketing nav's, which lives in `marketing.css` under the 2026-08-28 nav ruling
   and whose default IS the standard rung; the policy allows a clock read from a `var()` and refuses a
   typed number.
3. **Card's anatomy on a menu with two rows.** The board's own cost line: "a two-row menu is suddenly
   furniture. It is the right answer for the event menu and the wrong one for a three-row overflow."
   **Taken:** the anatomy ships as PARTS a call site may leave out, not as a shape baked into the panel.
   Five menus gained parts; the QR download and the profile overflow wear the layer and nothing else, and
   each says so in a comment so the next agent does not read it as an oversight.
4. **Which clock each surface gets.** `entrance=by-frequency` names the law, not the assignment.
   **Taken:** three rungs, written at each call site with its reason. Instant 90/70 (tooltip, menu,
   submenu, select), standard 200/150 (popover, dialog, marketing nav), edge 300/200 (sheet). Only the
   tooltip, the menu and the select actually changed, which is Will's sentence exactly: the tooltip and
   the menu land in 90ms and the dialog keeps its slower beat.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`: the floating-layer paragraph under Motion became **`### The
  floating-layer contract`**, rewritten to what shipped (the module, the derived corner, the two
  entrance languages, the three clocks, the no-glass guard, the two primitives outside the family by
  name, Card's parts, the submenu landmine and the two-level cap). The heading is why
  `PENDING_ANCHORS` in `_data/docs.test.ts` is now empty: `touchpoints.ts` pointed at
  `#the-floating-layer-contract` and it finally exists. The prose after it became `### Skeletons,
  tiles and the reveal chips` so the new subsection ends where its subject does.
- Same doc, the Rounding table: the floating row now names the DERIVED row corner beside
  `--radius-float`, so the pair is readable in the one place the tokens are listed.

## Deferred (ROADMAP one-liners, bucket named)

- **the design system** · `guest/entry-shell.tsx` renders a raw vaul drawer that never goes through
  `ui/drawer.tsx`, with a literal radius: the floating surface most guests will ever see is outside the
  contract, and `src/components/guest/` was `voice-picks`' lane this round.
- **the design system** · `marketing/help/help-palette.tsx` builds its own floating panel outside
  `src/components/ui/`, so it wears `rounded-float` by hand and `floating-layer.test.ts` cannot reach it.
- **the design system** · on a narrow screen a submenu can still be pushed partly off the edge when its
  parent panel leaves under about 130px on either side: radix flips to the roomier side and then
  `limitShift` keeps the submenu attached to its trigger, so it will not slide further into view. The
  product's one submenu fits (measured: 121px into 135px), but the durable answer for a phone is a
  drill-down rather than a side-opening panel, which is a design question and not a wiring one.

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
