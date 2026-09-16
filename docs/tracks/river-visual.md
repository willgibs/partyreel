---
track: river-visual
status: open
cut: "be1638f2"          # round 3, the clarity round, cut from launch-prep
cut_round_2: "1b647d76"
merged_round_2: "bf564121"
cut_round_1: "c473707"
merged_round_1: "232dfd29"
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/sandbox/river-visual/
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/light/
  - src/app/(dev)/design/sandbox/rounding/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/lab/[board]/page.tsx
  - src/app/(dev)/design/(shell)/_shell/index.ts
  - src/app/(dev)/design/_data/state.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/components/lab/kit-discipline.test.ts
  - scripts/new-board.mjs
  - docs/decisions/design-record.md
  - docs/reviews/README.md
  - docs/design/README.md

---

# lp/river-visual

## Round 3 (the clarity round, 2026-09-15): every ask in plain words

**Goal.** Every ask on this board rewritten so that someone who has not read the board can answer it
where they meet it (the desk's session, and the review card that pins under the dock): a real
question, its context, where to look, options labelled in words with what each means; the evidence
labelled with the options' names; the board's question, verdict and section ledes in the same plain
words. No candidate, number or recommendation changes and no new evidence is built. Will's first review
through the desk (2026-09-15) answered three asks on the light board and stopped at two that were labels
with token options ("The aurora's placement: no | seam | both | room"): "it was tough to understand what
I was being asked for most of those questions... when you use very technical terms or nicknames from
spots in these reports, it makes me have to go deep into the track to gain the relevant context and even
begin understanding the question being asked. Having the link helps a bit, but framing the context more
with the question would help a ton... the more clearly you can ask me questions, the more easily it is
for me to respond." His ruling is `docs/design/rulings.md` (2026-09-15 · a question carries its context; an
exploration is a catalog) and the guidance is `docs/design/guidance.md#boards-the-review-surface`.

**The exemplar.** `src/app/(dev)/design/sandbox/light/spec.ts` (read it whole, first) and the relabelled
columns in `sandbox/light/depth.tsx` (`cueLabel`). The shape is `Ask` in `src/components/lab/board-spec.ts`:
`question` (a real question, ends with `?`, 160 max), `context` (what the thing is and where it lives on
the site, for a stranger; a nickname glossed the first time or dropped; 400 max), `look` (which section,
which dock switch, which labelled specimens to compare; 240 max), `options` as `{ id, label, means }`
(the id UNCHANGED, one token; the label in words, 48 max, never the token itself; `means` one sentence on
what choosing it does, 160 max), `recommended` (an id), `because` in plain words (300 max), `overrule`
(160 max), `evidence`, `state` (the dock state that shows this ask's evidence; the review card applies it
on landing), `control` (a dock control whose option ids equal this ask's, so picking an option previews it;
use it wherever an ask mirrors a switch).

**The rules.**

1. Ask ids and option ids never change: the ledger joins on them. An ask may be split into two clearer
   asks, or added where the verdict decides something nobody was asked; new asks get new ids. An ask that
   decides nothing is removed.
2. The evidence carries the options' names. Every `Cell`, `Labeled`, `Compare` label, frame caption or
   column an ask is judged on is labelled with the option's `label` (the way `depth.tsx` does it), and a
   dock control an ask mirrors uses the same labels as the ask's options. Where a control's option ids
   differ from the ask's (`today` against `a`), rename the CONTROL's ids to the ask's, never the ask's, or
   leave `control` off; the ask's ids are the ledger's.
3. The board's `question`, `verdict` and every section `title` and `lede` in the same plain words,
   within `LIMITS`; a technical term stays only with its gloss. Arguments stay collapsed. Anything that
   decides nothing is cut, not rewritten. Do not bump `round.n` (the ledger's round guard reads it); edit
   `round.changed` to say the asks were rewritten in plain words.
4. Nothing else changes: no new specimens, no candidate or number or recommendation changed, no kit
   edits (`src/components/lab/` is not yours; a kit need goes in Handoff), no other board touched.
5. Remove this board's line from `PLAIN` in `src/app/(dev)/design/sandbox/registry.test.ts` (that file
   is otherwise read-only for you); the ratchet then checks the shape.

**This board.** Four asks. "The river" is the album streaming out of the code as one visual at
three sizes: say so in `context`. `column | card | guest` (where it goes first: beside a how-it-works
step, in a feature card, on the empty guest album), `in | out` (the scannable code inside the visual
or not; the `origin` control is a different axis, so leave `control` unset unless you align it),
`ghost | none` (may an empty album show faint photographs), `keep | taller | squarer` (the box's
proportion) each get a label in words and a `look` that names the labelled frames.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the board
at 1440 and 375 on a local `pnpm dev` (`/design/lab/river-visual`), reduced motion honoured, every evidence
section showing the options' words; the desk's session on this board (`/design/lab?session=river-visual.placement`)
read cold, as a stranger; `pnpm lab:review --dry 'review river-visual r2: <ask>=<option id>'` accepting one
clause per ask. No `[preview]` and no `[ci]` on your pushes: the round's review surface is a local
`pnpm dev` on launch-prep after integration.

**Handoff.** The usual (head SHA, gates, lane check) plus every ask as it now reads (the question and
the option labels, one line each), and any question you could not make plain without new evidence,
with why.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings this track works
under: 2026-09-15 · a question carries its context; an exploration is a catalog; 2026-09-15 · the review
surface.


## Round 2 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The river feature visual onto the kit. The stream is one flow, saved to the lab's design bank as a feature
visual (Will's round-four ruling): the spec says which surfaces it is for and asks the one question that
is open; the board mounts it in a `Specimen` at 1:1 with its `CostMeter` from the kit rather than its own,
and the reduced-motion state as an authored `useMotionState`.

**The migration contract (every board in the wave).** A board is two files on the kit: `sandbox/<id>/spec.ts`,
pure data through `defineBoard` (the question; `round {n, date, changed}` with this round's line; `history`
from this manifest's rounds; `context` for how the board got here; the `verdict`; the `asks` Will answers in
one word each, with stable kebab ids, one-token options, the recommendation, `because`, `overrule` and the
`evidence` section; the `candidates` with their rationale, departures and assets; the `departures` from a
bible rule, a ruling or precedent with their cost; the `assets` in the ASSETS.md shape; the `sections` with
a title and a one-line lede, arguments collapsed; the page-wide `controls` the dock renders; `lookFirst` as
an executable walk; `notes` as the builder's; `links {bible, record, track, spec, pages}`); nothing about
the board is scraped from JSX any more, and `sandbox/registry.test.ts` pins the density limits and refuses
a spec that imports React, CSS or the board. And `sandbox/<id>/board.tsx`, the client composition:
`BoardPage({spec, dock, evidence, review})` from `@/components/lab`, the evidence per section as a
function of the declared state (`useBoardState`), the kit's `Frame`, `Compare` (its `differs` line
required), `Specimen`, `ApplyToSite`, `CostMeter`, `Walk`, `Paste`, `Loupe`, `SelectTable`, `ConceptCard`,
`useReplay`, `useMotionState` in place of the board's local copies (`kit-discipline.test.ts` refuses a
local `Row|Part|Knob|PageFrame|ApplyToSite|CostMeter|Paste|CellLabel|Labeled|Cell|BoardIndex|RuleIndex`
once the board's id leaves its LEGACY list); no prose before the first section (the template has no slot
for it); every ask restated from the same array; comparisons name their distinction; captions never sit
inside the judged area; never zoom, scale or transform a judged specimen (1:1 is the law of the lab).
Read `sandbox/light/{spec.ts,board.tsx}` and `sandbox/rounding/{spec.ts,board.tsx}` whole first: they are
the pilots and the model. Keep what is genuinely the board's own (a candidate's engine, a sourcing sheet, a
scoped token block) and delete the rest of its shell code. No candidate, number or recommendation changes
in a migration unless the manifest's round says so: the wave moves the argument, it does not re-argue it.

**Registration, three lines you may edit for YOUR board id only** (declared as exceptions in the Handoff;
the Orchestrator resolves the adjacent-line merges): `sandbox/registry.ts` (import the spec, add it to
`BOARDS` in the list's existing order), `(shell)/lab/boards.ts` (drop `legacy: true` on your entry),
`src/components/lab/kit-discipline.test.ts` (delete your id from `LEGACY`). Nothing else outside your
lane; a shared-file change is asked for in the Handoff with the exact patch.

**Verify.** The board on your dev server at 1440 and 375, light and dark, reduced motion honoured: the
answer block first with the ask pills linking under the dock; every section anchored and in the dock's
Sections menu; arguments and pastes collapsed; the walk's steps set the dock and land on their section; a
copied link reopens the same canvas, candidate and section; the review panel's copied message parses with
`pnpm lab:review '<line>'` against a SCRATCH copy of `docs/reviews/` (never commit a ledger); `/design/lab`
queues the board's open asks; the gate green (typecheck, lint, test, build) and `pnpm lab:smoke --base
http://localhost:<your port>` green. Light QA (Will, 2026-09-14): a lab-only round verifies its board and
moves on; the red-team belongs to the wiring round. Push freely (no CI on `lp/*`); the preview builds at
`status: handed-off`.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Never edit another track's files, `touchpoints.ts`, `rules/bible.ts`,
CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md` or
`docs/reviews/`. No em-dashes and no `font-mono` anywhere a person reads.

**Verify on.** `/design/lab/river-visual` on your dev server at 1440 and 375, light and dark, reduced motion;
`/design/lab` shows the board's open asks; the gate and `pnpm lab:smoke` green.


## Round 1 (Will's ruling, 2026-09-15)

**The global notes, which bind every board this round** (Will, 2026-09-15, after a scroll through every
board on launch-prep): (a) **Page-wide controls always on screen.** "For any pagewide configs, the GUI
control should be fixed so that variants can be toggled on different previews anywhere on the page for
better back-and-forth comparisons. Having to scroll back to the top makes it very hard to review
differences." The shell now ships `BoardDock` (`src/components/dev/board/dock.tsx`, exported from
`@/components/dev/board`; the floating board's sticky bar, generalised: it sticks from `sm` up, writes its
height to `scroll-padding-top` so anchors land under it, and carries the shell's Fit/1:1, Sidebar and Desk
controls). Put every switch that changes the whole page in it (the candidate, the ground, the canvas, the
ramp, Replay, Apply to the site); a control that changes one specimen stays beside that specimen. (b)
**Pixel-perfect previews.** "The iFrame previews throw off anything related to size, making those reviews
particularly difficult. This needs to be fixed for pixel-perfect lab demos/previews." Every `Stage` now
renders at 1:1 by default (the lab preference in `lab-prefs.ts`; the board page lifts its max-width and
tucks the sidebar away so a 1440 canvas has its room; "Fit" keeps the old zoom for a glance at the whole).
Never zoom, scale or transform a specimen whose size is being judged; anything you render inside an iframe
renders at true pixels; if a 1440 canvas needs sideways scroll on a narrower window, that is correct. (c)
**More real UI.** Will wants live production components and whole real pages as the preview surfaces
("I'd love to see more UI examples for comparison, especially if they can be live production components";
"more UI to preview the variations on"), not a screen of specimens. (d) **The app's UI is open.** "The app
is functionally great, but UI design lags far behind the design work we've been doing for the marketing
site... any UI that touches App in an active lab track may be worked on before the dedicated app agents get
to it later." So where your board shows an app surface, you may redesign it (rising tides, bible 22), in
the lab, as a candidate. (e) **Vercel is capped** (the free plan's 100 deployments per trailing day, hit at
23:31 on the 14th; the window frees through the afternoon of the 15th): push, but verify on a local
production build or dev server at 1440 and 375 in a foreground tab, and say so in the Handoff. (f) The
record: "Handoff (round 4)" and "Record (round 4)" below; the Record is the paragraph the CHANGELOG carries
for round 4, so write it as what the board became and why.

**Will's ruling, verbatim.** "4 can be killed as a hero, but the river animation could be streamlined to
drop down in one flow rather than two, and saved to our lab design bank to hopefully use another time as a
feature visual rather than hero. This would be a cool, smaller alternative presentation of the images
emanating from the QR code versus the 1 or 2."

**Goal.** The river as a feature visual, kept in the lab's bank. Your lane is seeded with the river as it
left the home hero board (`river.tsx`, `river.css`, moved here whole; read `docs/tracks/hero-river.md` for
its three rounds of notes): the album pouring down out of the code, the fan over the first third of the
fall, the banks opening around the lockup's ink. (1) **One flow.** Streamline it to a single stream
dropping down out of the code (no two banks, no clearing profile for a headline), the frames straightening
as they land, the cadence dividing the flight, the loop cut by a frame's top edge. (2) **A feature visual,
not a hero.** Size it as a section-scale component: a card or a column a feature page could place beside
copy (a "how it works" step, a feature card's media slot, the guest page's empty state), shown at three
sizes (a 560 px column, a 400 px card, a 240 px thumbnail) on cinema and paper, at 1440 and 375, reduced
motion as the settled stream, the code optional (a prop: the real demo code, or a plain origin plate). (3)
**Bank it.** The board presents it as a saved visual: what it is, where it could be used (three real
placements on real pages, composed on the production section shells), its props and its cost (frame time,
layer count, measured), and the paste to mount it. (4) The board composes the shell (`Stage` at 1:1,
`Toggle`, `BoardDock` for the size, the ground, the canvas and Replay, `BoardMeta` with the asks); it is
registered on the desk as `river-visual`; keyframes and classes keep the `hhv-` prefix or move to `rvr-`
(say which). The asks: where Will would place it first, and the code in or out.

**The contract.** Your board is `sandbox/river-visual/board.tsx`, exporting `RiverVisualBoard` and importing
`./board.css`; it is registered on the desk as `river-visual` (`touchpoints.ts`, the Orchestrator's; its
placeholder variants are renamed at integration from your Handoff). Compose the shell from
`@/components/dev/board`: `Stage` at 1:1 on cinema and paper, `Toggle`, `BoardDock` for the page-wide
switches, `BoardMeta` for the question, the candidates, the asks, the departures and the assets. The seed
in your lane (`river.tsx`, `river.css`) is the river as it left the home-hero board, imports fixed to
`../home-hero/shared`; keep it, cut it or rewrite it, it is yours. Keyframes and classes under `hhv-` or
`rvr-` (say which). Production section shells are composed, never edited.

**Rulings in force.** The bible on `/design/library/rules` (second edition): 1, 12 (animate by frequency: a feature
visual is occasional, not a hero), 13, 14, 21, 22. The media manifest is the only source of paths (18).

**Verify on.** `/design/lab/river-visual?key=` on a local production build at 1440 and 375, reduced motion,
the gate; the preview alias once Vercel's window frees.

### Binds (every track)

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Shell changes are asked for in the Handoff and announced in
`docs/tracks/orchestrator.md`; never edit `src/components/dev/`, `src/components/lab/`,
`touchpoints.ts`, `rules/bible.ts`, another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM,
CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/`. Light QA (Will,
2026-09-14): the board at 1440 and 375 in a foreground tab, reduced motion honoured, the gate green
on the synced tree.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **none.** No production byte moved, and no owned fact belongs in a system doc while the visual is a
  lab candidate Will has not placed.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing (the wiring round, if the river is placed): the visual moves whole from
  `sandbox/river-visual/river.tsx` to `src/components/marketing/system/river-visual.tsx` with its sheet,
  and swaps the lab's `[data-paused]` ancestor read for `useAmbientPause` (which also pauses off screen,
  and an ambient loop below the fold is exactly what that hook exists for). Nothing else about the file
  changes: it imports only the media manifest, FooterQr, Caption and the reduced-motion hook.
- Marketing: a fluid wrapper for the visual, if a placement wants one. It takes `width` and `height` in px
  today, which is deterministic, hydration safe and zoom proof and is what let the board judge it at 1:1;
  a container query wrapper that feeds it the numbers its slot actually has is the production ergonomic,
  and it is a wrapper rather than a change to the visual.

## Handoff (round 1)

- **Head: this commit**, on top of `4245d07` (the `launch-prep` merge). The round's last commit of CODE
  is **`8cf5a3a`**, and the code is four commits: `ce614c5` built the visual and the board, `2b92747`
  is the retune the browser forced (below), `74f1b73` is the FIRST review fix (the scan floor, two
  bullets down), and **`8cf5a3a` is the SECOND** (the placements draw the widths the asks name, the
  bullet under this one). Pushed to `lp/river-visual`.
  **Marker for this round: `rvr-oneflow`**, the second class on every instance's root, which exists in
  no earlier round of anything (the seed rendered `hhv-delta`, the hero's). One line tells you which
  build an alias is serving:
  `curl -s "<url>/design/lab/river-visual?key=" | grep -o rvr-oneflow | wc -l` returns **6** on this
  round, where `hhv-delta` returns 0. (`grep -c` counts matching LINES and the page is one line, so it
  answers 1 for either: round one's handoff said `grep -c`, which is why this says `grep -o | wc -l`.)

- **THE SECOND REVIEW FIX, `8cf5a3a`: two figures the board asked Will to rule on that nothing on it
  drew.** Same shape as the scan floor, one pass later, and both are now read off the thing that
  renders rather than typed beside it.
  - **(a) THE COLUMN: the ask said 560, the section drew 460.** Ask one, the bank card and this
    manifest all call the first placement "the how it works column (560, the strongest of the three)",
    while `StepPlacement` drew `460` at 1440, a number that appeared exactly once in the file and in no
    caption; its sibling parenthetical, the doors row's 330, WAS the rendered figure, so the sentence
    read as if both were in situ. The placement now takes **the bank's own column size**, through the
    same `bankWidth("column", mode)` the specimen row uses: **560 at 1440 and 343 at 375**, identical
    to the bank row's first specimen (both measured 560 by 739 in the DOM, on one clock). The section
    absorbs it: `Container` gives 1216 px at 1440, so the step list keeps the **616** the visual
    leaves, which is a better measure than the 716 it had. The placement now carries a caption naming
    its width the way the doors row always did, and it prints **what it drew** ("the bank's column size
    (560 here)"), so it is true on both canvases. Ask one is unchanged and did not need rewriting: the
    board draws its numbers now.
  - **(b) THE GUEST A/B VANISHED AT 375.** `EmptyStatePlacement` rendered the real `GalleryEmptyState`
    only when `mode === "desktop"`, while its caption said "Today on the left, the flow on the right"
    on both canvases, so at Phone 375 Will read a sentence about two columns over one column and **ask
    three (may an empty album show photographs at all) had no evidence on the canvas most guests are
    on**. Both halves render on **both** canvases now: side by side at 1440, **stacked at 375**, where
    two of them cannot share a row. The width is no longer picked either. The guest page clamps at
    `max-w-2xl` with `px-5` gutters (`event-experience.tsx`), so its gallery is **the canvas or 672,
    whichever is smaller, less the two gutters**, read off the shell's own exported `CANVAS` so it
    cannot drift from the stage: **632 at 1440 and 335 at 375**, where the old hand-picked 340 was the
    guest column at no window at all. The A/B is bigger and truer for it, and the caption prints the
    number the canvas drew. The phone canvas also keeps the guest page's own 20 px gutter rather than
    the board's 24, so the column is not squeezed by a padding the real screen does not have.
  - **Two collateral corrections in the same file.** The doors caption printed a fixed "(330)" while
    the phone canvas draws **311**, which is the same defect one size down; it prints `{w}` now. And
    the bank card's "Where it could go" states ONCE that its parentheses are the 1440 numbers and that
    every placement below prints the one it actually drew, so the entry can name a banked size without
    the reader having to guess which canvas it belongs to.
  - **The two stage heights follow the content, measured rather than guessed**: the step stage is
    **1200 / 1400** (content 1187 / 1391) and the empty state **840 / 1060** (content 828 / 1030).
    Worth recording: the step placement was **already clipped at the phone canvas before this pass**
    (content ~1330 in a 1180 stage, which `overflow-hidden` hid), so the bigger column cost nothing and
    fixed something.
  - **How it was verified: a local PRODUCTION build at 1440 and 375, in a FOREGROUND tab.** `pnpm
    build` then `pnpm start` on **:3182** in the worktree, driven through the Browser pane at
    `/design/lab/river-visual?key=`, every reading taken with `document.visibilityState` asserted
    "visible" and `[data-paused]` at 0 in the same call. **No stage clips on either canvas** (858/860,
    1187/1200, 738/760, 828/840 at 1440; 1638/1640, 1391/1400, 1516/1560, 1030/1060 at 375, with no
    horizontal overflow). The six instances measure **560, 400, 240, 560, 330, 632** at 1440 and
    **343, 280, 160, 343, 311, 335** at 375, and the A/B's two halves measure 335 by 363 each, stacked,
    at the phone canvas. Every code still measures **3.0 px a module or better off the value drawn**
    (123 over a span of 41 where the demo URL is passed, 99 over 33 where it is not, and 126 over 33 in
    the 632 empty state, where the fifth-of-the-box share is larger than the floor). The cost meter
    still reads **8.3 ms median frame gap, about 120 fps** with all six mounted, and the reduced-motion
    resolution (27 `no-preference` blocks deleted from the running sheets, the stages paused, only
    `transform` and `opacity` cleared) still stands **68 of the 72 cards at `--rvr-rest`** with the
    four past the dissolve's last stop held at 0: the numbers the first fix recorded, unmoved by bigger
    boxes, because every one of them is derived from the box. **The Vercel API was not called and no
    preview was waited on** (the daily cap).
  - **Nothing else moved.** One file changed, `board.tsx`; `river.tsx` and both sheets are untouched,
    so the visual, its geometry, its scan floor and its reduced-motion state are bit-identical to the
    build the first fix verified.

- **THE REVIEW FIX, `74f1b73`: the scan floor was wrong by the board's own arithmetic, and ask two
  rested on it.** `FooterQr` draws its code over a viewBox of the module count PLUS its 8 quiet-zone
  modules, so the px a module gets is `size / span` and not `size / count`. The demo URL is 33 modules,
  span 41, so the typed `QR_FLOOR = 96` gave it **2.34 px a module against the 3 px floor the same
  comment cited**, and no banked size cleared it (the 560 column drew 112, and the 400 card and the 240
  thumbnail both clamped to 96). The floor is now **measured off the value being drawn** (one
  `qrcode-generator` pass in `riverQrReadout`, `river.tsx`), so the demo URL clamps at **123 px** and a
  placement that passes no demo URL, whose string is shorter, clamps at **99**. Verified on the served
  HTML and again in the live DOM: every `<svg>` on the page is `123` over a span of `41` or `99` over
  `33`, which is **exactly 3.0 px a module** in all six instances.
  - **The consequence is printed now, not claimed.** Every specimen's caption reads the code's real
    numbers off the same function: "Code 123 px, 3.0 px a module, plate 26 / 36 / 60 percent of the
    box" at 560 / 400 / 240, and 42 / 51 / **89** percent at the phone canvas's 343 / 280 / 160. A
    scannable demo code is 123 px whatever the box is, so the small sizes pay for it in composition
    rather than in legibility, and that is the second ask stated in a number. Ask two and the
    scan-floor departure are both restated on this arithmetic.
  - **Two defects the same pass turned up and fixed.** (a) The plain plate rendered as a **bare 20 px
    square**: its field was derived only for `origin="code"`, so `geo.qr` was 0 for the plate and only
    the plate's padding survived. It is a fifth of the box at every size now (112 / 80 / 48 in the bank
    row, confirmed in the DOM), which is also the honest picture of the second ask, since taking the
    code out takes the scan floor out with it. (b) The plate's printed line was held to
    `qr + PLATE_PAD`, which made the plate 153 px wide where the derived share said 143; the line is
    held to the code's own width now, so the plate is exactly the field plus its padding at every size
    and the printed share is the rendered one.
- **The preview alias was not waited on and the Vercel API was not called**, per the round's
  instruction: the free plan's 100 deployments per trailing day were spent at 23:31 on the 14th and the
  window frees through the afternoon of the 15th, so a push is an entry in a race for a slot and not a
  deploy. `partyreel-git-lp-river-visual-partyreel.vercel.app` serves this head the moment a push from
  this branch wins one; until then the board is the local build below.
- **How the REVIEW FIX was verified: a local PRODUCTION build at 1440 and 375, in a FOREGROUND tab.**
  `pnpm build` then `pnpm start` on **:3172** in the worktree (round one's loop was `pnpm dev`), driven
  through the Browser pane at `/design/lab/river-visual?key=`, at **Desktop 1440 and Phone 375**, on
  **cinema and paper**, through **all three origins**, across the bank row and all three placements,
  with `document.visibilityState` asserted "visible" and `[data-paused]` at 0 in the same call as every
  reading. The preview alias was again not waited on and the Vercel API was not called. Read off the
  live DOM rather than a screenshot: every code is 123 px over a span of 41 or 99 over 33 (3.0 px a
  module), every code plate is exactly **143** or **119** px wide, the plain plate is **112 / 80 / 48**
  across the bank row, and the three captions print 26 / 36 / 60 percent at 1440 and 42 / 51 / 89 at
  375. Reduced motion was resolved as below and the rest state holds: **68 of the 72 cards stand at
  `--rvr-rest`**, the four held at 0 being the ones whose top edge is already past the dissolve's last
  stop (which four depends on the box, so this is 68 where round one, with a smaller object, counted
  66). The cost meter still reads **8.3 ms median frame gap, about 120 fps** with all six instances
  mounted.
- **How the board was verified: a local server at 1440 and 375, in a FOREGROUND tab, with the loops
  running.** `pnpm dev` on :3171 in the worktree for the build-and-look loop and `pnpm build` for the
  gate. Driven through the Browser pane at `/design/lab/river-visual?key=`, at **Desktop 1440 and Phone
  375**, on **cinema and paper**, through **all three origins** (the demo code, the plain plate, no
  object), with Replay, plus the reduced-motion resolution below. Every reading was taken with
  `document.visibilityState` asserted "visible" and `[data-paused]` at 0 in the same call.
  **Three tooling facts, because each cost this round time and any one of them turns a look into a
  fiction:**
  - ★ **A board's loops stop in a tab that is not FRONTED, and the screenshot comes back solid black**
    while the DOM is perfectly correct (`docs/systems/testing-verification.md`). Worse in a wave: the
    Browser pane is SHARED between the sessions running tonight, so a tab that was fronted stops being
    fronted when another track fronts its own, and one of them navigated this track's tab to its own
    port mid-review. Every black screenshot here was that and not the board: the fix is
    `tabs_select` on your own tab (and a tab of your own, created late) immediately before each batch,
    and the tell is that `document.visibilityState` reads "hidden" or the stages carry `data-paused`
    while the markup is right.
  - **Reduced motion was resolved rather than emulated.** The pane cannot set the preference, so the
    reader's own resolution was reproduced on the live page: all **27 `no-preference` blocks were
    deleted from the running sheets** (which is exactly what such a reader resolves), the stages were
    given `data-paused` and the inline styles the loop had written were cleared. **11 of the 12 cards
    then stand at `--rvr-rest` and the 12th is held at 0** by the dead line, which is what the markup
    itself computes (`--rvr-rest-o` is written "0" for a card whose top edge is already past the
    dissolve's last stop). The rest state is therefore one INSTANT of the running stream and cannot
    drift from it.
  - ★ **Resolving that reader by clearing a card's WHOLE `style` attribute blanks the stage**, and
    the blank is the emulation, not the board: the `--rvr-rest` and `--rvr-rest-o` the rest state is
    written in are inline custom properties on the same element, so wiping the attribute deletes the
    state you were trying to see. Clear the two properties the loop writes, `transform` and `opacity`,
    and nothing else. (Found while re-verifying the review fix.)
- **What the browser changed, and what it cost to find.** The first build was measured at 1440 before it
  was judged, and it was wrong twice, both times in a way a screenshot flatters:
  - **Gravity.** The hero weighted the fall 60 percent quadratic, which is right under a code at the top
    of a 930px viewport and wrong in a box: six of the twelve frames sat in the first 200px, where the
    plate hides them, and the rest of the column was sparse. At **38/62** ten of the twelve are on
    screen, and a frame still leaves the object slowly and is still twice as quick at the bottom.
  - **Scale and fan.** At a third of the box width the twelve frames read as a scatter of small pictures
    with holes between them. At **0.40 of the width**, with the fan narrowed to **0.20**, consecutive
    frames overlap both vertically and laterally and the flow reads as one braid.
  - **The dissolve.** It ended at 97 percent of the height, which left a dead band inside a box somebody
    else's layout gave us. It now runs to the **bottom edge**, and the fall over travels it by 26
    percent so a card still only recycles once no part of it can be seen (the cut lands at progress
    0.93 against a 0.965 ceiling, so under half a card is off screen at any moment).
  - **The plain plate was invisible on paper** at oklch(0.955) against a white card: not a quiet object,
    a missing one. It is 0.915 now.
- **The cost, measured on the page carrying every instance at once.** The board mounts **six** instances
  (three specimens and one per placement), five more than any real page would: **8.3 ms median frame
  gap, about 120 frames per second** at 1440 on this machine, read off a rolling 180 sample window by
  the meter in the bank card (which writes to a DOM node twice a second rather than re-rendering, so it
  is not measuring itself). Per instance, derived and not claimed: **12 frames, 14 promoted layers, 39
  DOM nodes, 12 transform writes per frame** and an opacity write only when it changed, which at rest
  is none.
- Synced with `launch-prep` once, at **`6484558`** (2 commits: the app UI ruling in PROGRAM.md and the
  round-four In flight rows), merged at **`4245d07`**. No conflicts. Neither commit touches a file this
  track reads or owns: both are docs.
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors; **6 warnings,
  every one pre-existing and none in this lane**, on `contact-form.tsx`, `album-fill-grid.tsx`,
  `review-switch.tsx`, `jobs.ts` and `use-flip.ts`), test ok (**1804 in 199 files**), build ok
  (**248 static pages**). **Re-run green after the review fix**, at the same four numbers.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/river-visual.md`,
  `src/app/(dev)/design/sandbox/river-visual/board.css`,
  `src/app/(dev)/design/sandbox/river-visual/board.tsx`,
  `src/app/(dev)/design/sandbox/river-visual/river.css`,
  `src/app/(dev)/design/sandbox/river-visual/river.tsx`. **No exceptions**: the owned directory and this
  manifest.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte moved.
- **One finding OUTSIDE this lane, reported and not touched.** `src/components/marketing/chrome/footer-qr.tsx`
  carries the same arithmetic slip its copy in `river.tsx` did: its comment says "33 modules gives
  ~4.1px per module at the default size", but the default size is 128 px over a span of **41** modules,
  which is **3.12** px a module (4.1 would be 128 / 31, the count without its quiet zone). The render
  is fine, and 3.12 still clears the 3 px floor the same comment cites, but only just: the production
  footer draws at exactly 128 (`footer-demo.tsx`, `QR_PX`), so any caller that passes a smaller size is
  under the floor. It is a comment in production marketing, not the board shell, so it is left for
  whoever owns that file.
- **Shell changes asked for: none.** The board composes `Stage` (at 1:1, with its own `height` per
  placement), `Toggle`, `BoardDock` and `BoardMeta` as they ship and needs nothing added to them. Two
  notes for whoever owns the shell next, neither a request:
  - The dock is the right answer and this board uses it for all three page-wide switches (the canvas,
    the ground, the origin) plus Replay. Worth knowing: with three toggles and the shell's own controls
    it wraps to two rows at 1440, which is fine, and its measured height still lands in
    `--board-dock-h` correctly.
  - ★ **A Tailwind breakpoint prefix in a BOARD's own markup is a bug at the phone canvas**, because it
    reads the real browser window and not the stage (the shell documents this for the production
    components rendered inside). This board's first draft laid the placements out with `lg:` and `sm:`
    and the 375 stage was a lie on a wide window; every board-authored layout here now keys off the
    `mode` prop instead. The production shells inside (SectionShell, Container, Card) still carry their
    own prefixes and are judged as they ship, which is correct and is captioned on the board.
- **Assets requested from Will: two, both already open, neither new.**
  - 24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, framed tight enough to
    read at 110 px, which is the size a frame is as it leaves the object in the 560 column · ASSETS row
    2, unchanged, and the same row the media kit's call sheet asks for · replaces the 12 landscape
    stand-ins and retires the per-frame crop table in `river.tsx`.
  - 12 event photographs as 4:5 portraits, 720 x 900, one grade, from the same shoot · ASSETS row 12,
    unchanged · replaces the portrait cards (`wf` 0.8), which are cropped out of landscapes today.
  - Nothing else is a picture. This visual asks for **no count, no video and no shell prop**: it is
    twelve photographs, one plate and one clock, which is the point of banking it.
- **The asks, verbatim from BoardMeta** (the Orchestrator quotes these under Waiting on Will):
  - "Where it goes first: the how it works column on a feature page (560, the strongest of the three),
    the doors row card slot (330, the hardest), or the guest album's empty state (the app surface,
    ghosted)."
  - "The code, in or out. In, it is a scannable CTA inside a section visual and every placement inherits
    a second call to action, at a fixed price: the demo code is scannable from 123 px and no smaller,
    whatever the box is, so its printed card is a quarter of the 560 column, a third of the 400 card and
    three fifths of the 240 thumbnail. Out, the plain plate is a white card with a faint field in it,
    sized by the composition rather than by a camera, which is quieter and says less."
  - "Whether an empty album may show photographs at all. The candidate ghosts the flow at production's
    own mosaic treatment for exactly that reason, and the honest alternative is that the guest's empty
    state carries no picture of other people's events."
  - "The proportion: 1.32 is the visual's default and the only number in it that is taste rather than
    derivation."
- **Look at first:** the bank row at Desktop 1440 on cinema, with the dock's Origin flipped from the
  demo code to no object and back. Read the thumbnail's caption while you do it: it prints **60 percent
  of the box** for the code's card at 240, and 89 on the phone canvas, which is the second ask in one
  line and the reason the small sizes are the ones that argue. That one flip is the whole second ask, and it is the comparison the
  dock exists to make: the code turns a section visual into a second CTA, and without it the flow is
  just the album arriving. Then the same flip on the doors row (paper), where the object eats a third
  of a 330 by 238 card slot, and on the guest empty state, where the code is certainly wrong because
  the guest got there by scanning it. That last stage is the A/B for ask three: today's mosaic beside
  the candidate, both at the width the guest page really gives its gallery (632 at 1440), and both
  still there at Phone 375, stacked, where the row will not fit.
- **The prefix moved and the lane says so:** everything here is `rvr-`, and no `hhv-` name survives in
  this directory. `hhv-` meant "home hero variation" and this is no longer one; keyframe names are
  document global, so the rename also keeps this sheet from shadowing the hero board's if the two ever
  render on one page. Neither sheet declares a keyframe at all now: the whole animation is one rAF loop
  writing transforms, and the only CSS state is the pour's first frame.

## Record (round 1; the CHANGELOG paragraph for round 1, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The river, killed as the home hero, came back as a banked
feature visual. Will's ruling asked for one flow instead of two and a smaller presentation of the images
emanating from the code, so the hero's parity split, its clearing, its held beat and its two hand-typed
geometries were deleted: what is left is one stream fanning out of one printed object, every number derived
from its box, so a 560 column, a 400 card and a 240 thumbnail are one visual at three scales, on constants
that keep instances on a page in step. The frames straighten as they land, the dissolve runs to the bottom
edge rather than stopping short inside somebody else's slot, and the loop is cut by a frame's top edge. The
board banks it: three sizes at 1:1 on cinema and paper, three origins on one dock switch, and three
placements on the production shells they would ship inside, each drawing the width its own ask quotes, the
guest empty state among them as a true A/B against the mosaic it would replace, at the guest page's gallery
width on both canvases. The bank card carries the props, the paste and a live meter reading 8.3 ms with six
mounted. Nothing production moved; the asks are where it goes first and whether the code stays in it.

## Handoff (round 2)

- **Head: this commit**, on top of **`849937f5`**, which is the round's last commit of CODE. The
  round is two code commits: `b8c11ee6` migrated the board onto the kit's template, and `849937f5`
  collapsed the mount's paste (it was passed `lines={9}` against a 9 line block, so the kit's
  `total > lines` was false and it rendered open with no Read all button). Pushed to
  `lp/river-visual`; the preview at `partyreel-git-lp-river-visual-partyreel.vercel.app` builds on
  this `status: handed-off` push.
  **Marker for this round: `data-board="river-visual"`**, the attribute the kit's template writes on
  a migrated board's root and which round one's hand-built board had nowhere. One line tells you
  which build an alias is serving:
  `curl -s "<url>/design/lab/river-visual?key=" | grep -o 'data-board="river-visual"' | wc -l`
  returns **1** on this round and **0** on round one, where the same count of `rvr-oneflow` moved
  from **6** to **7** (the cost section mounts a seventh instance).

- **What the board IS now: two files.** `spec.ts` is the whole argument as pure data (the question,
  the verdict, the four one-word calls, three candidates, five departures, two assets, six sections
  with their ledes and collapsed arguments, four declared controls and a six step walk), and
  `board.tsx` is the evidence per section as a function of the declared state. **No candidate,
  number or recommendation changed**: every ask, candidate, departure and asset is round one's,
  moved out of `BoardMeta`'s prop strings so the template, the desk, the record and the review
  ledger read one list.
  - **The one thing the migration had to make explicit.** Round one's four asks were sentences with
    no recommendation, because `BoardMeta` had nowhere to put one; the kit's `Ask` requires it. Each
    is read off what the board already stood on rather than decided this round: `column` is the
    placement round one called "the strongest of the three", `in` is what the dock, the paste and
    the component's own prop all default to, `ghost` is what the candidate renders, and `keep` is
    1.32, the visual's default. The spec's header comment says exactly this, so a reviewer can see
    that the pills are round one's position and not a new one.

- **Three capabilities the board did not have, each a real gap round one hit.**
  - **REST IS A SWITCH.** `RiverVisual` takes `still`, which stops the loop AND clears the two
    inline properties it wrote. ★ It has to be a PROP and not a sheet rule: the running loop writes
    inline `transform` and `opacity`, which beat any rule a board's sheet could add, and ★ it must
    clear those two properties and never the style attribute, because `--rvr-rest` and
    `--rvr-rest-o` are inline custom properties on the same elements (round one blanked a stage that
    way). `river.css` gains one rule, `.rvr[data-rvr-still] .rvr-card`, written outside the
    media query so the pre-pour frame in the no-preference block cannot hold the cards collapsed for
    a reader looking at Rest who has not asked for less motion; it wins on specificity (0,3,0
    against 0,1,0) rather than on source order. Round one could only reach this state by deleting 27
    `no-preference` blocks out of the live sheets by hand, which is not something a reviewer will do.
  - **THE COST IS PHASED.** Round one's own rolling meter is deleted (it was a function literally
    named `CostMeter`, which the kit owns) for the kit's, with three declared phases: the rest
    floor, one instance, and six at once. ★ The count is MOUNTED rather than revealed, because
    `display: none` does not stop the loop: the rAF callback still writes a transform to every node
    it holds, so a stress phase built by un-hiding five would have measured six in every phase.
    `board.css` carries this board's reading of `data-lab-solo` (it hides the FLOW and not the
    instance, so the plate stays and a reviewer can see what is being measured).
  - **THE STAGES MEASURE THEMSELVES.** Four hand-typed stage heights are gone: every stage is a
    `FitStage`. Round one shipped a clipped step placement at the phone canvas and only found it by
    measuring the DOM two commits later; that class of defect is now unreachable.

- **How it was verified: the dev server on :3412 in this worktree, driven through the Browser pane
  at `/design/lab/river-visual`,** at Desktop 1440 and Phone 375, on cinema and paper, through all
  three origins, Live and Rest, with `document.visibilityState` asserted "visible" and `[data-paused]`
  at 0 in the same call as every reading. Read off the live DOM rather than a screenshot:
  - **Nothing clips and nothing overflows.** All five stages render at 1:1, 1440 or 375 wide, each
    exactly its content plus the kit's 3 px `FIT_SLACK` (1440: 828/825, 1174/1171, 741/738, 802/799,
    391/388; 375: 1248/1245, 1362/1359, 1487/1484, 597/594, 285/282), and the document's
    `scrollWidth` equals its `clientWidth` on both canvases.
  - **Every instance draws round one's number.** 560, 400, 240, 560, 330, 632 and 240 at 1440;
    343, 280, 160, 343, 311, 335 and 160 at 375 (the seventh is the cost row's). Every code is
    123 px over a span of 41 where the demo URL is passed, 99 over 33 where it is not, and 126 over
    33 in the 632 empty state, which is 3.0 px a module or better in all of them: the scan floor
    round one measured, unmoved.
  - **Rest resolves to the running stream's own frame.** All 7 instances carry `data-rvr-still`,
    **79 of the 84 cards stand at their `--rvr-rest` transform** and the 5 past the dissolve's last
    stop are held at 0, with **0 inline transforms left** on the page. A sampled card's computed
    matrix is its `--rvr-rest` string to the digit.
  - **The meter runs and isolates.** Mid-run `data-lab-solo` is `target` and exactly **1 of 12
    flows** is visible, which is the board's sheet doing its job. The three phases read **16.7 ms
    mean, 17.6 to 17.7 longest** on this machine, whose display is 60 Hz (round one's 8.3 ms was a
    120 Hz clock, so the two are the same answer: every frame inside budget). Worth knowing before
    anyone reads the third column as a defect: the "frames over 17 ms" count is 13 of 109 even AT
    REST, where there is no loop at all, because a 16.7 ms cadence straddles a 17 ms threshold.
  - **The template's own promises hold.** Six sections anchored and all six in the dock's Sections
    menu and in the index; the four ask pills link to `column`, `bank`, `guest`, `bank`, which is
    what the spec declares; every argument (3, 2, 2, 3, 2), the wiring note and "How it got here"
    are collapsed; the mount's paste is collapsed behind "Read all 9 lines" and renders in Inter.
  - **The walk executes.** All six steps set the declared state and land on their section
    (`bank` live, `bank` origin=none, `bank` motion=rest, `column`, `card`, `guest` origin=none), and
    a pasted link reopens the state: `?motion=rest` opens at rest, `?canvas=phone` at 375.
  - **The review panel's line parses.** The panel composed
    `review river-visual r2: placement=card; code=out; note: "..."` and
    `node scripts/lab-review.mjs --root <scratch>` recorded all three against a SCRATCH copy of
    `docs/reviews/`. The real ledger was never touched (`git status` clean after).
  - **The desk queues the board.** `/design/lab` lists all four asks under "Waiting on you" with
    their recommended options, and the board page no longer draws the `legacy layout` tag.

- **Two kit findings, both worked around inside this lane and both asked for below with the patch.**
  - ★ **`Compare` in `side` mode splits on a Tailwind prefix.** It lays its two halves out with
    `sm:grid-cols-2`, and a breakpoint prefix inside a `Stage` reads the real BROWSER window rather
    than the canvas (stage.tsx's own landmine), so on a wide window the 375 stage put two 160 px
    columns where a phone has room for one. This is exactly the defect `Specimen`'s `cols` NUMBER
    was designed to avoid, one component over. The board pins one column at the phone canvas from
    its own sheet (`.rvr-onecol > div:first-child`, unlayered so it beats the utility without a
    specificity war), measured at **333 px, one column**, on a 1512 px window.
  - ★ **`Specimen`'s grid cannot hold a row of specimens at different TRUE widths.**
    `repeat(cols, minmax(0,1fr))` is right for equal cells and wrong for the bank row: three equal
    437 px columns inside a 1440 stage cannot hold a 560 specimen, and the only ways to make it fit
    are to shrink it or scale it, both of which the 1:1 law forbids for a thing whose size is being
    judged. The bank row is a flex row of the kit's own `Cell`s until the kit takes content-sized
    columns; `Specimen` IS used where the cells are genuinely equal (the cost row).
  - **One note that is not a request.** A section lands **214 px** down the viewport after a walk
    step or a Sections click, about 117 px below the dock, because `BoardDock` writes
    `scroll-padding-top: 105px` on `<html>` AND `BoardSection` carries
    `scroll-mt-[calc(topbar+dock+12px)]`, and the two ADD. Nothing is hidden and nothing is broken,
    it is just dead headroom. **The light PILOT measures identically (214 px)**, so this is the
    kit's and not this board's, and the wave should not have twelve boards fixing it twelve ways.

- **Shared-file changes asked of the Orchestrator: two, both one-liners in the kit, neither blocking.**
  - `src/components/lab/compare.tsx`: take the canvas the way `Specimen` does rather than reading
    the window. Add `cols?: 1 | 2` and use it when given:
    `className={cn("grid min-w-0 gap-4", cols ? undefined : "grid-cols-1 sm:grid-cols-2")}`, plus
    an inline `gridTemplateColumns` of `repeat(<cols>, minmax(0,1fr))` when `cols` is given. Every
    board inside a `Stage` then passes `cols={mode === "desktop" ? 2 : 1}` and this lane deletes its
    `.rvr-onecol` rule.
  - `src/components/lab/specimen.tsx`: let `cols` be `number | "auto"`, and when `"auto"` set
    an inline `gridTemplateColumns` of `repeat(<child count>, max-content)` (or simply
    `grid-auto-flow: column` with `justify-content: center`). The bank row then becomes a `Specimen`
    like every other row on the wave.
  - **One thing NOT asked for.** The kit's `CostPhase.solo` is `"none" | "target"` and has no
    "measure everything" value; this board does not need one, because its stress case is a COUNT
    inside the measured specimen rather than the rest of the page.

- Synced with `launch-prep`: **not needed. It had not moved** (`git rev-list --count
  HEAD..origin/launch-prep` = 0; the tip is still `1b647d76`, this branch's cut).
- Gates on this tree, each on its own exit code: typecheck ok, lint ok (**0 errors; 6 warnings,
  every one pre-existing and none in this lane**, on `contact-form.tsx`, `album-fill-grid.tsx`,
  `review-switch.tsx`, `jobs.ts` and `use-flip.ts`), test ok (**2140 in 218 files**), build ok
  (**257 static pages**), and `pnpm lab:smoke --base http://localhost:3412` ok (**287 checks, 0
  failing**).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/river-visual.md`,
  `src/app/(dev)/design/(shell)/lab/boards.ts`,
  `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/sandbox/river-visual/board.css`,
  `src/app/(dev)/design/sandbox/river-visual/board.tsx`,
  `src/app/(dev)/design/sandbox/river-visual/river.css`,
  `src/app/(dev)/design/sandbox/river-visual/river.tsx`,
  `src/app/(dev)/design/sandbox/river-visual/spec.ts`,
  `src/components/lab/kit-discipline.test.ts`.
  **Three exceptions, all of them the registration the wave allows for this board's id only**, and
  each is an adjacent-line edit the Orchestrator resolves at the merge: `registry.ts` imports
  `RIVER_VISUAL` and appends it to `BOARDS` in the list's existing order; `boards.ts` drops
  `legacy: true` from the `river-visual` entry; `kit-discipline.test.ts` deletes `"river-visual"`
  from `LEGACY`. Nothing else outside the owned directory and this manifest.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte moved.
- **Assets requested from Will: two, both already open, neither new and neither changed this round.**
  - 24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, framed tight enough
    to read at 110 px, which is the size a frame is as it leaves the object in the 560 column ·
    ASSETS row 2, unchanged, and the same row the media kit's call sheet asks for · replaces the 12
    landscape stand-ins and retires the per-frame crop table in `river.tsx`.
  - 12 event photographs as 4:5 portraits, 720 x 900, one grade, from the same shoot · ASSETS row
    12, unchanged · replaces the portrait cards (`wf` 0.8), which are cropped out of landscapes
    today.
  - Nothing else is a picture. This visual still asks for no count, no video and no shell prop.
- **The asks, verbatim from the spec** (the Orchestrator quotes these under Waiting on Will; each is
  answered in ONE word and the board's own word is first):
  - "Where it goes first" (column, card, guest) · proposed **column** · because the column is the
    only slot tall enough for the whole fall, and the one placement that draws the visual at its
    full banked width. The card slot is the hardest test rather than the best one, and the guest
    album is an app surface that has to ghost it. · overrule if the first placement should be the
    hardest one rather than the strongest.
  - "The code, in or out" (in, out) · proposed **in** · because it is what the album pours out of,
    and a scannable code is a second call to action inside a section visual. The price is fixed: 123
    px of code whatever the box is, so its card is a quarter of the 560 column and three fifths of
    the 240 thumbnail. · overrule: the guest album is the exception either way.
  - "May an empty album show photographs" (ghost, none) · proposed **ghost** · because production
    already made this call for the mosaic it would replace, at grayscale and low alpha, so the
    promise is a thing arriving rather than a grid standing still. · overrule if an empty state may
    carry no picture of other people's events at all, in which case the mosaic goes too.
  - "The box's proportion" (keep, taller, squarer) · proposed **keep** · because 1.32 is the only
    number in the visual that is taste rather than derivation.
- **Look at first:** press **Look first** in the dock and take the six steps. It is round one's walk,
  executable: the bank row at 1440 on cinema, then the SAME row with Origin flipped to no object
  (that one flip is the whole second ask), then the same row at Rest, which is new this round and is
  what a reader who asked for less motion actually gets. Then the recommended column placement, the
  card slot on paper where the object eats a third of a short box, and the guest empty state as a
  true A/B against the mosaic it would replace. Every step sets the dock for you and the link in the
  address bar is shareable at each one.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The river's board moved onto the kit's template
and became two files: a `spec.ts` that is the whole argument as pure data, and a `board.tsx` that is
the evidence per section as a function of the declared state. No candidate, number or recommendation
changed, so the verdict and the four one-word calls a reviewer now meets on the first screen are
round one's, moved out of prop strings into the one list the desk, the record and the review ledger
also read. Three things the board could not do before, it can: the reduced-motion state is a Motion
knob driving the visual's own `still` prop, which stops the loop and clears the two inline properties
it wrote, so a state that took an hour to reproduce by hand is now one shareable link; the cost is
measured in three declared phases, the rest floor, one instance and six, with every other flow on the
board hidden while the meter runs; and four hand-typed stage heights are gone for stages that measure
themselves. The board's own rolling meter, its header, its index and its meta panel are deleted, the
kit's owning all four. Two kit findings are handed back with their patch: `Compare` splits on a
Tailwind prefix inside a stage, and `Specimen` cannot hold a row of specimens at different true widths.
