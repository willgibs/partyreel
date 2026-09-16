---
track: home-hero
status: integrated
cut: "be1638f2"          # round 6, the clarity round, cut from launch-prep
merged: "e438aa4d"      # the branch head merged into launch-prep
cut_round_4: "260c015"
merged_round_5: "6a75fcc1"
cut_round_5: "1b647d76"  # the round-5 branch is a fresh cut: the old one was deleted at its integration
merged_round_1: "393bacc"
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/sandbox/home-hero/
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

# lp/home-hero

## Round 6 (the clarity round, 2026-09-15): every ask in plain words

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

**This board.** Four asks. `source | scan | inflow` are the three hero concepts: label each by what
it shows (the album branching out of the code; the guest whose scan causes it; the album closing
into the code) and gloss "the source" in `context`; the `candidate` control carries an extra `all`,
so either wire `control` with `all` dropped or leave it unset. `ruled | proposed` (the headline: the
site thesis or each concept's own line) mirrors the `copy` control exactly: wire it. `centred | left`
and `keep | cut` (the live count: a stand-in number that must not ship as invented data) need the
sentence that says what each does.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the board
at 1440 and 375 on a local `pnpm dev` (`/design/lab/home-hero`), reduced motion honoured, every evidence
section showing the options' words; the desk's session on this board (`/design/lab?session=home-hero.direction`)
read cold, as a stranger; `pnpm lab:review --dry 'review home-hero r5: <ask>=<option id>'` accepting one
clause per ask. No `[preview]` and no `[ci]` on your pushes: the round's review surface is a local
`pnpm dev` on launch-prep after integration.

**Handoff.** The usual (head SHA, gates, lane check) plus every ask as it now reads (the question and
the option labels, one line each), and any question you could not make plain without new evidence,
with why.

**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's rulings this track works
under: 2026-09-15 · a question carries its context; an exploration is a catalog; 2026-09-15 · the review
surface.


## Round 5 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The home hero board onto the kit: the source, the scan and the inflow as `candidates`, each carrying the
Concept contract's copy proposal (`proposed: {eyebrow, h1, subhead, secondary}`); the concept switch is a
declared control so a link opens the exact concept; `ConceptCard` from the kit replaces the board's
`Variant` and `ConceptMeta`; each concept's `render` stays as it is (the engines are the work of three
tracks and are not re-argued here); the assets the three concepts ask for ride `assets` with their
`row` numbers from docs/ASSETS.md; the shared pieces in `sandbox/home-hero/shared.tsx` shrink to what the
kit does not provide.

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

**Verify on.** `/design/lab/home-hero` on your dev server at 1440 and 375, light and dark, reduced motion;
`/design/lab` shows the board's open asks; the gate and `pnpm lab:smoke` green.


**Goal.** The full home hero redesign, as its own focus round (Will, 2026-09-01: "I'd love a full
home hero redesign"; 2026-09-11 and 2026-09-12: its own agent round, cut alongside `design-gallery`).
A design problem, not a lighting one: boards in the lab first (a `home-hero` ruling with a `board` in
`touchpoints.ts`, its variants under `sandbox/`, dispatched from `c/[touchpoint]/page.tsx`), Will's
rulings on the boards, then the wiring into `cinema-hero.tsx`. Take the big swing: a totally
different, better hero beats a safe increment, and the only law is the bible plus the hero's
contracts (`page-hero-contract.test.ts`, `marketing-h1-policy.test.ts`: the h1 on the ladder, never
gated, at paint).

**Rulings in force.** The bible on `/design/library/rules` (22 rules, Will's). The hero stays UNLIT until a
board rules otherwise (the wall is the ground, not a source). The thesis line and the primary CTA are
ruled copy (`marketing-voice.ts`); the two provisional home headers stay provisional. Boards leave the
sandbox when their ruling lands; the record goes to `docs/decisions/design-record.md`.

**Verify on.** partyreel-git-lp-home-hero-partyreel.vercel.app: the boards on `/design/lab/home-hero?key=`,
then the home at 1440 and 375 with the h1 at opacity 1 at paint, reduced motion included.

**Lane exception, ruled.** `src/app/(dev)/design/rules/rules.generated.json` is generated: a push that
adds a specimen, a component file or a contract regenerates it with `pnpm design:rules` (the
freshness guard says so) and the lane check accepts the file.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. No `docs/systems/*.md` line changed: nothing shipped to a production surface, so no
  current-truth fact moved. The hero's own facts change with the wiring, after Will rules.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing overhaul: wire the ruled home hero into `cinema-hero.tsx`, retire the board, and record
  the ruling in `docs/decisions/design-record.md#home-hero` (the board and its four variants stand
  in `sandbox/` until then).
- Marketing overhaul: the kinetic word in the home h1, keep or retire. The board runs both; every
  variant reads better with it off, because the variety the word carried is carried by the
  photographs now. It rides the hero ruling.
- Marketing overhaul: if the hero ruling is V3 (the arrival), the live-demo section at position 7 of
  the home arc needs its own round, since the two would say the same thing in one chapter.

## Handoff (replaces the chat report)

- Head: the tip of `lp/home-hero`, which is THIS commit (a manifest cannot name its own SHA). The
  last code commit is `05f8642`, which is what the preview alias was verified at. Pushed; preview
  `https://partyreel-git-lp-home-hero-partyreel.vercel.app`.
  **The board: `/design/lab/home-hero?key=` (the sidebar's Sandbox zone picked it up on its own,
  since `catalog.ts` derives that list from `SANDBOX`).**
- Synced with launch-prep: **not needed**, it had not moved (`git rev-list --count
  HEAD..origin/launch-prep` = 0 at handoff).
- Gates: typecheck ok, lint ok (0 errors; the 6 warnings are the pre-existing ones on
  `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`), test ok (1622 in 189
  files), build ok (245 static pages, the launch-prep count unchanged).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `docs/tracks/home-hero.md`, `docs/decisions/design-record.md`,
  `src/app/(dev)/design/(shell)/lab/[touchpoint]/page.tsx`,
  `src/app/(dev)/design/sandbox/home-hero-lab.css`,
  `src/app/(dev)/design/sandbox/home-hero-variants.tsx`,
  `src/app/(dev)/design/touchpoints.test.ts`, `src/app/(dev)/design/touchpoints.ts`.
  **Two exceptions, both claimed rather than sneaked.** `touchpoints.test.ts` pins the exact set of
  standing boards, so a fifth board cannot be added without it; it is the test for a file this track
  owns, nobody else claims it, and it is now in `owns`. `docs/decisions/design-record.md` is
  unclaimed by any track and its own contract says the standing boards are listed there with
  `ruled: open`; the board page prints `design-record.md#home-hero` as its pointer, so an entry-less
  anchor would have been a broken link on the surface Will reviews. The edit is one new section, one
  index row, and one word in the header blockquote ("the four standing boards" to "the standing
  boards", which this change made stale).
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed:
  `cinema-hero.tsx` is untouched by design, because the brief is to wire only what Will rules.
- **Verified on the preview at `05f8642`** (the alias was polled until it served that build, proven
  by a marker in the HTML rather than by the clock):
  - The gate: `/design/lab/home-hero` 404 with no key and 404 with a wrong key, 200 with the key; the
    four pre-existing boards still 200; an unknown board 404.
  - **The measurement that is the whole argument**, taken in the browser on the preview over each
    stage (absolutely-positioned layers over 200x200 that paint anything over a photograph, counted
    colour-agnostically because Tailwind v4 emits `oklab()` and an `rgba()` regex undercounts):
    V1 8 photographs / 8 eager / **0 darkening layers**; V2 30 images, 15 of them the seam duplicate
    / 15 eager / **0**; V3 18 / 18 eager / **0**; V4 13 / the frame eager, the 12 strip thumbs lazy
    / **0**. The shipped hero rendered beside them from production code: **3** (`bg-black/35`, the
    three-stop `from-black/90` ramp, the radial vignette), plus a fourth below `sm`, and 7 of its 25
    images eager.
  - The h1s: all four variants and the reference at `opacity: 1`, `transform: none`, no
    `data-mkt-cut` / `data-mkt-reveal` / `.mkt-line`, straight off the server HTML as well as
    computed. Resolved to `text-7xl` on the 1440 canvas.
  - Reduced motion, read off the PRODUCTION-BUILT stylesheet rather than the source: every rule
    carrying a `data-hh-*` selector sits inside one `@media (prefers-reduced-motion: no-preference)`
    block, and nothing rests hidden. The JS beats gate on `usePrefersReducedMotion` as well (the
    album starts full, the count starts at its final value, no chips, no cut).
  - The home at 1440: h1 `opacity: 1`, 96px, `transform: none`, no horizontal overflow
    (`scrollWidth` 1440 = `clientWidth`). At 375: `opacity: 1`, 48px, no overflow. Console clean, no
    errors. It is unchanged, as intended.
  - The board at 375: no horizontal overflow, the desktop canvas zooms down to fit, the phone canvas
    sits at 1:1.
  - ★ **One reading that is the tooling, not the product:** `[data-hh-col]` reports
    `animationPlayState: "paused"` on the preview because the Browser pane's tab is hidden
    (`document.hidden === true`) and the board honours that. Measured running with live transforms
    on localhost with the tab in front. This is the documented Chrome-MCP blind spot; do not "fix"
    the drift on the strength of a paused reading.
- **Look at first:** the board at 1440, the Desktop toggle, scrolling from V1 to "Today, for
  reference" at the bottom. The whole case is in that scroll: four heroes whose photographs you can
  actually see, then the shipped one. Then the Phone 375 toggle, then the Kinetic word toggle.
- **The recommendation, if you want it before the boards: V1, the contact sheet**, with V2 the safer
  second. V1 is the only one that solves the problem structurally rather than by partition, and the
  only one whose composition IS the thesis (the promise is a page in the album, on the album's own
  grid lines). V4 is the most beautiful frame and the weakest argument, because one photograph is
  not an album. V3 makes the strongest argument and costs the most: it does what the live demo
  already does at position 7. If V1 wins, the second round worth taking is V1's sheet FILLING rather
  than developing, which is V3's beat on V1's composition.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-12). The home hero round opened with a board, not a
build. The finding is the board: the shipped hero carries three darkening layers over its wall of 24
tiles at desktop and a fourth below `sm`, because white type had to survive over whichever tile the
55-second drift parked under it, so bible rule 1 is inverted and not one photograph reads as a
photograph. That turns the hero into one design question, WHERE DOES THE TYPE LIVE so no photograph
is ever dimmed, and `/design/lab/home-hero` answers it four ways: the type as a cell in the album's own
grid, as its own column against a hard frame edge, as a band over an album that fills guest by guest
with the count climbing, and as a small opaque title card on one photograph that owns the screen. The
four stages carry zero darkening layers over media between them, measured on the preview against
three on the shipped hero rendered beside them from production code, and all four show fewer, bigger
photographs (8 to 18, not 24 thumbnails). The ruled copy renders verbatim, the h1 is never gated and
at `opacity: 1` at paint in all four, and the hero stays cinema and unlit. Two lab-fidelity findings
came out of building it and are worth keeping: a board that shows two viewport sizes on one page
cannot use Tailwind's responsive ramps, because a breakpoint keys off the reviewer's own window and
not the stage, so the canvases are real viewport pixels fitted with `zoom` and the ladder is resolved
per canvas; and a board that proposes a hero has to propose its LOADING too, since four of V1's
frames, two thirds of V2's and most of V3's album were lazy inside a hero, which is the exact defect
the /careers round measured on production. No production byte changed: `cinema-hero.tsx` is
untouched, and the wiring waits on Will's ruling. The agent's recommendation is V1, with V2 second.

## Handoff (round 5)

- Head: the tip of `lp/home-hero`, which is THIS commit (a manifest cannot name its own SHA). The
  last code commit is `b06e6202`, which is what everything below was measured at. Pushed; preview
  `https://partyreel-git-lp-home-hero-partyreel.vercel.app`. **The board:
  `/design/lab/home-hero`**, and it is worth opening it with `?candidate=source` to see that a link
  now carries the concept.
- Synced with launch-prep: **not needed**, it had not moved (`git rev-list --count
  HEAD..origin/launch-prep` = 0 at handoff, base `1b647d76`).
- Gates on the tree, each on its own exit code: typecheck ok, lint ok (0 errors; the 6 warnings are
  the pre-existing ones on `contact-form.tsx`, two feature sections, `jobs.ts` and `use-flip.ts`),
  test ok (2140 in 218 files), build ok (257 static pages), `pnpm lab:smoke --base
  http://localhost:3413` ok (287 checks, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `src/app/(dev)/design/sandbox/home-hero/{spec.ts,board.tsx,shared.tsx,source.tsx,scan.tsx,inflow.tsx}`,
  plus this manifest, plus **the three registration lines the wave's contract allows, for this
  board's id only**: `sandbox/registry.ts` (the spec imported and added to `BOARDS` first, which is
  `SANDBOX` order), `(shell)/lab/boards.ts` (`legacy: true` dropped from the `home-hero` entry), and
  `src/components/lab/kit-discipline.test.ts` (`"home-hero"` deleted from `LEGACY`). Nothing else
  outside the lane; the three are single adjacent lines, so the merge resolves by eye.
- Shared-file changes asked of the Orchestrator: **none.**
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed:
  `cinema-hero.tsx` is imported by the board and untouched.
- Assets requested from Will: **no new ask.** The board's two are already logged and are now carried
  in the spec's own `assets` shape so the fold is a no-op: **ASSETS row 2**, the 34 event squares
  (512x512, one grade, 6 to 35 KB webp, tight enough to read at 120 px and to survive a centre crop
  to 4:5 and 4:3), replacing `FRAMES` in `sandbox/home-hero/shared.tsx`; and **ASSETS row 8**, the
  hand-and-phone cutout with a transparent screen area, replacing `.hhc-phone` in `scan.tsx`. Row 2
  now has a section of its own on the board (section 3), which renders the twelve stand-ins at the
  120 px the corridor reads them at, so the framing clause is a thing to look at rather than a
  sentence to trust.
- **Noted, not patched (another lane's file).** A board section lands about 158 px lower than its own
  `scroll-margin-top`, because the shell sets `scroll-padding-top: 145px` on `<html>` AND
  `BoardSection` sets `scroll-mt-[topbar + dock + 12]` on the section, so the two offsets add.
  Measured identically on the `light` pilot (`scroll-padding-top` 145, `scroll-margin-top` 149,
  section lands at 294), so it is the kit or shell lane's line to remove, not this board's. The walk
  and the Sections menu both still land on the right section; it is a rhythm bug, not a miss.
- **Look at first:** the board at 1440 with Concept on **All three**, scrolling from the source to
  "Today, for reference" at the bottom. The whole case is that scroll: three heroes whose
  photographs you can see, then the shipped one under three darkening layers. Then **Look first**,
  which is now an executable six-step walk (it sets the canvas and the concept per step), and the
  **Copy** knob, which swaps every lockup to its concept's own proposal. The answer block at the top
  is the thing to reply to: four one-word calls, and the panel at the bottom composes the line.

## Record (round 5; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The home hero board moved onto the kit's
template, and the move is mostly a subtraction: its argument had been scattered across three places
(a prose block at the top of `board.tsx`, a hand-rolled `ConceptMeta` table at the foot of each
stage, and a metadata block each concept file declared beside its engine), and it is now one
`spec.ts` that the template, the desk, the record and the review ledger all read. `sandbox/home-hero`
is two files at its root; the three engines are untouched apart from their exported object, which
shrank to `{ id, render }`, and `copyFor` reads each copy proposal back out of the spec, so the words
on the card, in the hero and in the new Words section cannot drift. A reviewer now meets the verdict
and four one-word calls first instead of two paragraphs of history, and `?candidate=scan` opens one
concept, so a note about a hero is a link. Two things changed rather than moved, both deliberate and
both in the handoff: the shipped hero is the last section again, mounted from production code on
approach, because round one's whole case was the scroll from the candidates to the thing they
replace, and it was lost when round two rebuilt the board; and `bodySkin` left the stages, because
flipping the page through `body:has()` made the lab's own chrome cinema-dark whatever theme the
reviewer had chosen. The measurement that is the board's argument was re-taken on the migrated page
and is unchanged: three darkening layers over media on the shipped hero, zero on all three
candidates, whose only absolutely-positioned paints are the scan's two emissive layers, and every h1
at `opacity: 1` with no transform at paint. No concept, number or recommendation changed.

## Handoff (round 6, the clarity round)

- Head: the tip of `lp/home-hero`, which is THIS commit (a manifest cannot name its own SHA). The
  last code commit is `05b2f5a2`; everything below was measured on `2f98d022`, the merge of
  `origin/launch-prep`. Pushed; **no preview** (`preview: false`): this round's review surface is a
  local `pnpm dev` on `launch-prep` after integration, so no commit carries `[preview]` or `[ci]`.
  **The board: `/design/lab/home-hero`. The session: `/design/lab?session=home-hero.direction`.**
- Synced with launch-prep: **yes**, it had moved 15 commits (glow-specs, brand-voice and rounding
  integrated, plus `5da989bd`, which makes the board's own answer block print an ask's `context` and
  `look` beside its pills). Merged at `2f98d022`, never rebased. **One conflict, and it is the
  adjacent deletion this whole wave causes:** `PLAIN` in `sandbox/registry.test.ts`, where
  launch-prep had removed `glow-doctrine` and `glow-moments` and this branch had removed
  `home-hero`. Resolved by keeping EVERY side's deletion, which is what the list means (it only
  shrinks); the list now reads album-hero, floating-surfaces, media-kit, palette, river-visual,
  type-scale.
- Gates on the merged tree, each on its own exit code: typecheck ok, lint ok (0 errors; the 6
  warnings are the pre-existing ones on `contact-form.tsx`, two feature sections, `jobs.ts` and
  `use-flip.ts`), test ok (2155 in 218 files), build ok (257 static pages). `pnpm format` on the
  three changed files: all already formatted. `pnpm lab:smoke --base http://localhost:3517` ok (324
  checks, 0 failing). The dev server was killed by port before handoff.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `src/app/(dev)/design/sandbox/home-hero/{spec.ts,board.tsx}` plus this manifest, plus **the one
  exception the brief names**: the `"home-hero"` line deleted from `PLAIN` in
  `src/app/(dev)/design/sandbox/registry.test.ts`. Nothing else; **no CSS and no engine file was
  touched**, which is also why reduced motion cannot have moved.

### Every ask as it now reads

- **direction**: "Which of the three pictures should the home page's first screen be?"
  Options: *The album comes out of the code* | *A guest scans, then it comes out* | *The photos fly
  into the code*. The context glosses the two nicknames a reader would otherwise have to dig for
  (the source, the corridor). `control` is deliberately unset: the Which picture switch carries a
  fourth option (All three) that no ask can offer, and dropping it would cost the board its
  side-by-side scroll.
- **headline**: "Should the hero carry the site's one line, or a headline written for the winning
  picture?" Options: *The site's one line* | *The picture's own line*. Mirrors the `copy` control
  (relabelled Headline), so its two labels are one string in two places and picking an option on the
  review card previews it on every hero.
- **lockup**: "Should the headline and buttons sit centred above and below the code, or left like
  the rest of the site?" Options: *Centred, above and below the code* | *Left, like every other
  page*.
- **count**: "Should the hero carry a live count of photos and guests under the code?"
  Options: *Keep it, wired to the real event* | *Cut the number from the hero*.

### The evidence, carrying those words

Each `ConceptCard` is titled with its own option's label ("1. The album comes out of the code"), so
the words offered on the desk are the words on the thing being judged; the Which picture switch says
the same words shortened to a knob. The headlines section's four lockups are labelled "The site's
one line" and "The picture's own line" (they were "The site thesis" and "Proposed by ..."), which
are the headline ask's labels exactly. The shipped hero's label at the foot of the board now says
its type runs **Left, like every other page**, because the board builds no left candidate and that
is the only place the lockup ask's other option can actually be seen.

### What could not be made plain without new evidence

**Two asks offer an option the board shows no specimen of, and this round built none** (rule 4: no
new specimens). `lockup=left` has no left-aligned candidate, and `count=cut` has no version with the
line removed; both options are answerable from their `means` sentence, and `left` is now pointed at
the shipped hero as the nearest honest picture of it. If either comes back `?`, the fix is evidence
rather than words: a fourth stage of the recommended concept with the type moved beside the lane,
and the same stage with the count line gone. Named here rather than built, because a new specimen
would have re-argued a board this round was told only to make readable.

- Shared-file changes asked of the Orchestrator: **none.** The `PLAIN` deletion is the brief's own
  exception and the merge above already reconciles it with the three boards that landed first.
- Kit needs: **none.** `5da989bd` landed the one thing this board would have asked for (the answer
  block printing `context` and `look`), so the board's first screen, the desk's session and the
  review card now carry the same four asks word for word.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none.** No production byte changed;
  `cinema-hero.tsx` is imported by the board and untouched.
- Assets requested from Will: **no new ask.** The board's two are unchanged and still carried in the
  spec's own `assets` shape, so the fold is a no-op: **ASSETS row 2** (the 34 event squares) and
  **ASSETS row 8** (the hand-and-phone cutout).
- Verified on a local `pnpm dev` at `2f98d022`: the board at **1440** (no horizontal overflow,
  1440 = 1440; all four asks print their question, context, option pills, Where to look, Why the
  board says so and Overrule if on the first screen) and at **375** (no horizontal overflow,
  375 = 375; the Which picture knob wraps to two rows with nothing clipped, `scrollWidth` =
  `clientWidth` on all three knobs; the three concept h1s at `opacity: 1`, `transform: none`, 48px).
  The desk's session read cold as a stranger, all four asks in order: each one answerable from the
  question, its context, its Where to look line and its labelled options alone. **Reduced motion
  honoured, unchanged by construction**: the diff carries no CSS, and in the production stylesheets
  every applied `hh*` animation sits inside a `prefers-reduced-motion: no-preference` block (7 of 7;
  the two apparent exceptions are `animation-timing-function` lines inside `@keyframes` bodies,
  which apply nothing).
  `pnpm lab:review --dry 'review home-hero r5: direction=source; headline=ruled; lockup=centred;
  count=keep'` accepts one clause per ask, and a second dry run proves the dissenting shapes
  (`direction=inflow "..."`, `lockup=left`, `count=? "..."`).
- **Look at first:** the answer block, and nothing else at the start. Four questions, each with a
  paragraph of what the thing is, pills you can read without the board, and a line saying where to
  look. If any of the four still needs the board to be understood, that is the finding, and `?` is
  the answer that says so.

## Record (round 6; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The home hero board's four asks were rewritten as
questions a stranger can answer where he meets them, which on this board meant admitting that all
four had been labels over tokens ("The direction: source | scan | inflow") that only the board could
decode. Each now carries what the thing is and where it lives on the site, where to look and what to
compare, and every option labelled in words with one sentence on what choosing it does; the two
nicknames a reader would have had to dig for, the source and the corridor, are glossed inside the
ask that uses them. The ids did not move, so the ledger still joins, and no concept, number,
recommendation or specimen changed. The harder half was the evidence: a card titled "1. The source"
gave a reviewer nowhere to find the words he had been offered, so each concept card, the dock's
concept switch and the four headline lockups now wear their option's own label, and the shipped hero
at the foot of the board says in its own caption that its type runs left, because the board builds
no left candidate and that caption is the only place the lockup ask's second option can be seen. Two
options still have no specimen at all (a left-aligned lockup, a hero with the count removed) and the
handoff names them as evidence a later round owes rather than words this one could fix.
