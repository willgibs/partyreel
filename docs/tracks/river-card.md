---
track: river-card
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d62dac22"         # the launch-prep SHA the branch was cut from
board: river-card       # a new question-first board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/river-card/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/river-visual.json
  - docs/design/rulings.md
  - src/app/(dev)/design/sandbox/river-visual/river.tsx
  - src/components/marketing/sections/features/shared/feature-door.tsx
---

# lp/river-card

**Goal.** One question-first board that puts the river (photographs streaming down out of the demo's
QR code) into the real QR door card, which Will called "our first truly beautiful card visual".
Authored with `defineExploration` (`src/components/lab/exploration.ts`), never `new-board.mjs`: a
handful of decisions in plain words, every option drawn in the real door. **Not in this round:** any
production byte (the wiring lane ships the pick and adds any redirect it needs), the ghost river on the
empty guest album (answered: `guest-photos=ghost`, the wiring's), any other door.

**Binds.** The bible, the component contracts, the policies. The newest section of
`docs/design/rulings.md` (2026-09-18) and `docs/PROGRAM.md` "A round returns DECISIONS", including its
two newest sentences (a relative note is answered against a reference, never a cap and a test;
placeholder copy is judged for its size and wrapping).

## What he said

On where the river goes (`placement=card`): "This would create our first truly beautiful card visual. I
think this is where it lands most powerfully, and how it works can use a more dedicated animation.
However, let's run the card implementation through its own exploration to nail it. Right now, I think
the QR code needs a bit more of a gap from the top, so it feels a bit more centered with the images still
streaming down. The blank space above will allow some breathing room."

On the code in it (`code=in`): "However, we don't need the 'scan it' label text. Think of this more as an
Easter egg in our design. We have other instances that are more direct about pointing to the demo event."

## What is settled, so build rather than ask

- **The real door, never a stand-in.** river-visual's "card" option drew three shadcn `Card`s
  (`board.tsx:294-361`); this board draws `FeatureDoor` (`feature-door.tsx`) itself, in BOTH of its
  aspects on every option: 4:5 on the /features hub (`features/page.tsx:98-117`, QR the middle of row one)
  and 3:2 in `RelatedFeatures` (first on /features/album, middle on /features/guests). Real sizes at 1440:
  330.7 wide, 413 tall at 4:5 and 220 at 3:2; at a phone one column, 343 wide.
- **The picture slot today**: the QR door has no photograph (`feature-door.test.ts:40-56` enforces it):
  `InkGround` (oklch 0.13) and `QrPlateArt` (`:141-154`, a white plate holding `StyledQr` at
  `clamp(84px, 34%, 132px)`), sitting above both scrims (the rest scrim `from-black/85 via-black/40
  to-black/10`, the copy scrim over the bottom 60%). The river takes `QrPlateArt`'s place and stays
  above the scrims, so the code reads at full contrast.
- **The river is imported IN PLACE**: `RiverVisual` from `sandbox/river-visual/river.tsx` (`:595`; props
  `width`, `height`, `origin`, `qrUrl`, `line`, `tone`, `eager`, `still`). Never edit it. When the card
  needs something it lacks (the plate's position is fixed at `round(h * 0.055)`, `:297`), copy the piece
  into your directory and say so in the Handoff: the river-visual board retires at its wiring.
- **No label**: `line` stays null and nothing captions the code. It is an Easter egg.
- **The code is not a link**: the whole door is one `<Link href="/features/qr">` (`:225-237`), so a link
  inside it would be nested. Scanning it is the only way in.
- **The scan floor is measured off the encoded value** (`river.tsx:223-224`: 3px modules and a 4-module
  quiet zone): partyreel.com and a /demo short link are 25 modules, a 99px floor; the demo event's full
  link (`DEMO_EVENT_URL`, `src/lib/demo.ts:17-19`) is 33 modules, 123px. No `/demo` route exists yet.
- **"A more dedicated animation"**: the card is small, so its river may run on its own clock (fewer
  frames, another flight). If you tune it, draw the card's clock beside river-visual's and say both in
  numbers; that is the reference, never a cap.

## The decisions (each drawn at 1440 AND 375, in both door aspects)

1. **Where the code sits** ("Where should the code sit in the door's picture?"): a tenth of the way down /
   centred in the picture [recommended: the river takes its position from the picture, and his "a bit
   more centered with the images still streaming down"] / a third of the way down. Every option sits
   lower than today's stand-in (13px from the top of a 238px slot).
2. **What it opens** ("What should the code open when someone scans it?"): a short demo link,
   `partyreel.com/demo` (99px floor; it opens the demo event, and the wiring adds the redirect)
   [recommended: it fixes the scan floor at its source] / the demo event's full link (123px floor) /
   partyreel.com (99px, what the door encodes today).
3. **The short door** (after where the code sits) ("What does the short 3:2 door do?"): the river at
   rest, still / it pours as the tall one does / every row takes the tall 4:5 door.

## The lab you are building for

The Orchestrator is rebuilding the step while you build, and it lands on launch-prep before your
handoff: **the preview is the page and the answer is a dock.** Every option is drawn ONCE, on the
stage, at its true size (flipped one at a time, or side by side when they fit), and a staged decision is
drawn wearing the answers it waits on. So draw each option as the real door at its real size (a `Frame`
at the real width, or a `Stage`), never a thumbnail. A preview may be a FUNCTION of the board's state
(`Preview` in `exploration.ts`): the short door's options can read `s.place` and draw the code where he
put it. `src/app/(dev)/design/sandbox/type-phone` is the worked example of the authoring shape; it
retires when `ladders-wiring`'s phase 1 merges, so read it at your cut.

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (after river-visual's; copy its shape,
  `board` block included);
- `touchpoints.test.ts`: the id in "marks exactly the standing sandbox boards".
Two other lanes add theirs at the same places, so the Orchestrator merges those lines keep-both. Never
reorder, re-sort or reformat the lists; if `pnpm format` touches a hunk outside your lines, revert it.
`pnpm design:rules` regenerates `docs/design/library.md` and `rules.generated.json` (generated;
allowances in the lane check).

**Names `ladders-wiring` changes, which you build against**: `rounded-3xl` and `rounded-4xl` become no-ops
and `shadow-float` and `--radius-action-lg` retire, so use none of them; `text-subhead` and `size="cta"`
arrive with its merges, so do not depend on either before your sync; the door's own corner follows the
new ladder when it lands (family C: an 8px surface).

## Verify, and the gate

The board at 1440 and 375, reduced motion honoured (the river at rest). **Measure every tile**:
screenshot every option beside its option's words and check the picture shows what the words claim; and
measure every drawn code's module size from a lossless capture against the 3px floor, in both aspects
at both widths (PROGRAM.md; a tile drawn with its sign backwards reached Will once). Dev server on port 3134, stopped by
port (`lsof -ti tcp:3134 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on its own
exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`,
`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`
(0 routes failing; the board under the reading budget), `pnpm lab:demo --board river-card --base
http://localhost:3134` (0 failing; after your sync it also judges the new step's CLIPPED, UNLABELLED and
NO DOCK).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Resumed after a kill: two edits were left uncommitted (board.css's gutter, board.tsx's
  `useLadderAt`). Both verified, then committed together at `7bac8c4b`. The gutter: at a real 375 px
  viewport, `document.documentElement.scrollWidth` measures exactly 375 (no horizontal overflow) on
  all four steps. The ladder: the "1440" door's title measures 20 px at real windows of 1440, 800 and
  375 alike; unfixed, `--text-subsection` itself resolves to 20 / 18.816 / 18.009 px at those same
  widths, so the bug was real (a phone-width reviewer, or the board itself viewed narrow, would have
  shown the "1440" door 18px type) and the fix holds it at 20 regardless.
- Head: the handoff commit (this manifest's Handoff and Record, `status: handed-off`) on top of
  `96679ad7`, pushed. Synced once, merge never rebase: `git merge origin/launch-prep` at `96679ad7`
  (gallery-width's merge `3a519e0d` and two docs-only commits, `3bb7370d` and `cffd16d3`); origin/launch-prep
  had not moved again since.
- Gates on the synced tree (`96679ad7`), each step's own exit code: design:rules 0 (regenerated
  `library.md`'s river-card row and `rules.generated.json`; both idempotent on a second run, no diff),
  specimens 0 (116 specimens on 89 entries, no diff), typecheck 0, lint 0 (0 errors, the 8 known
  warnings, none in river-card's files), test 0 (228 files, 2,137 tests), build 0 (254 pages, server
  killed first), lab:smoke 0 (208 checks, 0 failing; river-card reads 280 of its 1,200-word budget),
  `lab:demo --board river-card` 0 (4 steps, 0 failing: place moves up to 37.40%, fall 21.37%, opens
  31.42%, short 100.00%; tallest is short at 1.9 screens, wordiest is fall at 240 words; no CLIPPED,
  UNLABELLED or NO DOCK)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `board.css`, `board.tsx`,
  `card-river.css`, `card-river.tsx`, `door.tsx`, `spec.ts` (all under `sandbox/river-card/`), the
  registration lines in `registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts`, the generated
  `docs/design/library.md`, and this manifest. Nothing else; `rules.generated.json` did not move.
- `place` (where the code sits): a tenth down (41 / 43 px from the top at 1440 / 375) / centred (98 /
  107, recommended) / a third down (138 / 143). Every option's foot door holds the code at 13 to 24 px
  regardless (the short door has no more room to give); only the tall door's height actually moves.
- `fall` (where the photographs end; the fourth question the drawing surfaced, not the brief's three):
  behind the title (recommended; the photographs run to the door's foot under the copy scrim, the
  door's own anatomy) / above it (the stream stops 12 px short, bare ink under the words).
- `opens` (what the code opens): the short link (recommended; 99 px, 33 modules) / the demo event's
  full link (123 px, 41 modules; 0 px of clearance left in the short door at both 1440 and 375, exactly
  as spec.ts warned) / partyreel.com (99 px, 33 modules, today's pattern; confirmed a genuinely
  different code from the short link by a 0.71% whole-view pixel diff, not a frozen graphic).
- `short` (the closing row, after `place`): stands still / pours (recommended's runner-up; identical
  to `still` under reduced motion by construction, `rest = usePrefersReducedMotion() || still`,
  measured 0.0001% apart, one row of antialiasing) / every row takes the tall door (recommended; 193 px
  taller at 1440, the code finally gets room at 110 / 119 px from the top).
- The scan floor: all 44 measurements (11 options, 4 door-instances each except `short`'s 2) read
  exactly 3.000 px a module, at the 3 px floor and never below it: 99 px / 33 modules for every option
  except `opens.event` at 123 px / 41 modules. Doors measured 331x413 (1440, portrait), 331x220 (1440,
  landscape), 343x429 (375, portrait), 343x229 (375, landscape), read directly off each `.rcd-plate
  svg`'s rendered width and its own `viewBox` span, not recomputed from the value.
- Reduced motion: confirmed at the DOM level for every option (33 `.rcd` roots): `data-rcd-still`
  present and every `.rcd-card`'s inline `transform` / `opacity` byte-identical across three samples
  900 ms apart. A first pass diffed whole-view screenshots instead and falsely flagged 6 of 11 tiles
  (up to 21.6%); traced to something other than the river itself (card-river.tsx never starts a rAF
  loop when `rest` is true) and not chased further once the causal DOM check confirmed the actual claim.
- Captures (paths, under `/private/tmp/partyreel-captures/river-card/`): `place.tenth.png`,
  `place.centre.png`, `place.third.png`, `fall.behind.png`, `fall.above.png`, `opens.short.png`,
  `opens.event.png`, `opens.home.png`, `short.still.png`, `short.pours.png`, `short.tall.png` (every
  option, both widths, both aspects where the option draws both, beside its figcaption's words), plus
  `manifest.json` (every measurement, the option's stage label and dock words, the file path).
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot,
  never the picture).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the /demo redirect is the wiring
  lane's).
- Look at first: the `fall` step first (new, not the brief's three) then `opens.event`'s foot door at
  1440 or 375 (0 px from the top, no clearance left), the picture behind `short`'s `tall` recommendation.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `river-card` resumed after a usage-limit kill: the two
edits left uncommitted (the phone gutter into an unlayered rule, the 1440 doors' type pinned via
`useLadderAt`) were verified, committed, and synced against `gallery-width` and two docs commits. The
board draws four decisions, not the brief's three: drawing the door surfaced where the photographs end
as its own question. Every drawn code measured exactly 3.0 px a module against the floor, including a
hard 0 px of clearance for the event link in the short door. The river's rest under reduced motion was
confirmed at the DOM level. Recommended: centred, behind, the short link, every row tall.
