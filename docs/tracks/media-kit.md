---
track: media-kit
status: handed-off
cut: "1b647d7"
merged_round_4: "b399c354"
merged_round_3: "6c6ab14"
merged_round_2: "2307446"
merged_round_1: "c1aa5c6"
preview: false           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/media-kit/
  - docs/specs/media-kit.md
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

# lp/media-kit

## Round 5 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The media kit board onto the kit, with the round-four pivot kept (discovery and sourcing: a few potential
sources rather than exact picks). Its 561-line preamble becomes the spec's `context` and each section's
collapsed `argument`; `Verdict` becomes the template's Answer; `PlanCard`, `SourcingSheet` and
`SurfaceCheck` stay local (one consumer each); the applied-block walk uses the kit's `ApplyToSite` and
`Walk`; the two blog-cover and licensed counts are measured by the kit's hooks, never typed; the spec doc
loses its asks block.

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

**Verify on.** `/design/lab/media-kit` on your dev server at 1440 and 375, light and dark, reduced motion;
`/design/lab` shows the board's open asks; the gate and `pnpm lab:smoke` green.


## Round 4 (Will's review notes, 2026-09-15)

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

**Will's note on this board, verbatim.** "I haven't had any time to find or design any photos myself. The
best use of this track next may be for discovery/sourcing of those new assets. Could focus on a few
different potential sources as opposed to a few exact image picks. E.g. here's a real wedding album with a
$5 license, here's a real party gallery on Unsplash for free, here's a license-free conference image
gallery, etc."

**Round 4 (the goal).** The board becomes a sourcing sheet. (1) **Sources, not picks.** Find real,
specific sources for the kit's verticals (weddings, birthdays and parties, corporate and conferences,
festivals, trips), each a concrete place with a real catalogue behind it: a paid stock album or collection
with a named price and licence (a real wedding gallery under a per-photo or per-album licence), a free
gallery whose terms allow marketing use with recognisable people (release status stated), a CC0 or
public-domain collection for a vertical, a licensed-clip source for the vertical films the heroes ask for.
For each: the URL, the licence in its own words (the clause that allows or forbids marketing use and a
recognisable face), the price, what it covers (how many frames, which verticals, orientations), the model
release position, a contact sheet of six to twelve representative frames rendered from the source (hotlinked
thumbnails or staged under `public/design/media-kit/` with provenance, never promoted), and a one-line
verdict. Aim for six to ten sources across the verticals, ranked, with a recommended first purchase or
download per vertical and its total cost. (2) **The rule stays.** Round three's licence rule (no stock at
launch that cannot be named; a recognisable face needs a release) is the filter every source is judged
by; the exposure map and the twelve unlicensed stills stay as the reason. (3) **The dock** carries the
vertical and the source filter. (4) The spec (`docs/specs/media-kit.md`) gains the sourcing sheet as its
own section and the asset log rows it proposes (what Will buys or downloads, where it lands) in the
Handoff.

### Binds (every track)

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`/design/library/policies`); everything else is precedent (`docs/design/README.md#what-binds-you`,
rendered at `/design/library`). Shell changes are asked for in the Handoff and announced in
`docs/tracks/orchestrator.md`; never edit `src/components/dev/`, `src/components/lab/`,
`touchpoints.ts`, `rules/bible.ts`, another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM,
CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/`. Light QA (Will,
2026-09-14): the board at 1440 and 375 in a foreground tab, reduced motion honoured, the gate green
on the synced tree.

## Round 3 (Will, 2026-09-14: one more iteration cycle before his review)

**Round 3 (the goal): the last mile, walked first by you.** Two rounds built the board; this one is the
walk Will will take, taken before him. (1) **Walk it cold**, the way he will: the board on the launch-prep
alias (round 2 is integrated there) and then on your preview, in a foreground tab, at 1440 and then
375, every toggle, every candidate, and every "Apply to the site" block on the pages you listed (the home
arc, `/pricing`, `/help`, `/contact`, the dashboard and an event page with `?key=`, the demo guest page).
Note every place a stranger would stumble: an unexplained toggle, two candidates that read the same, a
stage that needs a caption or has one too many, a slow first paint, a layout that breaks at 375, a
control that does nothing visible. Fix each. (2) **Re-read the reviewer's findings** on your round-2
handoff (below) and the other boards' latest Handoffs in `docs/tracks/` and proposals in `docs/specs/`:
anything there that changes your answer changes your board. (3) **Make the decision easy**: the strongest
candidate first; a candidate cut if it no longer earns its column (say so); every ask a one-word answer
and no more asks than Will must answer; the departures only the ones he must rule on. (4) **Honesty and
cost**: every number on the board is measured or labelled a stand-in; measure what runs (frame time, layer
count) and cut what does not earn its cost; reduced motion gets the settled composition. (5) **The
record**: "Handoff (round 3)" and "Record (round 3)" below; the Record is the paragraph the CHANGELOG
carries for rounds 2 and 3 together, so write it as the whole story of what the board became.

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The survey found the exposure and the corpus's limits; now turn the board
into the two things Will can act on. (1) **The blog bridge, concrete**: a mapping of all 23 posts to a
candidate cover (the staged CC0 batch plus whatever the allowed sources yield on a second, harder
search: the exact verticals the corpus failed on, tried by subject synonyms and by scene rather than
by keyword, on every source in the allowed list), each shown in place at the blog card's and the OG
card's real geometry, with the provenance line under it and the posts that stay miscast named
honestly; if a frame cannot be filled under the rule, say so and leave it empty. (2) **The kit as a
shootable brief**: one card per master frame (36 by vertical, plus the derived rows 2, 8, 9 and 12
from the hero rounds and the palette's four hard cases from `docs/ASSETS.md` row 7), each with the
subject, the framing, the light, the crop it must survive (22 to 78 percent, 4:5, 1:1, 120 px
legibility), and the stand-in it replaces by id, laid out as a contact sheet Will can shoot from.
(3) **The provenance schema** prototyped: `provenance.json` mirrors the fields `marketing-media.ts`
would gain (`author`, `sourceUrl`, `license`, `clause`, `retrieved`, `people`), and the test pins
that every staged file has every field. (4) **The reel re-render runbook** made executable: the
steps, the page, the finish command, tried once as far as the lab allows, with what the wiring round
must add. (5) The asks reduced to one-word answers; the route recommendation kept.

### The rules of round two (every track)

- **Why a second round.** Will (2026-09-14, after the first wave integrated): "They all seemed to be
  making progress in their directions, but a single round of context didn't seem to be enough for
  any of them to reach enough of their full potential for a real review." Read your round-1 Handoff
  and Record below as your own notes, look at the board as it stands on the launch-prep alias, and
  judge it from the ground up (bible 22): what would the perfect version of THIS board be, as a
  surface Will can rule on in a few words after walking it? Elevate what points there, rework what
  does not. Every candidate should be complete enough to ship as a paste; every ask a one-word answer.
- **The other boards are inputs now.** Every proposal from the first wave is in `docs/specs/`
  (`palette.md`, `light.md`, `type-scale.md`, `floating-surfaces.md`, `brand-voice.md`,
  `media-kit.md`). Use what sharpens your board (the palette's ramps under your surfaces, the light
  spec's shadow family on your cards, the type tables on your headings) and say so in BoardMeta; you
  still own only your lane, so read those boards' files, never edit them.
- **"Apply to the site".** The shell now lets a board hand the WHOLE site a CSS block, the same paste
  its ruling would land, so Will judges a candidate on the real pages and not only on a stage:
  `setCandidateCss(label, css)`, `clearCandidate()` and `useTunerCandidate()` from
  `@/components/dev/board`. One block at a time (the newest replaces the last); it renders as a
  `<style>` after every stylesheet on every lab page, every marketing page and the host app (all with
  `?key=`), persists in the browser until cleared (the tuner panel shows it with a clear button; your
  board shows a badge and its own clear). A block must be real CSS with the real selectors
  (`:root, .surface-paper`, `.dark`, `.surface-ink`, `.dark[data-mkt-skin="cinema"]`, a primitive's
  own class), never a stage-local class. Where your candidate is a CSS paste, offer it per candidate
  ("Apply A to the site") and list in BoardMeta the pages to walk with it on: `/`, `/pricing`,
  `/help`, `/contact`, `/dashboard` and an event page (the app needs the signed-in host), the demo
  guest page. The knobs are reachable too: `setTunerValue(control, value)` from
  `@/components/dev/tuner-store` with a control from `motion-tuner-config.ts`.
- **The same lane, the same wave rules.** You own exactly what your front matter says; never
  `touchpoints.ts`, `bible.ts`, the shell, `docs/ASSETS.md`, CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS. No mono (there is no mono face in the product now; `two-faces-policy.test.ts`
  refuses a `font-mono` class), no em-dashes, keyframes under your prefix, sheets never import
  tailwindcss, `<Glow>` only. Unlimited design resources: ask for exactly what the design needs, one
  bullet per asset in the fixed shape. Light QA: the board on your preview at 1440 and 375, reduced
  motion honoured, the gate green on the synced tree.
- **Boot.** Round one's branch and worktree are gone; cut fresh: `git fetch origin`, then
  `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, install, copy
  `.env.local`, fill `cut` below with the SHA you branched from, commit this manifest alone
  (`docs(tracks): reopen <track> for round two`), push `-u`; `pnpm test` green. Sync only per
  PROGRAM.md.
- **Handoff.** Fill "Handoff (round 2)" and "Record (round 2)" below (round 1's stay as history),
  `status: handed-off`, push; the chat report is one line, "handed off at <sha>".

## Round 1, for reference (integrated; the brief it was built to)

**Goal.** The media-kit exploration of the review wave (2026-09-14). Bible 18 (every frame is ours) was "an unspoken rule": no stock at launch, and a licensed kit found under allowed licenses. This track writes the licensing rule down as a proposal (`docs/specs/media-kit.md`), surveys the sources whose terms allow a marketing use, plans the kit Will produces himself (he makes any image, video, SVG, 3D or generative asset), and stages a candidate first batch on a contact-sheet board beside the current twelve stills with provenance under each. The batch is staged, not wired: the stand-ins stay until a wiring round. No production byte changes on this track.
**Rulings in force.** The bible's second edition: rule 18 (every frame is ours; `marketing-media.test.ts` enforces the manifest), rule 1 as rewritten (media is the color), the unlimited-design-resources policy (PROGRAM.md: Will makes the assets; ask specifically). Every asset request goes through `docs/ASSETS.md` via the Orchestrator; never edit it.
**Verify on.** `/design/lab/media-kit?key=` on your preview at 1440 and 375; `docs/specs/media-kit.md` reads whole; the gate green (`marketing-media.test.ts` stays green: the staged batch lives under `public/design/`, which nothing scans, never under `public/marketing/`).

## The brief

### The question

If the marketing media were sourced today under the rule that every frame is ours or licensed under terms we can name, where does it come from, what does Will make himself, and does a candidate first batch replace the twelve unverified stills?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **All twelve `MARKETING_IMAGES`** (`src/lib/constants/marketing-media.ts:64-171`) carry the same line,
  `credit: { license: "unsplash (per lab-pack comment; provenance unverified)" }`, with no `author`,
  `sourceUrl` or `retrieved` (all three optional on the type at `:33-36`); the header (`:13-15`) admits
  the gap and `:31` says unverified entries "block the M4 gate". The lab pack they were copied from,
  `public/design/`, is EMPTY now, so the provenance trail is gone from the tree.
- **The test** (`marketing-media.test.ts`): every referenced file exists (`:29`), every file under
  `public/marketing/` has a manifest entry (`:39`, no orphans), every entry has a NON-EMPTY license line
  (`:51`; it does not check verified), unique ids, orientation matches dims, reel recipes reference
  known ids. `public/marketing/` holds 16 files (`img/`, `posters/`, `reels/`).
- **The two reels** (`MARKETING_REELS`, `:181-217`): `hero-candidate-01` (portrait) and `hero-candidate-02`
  (landscape, clips `festival-lights`, `festival-crowd`, `concert-confetti`, `party-dj`), each with a
  deterministic recipe (`styleId`, `seed`, `clipIds`, `sourceBitrate`, `finish`). ★ Re-rendering is NOT
  a CLI job: the engine encodes in the host's browser (WebCodecs, `src/lib/reel/engine/encode.ts:54`;
  `render-service.ts:1-12` brokers the client encode; the Lambda path was torn down 2026-07-08), driven
  from the lab's `/design/lab/tools/reel-parity` page, then the `finish` ffmpeg step by hand. Budget for it.
- **The rights statement today:** `docs/systems/marketing-content.md:555-557` (bible 18; Will pulled the
  two stock event photos from the press cut: "just feels weird to say here's a random stock photo"). The
  media manifest itself is undocumented in the system doc. STATUS's old queue said "the 4 Unsplash items
  need a per-batch OK"; the manifest has 12 (`docs/ASSETS.md` row 6 carries the corrected count).
- **The three hero asks already written** (`docs/ASSETS.md` rows 1 to 4; the manifests
  `docs/tracks/hero-reel.md`, `hero-source.md`, `hero-gathering.md`): the film (15 to 20 s, 12 to 18
  shots, a dark warm grade with the left 55% low, both orientations, mp4 + webm + posters, the cut list),
  24 squares at 512 px, 36 photographs at 1600 px (a third portrait) with 8 vertical clips and their own
  posters. `hero-gathering` names all twelve stills as the stand-ins to replace. These are the seed of
  the generated-kit plan.
- **The upload fixtures** (`/Users/gibby/local/ai/partyreel-test-media/`, gitignored) are proxy-licensed
  (Lorem Picsum "Unsplash-sourced", `samplelib.com`): never promote them into `public/marketing/`.
- **The unlimited-design-resources policy** (PROGRAM.md): Will makes any image, video, SVG, 3D or
  generative asset; a licensed kit is the complement, not the plan.

### The board

A contact sheet: the current twelve stills in one row, and beneath each the candidate that would
replace it (staged under `public/design/media-kit/` with a `provenance.json` beside the files: source,
author, license, the clause that allows a marketing use, the retrieval date), with the twelve grouped
by vertical (weddings, birthdays, corporate, festivals) so the gaps show; the two reels' clip ids
mapped to their candidates; a Phone 375 view. The candidates span the range: a batch from licensed
libraries; a batch that is Will's to make (the shot list rendered as a brief card per frame, with the
stand-in it replaces); a mix. The asks: the licensing rule as written; the sources allowed, clause by
clause; the first batch, OK or not, item by item; the kit plan.
### The deliverable

`docs/specs/media-kit.md` (a proposal until Will rules; the settled part is promoted into the system layer by the Orchestrator): the licensing rule (no stock at launch; every frame ours or under a license we can name, with `author`, `sourceUrl` and `retrieved` required on every manifest entry), the manifest and its test documented, how a loop is re-rendered, a survey of licensed sources whose terms allow a marketing use without attribution (CC0, Pexels, Pixabay, Mixkit, Coverr and the like, each with the exact clause and what it forbids), the generated-kit plan (the hero asks generalised: photographs by vertical, vertical clips, posters, with the shot lists), and the rows to add to `docs/ASSETS.md` proposed in Handoff. Plus the board.

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

- none. The media manifest is undocumented in the system layer (`marketing-content.md` covers the
  pages but never `marketing-media.ts`), and `docs/systems/` is outside this lane, so the contract is
  written in `docs/specs/media-kit.md` section 2 until the Orchestrator promotes the settled part.

## Deferred (ROADMAP one-liners, bucket named)

- Lab: `/design/lab/tools/reel-parity` hardcodes its eight `FIXTURES`, so re-rendering a recorded
  `MARKETING_REELS` recipe needs a code edit rather than a control; read the clip ids off the recipe.
- Docs: the marketing media manifest and its test have no home in `docs/systems/`; fold
  `docs/specs/media-kit.md` section 2 into `marketing-content.md` when the rule is ruled.

## Handoff (round 1)

- Head: the tip of `lp/media-kit`, pushed. The last commit touching the board, the spec or the batch
  is `14bd665`; `f78800f` merged `launch-prep`; the commits after it are this manifest.
  Preview: `partyreel-git-lp-media-kit-partyreel.vercel.app`
- Synced with `launch-prep` at `8b06f89` (twice: an earlier merge at `04af3d5` took a tip that still
  carried a YAML break in `docs/tracks/orchestrator.md`'s frontmatter, landed by `ff2de13`, which
  failed `track-manifests.test.ts`; `8b06f89` has it fixed and the suite is green)
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all pre-existing and none in
  this lane), test ok (1697 in 193 files, 6 of them this track's `provenance.test.ts`), build ok
  (247 static pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md`, the nine files under `public/design/media-kit/`, and the five under
  `src/app/(dev)/design/sandbox/media-kit/` (`board.tsx`, `board.css`, `kit.ts`, `sources.ts`,
  `provenance.test.ts`). No exceptions. No production byte changed: the twelve stand-ins,
  `marketing-media.ts` and `public/marketing/` are untouched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will:
  - **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences,
    festivals, trips) · 1600 px long edge, a third portrait, one grade, 3 of the 36 showing a guest
    holding a phone up, framed to read at 120 px and to survive a crop from 22 to 78 percent; the
    shot list is `docs/specs/media-kit.md` 5.1 · replaces all twelve stand-ins by id
    (`wedding-golden`, `reception-table`, `party-balloons`, `concert-confetti`, `wedding-rings`,
    `reception-hall`, `party-dj`, `wedding-toast`, `festival-lights`, `festival-crowd`,
    `wedding-arch`, `wedding-petals`)
  - **24 square crops at 512 px** · 6 to 35 KB webp, cropped from 24 of the 36 rather than shot
    separately · replaces `FRAMES` in `sandbox/home-hero/shared.tsx`, which every round-three hero
    variation cycles (`ASSETS.md` row 2)
  - **8 vertical clips with posters** · 3 to 5 s, 1080 x 1920, silent, each with its own poster at
    1080 x 1920, filmed at the same events · replaces the `currentTime` ranges cut out of
    `hero-candidate-01` (`ASSETS.md` row 4, withdrawn with the gathering; it costs nothing to keep
    because it is the same shoot)
- **Proposed `ASSETS.md` changes** (the Orchestrator applies; no agent edits that file). Row 7 is
  already open for "a licensed media kit" and this specifies it; rows 2 and 4 fold into it:
  - Row 7, `what` → `The kit, 36 masters`; `spec` → `36 event photographs, six per vertical
    (weddings, birthdays, corporate, conferences, festivals, trips), 1600 px long edge, a third
    portrait, one grade; 3 of the 36 show a guest holding a phone up; framed to read at 120 px and to
    survive a 22 to 78 percent crop; shot lists in docs/specs/media-kit.md 5.1. The 24 squares
    (row 2), the 8 clips (row 4) and the film (row 1) are crops and cuts of this one shoot, not
    separate deliveries.`; `replaces` → `all twelve MARKETING_IMAGES by id`; `status` → `requested`
  - Row 2, `spec` → append `derived from row 7 rather than shot separately`
  - Row 4, `status` → `parked (revives with row 7: the same shoot)` rather than `withdrawn`
  - Row 6, `spec` → append `the media-kit track staged 8 CC0 candidates under public/design/media-kit/
    with provenance.json; the recommendation is a dated bridge on the blog pool only, never the hero`
- The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will):
  1. The rule as written: author, source and retrieval date REQUIRED on every manifest entry, and an
     entry missing them cannot ship (spec section 1).
  2. The allowed list: Pexels, Pixabay, Mixkit, Coverr and CC0 in, Unsplash out, each on the clause
     quoted above. Yes to the list, or strike a source.
  3. The route: Licensed, Ours, or Mix. The recommendation is Mix, with the frames marked ours in the
     sheet.
  4. The first batch, item by item: OK to stage as the bridge on the blog pool, or not at all.
  5. The kit: 36 masters, six per vertical, and the 24 squares, the 8 clips and the film derived from
     them rather than asked for separately.
- **Look at first**: the three paragraphs above the toggles, then flip Route to Licensed and read the
  four empty frames. Unsplash's terms exclude recognizable people from the license, and all twelve
  stand-ins are full of them, so the gap cannot be closed by finding the source; and the best free
  corpus that exists returns hot air balloons for "party balloons" and a rope on a stage for "a dance
  floor". Then "In place", which is the whole argument in one image: a conference post illustrated
  with a music festival, on the real blog geometry with the real derived crop.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The media-kit exploration wrote bible 18 down as a
proposed sourcing law (`docs/specs/media-kit.md`): two provenance classes and no third, `author`,
`sourceUrl` and `retrieved` required on every manifest entry, a generated frame's license being the
generating service's output-ownership clause, and the model-release rule that keeps a licensed face
off a page that makes a claim. The survey behind it quotes ten license pages clause by clause and
found the thing that settles the round: Unsplash's terms exclude recognizable people from the
license, and all twelve stand-ins are full of them, so the gap was never a missing citation. The board
at `/design/lab/media-kit` argues three routes on the same twelve positions with the provenance line
under each, shows the vertical gap costing seven of 23 blog posts a miscast cover, and stages eight
CC0 candidates under `public/design/media-kit/` with `provenance.json` and a test pinning the two
together; the four it could not fill are the argument. The kit plan generalises round two's parked
asks into 36 masters by vertical, with the squares, clips and film derived from one shoot. No
production byte changed.

## Handoff (round 2)

- Head: the tip of `lp/media-kit`, pushed, and the alias is built from it (a manifest cannot name
  its own commit; `git rev-parse origin/lp/media-kit` gives the SHA). The last commit that changes
  what the board draws is `763423a`; the ones after it are this manifest and one unused import
  dropped. Preview `partyreel-git-lp-media-kit-partyreel.vercel.app`, board at
  `/design/lab/media-kit?key=`
- ★ **The alias was a day stale, and it is rebuilt.** Vercel's ceiling of 100 deployments a day
  was at 0 remaining when `763423a` landed, so that push produced no deployment and the alias kept
  serving `b05c7c3`, a build whose Ours slate is still the 1200x800 cut. That is the one frame the
  walk below opens on, and the one this track found broken: a 4:5 blog card takes 20 percent off
  each side of it, so the shot code and the start of the line were gone. The first rebuild push lost
  its slot by seven seconds, so the rebuild was forced at the same SHA instead and went READY, and
  the alias now serves the tip. Verified on it, not inferred: the board's chunk carries
  `viewBox='0 0 1000 1000'` and no served chunk carries `0 0 1200 800` any more, and Ours applied
  from the board draws the square slate on the real `/blog` at 1440, centred inside the 320x400 card
  with the code, both rows of the subject and the replaces line all inside the crop. The same check
  settles it any time the alias looks behind again.
- **How the ceiling actually behaves** (worth knowing while six tracks share one project, and the
  reason the first rebuild push produced nothing): the cap does not lift at midnight, it refills at
  one deployment every 14.4 minutes, and the next push on ANY branch takes the free slot. Pushes
  made mid window are refused outright and GitHub never retries them, so a push is not a deploy: it
  is an entry in a race. Confirm a rebuild by the SHA on the deployment, never by the push
  succeeding. The API route is the same race from the other side (`POST /v13/deployments` with
  `gitSource` returns `payment_required` until a slot frees).
- Synced with `launch-prep` at `4b035c1` (it had moved one docs-only commit past the cut at `ca952b5`)
- Gates on the synced tree, re-run at the head: typecheck ok, lint ok (0 errors, 7 warnings, all
  pre-existing and none in this lane now that round two's own unused import is gone), test ok (1726
  in 197 files; this track's five suites hold 34, 28 of them new this round), build ok (248 pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md`, `public/design/media-kit/` (22 jpgs + provenance.json) and the eleven
  files under `src/app/(dev)/design/sandbox/media-kit/`. No exceptions. No production byte changed:
  `marketing-media.ts`, `public/marketing/` and every blog frontmatter are untouched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Shell / touchpoint change the Orchestrator applies** (no agent edits `touchpoints.ts`): the
  `media-kit` entry still carries round one's note and variants. Proposed:
  `note` → `The exposure measured on the real site, all 23 posts mapped to a candidate cover at the
  blog card's and the share card's real geometry, the kit as a call sheet of 36 frames, and four
  blocks a walk can wear`; `variants` → `["The exposure", "Licensed", "Ours", "Mix"]` (they are the
  four applied blocks now, which is what a reviewer actually switches between).
- Assets requested from Will (unchanged in substance from round one, sharpened by the call sheet;
  `ASSETS.md` row 7 already covers the first and names the hard cases):
  - **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences,
    festivals, trips) · 1600 px long edge, a third portrait, one dark warm grade; the call sheet is on
    the board and in `docs/specs/media-kit.md` 5.1, one card per frame with codes `W1` to `T6`, each
    naming the subject, the framing, the light and the crops it must survive. Four are the palette
    board's hard cases (`W5` high key, `W3` low key, `W2` candle warm, `S4` stage cool) and three show
    a guest holding a phone up (`K3`, `S3`, `T4`) · replaces all twelve `MARKETING_IMAGES` by id
  - **24 squares at 512x512**, 6 to 35 KB webp · 1:1 crops of the 24 masters marked `512 square`,
    not a second shoot · replaces `FRAMES` in `sandbox/home-hero/shared.tsx` (`ASSETS.md` row 2)
  - **8 portrait crops at 512x640 and 12 portraits at 720x900** · 4:5 recrops of the same masters;
    `W4`, `B5` and `S3` are shot portrait and the rest are recrops of masters whose subject is
    vertical · `ASSETS.md` rows 9 and 12
  - **A hand-and-phone cutout**, PNG with alpha, 1200 px long edge, screen area transparent, two
    grips · the ONE item that is a separate setup: shoot it at the same event, against the darkest
    wall, from just behind the holder's shoulder, in the same low warm light as `K3` · replaces the
    drawn device in `sandbox/home-hero/scan.tsx` (`ASSETS.md` row 8)
  - **8 vertical clips with posters**, 3 to 5 s, 1080x1920, silent · filmed at the same events, and
    the film cut from that footage · `ASSETS.md` rows 4 and 1
- **Proposed `ASSETS.md` changes** (the Orchestrator applies): row 7's `spec` → append
  `the call sheet is docs/specs/media-kit.md 5.1 and the board, one card per frame with codes W1 to
  T6; rows 9 and 12 are recrops of the same masters and row 8 is the only separate setup (shoot it at
  the same event in K3's light)`; row 6's `spec` → replace the count with
  `the media-kit track staged 22 CC0 candidates under public/design/media-kit/ with provenance.json,
  filling all twelve ids; the recommendation is a dated bridge, and the exposure is 40 production
  files and 22 routes, with six of the twelve in the footer and nav of every marketing page`;
  rows 8, 9 and 12 `spec` → append `derived from row 7's shoot` (row 8: `shot at the same event`).
- The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will):
  1. The rule, yes or no: author, source, license clause, retrieval date and a people field required
     on every manifest entry, and a recognisable face may not ship without a release (spec 1.2 and 1.4).
  2. The allowed list, yes or strike one: CC0, Pexels, Pixabay, Mixkit and Coverr in, Unsplash and
     CC BY out.
  3. The route, one word: Licensed, Ours or Mix. The recommendation is Mix.
  4. The bridge, ship or hold: 23 posts recovered by hand, 21 filled and 2 left empty on purpose.
  5. The kit, shoot or park: 36 masters, six per vertical, with the squares, the portraits, the clips
     and the film cut from the same night.
- **Look at first**: press **Licensed** in "Apply to the site", then open `/blog` on this preview.
  The whole library wears the CC0 bridge, all twelve ids, on the real cards. Press **Ours** and walk
  it again: every frame becomes the slate of the shot that replaces it, which is the shoot's cost said
  page by page. Then come back and read the two red rows at the bottom of the bridge, which are the
  conference post and the office party, the two the corpus cannot fill at all.
- **Light QA.** Board walked on the preview at 1440: the four applied blocks driven on the real
  `/blog` (Licensed swaps all 15 loaded frames on the library page; Ours draws the slate on each), the
  stage no longer clips its plates, the sheet reads at three across. 375 verified by construction and
  by the stage's Phone 375 mode (every grid on this board is single-column at its base and only opens
  at `sm:`), because the Chrome MCP could not actually narrow the window: it reports
  `window.innerWidth` 1318 for a 658 px window, so a forced-width measurement re-runs no media query
  and is pessimistic by design. Reduced motion is honoured: this board mints no keyframe and runs no
  loop, the develop beat's settled state lives outside the media query in `marketing.css`, and the
  only rule `board.css` adds is a transition delay inside `prefers-reduced-motion: no-preference`.
- **Findings against a rule** (for Will, not acted on): none against the bible. Three against round
  one's own board, all corrected in place and each pinned by a test so they cannot come back: the
  exposure (the site, not the blog), the blog covers (chosen in frontmatter, not hashed) and the reel
  runbook (no code edit needed).

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The media-kit board's second round turned the
survey into a ruling surface and corrected three things the first round got wrong, each now pinned by
a test. The exposure was the site, not the blog: the twelve unverified stills are named in 40
production files across 22 routes, and six of them sit in the footer strip and the nav panel, both in
the group layouts, so they are on all 24 marketing pages before a reader scrolls. Nobody hashed the
blog covers either; all 23 posts set `cover:` in frontmatter and 22 differ from the fallback hash, so a
person chose every miscast one out of eleven wedding and festival frames, which makes the bridge 23
frontmatter lines rather than twelve files. And re-rendering a recorded reel needs no code edit: both
recipes are already in the parity page's clip-set picker, in order. A second, harder search by scene
rather than by keyword closed all four of round one's holes and staged 15 more CC0 frames, 22 in all,
which moved the argument rather than winning it: 18 of the 22 work only because nobody in them is
recognisable, and the free corpus turns out to be an archive of record rather than of celebration, so
it covers trips completely and conferences not at all. The board now maps every post to a candidate at
the blog card's and the share card's real geometry (the share card centre-crops and ignores the
ladder), writes the kit as a call sheet of 36 frames with framing, light and the crops each must
survive, prototypes the manifest's proposed `credit` shape across 22 records, and hands the running
site four blocks it can wear. No production byte changed.

## Handoff (round 3)

- Head: the tip of `lp/media-kit`, pushed (`git rev-parse origin/lp/media-kit`; a manifest cannot
  name its own commit). The last commit that changes what the board draws is `063a227`, the third
  pass's; the ones after it are the `launch-prep` merge and these docs. Board at
  `/design/lab/media-kit?key=`.
- **Third pass (a second read-only review raised two should-fix items; both are closed here, in the
  lane, and both were the same fault seen from two sides: the board and the site were not looking at
  the same thing).**
  1. *The block could only speak in ids, and the sheet speaks in posts.* `BRIDGE[].candidate` is per
     POST and a file name can only carry an id, so the applied CSS matched `BRIDGE_BY_ID` and 14 of
     the 21 filled posts wore a different photograph on the walk from the one the board's own row
     showed (the timeline post wore bridge-ceremony.jpg under Licensed while the sheet showed
     wedding-arch.jpg). It also made the route table unreachable: the Mix row promises two covers and
     exactly one id can change. The site does name a post, in two places, so the blocks now carry a
     per-slug rule as well as the per-id one: `a[data-cover-morph][href="/blog/<slug>"] img` for the
     card (the index and an article's "Keep reading" row), and
     `html:has(link[rel="canonical"][href$="/blog/<slug>"]) [data-cover-plate="target"] img` for the
     article's own hero, both outranking the id rule on specificity. A post that nothing licensed can
     fill draws a `None` slate rather than keeping today's frame, and under Ours a post draws the
     shot ITS vertical is owed (the conference post wears `K1`, not the festival frame's shot), which
     is the miscasting the route exists to end said on the real page. Five assertions in
     `apply.test.ts` pin every post's rule to `routeOutcome`, pin that the 14 genuinely diverge, pin
     that no slug is a suffix of another (the canonical is matched by suffix, because its origin
     differs between localhost, a preview and production), and pin the route table's blog column to
     the number of licensed rules in the block.
  2. *The candidate was drawn centred and the real card does not draw it centred.* `coverFor` derives
     object-position from the SLUG alone, so a `content` swap leaves it where it was and the wiring
     round's frontmatter edit will not move it either: a candidate lands at the post's own rung of
     the crop ladder. The stage and the sheet drew it at `50% 50%`, which flattered every candidate
     by exactly what the real card takes off its side. Both are drawn at `post.crop` now, on both
     rows, and the file header and the two captions say why.
  3. The two doc comments that claimed the sheet and the block "cannot disagree" (`bridge.ts`) are
     corrected to say what is actually true now, and `decision.ts` carries the note that its `blog`
     column is a number a reviewer can count on the real /blog.
- **Second pass (a read-only review of the first handoff raised three should-fix items, all fixed
  here, none blocking and none outside the lane).**
  1. *Ask 3 still carried round two's pre-rule count.* It read "Licensed ships twelve swaps, Mix
     ships two, Ours ships none", which is the one number this round exists to take back, in the
     first sentence a reviewer reads, under a caption promising every number is computed, two lines
     above its own `because` and directly above the table that contradicts it. Every digit in the
     asks and the route table is interpolated now, and `decision.test.ts` refuses any that the batch
     does not compute (the asks below are re-quoted from the rendered board).
  2. *`MIX_LICENSED` was read in two namespaces at once.* `routeOutcome` matched it against a post's
     candidate; the applied CSS matched it against a manifest id. Both only appeared to work because
     "wedding-rings" and "wedding-arch" name a staged frame AND a manifest entry, and the id
     `wedding-arch` is bridged by `bridge-ceremony`, so Mix pasted bridge-ceremony.jpg onto a page
     the board's own sheet showed wearing wedding-arch.jpg. It was also one edit from silence: a key
     that is not also an id would have sent every post to "ours" and made Mix identical to Ours,
     which is the inert toggle this round claims to have killed. The list is candidate keys now, one
     predicate answers for a post and for an id (`routeOutcomeForId`), `apply.ts` builds all three
     route blocks through it, and three tests pin the namespace, the agreement and that Mix changes
     something. **The correction moves a count: Mix swaps ONE of the twelve ids, not two** (the id
     `wedding-arch` is bridged by a ceremony with people in it, which is not furniture, so it goes
     to the shoot); on the blog, where a post names its own candidate, Mix is still two covers. The
     board, the route table, the spec and this manifest all say the derived numbers.
  3. *The applied-block walk was reported for `/blog` only.* It is now walked on every page in the
     walk row, with the counts under Light QA below.
- ★ **Verified on a LOCAL PRODUCTION BUILD, not on a preview.** Vercel was at its daily deployment
  ceiling for the whole round, so the `lp/media-kit` alias serves round two's build and no push in
  this round produced a deployment, and neither the second nor the third pass called a Vercel API at
  all. The round was walked on `pnpm build` + `next start` in this worktree against the real Supabase
  and R2 (`-p 3112` in the first pass, `-p 3210` in the second, `-p 3211` in the third;
  `pnpm dev -p 3111` during the work). The alias will be
  round three's as soon as a slot frees: confirm by the SHA on the deployment, never by the push
  succeeding (round two's note on how the cap behaves still holds, one slot every 14.4 minutes and
  the next push on any branch takes it).
- Synced with `launch-prep` at `778bdf1` (it had moved one merge past the cut `fb395fe`, the
  brand-voice track's round three, which touches nothing this lane reads; merged in before handoff
  so the tree under test is the integration tree).
- Gates on that tree, re-run after `pnpm format` on the changed files: typecheck ok, lint ok
  (0 errors, 6 warnings, all pre-existing and none in this lane), test ok (1786 in 198 files; this
  track holds 59 across six suites, 25 of them new this round), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md` and nine files under `src/app/(dev)/design/sandbox/media-kit/`
  (`apply.ts`, `apply.test.ts`, `board.tsx`, `bridge.ts`, `bridge.test.ts`, `decision.ts`,
  `decision.test.ts`, `exposure.test.ts`, `shoot.ts`). No exceptions. No production byte changed: `marketing-media.ts`,
  `public/marketing/` and every blog frontmatter are untouched, and `public/design/media-kit/` is
  unchanged from round two (the 22 staged files and `provenance.json`).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Shell / touchpoint change the Orchestrator applies** (no agent edits `touchpoints.ts`), superseding
  round two's proposal: `note` → `The ruling first: four questions with one-word answers, then the
  exposure on the real site, all 23 posts at the blog card's and the share card's real geometry, the
  kit as a call sheet of 36, and four blocks a walk can wear`; `variants` →
  `["The exposure", "Mix", "Ours", "Licensed"]` (the four applied blocks, recommendation first).
- **Assets requested from Will.** Unchanged in substance; round three read the whole asset log and
  found the list is longer on paper and shorter in practice, because one night produces nine of its
  twelve rows.
  - **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences,
    festivals, trips) · 1600 px long edge, a third portrait, one dark warm grade; the call sheet is
    on the board and in `docs/specs/media-kit.md` 5.1, one card per frame, codes `W1` to `T6`, each
    naming the subject, the framing, the light and the crops it must survive. Four are the palette
    board's hard cases (`W5` high key, `W3` low key, `W2` candle warm, `S4` stage cool) and three
    show a guest holding a phone up (`K3`, `S3`, `T4`) · replaces all twelve `MARKETING_IMAGES` by id
  - **24 squares at 512x512**, 6 to 35 KB webp · 1:1 crops of the 24 masters marked `512 square` ·
    `ASSETS.md` row 2
  - **10 portrait crops at 512x640 and 12 portraits at 720x900** · 4:5 recrops of the same masters ·
    rows 9 and 12. **Ten, not row 9's eight**: `hero-burst` raised the count in its round-two handoff
    so no frame is on screen twice on the desktop canvas, and the log still says eight
  - **A hand-and-phone cutout**, PNG with alpha, 1200 px long edge, screen area transparent, two
    grips · the ONE separate setup: the same event, the darkest wall, `K3`'s light · row 8
  - **8 vertical clips with posters**, 3 to 5 s, 1080x1920, silent · filmed between the frames, and
    the film cut from that footage · rows 4 and 1
  - **The light board's worst-case overlapping pair** (row 11) · `W3` and `C1` on the call sheet are
    already that pair, two dark low-contrast frames; they need the intent, not a second setup
  - **The demo event's curated folder** (row 5) · if the shoot is run AS a Partyreel event, the
    guests' own uploads are the seed and the live QR on every hero board points at a real album
- **Proposed `ASSETS.md` changes** (the Orchestrator applies): row 7's `spec` → append `one night
  closes nine of the twelve rows in this log: rows 1, 2, 3, 4, 5, 8, 9, 11 and 12 are crops,
  recrops, cuts or setups of it, and the table is docs/specs/media-kit.md 5.3`; row 9's `what` and
  `spec` → ten portrait crops rather than eight (hero-burst, round two); row 11's `spec` → append
  `W3 and C1 on the media-kit call sheet are this pair already; shoot them knowing they will be laid
  over each other`; row 5's `spec` → append `if row 7's shoot is run as a Partyreel event, the
  guests' uploads ARE this folder`; row 6's `spec` → replace the recommendation clause with `under
  the proposed rule the staged batch fills 10 of the 12 ids and 18 of the 23 posts, not 12 and 21:
  four frames carry a recognisable face with no release, and reception-hall and party-dj are the two
  ids it cannot fill`.
- The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will). **Four,
  not five:** round two asked the route and the bridge separately, and the route decides the bridge,
  so the fifth was the same question in different words. The consequence is on the board as a route
  table instead.
  1. The sourcing rule: author, source, the license clause quoted, a retrieval date and a people
     field required on every manifest entry, and no recognisable face ships without a release.
     Options: Yes or No. This board recommends Yes.
  2. The allowed list: CC0, Pexels, Pixabay, Mixkit and Coverr in; Unsplash and CC BY out. Options:
     Yes or Strike one. This board recommends Yes.
  3. The route, which also decides the bridge: under ask 1 Licensed fills 10 of the 12 ids, Mix
     fills 1 of them now and sends the rest to the shoot, Ours sends all 12. Options: Mix, Ours or
     Licensed. This board recommends Mix.
  4. The kit: 36 masters, six per vertical, shot in one night at a real event running Partyreel.
     Options: Shoot or Park. This board recommends Shoot.
- **Look at first**: the card at the top. It is the whole ruling in four rows, and a reviewer who
  reads nothing else can still answer it. Then press **Licensed** in "Apply to the site" and click
  `/blog` in the walk row (the links carry the key and open in a new tab now): the whole library
  wears the CC0 bridge on the real cards, and every card wears the candidate its own row on the
  sheet names rather than whatever its cover's id is bridged with, so the walk and the board can be
  read against each other line by line. Press **Mix** and walk it again: two covers keep a
  photograph and the other 21 become the shot they are owed, which is the route table's blog column
  standing on the page. Come back, flip the route toggle to **Licensed** on the stage, and read the
  three plates at their real 320x400, each cut at its post's own rung of the crop ladder: a group
  around a fire with `A face, no release` under it, the conference frame that stays empty with the
  reason in it, and a ring detail that is legitimately licensed. That row is the argument in one
  line: the corpus can dress the site and cannot dress the half of it that matters.
- **Light QA.** Walked cold at 1440 on the local production build: every toggle, all three routes
  against both geometries and both viewport modes, and the four applied blocks.
  **The third pass re-walked every page after the block was rebuilt, on `next start -p 3211`.**
  Under **Licensed** all 23 posts land exactly what `routeOutcome` says, checked by computed
  `content` on every rendered card (13 on page 1, 11 on page 2, all 23 slugs covered, zero
  mismatches) and on three article heroes through the canonical rule:
  `/blog/scanned-a-qr-code-where-your-photos-go` wears bridge-ceremony.jpg (its own candidate, where
  the id would have given wedding-golden.jpg), `/blog/qr-code-for-wedding-photos` wears
  wedding-golden.jpg, and the conference post wears the `None` slate. The reviewer's own example is
  the clearest: `/blog/wedding-day-photo-collection-timeline` now wears wedding-arch.jpg at
  `50% 42%`, which is what its row on the sheet shows, rather than bridge-ceremony.jpg centred.
  Under **Mix**, exactly **2** of the 23 covers keep a photograph and 21 wear their shot, which is
  the number the route table promises and one more than the old block could land; the frames on
  every other page still come from the id rules (`/` 117 frames: 9 licensed, 105 slated, 3 reel
  posters no route touches; `/pricing` 26: 2 and 24; `/help` 8: 0 and 8; `/contact` 5: 0 and 5;
  `/features/album` 66: 6 and 59), and `scrollWidth === clientWidth === 1440` on each. The stage and
  the sheet were re-measured the same way: every `today` plate and its `bridge` plate now report the
  same computed `object-position`, across all three routes.
  **Round three's first-pass walk, unchanged:** With **Mix** applied from the board's own button (not by hand into the store) and
  `?key=` carrying the gate, every page mounts the island's `<style data-tuner-candidate="Mix">` and
  wears it. Marketing stills on the page, then the count wearing the licensed ring and the count
  wearing a slate: `/` 114 (9 and 105), `/pricing` 26 (2 and 24), `/help` 8 (0 and 8), `/contact` 5
  (0 and 5), `/blog` 17 (1 and 16), `/blog/qr-code-for-wedding-photos` 7 (0 and 7),
  `/features/album` 68 (7 and 61). With **Licensed** applied, every frame swaps and none slates
  (`/blog` 17 of 17 across 11 distinct staged files, `/` 114 of 114), which is the check that the
  block rebuilt through `routeOutcomeForId` still fills all twelve.
  **One walk finding, recorded rather than fixed:** the footer strip's four ids are in the DOM of
  every marketing page, but the nav mega panel's two (`wedding-toast`, `reception-table`) mount only
  when the panel opens, so a page at rest wears four of the six the board counts in the chrome. The
  exposure count is right; a reviewer just has to open the nav to see the last two wearing the block.
  **The non-marketing half of the round's list stays declined, and the board says why:** no marketing
  still is referenced anywhere under the dashboard, an event page, the admin portal or
  `/e/[qr_token]`, so a block changes nothing there, and `exposure.test.ts` pins it.
  **375 was verified for real this round, not by construction:** the Chrome MCP still cannot
  narrow the window (it reports `innerWidth` 1456 for a 420 px window), but the board loaded in a
  375 px same-origin IFRAME does re-run its media queries, and there
  `documentElement.scrollWidth === clientWidth === 375` at every section, with no element outside an
  `overflow-x: auto` container reaching past 376 px. The route table is the one wide element and it
  sits in its own scroller (736 px table inside a 343 px wrapper, the page still 375). The second
  pass also re-walked the applied block at an emulated 375: `/`, `/blog` and `/pricing` wear it with
  `scrollWidth - innerWidth === 0` on each, so a slate never widens a page. The third pass re-ran
  both: the board in a 375 iframe is 375 wide at eight sampled scroll positions down all 30,799 px
  of it, and `/blog` and `/pricing` at 375 with the Mix block on are 375 wide too, so the per-slug
  rules add nothing to a phone's width. Reduced motion
  is honoured: this board still mints no keyframe and runs no loop, the develop beat's settled state
  lives outside the media query in `marketing.css`, the only rule `board.css` adds is a transition
  delay inside `prefers-reduced-motion: no-preference`, and round three added
  `motion-reduce:transition-none motion-reduce:active:scale-100` to the press feedback on the applied
  blocks, which round two left unguarded. No console message of any kind on the production build, so
  the `useSyncExternalStore` read of the lab key hydrates clean.
- **Findings against a rule** (for Will, not acted on): none against the bible. Five against this
  track's own earlier work, all corrected in place and all now pinned by a test: the Licensed route's
  counts were the counts before the rule the same board proposes; the stage was drawing the wrong
  geometry on the wrong ground while its route toggle was inert between two of its three routes; the
  mix list was read in two namespaces at once, so the board's sheet and the CSS it hands the site
  disagreed about one frame on the recommended route; the block could only ever speak one of those
  two namespaces, so a walk showed the id's answer on 14 of the 21 filled posts and the route table's
  blog column was a number no walk could produce; and the candidate was drawn centred on a board
  whose whole claim is that it draws the real card. The shape of all five is one shape, and it is
  worth saying once: a number or a rule written into a sentence goes stale silently, a list read in
  two places means two things, and a surface that cannot express half of an argument will quietly
  show the other half instead. Each is derived from one function now and refused by a test.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Two rounds turned the media-kit survey into a
surface Will can rule on in four words. Round two found the exposure was the site and not the blog
(the twelve unverified stills are named in 40 production files across 22 routes, six of them in the
footer and nav of every marketing page), that nobody hashed the blog covers (all 23 posts set
`cover:` by hand, so the fix is 23 frontmatter lines), and that a recorded reel re-renders with no
code edit; a second, harder search by scene rather than by keyword staged 22 CC0 candidates and
handed the running site four CSS blocks it can wear. Round three walked the board the way a reviewer
would and found the argument was buried under its own evidence, so the ruling is now the first thing
on the page: four questions with one-word answers, the recommendation marked, each linked to the
section that argues it. Asking the route and the bridge separately was asking one question twice, so
there are four asks and a table of what each route ships. The round's real correction is a number:
the rule this board proposes bars a recognisable face without a release, four of the 22 staged frames
carry one, and so the Licensed route fills ten of the twelve ids and eighteen of the 23 posts rather
than twelve and 21, with the dance floor and the DJ the two it cannot fill. The stage was drawing
440 px plates on the paper ground when the real blog card is 320x400 on a cinema page, and all three
of its posts went to the shoot under the default route, so it opened blank and two of its three
routes looked identical; it is now the real card at the real size with today's row above the route's
row, and a test refuses a stage set that leaves a route flip inert. A review of the handoff found the
same class of fault twice more: the ask a reviewer answers first still quoted the pre-rule count, and
the list of frames the Mix route keeps licensed was read as candidate keys on the board and as
manifest ids in the CSS the board hands the site, so the recommended route pasted a photograph the
sheet did not show. One function now answers a route for a post and for an id, every digit in the
ruling surface is interpolated from the batch, and Mix swaps one of the twelve ids and two of the 23
covers. Reading the whole asset log
closed the cost argument: one night of photography produces nine of its twelve rows, the demo event's
own seed among them, so the shoot is the cheapest item on the list rather than the most expensive.
No production byte changed.

## Handoff (round 4)

- Head `c937549`, pushed, plus the one commit after it that names this line (a manifest cannot name
  its own commit; `git rev-parse origin/lp/media-kit` is the truth). Board at `/design/lab/media-kit?key=`.
  Preview `partyreel-git-lp-media-kit-partyreel.vercel.app`.
- ★ **A fifth pass was asked to strike finding 0c as false. It is not false, and the review that
  called it false used the wrong compiler, so this pass fixed the actual defect instead.** 0c reported
  the board printing "26pulls" / "24marketing pages" but explained it as a JSX rule and planted
  **NEVER `{n} noun`** in `sheet.tsx`; the review disproved the rule with `tsc` and concluded the
  symptom was a DOM-walk artifact. The symptom is real. Next compiles with SWC, not `tsc`, and SWC
  drops the leading whitespace of a JSXText run that both spans more than one source line and holds an
  HTML entity (measured here on Next 16's own bindings over a variant matrix, and confirmed in
  `.next/server/chunks`). **Round four's fix had also never worked:** it moved the glue one word along
  and the board shipped **"24 marketingpages"** for the round. So this pass deleted the false rule and
  the comment carrying it, put `sheet.tsx` back to the plain `{n} noun` shape (correct, and checked in
  the compiled output), fixed the one genuinely affected site in `board.tsx` with an explicit `{" "}`
  plus a note naming the real trigger, rewrote 0c to the measured mechanism, and added a guard in
  `plan.test.ts` that scans both files for the trigger so a prettier reflow cannot glue two words in
  silence. Also corrected: that section's intro count, stale at "seven" once 0c made eight findings.
  **The commit message on `74fa8ea` still carries the wrong explanation and cannot be amended after a
  push; the correcting commit contradicts it by name.** Nothing else moved: no copy, no data, no
  derived number. **Will's 10-second look, if he wants one: the exposure paragraph should read "on all
  24 marketing pages", with a space on each side of the 24.**
- ★ **Verified on a LOCAL PRODUCTION BUILD, not on a preview, and no Vercel API was called.** The
  round's brief said Vercel is capped, so every check below was run on `pnpm build` + `next start` in
  this worktree at 1440 and at 375 (finally `-p 3233`; the port moves because a rebuild swaps `.next`
  under a running server and kills it). The alias will serve this round whenever a slot frees; confirm
  by the SHA on the deployment, never by the push succeeding (round two's note on the cap still holds).
- ★ **Synced with `launch-prep` at `07ad3b2`, which is the correction of a claim the first handoff got
  wrong.** That handoff said the tree under test was the integration tree at `6484558`; it was not.
  `launch-prep` moved to `07ad3b2` (`lab(shell)`: the dock wraps at 375, re-syncs its height, hides the
  pill; `Toggle` takes `wrap`; `Stage`'s wrapper is `min-w-0`) at 05:07, between this track's merge at
  05:04 and its handoff commit at 05:09, so the round was signed off against a shell one commit stale,
  and that shell commit lands exactly on the surface this board's 375 fix works around. It is merged now
  and everything below was re-measured on it. The lesson for the next round is the cheap one: re-read
  `origin/launch-prep` at the moment of the handoff, not at the moment of the merge.
- Gates on that synced tree, re-run whole at the corrected head: typecheck ok, lint ok (0 errors, 6
  warnings, all pre-existing and none in this lane), test ok (1823 in 200 files; this track holds 78
  across 7 suites, 19 of them new this round in `plan.test.ts` plus 3 rewritten in `decision.test.ts`),
  build ok (248 static pages). The extra test over the previous handoff is the JSX-run guard in 0c.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md` and eight files under `src/app/(dev)/design/sandbox/media-kit/`
  (`board.tsx`, `catalogue.ts`, `decision.ts`, `decision.test.ts`, `plan.ts`, `plan.test.ts`,
  `sheet.tsx`, `sources.ts`). No exceptions. **No production byte changed and nothing was added to
  `public/`:** `marketing-media.ts`, `public/marketing/` and every blog frontmatter are untouched, and
  `public/design/media-kit/` is unchanged from round two (the same 22 staged CC0 files and
  `provenance.json`). Round four copied nothing into the repo at all, which is the point of it.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none

### The goal, item by item (and the one item that was not delivered whole)

- (1) **Sources, not picks**: delivered. 13 catalogues, each with URL, licence clause quoted verbatim,
  price, coverage, release position, verdict, and a contact sheet where one can be drawn.
- (2) **The rule stays**: delivered. Release-held is the sort key and the bar; `plan.test.ts` asserts
  the ordering rather than trusting the array.
- (3) **"The dock carries the vertical and the source filter"**: **HALF DELIVERED, AND THE HALF THAT IS
  NOT IS A DECISION.** The dock carries Vertical, Route and Geometry plus the Apply cluster. The Source
  filter is NOT in the dock: it sits beside the surface check, where it started. The reason is the same
  round's global note (a), which puts every PAGE-WIDE switch in the dock and keeps a control that
  changes ONE specimen beside that specimen. Source drives only the surface check's single stage, and
  nothing else on the page moves when it changes, so docking it would make the dock advertise a reach it
  does not have, and it would push a 7-option row into a dock that already wraps to 232 px at 375. The
  vertical, which every contact sheet on the page obeys, IS docked, and that is the half of the item
  that was about back-and-forth comparison. A caption under the surface check says this on the board so
  a reviewer hunting the missing switch finds the answer without the manifest. **If Will reads the item
  literally rather than by its stated purpose, this is a one-line change and the board should take it**;
  it is written up here rather than quietly dropped, which is what the first handoff did.
- (4) **The spec gains the sourcing sheet**: delivered, `docs/specs/media-kit.md` section 8 (8.1-8.5),
  plus the asset-log rows proposed below.

### Shell changes asked for (the Orchestrator lands them)

1. ~~**`BoardDock`'s height sync is dead after first paint.**~~ **WITHDRAWN, it is already landed.** The
   first handoff asked for this against a `launch-prep` that had already fixed it: `07ad3b2` adds a
   `requestAnimationFrame`-deferred re-sync and a `resize` listener to `dock.tsx`, which is the fix that
   ask described. Re-measured on the merged tree: the dock is 89 px, `--board-dock-h` is 89 px,
   `scroll-padding-top` is 97 px, and all four "See it" links land their section at `top: 97`, i.e. 8 px
   under the dock. **The "four links land 210 px low" defect reported in the first Light QA is gone, and
   the Orchestrator should not act on it.**

   ★ One real residue, and it is the reason that ask read as a live bug at all: the stale value only
   appears when the board first paints in a **background tab**, where the lab lays out in its narrow
   sidebar cell and no resize ever fires. Measured here: `document.hidden === true`, dock 89 px,
   variable stuck at 350 px, and one synthetic `resize` event corrected it to 89 px instantly. A human
   opening the lab in a foreground window never sees it, which is why this is reported as a note rather
   than an ask. If the Orchestrator wants it closed anyway, a `visibilitychange` listener next to the
   existing `resize` one in `dock.tsx` is the whole fix. This is the `testing-verification.md`
   blind-spot in its purest form: the tooling, not the product, produced the number.

2. **`touchpoints.ts` still carries round three's note and variants for `media-kit`** (no agent edits
   that file). Proposed: `note` → `Where the frames actually come from: thirteen real catalogues
   ranked by whether they hold a release, each with its clause, its price and a contact sheet of its
   own thumbnails, and a plan that totals $56`; `variants` → `["The sheet", "The plan", "Mix",
   "Ours"]`.

### Assets requested from Will

★ **The first item is not an asset, it is a purchase, and it is the only line Will can complete
tonight with a card instead of a camera.** Everything under it is unchanged from round three.

- **One month of Unsplash+ ($20) and 3 iStock Essentials frames for the conference rooms ($36),
  $56 in total** · download to the call sheet's codes inside the month and stage the files the way
  the CC0 batch was staged, under `public/design/media-kit/`, with the same six provenance fields ·
  replaces the CC0 bridge, which ask 1 bars on four of its 22 frames
- **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences, festivals,
  trips) · 1600 px long edge, a third portrait, one dark warm grade; the call sheet is on the board
  and in `docs/specs/media-kit.md` 5.1, codes `W1` to `T6`. Four are the palette board's hard cases
  (`W5`, `W3`, `W2`, `S4`) and three show a guest holding a phone up (`K3`, `S3`, `T4`) · replaces all
  twelve `MARKETING_IMAGES` by id
- **24 squares at 512x512**, 6 to 35 KB webp · 1:1 crops of the 24 masters marked `512 square` ·
  `ASSETS.md` row 2
- **10 portrait crops at 512x640 and 12 portraits at 720x900** · 4:5 recrops of the same masters ·
  rows 9 and 12
- **A hand-and-phone cutout**, PNG with alpha, 1200 px long edge, screen area transparent, two grips ·
  the ONE separate setup: the same event, the darkest wall, `K3`'s light · row 8
- **8 vertical clips with posters**, 3 to 5 s, 1080x1920, silent, and the film cut from that footage ·
  rows 4 and 1. **Round four priced the alternative and it is the round's second number:** the only
  clip licence on the sheet whose grant survives cancellation is Artgrid at **$299 a year**, more than
  every photograph in the plan put together, so this is the one row a licence cannot make cheaper
- **The light board's worst-case overlapping pair** (row 11) · `W3` and `C1` are already that pair
- **The demo event's curated folder** (row 5) · if the shoot runs AS a Partyreel event, the guests'
  uploads are the seed

### Proposed `ASSETS.md` changes (the Orchestrator applies; no agent edits that file)

- Row 7's `spec` → append `round four priced the licensed alternative: one month of Unsplash+ plus
  three iStock frames is $56 for every still, and the only clip licence that survives cancellation is
  $299 a year, so the money in this log was never in the photographs. The sourcing sheet is
  docs/specs/media-kit.md section 8.`
- Row 6's `spec` → append `and round four found the refusal was of a TIER: Unsplash's FREE licence
  excludes recognisable people, Unsplash+ is model and property released with a $10,000 warranty and
  a perpetual grant on anything downloaded inside a paid month. The staged CC0 batch is the bridge
  only until that month is bought.`
- Rows 1 and 4's `spec` → append `licensing these instead is $299 a year (Artgrid, the only clip
  grant on the sheet that survives cancellation); shooting them is cheaper and it is the one asset a
  licence cannot stand in for.`

### The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will)

**Four, and two of them are new.** Round three asked for a yes to a LIST of licence names; Will's note
asked for places, so the sheet ranks thirteen catalogues instead and that ask is gone. Round three
also asked for the route; round four answers it rather than re-asking (it is still Mix, and only the
source of Mix's licensed half changed), so the question it actually needs is the money.

1. The sourcing rule: author, source, the license clause quoted, a retrieval date and a people field
   required on every manifest entry, and no recognisable face ships without a release. Options: Yes
   or No. This board recommends Yes.
2. The bridge, bought rather than scavenged: one month of Unsplash+ plus 3 iStock frames for the
   conference rooms, $56 in total, staged the way the CC0 batch was. Options: Buy or Hold. This board
   recommends Buy.
3. Does the release rule bind every face, or only a frame's subject? A crowd shot is full of
   recognisable people and none of them is the picture. Options: Subjects only or All faces. This
   board recommends Subjects only.
4. The kit: 36 masters, six per vertical, shot in one night at a real event running Partyreel.
   Options: Shoot or Park. This board recommends Shoot.

### Look at first

**The plan card, second block on the page.** It is four lines of money and it is the whole round: one
month of Unsplash+ at $20 covers all five verticals, three iStock frames at $36 cover the conference
rooms nothing else can, and $56 is the total. Then read the three lines under it, especially the
middle one: $299 a year is what the FILMS would cost, which is more than every photograph above, and
that asymmetry is why the recommendation buys the stills and shoots the rest.

**Then the first card on the sheet, and look at the twelve frames on it before you read a word.**
Until this morning that card was blank, with a sentence where the photographs are now: the board was
asking for $20 on a catalogue it showed nothing of, because an unmeasured claim that the paid tier
needs an account had been sitting there since the sheet was built. It does not. Those are the frames
the money buys, on whichever vertical the dock is set to. **Then** read the release note underneath.
Unsplash was refused in round one on the sentence that excludes recognisable people, and three rounds
were built on that refusal. It is the FREE licence. Unsplash+ is a different agreement on the same
site whose entire product is that clause removed: model and property released, a $10,000 warranty per
photo, perpetual for anything downloaded inside the month. Nobody had looked at the paid tier of the
site the first round ruled out, and then nobody had looked at its catalogue either.

**Then set the dock to Corporate and conferences and scroll to card 7, Web Summit's Flickr archive.**
87,066 CC BY 2.0 photographs from one account, which is the best free catalogue that exists for the
one vertical our corpus cannot fill at all. Look at the twelve frames rather than the numbers: they
are real conference floors, full of recognisable faces AND full of Meta and Huawei booths at full
size, which is a second bar nobody had thought of before the sheet drew them. It is free, it is
better than anything the money buys, and ask 3 is the ruling that decides whether it is a source or a
footnote.

### Light QA

**Re-walked from scratch on the merged tree** (`launch-prep` `07ad3b2` in), on a local production build
(`pnpm build` + `next start -p 3233`), at 1440 and at 375. No Vercel API was called and no preview was
used. Everything the first handoff measured on the stale shell was thrown away and taken again.

- **1440.** `documentElement.scrollWidth === clientWidth === 1456`. The dock's Vertical filter drives
  every contact sheet at once. The dock measures 89 px, `--board-dock-h` agrees, and the four "See it"
  links land their section at `top: 97` (8 px clear). Zero console messages of any kind.
- **The sheet.** 26 contact sheets, 308 frames. Unsplash+ is rank 1 and now draws its own 12-frame
  sheet on each of the five verticals; the other six blanks each print their own measured reason.
- **The surface check at 1:1.** Three real 320x400 blog cards at the three rungs of the crop ladder and
  the 1200x630 share card, each at exactly those pixels. It now defaults to Unsplash+, which is also the
  source the plan recommends buying, so the first specimen a reviewer sees is the one being argued for.
- **375, measured in a 375 px same-origin iframe, and this is a disclosed limitation.** The Chrome MCP
  cannot narrow this window: `resize_window` to 375x812 reports success and `innerWidth` stays 1456, so
  the iframe (which does re-run the media queries) is the honest instrument available. In it:
  `scrollWidth === clientWidth === 371` at six sampled positions down all 22,146 px of the page, and a
  walk of every element in the document found **zero** wider than the viewport outside an
  `overflow-x` container. The dock wraps to 232 px and `scroll-padding-top` follows it to 240 px.
- **The dock's row wraps; the surface check's row still scrolls, and that difference is measured.** The
  dock's switches sit in the shell's `basis-full` cell, whose `min-w-0` applies only from `sm` up, so a
  sideways scroller there still widens the page: they use the shell's new `wrap` option instead. The
  surface check's 7-source row has a parent with a definite width, so its scroller is contained (339 px
  visible over 674 px of content) and costs no page width.
- **Reduced motion is honoured, and this board still mints no keyframe and runs no loop.**
  `document.getAnimations()` returns **0** running animations on the loaded board. `board.css` is
  untouched and still adds exactly one rule, inside `prefers-reduced-motion: no-preference`.
- ★ **What the tooling could NOT tell me, stated rather than glossed.** The Chrome MCP drives a
  BACKGROUND tab, and Chrome defers image loading in one: every tile reports `complete === false`
  forever, so "all 308 tiles load" cannot be proved by polling `naturalWidth` here (it reports 0 dead
  and 115 pending, which means nothing). What IS evidence: all 308 thumbnail URLs plus 60 photo pages
  and 5 search pages were confirmed by `curl` to answer 200 with an image content type behind a
  `partyreel.com` referer, and the screenshots taken during the walk show the frames painted on both
  the sheet and the surface check. The same background-tab deferral is what produced the withdrawn
  shell ask above. **Will's 10-second look, if he wants one: open the board and confirm the tiles on
  card 1 are photographs rather than empty slates.**

### Findings against a rule

None against the bible. Eight against this track's own earlier work and one against a source, all
acted on. **The first three were found by reading the round after it called itself done (0a and 0b by
a review of the handoff, 0c by a review of the fix that closed them and then by measuring what both
of those passes had each asserted without rebuilding), and they are the three worth reading:**

0a. ★★ **The board printed a false technical claim on 7 of its 13 cards, and it contradicted the card
   standing next to it.** Every source with no contact sheet shared one categorical slate: "This
   catalogue answers a non-browser client with a 401 or a 403." It was true of three. Stocksy and
   Artgrid were only ever described as unreadable; Death to Stock carried a described catalogue; and
   **Coverr's own card, one column to the left of that slate, reports a measurement taken off the very
   search page the slate said had refused** (70 clips, 23 of them AI, plus 34 iStock results), the
   measurement finding 4 below is built on. On a board whose entire thesis is "drawn, not described", a
   shared excuse is the one thing a blank must not carry. Every reason is now measured per source and
   printed per card, and `plan.test.ts` fails a source that has neither a sheet nor its own reason, or
   two sources sharing one.

0b. ★★ **Writing those seven reasons out separately is what proved one of them false, and it changed
   the round's own recommendation from "described" to "drawn".** Unsplash+ was blank on the claim that
   the paid tier sits behind an account. Nobody had ever measured it.
   `unsplash.com/s/photos/<q>?license=plus` answers a plain client with the plus results: 20 released
   frames on every one of the five verticals. **The one source the plan asks Will to spend money on was
   the one source the board showed nothing of**, purely because an unchecked sentence sat where a
   measurement belonged. It now draws 60 frames, 12 per vertical, and the sheet went from 21 sheets /
   248 frames to 26 / 308. The general lesson is the round's own turned back on itself: an unverified
   claim about why something CANNOT be shown is the same failure as an unverified claim about what it
   contains, and it is harder to spot because it looks like diligence.

0c. ★★ **A real rendering defect, a wrong explanation, a wrong disproof, and a fix that moved the
   bug instead of removing it. Four passes touched this line and only the build knew the answer.**
   Round four saw the board print "26pulls" and "24marketing pages", which was TRUE and is the only
   part of the story that survived. It explained the symptom as "JSX drops the space after `{n}`" and
   wrote a ★ rule into `sheet.tsx` saying **NEVER `{n} noun`**, three lines under an h2 that does
   exactly that and renders correctly. The review that followed transpiled the pre-fix sources with
   the repo's `tsc`, saw the space preserved, and called the whole finding false. **Both were wrong,
   and acting on either alone ships a visible defect:** the rule is not real, but the bug is, and
   `tsc` cannot see it because Next does not compile with `tsc`. Measured this pass by driving Next
   16's own SWC bindings over a variant matrix: **SWC drops the leading whitespace of a JSXText run
   that BOTH spans more than one source line AND contains an HTML entity.** One line with an entity
   is fine, two lines without one are fine, two lines with `&ldquo;` anywhere in the run glue the
   words. That is why exactly one site on this page was ever broken and five identical `{n} noun`
   shapes beside it were always correct. Worse, round four's own fix never worked: `` {`${N}
   marketing`} pages `` compiles to `` `${N} marketing` `` followed by `"pages before…"`, so the board
   spent the round printing **"24 marketingpages"** instead, one word further along, and neither the
   fix nor the review caught it because neither rebuilt and read the rendered text. Now: the one
   affected site carries an explicit `{" "}` and a note naming the trigger, `sheet.tsx` is back to the
   plain shape and verified in the compiled chunk, and `plan.test.ts` scans both files for the trigger
   so prettier cannot reflow a safe run into a broken one in silence. The lesson is not about JSX.
   **A claim about what a page renders is settled by reading what the page rendered.** Two passes
   argued it from transpiled source, one of them with the wrong compiler, and the answer was sitting
   in `.next/server/chunks` the entire time.

1. ★ **The refusal that shaped three rounds was of a TIER, not of a company.** Round one read
   Unsplash's free terms, found the sentence excluding recognisable people, marked the source
   refused, and no round since re-opened it. The paid tier is a separate agreement whose entire
   product is that clause removed, at $20 for a month, and it makes the whole bridge buyable. The
   general lesson is worth carrying: a source was ruled out by reading ONE of its licences.
2. ★ **A licence is not a source, and round three's survey ran them together.** Its top row was
   "CC0 1.0", a legal instrument rather than a catalogue with photographs in it, which is precisely
   why it could not answer "where do I get a wedding" and why Will's note had to ask again. `SOURCES`
   and `LICENCES` are separate exports now and `plan.test.ts` refuses anything that appears in both.
3. ★ **Ranking by price hid that the free half is not cheap, it is unusable.** Under the rule this
   board proposes, a library with no release cannot supply a frame with a face in it, and faces are
   the only frames this product wants. Seven of the thirteen places sit below a line for that one
   reason, and the test asserts the rule rather than trusting the order the array was typed in.
4. ★ **A licence is read once and a catalogue moves continuously.** Round one marked Coverr allowed
   on its terms, which are generous and irrevocable and still true. Measured this round: a search for
   `party` returns 70 Coverr-hosted clips of which 23 are `user-ai-generation` uploads, served on the
   same page as 34 iStock results under no Coverr licence at all; `wedding` returns 58, 24 of them AI,
   with the same 34. Nothing about the licence changed.
5. **A conference floor is a wall of other companies' trademarks**, which the Web Summit contact
   sheet shows and no amount of licence reading would have. It is a second bar on the free conference
   corpus, independent of the release one, and it only appeared because the board draws the catalogue
   instead of describing it.
6. **`next/image` is wrong for a sourcing board, and not because it cannot do it.** It would proxy
   every thumbnail through our own optimizer, putting a cached copy of another company's watermarked
   comp on our infrastructure, which is the one thing a board arguing about licensing must not do
   quietly. Plain `<img>` from the source's own CDN, with a labelled slate on error. Related and said
   on the board in red: iStock serves its comps **unwatermarked** at 612 px, so a plate can look
   finished when it is not, and both surfaces now say plainly that nothing here is licensed to us.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Will's note reopened the media-kit track on a
different question, where the frames come from rather than which twelve to pick, and the board became
a sourcing sheet: thirteen real catalogues, ranked by whether they hold a model release rather than by
price, each with its licence clause quoted word for word, its price with a number in it, and a contact
sheet of its own thumbnails hotlinked from its own CDN so that nothing paid was copied into the repo.
Twenty-six sheets and 308 frames were harvested from the sources' public search pages and every URL
confirmed live; the six that cannot be drawn say why on their own cards, in four different ways (a 403,
an empty client-rendered shell, a members' wall, and one that read perfectly and failed on what it
returned) rather than sharing one excuse. Writing those reasons out per source is what caught the round's
own worst error: a seventh card had been blank on an unmeasured claim that Unsplash+ sits behind an
account, the plus-filtered search reads fine from a plain client, and the source the plan actually asks
Will to buy now draws 60 of the frames instead of explaining why it could not. The round's finding is that the refusal at the heart of
three rounds was of a TIER and not of a company: Unsplash's free licence excludes recognisable people,
which is what disqualified the twelve stand-ins, and Unsplash+ is a separate agreement on the same site
whose entire product is that clause removed, model and property released with a $10,000 warranty per
photo and a perpetual grant on anything downloaded inside a paid month. So the bridge that three rounds
called unbuyable costs $56: one month at $20 for all five verticals, plus three iStock frames at $36 for
the conference rooms no subscription is deep in. The films are the other number and they point the other
way, at $299 a year for the only clip licence that survives cancellation, which is more than every
photograph put together and is why the recommendation buys the stills and shoots the rest. Two more
things the sheet found rather than reasoned: Coverr, marked allowed in round one on its licence text,
now returns 23 AI generations and 34 iStock results in a single page of its own search, so a licence is
read once and a catalogue moves continuously; and the 87,066 CC BY conference photographs in Web
Summit's Flickr archive, the best free catalogue for the vertical we cannot fill, are a wall of other
companies' trademarks as well as unreleased faces. The asks are four again, two of them new: the rule,
the $56, whether a crowd counts as a subject, and the shoot. No production byte changed and nothing was
added to `public/`.

## Handoff (round 5)

- Head: the tip of `lp/media-kit`, pushed (`git rev-parse origin/lp/media-kit`; a manifest cannot name
  its own commit). The last commit that changes what the board draws is `71eba9de`; the ones after it
  are the second `launch-prep` merge and this file. **No preview**: Vercel is over its monthly
  deployment storage and the wave's previews are off, so this push says nothing about `[preview]` and
  builds nothing. The board is at `/design/lab/media-kit` on a dev server, and on the `launch-prep`
  alias when the Orchestrator builds it once at the close.
- **Synced with `launch-prep` twice, and the second sync is the one that counts: `55e74015`.** The
  first, at `a489d563`, brought home-hero and river-visual onto the kit, gave the two glow boards
  specs, and taught the kit's `answer.tsx` to land an anchor once rather than twice. The second brought
  album-hero, floating-surfaces and brand-voice, the Vercel storage round's
  `scripts/vercel-ignore-build.mjs` (an `lp/*` push now builds nothing unless its message says
  `[preview]`, and this handoff push deliberately does not) and the `lab-review.mjs` fix below. Five
  conflicts across the two merges, every one the adjacent-line kind the wave predicted, every one
  resolved by keeping BOTH sides: `registry.ts` (the import and the `BOARDS` entry, `MEDIA_KIT` after
  `BRAND_VOICE`, which is `touchpoints.ts`'s own order), `(shell)/lab/boards.ts` (three entries in one
  hunk: theirs drop `legacy` from floating-surfaces and brand-voice, mine from media-kit) and
  `kit-discipline.test.ts` (`LEGACY` is down to `palette` and `type-scale`). The whole gate was re-run
  on each merged tree.
- Gates on the merged tree, re-run in full after the second merge: typecheck ok, lint ok (0 errors, 6
  warnings, all pre-existing and none in this lane), test ok (2140 in 218 files; this track's eight
  suites hold 78), build ok (257 static pages), `pnpm lab:smoke --base http://localhost:3418` ok (314
  checks, 0 failing). The board re-checked on that tree at 1440: eleven anchored sections, no document
  overflow, no running animation.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md`, the twelve files under `src/app/(dev)/design/sandbox/media-kit/`, and the
  **three registration lines the wave allows, declared here as the only exceptions**:
  `src/app/(dev)/design/sandbox/registry.ts` (the spec imported and added to `BOARDS`),
  `src/app/(dev)/design/(shell)/lab/boards.ts` (`legacy: true` dropped from the `media-kit` entry) and
  `src/components/lab/kit-discipline.test.ts` (`"media-kit"` deleted from `LEGACY`). Nothing else
  outside the lane. No production byte changed: `marketing-media.ts`, `public/marketing/` and every blog
  frontmatter are untouched, and nothing was added to `public/`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

### ★ One shared-file change, found here and already landed on `launch-prep` at `9ab89cdd`

**Nothing is asked for: the fix below is in the tree this branch merged.** It is written out in full
because the reasoning is worth keeping and because the guard that would stop it coming back is still
owed by the lab-shell lane.

`scripts/lab-review.mjs` could not read a spec whose `defineBoard` import is followed by another NAMED
import. It finds the board object as the first `{` after the first occurrence of `defineBoard`, and the
first occurrence is the import itself, so `import { BRIDGE } from "./bridge"` on the next line is read
as the board: no asks are found and every ruling on that board is refused with `"rule" is not an ask on
media-kit ()`. Measured, not inferred: `readSpec` returned 0 asks for this board and 9 for `light`,
whose spec has exactly one import. The patch is one line, in `readSpec`:

```js
-  const open = masked.indexOf("{", masked.indexOf("defineBoard"));
+  // The CALL, not the import: `import { defineBoard }` puts its brace before
+  // the word, so the first `{` after the first occurrence is the NEXT named
+  // import's brace, and the import list is then parsed as the board.
+  const open = masked.indexOf("{", masked.indexOf("defineBoard("));
```

It is a no-op for every spec standing today (verified before the merge: the brace offset was identical
for glow-doctrine, glow-moments, home-hero, light, media-kit, river-visual and rounding) and it fixes
the shape above, verified on a synthetic spec. It landed on `launch-prep` at `9ab89cdd` in exactly that
form while this round was running. This board keeps every number it interpolates behind ONE brace-free
default import (`sandbox/media-kit/facts.ts`) anyway, because that was what made its ledger work before
the fix and it costs nothing now; `facts.ts` records why. **Still owed, and the reason this stays in the
record:** a test in the lab-shell lane pinning the reader to a spec with two named imports. Without one,
the reader can regress and the only symptom is a board whose rulings are silently refused.

- **A ledger note.** Three of the four asks kept their ids (`rule`, `spend`, `crowds`, `kit`) and all
  four changed their OPTION tokens, because the ledger's grammar is `<ask>=<option>` and a space ends
  the clause: round four's `Subjects only` could never have been recorded. They are `yes|no`,
  `buy|hold`, `subjects|all-faces` and `shoot|park` now, lower case like the pilots'. Nothing is in
  `docs/reviews/` for this board yet, so nothing has to be migrated.
- **`touchpoints.ts` needs no change** (and this track never edits it). Its `note` and `variants` are
  what the desk shows for a board WITHOUT a spec; this board has one now, so the desk reads the verdict
  and the asks instead, and the entry can be left exactly as it is.
- Assets requested from Will: unchanged from round four in substance, and now carried as data in
  `spec.ts` (`assets`), in the fixed `what / spec / replaces / row` shape the `BoardMeta` panel renders
  and the Orchestrator folds: the $56 purchase (a card, not a camera), the 36 masters (row 7), the 24
  squares (row 2), the portrait recrops (rows 9 and 12), the hand-and-phone cutout (row 8), the 8
  vertical clips and the film (rows 4 and 1), the deliberately overlapping pair (row 11) and the demo
  event's curated folder (row 5).
- **Proposed `ASSETS.md` changes**: none new. Round four's are unapplied or applied as the Orchestrator
  judged; this round changed no asset, no count and no price.
- The asks, verbatim from the spec (the Orchestrator quotes them under Waiting on Will; the desk already
  queues all four):
  1. **The sourcing rule** (`yes` / `no`, recommended **yes**). Author, source, the clause quoted, a
     retrieval date and a people field on every entry, and no recognisable face without a release.
  2. **The bridge, bought rather than scavenged** (`buy` / `hold`, recommended **buy**). One month of
     Unsplash+ plus 3 iStock frames for the conference rooms, $56 in total.
  3. **Does the release rule bind every face, or a frame's subject?** (`subjects` / `all-faces`,
     recommended **subjects**). Answer `all-faces` and the free half of the sheet is decoration.
  4. **The kit, shot in one night** (`shoot` / `park`, recommended **shoot**). 36 masters, six per
     vertical, at a real event running Partyreel.
- **Look at first**: press **Look first** in the dock and take the seven steps. They are the walk this
  board has always wanted a reviewer to take and could never make executable: the plan, the sheet
  filtered to corporate and conferences (watch the cards that flag they have nothing for it), the same
  frames at the real card size, the four blocks with `/blog` open in a second tab, then the bridge at
  Licensed and at Mix on the same posts, and the call sheet. Each step sets the state it was written in,
  so the note and the specimen can no longer disagree.

### Light QA (a lab-only round; the red-team belongs to the wiring round)

- The board on `http://localhost:3418` at **1440 and 375, dark and light**, on the merged tree.
  Measured rather than eyeballed: `documentElement.scrollWidth === clientWidth` at both widths (375 and
  375; 1440 and 1440), so the document never scrolls sideways; the widest box on the page at 375 is a
  Stage's 1440 canvas inside its OWN scroller, which is the round-four note's stated correct behaviour.
  All eleven sections carry their anchor, there are no duplicate ids, and a section reached by its hash
  clears the dock (`media-kit-record` top 294, dock bottom 150).
- **Reduced motion is honoured by construction, and it was checked rather than assumed**:
  `root.getAnimations({subtree: true})` returns 0 and no element on the board has a computed
  `animation-name`. The board mints no keyframe and runs no loop; `board.css`'s only motion rule is the
  develop transition-delay inside `prefers-reduced-motion: no-preference`, so a reduced-motion reader
  gets the settled composition with nothing to undo.
- **A copied link reopens the same canvas, candidate and section**, verified:
  `?canvas=phone&route=licensed&vertical=corporate&geometry=share#media-kit-bridge` restores all four
  controls on the board's root and lands on the bridge.
- **The review panel's message parses.** Composed on the board
  (`review media-kit r5: rule=yes "..."; spend=buy; crowds=all-faces; kit=shoot; note: "..."`) and run
  through `node scripts/lab-review.mjs --root <scratch>` against a COPY of `docs/reviews/` in the
  scratchpad: five clauses recorded, nothing written to the repo (`git diff` over `docs/reviews` is
  empty).
- **`/design/lab` queues the board's four asks** with their recommended words, and the desk's count went
  from 14 waiting to 18.
- **Two tooling blind spots, neither a board defect**, both isolated before they could be "fixed":
  1. **The walk's scroll does not animate under automation.** `scrollIntoView({behavior: "smooth"})`
     moves nothing in an automation-driven tab (`scrollY` stays 0 across all seven steps) while
     `behavior: "auto"` scrolls to the pixel, in BOTH the browser pane and the Chrome extension, with
     `prefers-reduced-motion` reporting false. The light pilot behaves identically on the same server,
     which is what settles it: the compositor's scroll animation does not advance for a tab that is
     never painted. The state half of every step was verified instead, and it is correct.
  2. **The window cannot be narrowed through the Chrome extension** (it reported `innerWidth` 500 after
     a successful-looking resize to 1440), which is round two's finding in this manifest, unchanged. The
     375 pass was taken on the browser pane's per-tab viewport emulation, which is real.

### Findings against a rule

None against the bible. Three against this board's own tests and documents, all closed in the lane:
the review ledger could not read this spec at all (above); `board-jsx.test.ts` named two files and the
board is four since the split, and widening it immediately caught a real glued count
(`{CANDIDATES.length} staged` with an entity later in the run, which SWC renders as "22staged"); and
`docs/specs/media-kit.md` was still printing round three's asks as a table, which is the second copy the
spec now replaces.

## Record (round 5; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The media-kit board moved onto the lab kit's
template and became two files: `spec.ts`, which is the question, the verdict, the four one-word calls,
three candidates, seven departures and eight assets as pure data, and `board.tsx`, which is the
evidence per declared section and nothing else. Round four's `details` fold, which hid five sections
behind one summary so the answer could come first, is gone: the template answers first, indexes the
whole board and folds each section's own argument under the evidence it belongs to, and the board is
25,600 px rather than round three's 30,800. Four page-wide switches became declared state, so the dock
renders them, a walk step sets them and a pasted link reopens the exact canvas, route, geometry and
section; the two per-stage viewport toggles became one canvas; the four applied blocks became the kit's
own Apply with the dock's badge. Applying this board's oldest rule to the spec, that a count is computed
and never typed, found the last two places that still broke it, both in the route table's blog column.
Two guards were repaired on the way: the review ledger could not read a spec whose `defineBoard` import
is followed by a named import, and refused every ruling on this board until its numbers came through one
brace-free import; and the JSX count guard named two files when the board is four, which hid a real
glued count. No candidate, number or recommendation changed, and no production byte.
