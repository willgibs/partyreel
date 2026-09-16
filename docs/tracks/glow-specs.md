---
track: glow-specs
status: integrated
cut: "be1638f2"          # round 2, the clarity round, cut from launch-prep
merged: "6c06d85e"      # the branch head merged into launch-prep
cut_round_1: 1b647d76
merged_round_1: "462b7095"
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/sandbox/glow-doctrine/
  - src/app/(dev)/design/sandbox/glow-moments/
  - src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx
  - src/app/(dev)/design/sandbox/glow-moments-variants.tsx
  - src/app/(dev)/design/sandbox/glow-lab-shared.tsx
  - src/app/(dev)/design/sandbox/glow-lab.css
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

# lp/glow-specs

## Round 2 (the clarity round, 2026-09-15): every ask in plain words

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

**These boards.** One ask each, and both are the same procedural question: the light board asks this
same thing (the lit surface; the publish beat's colour), so should it be ruled there or here?
`light | here` become "On the light board, where the same question sits beside the evidence it
needs (recommended)" and "Here, on this board"; `context` says in one sentence what the item is and
that the light board's ask covers it (`light.lit-face`, `light.publish`). The two records stay as
they are.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the board
at 1440 and 375 on a local `pnpm dev` (`/design/lab/glow-doctrine` and `/design/lab/glow-moments`), reduced motion honoured, every evidence
section showing the options' words; the desk's session on this board (`/design/lab?session=glow-doctrine.lit-surface`)
read cold, as a stranger; `pnpm lab:review --dry 'review glow-doctrine r4: <ask>=<option id>'` accepting one
clause per ask. No `[preview]` and no `[ci]` on your pushes: the round's review surface is a local
`pnpm dev` on launch-prep after integration.

**Handoff.** The usual (head SHA, gates, lane check) plus every ask as it now reads (the question and
the option labels, one line each), and any question you could not make plain without new evidence,
with why.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings this track works
under: 2026-09-15 · a question carries its context; an exploration is a catalog; 2026-09-15 · the review
surface.


## Round 1 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The two glow boards get a spec each and render through the template: `sandbox/glow-doctrine/spec.ts` and
`sandbox/glow-moments/spec.ts` with the board's question, its one open ask (from `touchpoints.ts`'s note and
`docs/decisions/design-record.md#glow-doctrine` / `#glow-moments`), the candidates as recorded, and a single
section whose evidence mounts the existing component unchanged (`glow-doctrine-variants.tsx`,
`glow-moments-variants.tsx`); `sandbox/glow-doctrine/board.tsx` and `sandbox/glow-moments/board.tsx` compose
`BoardPage`; the variants files and `glow-lab-shared.tsx` / `glow-lab.css` move under the two directories
if that keeps the lane clean, or stay where they are with the boards importing them. The light board already
holds the doctrine's future (its round-four synthesis), so the two specs say so in `context` and ask only
what is still theirs to ask.

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

**Verify on.** `/design/lab/glow-doctrine` and `/design/lab/glow-moments` on your dev server at 1440 and
375, light and dark, reduced motion; `/design/lab` shows both boards' open asks; the gate and
`pnpm lab:smoke` green.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (round 1)

- Head is the commit carrying this record; the code landed at `2014616f`. Pushed; the preview at
  partyreel-git-lp-glow-specs-partyreel.vercel.app builds on this push (`status: handed-off`).
- Synced with launch-prep at `1b647d76`: it had not moved since the cut (`git rev-list --count
  HEAD..origin/launch-prep` = 0), so no merge was needed.
- Gates on the tree, each on its own exit code: typecheck ok, lint ok (0 errors, the 6 pre-existing
  warnings, none in this lane), test ok (218 files, 2140 tests), build ok (128 routes),
  `pnpm lab:smoke --base http://localhost:3419` ok (285 checks, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/glow-specs.md`, `sandbox/glow-doctrine/{spec.ts,board.tsx}`,
  `sandbox/glow-moments/{spec.ts,board.tsx}`, plus the two registration files,
  `sandbox/registry.ts` (both specs imported, added to `BOARDS` in the sandbox's own order) and
  `(shell)/lab/boards.ts` (the two entries point at the new compositions and drop `legacy: true`).
  **The third registration line was not needed:** `kit-discipline.test.ts`'s `LEGACY` is keyed to a
  sandbox DIRECTORY and these two boards had none, so neither id was ever on it. Nothing else in the
  diff; `glow-lab-shared.tsx` and `glow-lab.css` were not touched at all.
- **The variants files stayed at the sandbox root, deliberately.** Moving them would have broken two
  files outside this lane: `src/components/shared/glow-contract.test.ts:550-551` pins the BorderBeam
  call sites as an exact path list, and `src/components/dev/border-beam-vendor.test.ts:102-103`
  `readFileSync`s both paths (it throws, not fails, if either moves). Three docs cite the same paths
  (`docs/systems/design-system.md:232`, `docs/tracks/light.md:234-235`, `design-record.md:416,429`).
  The boards import `../glow-<board>-variants`; `glow-lab-shared.tsx` and `glow-lab.css` stay for the
  plainer reason that BOTH boards use them.
- Shared-file changes asked of the Orchestrator: **one, optional, in `touchpoints.ts`.** Both boards'
  header now reads "Track: no manifest (a standing board)" and their sidebar badge reads "exploring"
  rather than a round, because `_data/nav.ts:135` and `[board]/page.tsx` both resolve
  `r.board?.tracks ?? [r.id]` and no manifest is named `glow-doctrine` or `glow-moments`. The patch is
  one line inside each of the two `board: { ... }` objects (touchpoints.ts:428 and :443):
  `tracks: ["glow-specs"],`. It is not needed for anything to work; it makes the pair point at the
  manifest that now owns them.
- Assets requested from Will: none (both specs declare `assets: []`, so the meta panel prints "none").
- Look at first: `/design/lab/glow-doctrine` and `/design/lab/glow-moments`. The first screen is the
  whole change: the question, the verdict, and ONE ask each, where there used to be fourteen sections
  with the unruled item halfway down. Then press **Look first** in the dock (it sets the dock's note
  and lands on the section) and check the ask pill's **See it**. The asks are deliberately about WHERE
  each open item closes, not a re-argument: `docs/tracks/orchestrator.md` item 4 already records the
  lit surface and the publish beat's violet as the `light` board's asks, so ruling them twice would
  write two contracts for one shadow and two homes for one beat. `/design/lab` now queues both
  (16 waiting on you, the two at the top of the list).

### Verification walked

- Both boards at 1440 and at 375, dark and light: the answer block first, the ask pill under it with
  its options and its "See it", the index, one anchored section, the review panel, the meta panel and
  a collapsed "How it got here". No horizontal overflow at 375 (`scrollWidth` = 375), no `font-mono`
  anywhere on either page, the argument, the wiring and the history folds all collapsed by default.
- The walk fires on both: the dock shows "Walk 1 of 1" with the step's note and the page lands on the
  section. Note, for the next agent: it only does so in a FRONTED tab, since a background tab throttles
  `scrollIntoView({behavior:"smooth"})` to nothing, which reads exactly like a broken walk. A hidden
  browser pane also returns blank screenshots of a page the DOM says is fully painted. Both are
  tooling, not the product (`docs/systems/testing-verification.md`).
- The review round trip, on a SCRATCH copy of `docs/reviews/` (nothing written into the repo, `git
  status` clean): `pnpm lab:review --dry 'review glow-doctrine r4: lit-surface=light "..."'` and
  `'review glow-moments r4: publish-violet=here; note: "..."'` both parse; the same lines written
  against `--root <scratch>` produced well-formed ledgers; and `lit-surface=maybe` was refused with
  `line 1, column 38: "maybe" is not an option of glow-doctrine.lit-surface (light, here)`.
- Reduced motion: neither new file declares a single animation or transition (a spec is data, a board
  is a two-line composition), so the pages inherit the global guard in `globals.css:862-869` and the
  engine's own, both unchanged. The 17 animated elements inside each board are the unchanged
  component's lamps, which the board's own section 07 is the instrument for.

## Record (round 1; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The two glow boards joined the migration wave and
now render through the kit's template: `sandbox/glow-doctrine/` and `sandbox/glow-moments/` each got a
`spec.ts` carrying the question, the round and its history, the verdict, the candidates as recorded
(the six shapes, the thirteen placements), the departures and one section, plus a `board.tsx` that
composes `BoardPage` with that section's evidence mounting the existing variants component unchanged.
Both rounds were settled but for one line each, so the wave moved the argument and not the furniture:
no law, shape, placement, number or verdict changed. Each board now asks exactly one thing, and asks
it as a question of WHERE it closes rather than as a re-argument, because the orchestrator's record
already carries the lit surface carve-out and the publish beat's violet as the `light` board's asks;
the answer block says so. The variants files and the boards' shared sheet stayed at the sandbox root,
since `glow-contract.test.ts` and `border-beam-vendor.test.ts` read them by their exact paths;
`/design/lab` now queues both open asks.
## Handoff (round 2)

- Head is the commit carrying this record; the code landed at `9579da76` and the merge of
  `launch-prep` at `ad51514b`. Pushed. **No preview** (`preview: false`, and no `[preview]` or `[ci]`
  on any commit): the round's review surface is a local `pnpm dev` on `launch-prep` after integration.
- Synced with `origin/launch-prep` at `2eed7cb6` (it had moved by one commit since the cut at
  `d5f0c3c9`; docs only, and none of it inside this lane), merged not rebased, and the gate re-run on
  the merged tree.
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors, the 6
  pre-existing warnings, none in this lane), test ok (218 files, 2152 tests), build ok (129 routes).
  `pnpm lab:smoke --base http://localhost:3427` ok (324 checks, 0 failing). `pnpm format` reported all
  three changed files already clean.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `sandbox/glow-doctrine/spec.ts`,
  `sandbox/glow-moments/spec.ts` and `sandbox/registry.test.ts`. **The third is the one exception the
  brief names**: both glow lines (`glow-doctrine`, `glow-moments`) deleted from `PLAIN`, nothing else
  in that file touched. The two `board.tsx` compositions, the two variants files and `glow-lab-shared`
  / `glow-lab.css` were not touched at all: this round is data only.

### Every ask, as it now reads

- **glow-doctrine `lit-surface`** (evidence: the one record section). "Where should the exception that
  lets a lit card carry a shadow in dark mode be ruled?" Options: **On the light board** (`light`, the
  board's pick) | **Here, on this board** (`here`).
- **glow-moments `publish-violet`** (evidence: the one record section). "Where should the colour of the
  flourish that fires when a host publishes be ruled?" Options: **On the light board** (`light`, the
  board's pick) | **Here, on this board** (`here`).

Both now carry `context` (what a lit card is; what the publish flourish is, and that the light board's
own ask covers it) and `look` (the item numbered 05 / 07 inside the one evidence section, and the
specimens by their on-screen names: Dressed beside Today, Sampled spill beside Today). The ask and
option ids are UNCHANGED, so every answer already in the ledger still joins.

### What could not be made plainer, and why

- Nothing was left unclear, and nothing was split or removed: each board has one ask and it decides a
  real thing (which board closes the item), so rule 1's split/add/remove cases did not arise.
- **Rule 2 (the evidence carries the options' names) has nothing to bite on here, by construction.**
  Both asks are PROCEDURAL: the options are two places to rule, not two things to look at, so there is
  no `Cell`, `Compare` column or frame caption that could wear "On the light board". `look` instead
  points at the specimens the ITEM is about, which keep their own names (Dressed / Today at item 05;
  Sampled spill / Today at item 07). Neither board declares any `controls`, so no ask carries `state`
  or `control` either, and the registry test would reject one that did. This is written into both
  specs as a ★ comment so the next agent does not read the absence as an omission.
- One consequence of the density limits worth knowing: `glow-doctrine`'s board question had to drop
  "in dark" from its closing clause to fit `LIMITS.question` (200) with the two glosses in it. The
  dark-mode detail survives in the verdict, the ask question and the ask context, which are where a
  reviewer decides.

### Verification walked

- Both boards on a local dev server (`PORT=3427`) at 1440 and at 375: the answer block first (the
  question, the verdict, what would change it, the round line), then the ask card with its question,
  its two labelled pills (the recommended one filled), its because and its overrule; then the index
  and the one anchored section, whose header restates the ask with the same labels. No horizontal
  overflow at 375 (`document.documentElement.scrollWidth` = 375 on both) and no `font-mono` anywhere.
- The desk read cold, as a stranger: `/design/lab?session=glow-doctrine.lit-surface` and
  `?session=glow-moments.publish-violet` both render the question, the context paragraph, "Where to
  look", the evidence link, the two options each with its `means` line, the board's pick, the because,
  the overrule and the "This question is not clear to me" answer. Both boards' asks are in the queue.
- The review round trip, dry: `pnpm lab:review --dry 'review glow-doctrine r4: lit-surface=light "..."'`
  and `'review glow-moments r4: publish-violet=here; note: "..."'` both parse, so the reworded labels
  did not orphan the ids. `lit-surface=maybe` is still refused with `"maybe" is not an option of
  glow-doctrine.lit-surface (light, here)`, and `publish-violet=?` is refused until a note says what
  was unclear. Nothing was written to `docs/reviews/`; `git status` is clean.
- Reduced motion: this round adds no animation or transition of any kind (a spec is data, and neither
  `board.tsx` was touched), so both pages still inherit the global guard in `globals.css` and the
  engine's own, exactly as round 1 verified them.
- Kit needs (`src/components/lab/` is not this track's): **none.** The `Ask` shape carried everything
  these two asks needed. Assets requested from Will: **none** (both specs still declare `assets: []`).

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Both glow boards joined the clarity round: each had
exactly one ask and each asked it as a label with two bare tokens ("The lit surface carve-out",
`light | here`), which is the shape Will could not answer on the light board. Both are now real
questions that carry their own context, so a stranger can answer them on the desk or on the review
card without opening the board: what a lit card is and what the publish flourish is, where to look
(items 05 and 07 inside each board's one evidence section, and the specimens by their on-screen names),
and each answer labelled in words with what picking it would do. The board question, the verdict and
the section lede followed into the same plain words, and both boards left the registry's clarity
ratchet (`PLAIN`), which now checks their shape. The ask and option ids were untouched, so the review
ledger still joins; no candidate, number, placement, verdict or recommendation moved, and neither
evidence component was touched. Both asks are procedural (which board closes the item), so there was
no specimen to relabel with an option's name.
