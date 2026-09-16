---
track: type-scale
status: open
cut: "be1638f2"          # round 6, the clarity round, cut from launch-prep
cut_round_5: "c473707"
merged_round_5: "ae5f1efc"
merged_round_4: "9b8af70d"
merged_round_3: "3faf6ad"
merged_round_2: "c97d799"
merged_round_1: "5186fb8"
preview: false          # no branch preview: the round reviews on a local pnpm dev after integration
owns:
  - src/app/(dev)/design/sandbox/type-scale/
  - docs/specs/type-scale.md
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

# lp/type-scale

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

**This board.** Four asks. `b | c | a | today` are four heading ladders: label each by its idea
("B, rungs: one set of sizes from 12 to 160", "C, registers", "A, tuned", "Today, as shipped") and
gloss "ladder", "rung", "leading" and "tracking" in `context`; the `marketing` and `app` controls
mirror the two ladder asks with the same ids, so wire `control` on both and make their labels the
asks'. `adopt | keep` (the tracking law) and `on-ladder | leave-off` (the 404's heading) each get a
label in words.

**Verify on.** The gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, each green); the board
at 1440 and 375 on a local `pnpm dev` (`/design/lab/type-scale`), reduced motion honoured, every evidence
section showing the options' words; the desk's session on this board (`/design/lab?session=type-scale.marketing`)
read cold, as a stranger; `pnpm lab:review --dry 'review type-scale r5: <ask>=<option id>'` accepting one
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

**Goal.** The type scale board onto the kit, with Will's round-four ruling kept in the spec: the marketing scale
and the app scale are chosen separately (two asks, two controls), the configurator lives in the dock, 1:1
is the only size. `TheAnswer` becomes the template's Answer, `Glance` becomes the kit's `SelectTable`,
`PageFrame` becomes `Frame` with the kit's settle, the measured line counts use `useLineCount`; the spec
doc (`docs/specs/type-scale.md`) loses its "asks, one word each" block since the spec carries the asks.

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

**Verify on.** `/design/lab/type-scale` on your dev server at 1440 and 375, light and dark, reduced motion;
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

**Will's notes on this board, verbatim.** "This is currently un-reviewable with the iframes because, despite
it maintaining the same scale at a smaller size, I can't actually judge the font sizes in usage themselves
scaled down." "I'd also like a fixed configurator for easier comparisons per UI section, as well as more UI
previews themselves." "Marketing and app will have different type scales. Your call on separating them into
two distinct sets or combining them all into one. I'd like to select them separately in the lab."

**Round 4 (the goal).** (1) **1:1 everywhere.** Every stage and every page on the board renders at true
pixels (the shell does this by default now; remove any scaling of your own; a 1440 page scrolls sideways on
a narrow window and that is correct), so a size is judged at the size it ships. (2) **Two ladders, chosen
separately.** The dock carries a marketing ladder switch and an app ladder switch, so any marketing
candidate pairs with any app candidate; "Apply to the site" hands the site the pair. Your call, argued on
the board and in the spec, whether the proposal is two distinct token sets or one set with two registers;
the lab selects them separately either way. (3) **More real UI.** The judged surfaces are whole real pages
and live production components: the home arc top to bottom, a feature page, /help and a help article,
/pricing, the dashboard, an event page, the guest album, admin, each at 1440 and 375, each re-laid by the
selected pair; a comparison per section is a flip of the dock beside that section, never a scroll to the
top. (4) Keep round three's answer block, the glance table and the pastes; recompute anything the 1:1 change
or the two switches move. (5) **The dock** for every page-wide switch.

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

**Round 2 (the goal).** The board named the ladder and its three faults; now put the candidates on
the real pages. (1) **Apply to the site**: the board already drives the production components through
three custom properties in its own sheet; turn each ladder into a candidate block that targets the
real components' own classes and hooks on the real pages (find the selectors `PageHero`,
`SectionShell`, `PageHeading` and the card title actually render; if a component exposes no hook, say
in Handoff the one-line hook the wiring needs and target what exists), with the tracking law inside
the block, so Will walks the home arc, a feature page, `/help`, the dashboard and an event page under
A, B and C. (2) **The app's missing middle**, judged on real app compositions (the dashboard, the
event page, an admin page built from production components), including the two h2 idioms that are
labels in a heading tag. (3) **The tracking law as its own ask**, shown on the same masthead at 160
and at 16 px under the flat -0.03em and under the law, so it can be adopted independently of the
sizes. (4) **The display step against the hero board**: the source's lockup uses the ladder's `xl`
and `lg` steps by hand (`sandbox/home-hero/shared.tsx` LADDER, read-only); show what each candidate
does to that lockup at 1440 and 375, since the hero is the loudest step on the site. (5) The 404's
h1, the `not-found` case, on the board. (6) Every stage on the phone canvas. (7) Reconsider C's app
title at 20 and card at 14 from the ground up: keep it if it holds on the real dashboard, or replace
it with the candidate you would actually ship. Keep `ladders.ts` pure and its test.

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

**Goal.** The type-scale exploration of the review wave (2026-09-14). Bible 5 holds (one heading face on one site ladder) but the sizes are not nailed: one ladder for marketing and one for the app, each consistent, shown on real pages at both widths as three candidate scales beside today's, and proposed as a token table the wiring round bakes. Lab only: no production byte changes on this track.
**Rulings in force.** The bible's second edition: rule 5 (under exploration, naming this board), rule 6 (a masthead is one or two words; the h1 is the nav label at the display step), rule 13 (nothing gates an h1; `marketing-h1-policy.test.ts`), rule 2 as rewritten (marketing may be louder in most things, scale included).
**Verify on.** `/design/lab/type-scale?key=` on your preview at 1440 and 375, reduced motion honoured; the gate green.

## The brief

### The question

If the heading ladder were designed today for a site that is loud in marketing and quiet in the app, what are its steps, line-heights and tracking, for each, and does the pairing survive?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **Marketing declares five steps:** `PageHero` (`src/components/marketing/system/page-hero.tsx`) has a
  display step (`clamp(3.25rem, 12vw, 10rem)` with `mkt-name`), `xl` (text-5xl/6xl/7xl/8xl, i.e.
  48/60/72/96) and `lg` (text-4xl..7xl, 36/48/60/72); `SectionShell` (`system/section-shell.tsx`) has `lg`
  (36/48/60) and `default` (30/36/48). `page-hero-contract.test.ts` pins the clamp idiom, the three step
  names and `mkt-name` first (assertions 6, 7, 11); `SectionShell`'s table is unpinned. The home hero's
  board resolves `xl` and `lg` per canvas by hand (`sandbox/home-hero/shared.tsx` LADDER).
- **The app has one atom:** `PageHeading` (`src/components/shared/page-heading.tsx`, `font-heading
  text-2xl`, 23 call sites, three overrides) plus about ten ad-hoc combinations, one h1 without
  `font-heading` (`shared/not-found-screen.tsx:55`) and admin h2s at 14 px.
- **Faces:** Inter body (`--font-sans`), Urbanist headings through the `font-heading` utility
  (`globals.css:815-819`: weight 700, tracking -0.03em); no size tokens exist anywhere;
  `--tracking-tight: 0em` is parked as a deferred pass (`theme.css:23`) so 90+ legacy `tracking-tight`
  uses are no-ops. Mono is leaving (bible 7): a data numeral is the body face with `tabular-nums`.
- **The bible's related rules:** 6 (masthead one or two words), 13 (the h1 at paint), and the h1 policy
  test that scans the lab too (`src/app/(marketing)/marketing-h1-policy.test.ts`: no `data-mkt-cut`,
  `data-mkt-reveal`, `mkt-line`, `cut()`, `rise()`, `mark()` on an h1).

### The board

One ladder for marketing and one for the app, shown on real pages composed from production components
(the home arc's hero and two sections, a feature page's hero and cards, /help's masthead; the
dashboard, an event page, an admin page) at 1440 and 375, three candidate scales beside today's. The
candidates span the range: a tuning of today's steps; a ladder rebuilt from a ratio with named
line-heights and tracking per step; one that reconsiders how loud marketing's display step is against
the app's quiet. The face pairing (Inter body, Urbanist headings) is not the question and is not
protected either: a candidate that needs a different pairing shows it once and flags it as a
departure. The proposal is a token table (`--text-display`, `--text-xl`, `--text-lg`, ... with
line-height and tracking) written in the Record for the wiring round to bake into `theme.css` and the
two atoms. The asks: the marketing ladder (A, B, C or today's), the app ladder (A, B, C or today's),
any pairing departure.
### The deliverable

The board, plus the token table in the Record. Read `page-hero.tsx`, `section-shell.tsx`, `page-heading.tsx`, `globals.css`, `theme.css`; change none of them.

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

- none. The type facts live in `docs/systems/design-system.md` ("Type: the heading face + the
  tiered scale"), which is outside this track's lane and is the wiring round's to rewrite once a
  ladder is ruled. Two of its lines are already wrong in a way worth folding then: the h2 ladder is
  described as three tiers (24/30, 30/36/48, 36/48/60) when the phone end collapses two of them onto
  36px, and the "Icon + small-type rules" section states the law ("letter-spacing/line-height run
  inverse to size") that `font-heading`'s flat -0.03em does not implement.

## Deferred (ROADMAP one-liners, bucket named)

- Bucket "App polish the gallery's declarations surfaced": `shared/not-found-screen.tsx:55` is the
  one h1 on the site without `font-heading`, so the 404 title renders in Inter while every other
  page title is Urbanist; the wiring round should sweep it with the ladder. It is ON the board
  (stage 10 of 11) and in every paste, so it is ask 4 of 4 rather than a silent sweep: if Will rules
  it onto the ladder the deferred line closes with the wiring, and if he rules it off the line
  stays as the documented exception.

## Handoff (round 1)

- Head: this handoff commit, sitting on the gated tree `a9a3c79`; both pushed. Preview
  `partyreel-git-lp-type-scale-partyreel.vercel.app`, and the board is at
  `/design/lab/type-scale?key=8838d0dd22f626a603fcf551`. The alias was READY at the first commit
  `90baaf5` when this was written, with the later pushes queued behind the wave's other tracks on
  the one-at-a-time plan; it moves to the head on its own. ★ WAIT FOR IT TO PASS `e28579b` before
  ruling on the display step: at `90baaf5` the masthead still lost its tracking to marketing.css and
  reported -0.03em under every candidate, so stage 2 and stage 1's top row read wrong there. The
  whole board is correct from `e28579b` on.
- Synced with `launch-prep` at `b34993e` (round three's hero tracks and the round-two ruling). No
  conflicts: nothing it landed touches this track's `reads`.
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings, none in this
  lane), test ok (1688 in 191 files), build ok (247 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five files under
  `src/app/(dev)/design/sandbox/type-scale/` plus this manifest. No exceptions.
- **The review round's one fix (this head).** A read-only review found that an applied candidate
  outranked the board's own stages at one step. The page hook,
  `h1[class~="font-heading"]:is([class~="text-2xl"], ...):not([class~="lg:text-5xl"])`, scores
  (0,3,1), three attribute tokens AND a type, which is exactly what board.css's
  `[data-tsc] [data-tsc-page] [data-tsc-step="heading"] :is(h1, h2, h3)` scored, and a candidate's
  `<style>` is rendered after every stylesheet, so the paste won the tie on source order. Stage 13
  lost its whole argument to that: with any candidate applied its three app registers collapsed onto
  the applied ladder's one page size while the captions still read 24 / 20 / 20, and stages 9, 11 and
  12 lost the same way whenever the applied block and the toggled ladder differed. The step rules now
  run a doubled `[data-tsc][data-tsc]` chain at (0,4,1), the `ships` and `face` rules with them (that
  note had the premise wrong: it said a candidate's longest selector is three tokens). And it is
  computed now rather than asserted: "the board's sheet outranks any paste" in `ladders.test.ts`
  counts both sides by Selectors Level 4 and fails the moment a hook grows a token or the doubling is
  tidied away, which was verified by reverting the chain (it fails, naming the rule that lost).
- Re-verified after the fix on `pnpm dev` from this worktree, measured off the DOM: under each of the
  five applied blocks (Today, A, B, C, the law alone), every heading and card title on the board
  renders the size its own stage declares, at 1440 and at 375; the cross case holds (B applied while
  the board is toggled to C reads C's 20 at stage 12 and still 24 / 20 / 20 at stage 13); the 404
  stage's "as it ships" half stays Inter 600. The paste itself is untouched: C applied to the real
  home page still gives the hero 119.94px at -5.4px, which is C's 120 at -0.045em.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab only, as briefed: not one
  production byte changed, and `page-hero.tsx`, `section-shell.tsx`, `page-heading.tsx`,
  `globals.css` and `theme.css` were read and left alone.
- Assets requested from Will: none. A type board needs no asset; the only thing it could have asked
  for is a licensed display face, and the pairing check concluded the pairing holds (below), so
  asking would have pre-judged an ask that is on the board.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - "The marketing ladder: today, A tuned, B rungs or C registers"
  - "The app ladder: today, A tuned, B rungs or C registers"
  - "The tracking law (leading and tracking named per step, running inverse to size): adopt, or keep
    the flat -0.03em"
  - "The face pairing: keep Inter with Urbanist, or open a face round"
- Departures, verbatim from BoardMeta (all five are on the board, none buried):
  - "The pairing is NOT departed from. Inter with Urbanist survives the loudest step once tracking
    runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not
    the face. Stage 11 is the evidence, and a face round would be its own ruling."
  - "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the
    display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em
    constant it lands on today."
  - "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the
    section step, so /about's story sections and /press's sections move up a tier. That contradicts
    design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight."
  - "C drops the app page title from 24 to 20 and the card title from 16 to 14, so the app's
    hierarchy moves off size and onto weight and colour. It is the loudest claim on the board and
    the first thing to reject if it reads cheap."
  - "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app
    travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible
    finding if B is adopted."
- Bible finding for Will (not acted on): if B wins, bible 2's "marketing may be louder in most
  things, scale included" acquires a number. Bible 5 is unaffected either way: one face, one ladder,
  every h1 on it, which all four candidates keep.
- Look at first: stage 1 at **Phone 375**, flipping Today against any candidate. Today's phone end is
  the whole argument, and it is the one thing a desktop-only look cannot show: a page title and a
  chapter opener both land on 36px and the masthead sits four pixels above the home hero, so six
  steps read as three. Then stage 2 for the loudness question (three of the four mastheads are the
  same 160px and differ only in tracking, which is the tracking law in one glance), and stage 8 for
  the app's missing middle.
- Light QA (the wave's rule, verified on `pnpm dev` from this worktree at both canvases, all four
  ladders): every heading's computed size, leading and tracking matches the ladder data exactly
  (measured, not eyeballed, which is how the display-step bug below was found); no horizontal
  overflow and no vertical cropping on any of the 11 stages; `document.getAnimations()` is empty, so
  the board renders identically with and without reduced motion. The eye pass covered all 11 stages
  at 1440 and stages 1 to 8 at 375. One tooling note for the next agent: the Chrome MCP returns a
  BLACK screenshot whenever the Browser pane is hidden or the tab is not fronted, and several
  sessions share that pane during a wave, so a black frame there is the tool, not the board
  (`document.visibilityState` says which).

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). **The type scale, written down.** Bible 5's ladder
had never had its numbers stated, so the board stated them: today's, resolved at both ends from the
class strings, beside three candidates spanning tune to replace. Eleven stages render the PRODUCTION
components (`PageHero`, `SectionShell`, `PageHeading`, `Card`) with three custom properties handed
to them through the board's own sheet, so picking a ladder re-lays the real home arc, a feature
page, /help, /about, the dashboard, an event page and an admin page rather than a mock; the ladder
data is pure and `ladders.test.ts` pins its laws, today's two faults included. Three faults were
found and are what the candidates answer: at 375 the ladder has three distinct sizes doing the work
of six, line-height arrives with whichever Tailwind size class a ramp lands on (the one hero that
needed a real value invented `leading-[1.02]` locally), and `font-heading` tracks a 160px masthead
and a 16px card title at the same -0.03em, against the design system's own written rule that
letter-spacing and line-height run inverse to size. Lab only; no production byte changed.

### The token table the wiring round bakes

One clamp per step, the line through (375, phone) and (1440, desktop), so the ladder is continuous
and there is no breakpoint left to jump at. Leading is emitted as a rem LENGTH, because a unitless
line-height cannot sit inside a clamp and a step whose leading tightens as it grows needs one;
tracking stays in em, which already rides the fluid size. The board prints whichever table is
selected, and `tokenTable()` in `ladders.ts` generates all four, so nothing here is retyped by hand.

**Today, resolved (the reference, not a proposal)**

```
--text-display     clamp(3.25rem, 0.873rem + 10.14vw, 10rem)   lh clamp(2.763rem, 0.743rem + 8.62vw, 8.5rem)   ls -0.03em
--text-hero        clamp(3rem, 1.944rem + 4.51vw, 6rem)        lh clamp(3rem, 1.944rem + 4.51vw, 6rem)         ls -0.03em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)   lh clamp(2.5rem, 1.796rem + 3vw, 4.5rem)        ls -0.03em
--text-chapter     clamp(2.25rem, 1.722rem + 2.25vw, 3.75rem)  lh clamp(2.5rem, 2.06rem + 1.88vw, 3.75rem)     ls -0.03em
--text-section     clamp(1.875rem, 1.479rem + 1.69vw, 3rem)    lh clamp(2.25rem, 1.986rem + 1.13vw, 3rem)      ls -0.03em
--text-prose       clamp(1.5rem, 1.368rem + 0.56vw, 1.875rem)  lh clamp(1.999rem, 1.911rem + 0.38vw, 2.25rem)  ls -0.03em
--text-page        1.5rem                                      lh 1.999rem                                     ls -0.03em
--text-subsection  (none)
--text-card        1rem                                        lh 1.375rem                                     ls -0.03em
```

**A. Tuned** (every desktop number kept; the phone end unpacked, the leading named, the tracking
inverse to size; the app deliberately untouched, which is its cost)

```
--text-display     clamp(4rem, 1.887rem + 9.01vw, 10rem)       lh clamp(3.52rem, 1.731rem + 7.63vw, 8.6rem)    ls -0.045em
--text-hero        clamp(2.75rem, 1.606rem + 4.88vw, 6rem)     lh clamp(2.75rem, 1.732rem + 4.34vw, 5.64rem)   ls -0.04em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)   lh clamp(2.362rem, 1.641rem + 3.08vw, 4.41rem)  ls -0.035em
--text-chapter     clamp(1.875rem, 1.215rem + 2.82vw, 3.75rem) lh clamp(2.1rem, 1.466rem + 2.7vw, 3.9rem)      ls -0.032em
--text-section     clamp(1.625rem, 1.141rem + 2.07vw, 3rem)    lh clamp(1.95rem, 1.496rem + 1.94vw, 3.24rem)   ls -0.03em
--text-prose       clamp(1.313rem, 1.114rem + 0.85vw, 1.875rem) lh clamp(1.706rem, 1.515rem + 0.82vw, 2.25rem) ls -0.024em
--text-page        1.5rem                                      lh 1.875rem                                     ls -0.02em
--text-subsection  (none)
--text-card        1rem                                        lh 1.35rem                                      ls -0.012em
```

**B. Rungs** (one rung set, 12 14 16 18 20 24 28 34 42 52 64 80 100 128 160, the ratio widening as
it climbs; every step sits on a rung at both ends and reads its leading and tracking off the rung,
never off the step. Marketing travels four rungs between 375 and 1440, the app travels one, the card
step travels none)

```
--text-display     clamp(4rem, 1.887rem + 9.01vw, 10rem)       lh clamp(3.92rem, 2.272rem + 7.03vw, 8.6rem)    ls -0.045em
--text-hero        clamp(2.625rem, 1.349rem + 5.45vw, 6.25rem) lh clamp(2.888rem, 1.924rem + 4.11vw, 5.625rem) ls -0.042em
--text-title       clamp(2.125rem, 1.113rem + 4.32vw, 5rem)    lh clamp(2.465rem, 1.678rem + 3.36vw, 4.7rem)   ls -0.038em
--text-chapter     clamp(1.75rem, 0.958rem + 3.38vw, 4rem)     lh clamp(2.135rem, 1.506rem + 2.68vw, 3.92rem)  ls -0.035em
--text-section     clamp(1.5rem, 0.884rem + 2.63vw, 3.25rem)   lh clamp(1.89rem, 1.366rem + 2.24vw, 3.38rem)   ls -0.032em
--text-prose       clamp(1.125rem, 0.773rem + 1.5vw, 2.125rem) lh clamp(1.53rem, 1.201rem + 1.4vw, 2.465rem)   ls -0.024em
--text-page        clamp(1.5rem, 1.412rem + 0.38vw, 1.75rem)   lh clamp(1.89rem, 1.804rem + 0.37vw, 2.135rem)  ls -0.02em
--text-subsection  clamp(1.125rem, 1.081rem + 0.19vw, 1.25rem) lh clamp(1.53rem, 1.488rem + 0.18vw, 1.65rem)   ls -0.014em
--text-card        1rem                                        lh 1.4rem                                       ls -0.006em
```

**C. Registers** (two registers: marketing editorial and much louder at the top, the app an
instrument that goes quieter and carries its hierarchy on weight. `--text-prose` is `--text-section`
by design)

```
--text-display     clamp(5rem, 2.359rem + 11.27vw, 12.5rem)    lh clamp(4.2rem, 2.07rem + 9.09vw, 10.25rem)    ls -0.05em
--text-hero        clamp(3.25rem, 1.754rem + 6.38vw, 7.5rem)   lh clamp(3.185rem, 1.982rem + 5.13vw, 6.6rem)   ls -0.045em
--text-title       clamp(2.5rem, 1.62rem + 3.76vw, 5rem)       lh clamp(2.625rem, 1.877rem + 3.19vw, 4.75rem)  ls -0.04em
--text-chapter     clamp(2rem, 1.472rem + 2.25vw, 3.5rem)      lh clamp(2.24rem, 1.747rem + 2.1vw, 3.64rem)    ls -0.034em
--text-section     clamp(1.625rem, 1.317rem + 1.31vw, 2.5rem)  lh clamp(1.95rem, 1.668rem + 1.2vw, 2.75rem)    ls -0.03em
--text-prose       (folded into --text-section)
--text-page        1.25rem                                     lh 1.625rem                                     ls -0.014em
--text-subsection  1rem                                        lh 1.4rem                                       ls -0.006em
--text-card        0.875rem                                    lh 1.269rem                                     ls -0.002em
```

**Shared by every candidate**

```
--text-body        1rem / 1.55 / 0em      Inter, unchanged by every candidate.
--text-caption     0.75rem / 1.45 / 0.01em  the Caption atom; the uppercase Eyebrow keeps its 0.14em.
```

### What the wiring round inherits

- Three consumers take the tokens: `page-hero.tsx`'s `HERO_SCALE` (display, hero, title),
  `section-shell.tsx`'s `HEADING_SCALE` (chapter, section) and `page-heading.tsx` (page). Each
  becomes one custom property per step instead of a four-breakpoint ramp, and
  `page-hero-contract.test.ts` assertions 6, 7 and 11 (the clamp idiom, the three step names,
  `mkt-name` first) need rewriting with them: assertion 6 pins the clamp shape that these tokens
  replace.
- The display step's optical corrections survive a size change untouched, which the board proved by
  driving `PageHero` at 160px and at 200px: `-mt-[0.12em]`, `py-[0.08em]` and `leadIn` are all in em.
- Two size overrides disappear once the ladder is named: `PageHeading className="text-3xl"` on the
  event name and on `/admin/albums/[eventId]`, and `className="text-lg"` in `admin/layout.tsx`.
- The two app h2 idioms that are labels in a heading tag (`text-sm` in `admin/metrics` and
  `admin/announcements`, `text-[11px] uppercase` in the dashboard sections) become either the
  `subsection` step or the `Caption` atom, depending on which app ladder wins: A and today have no
  step for them, B and C do.
- `--tracking-tight: 0em` (theme.css:23) and its 90-plus legacy `tracking-tight` no-ops are the
  tracking law's business: once tracking is a token per step, the parked pass is a deletion.

## Handoff (round 2)

- Head: this commit, sitting on the handoff and on the review round's fix; all pushed. Preview
  `partyreel-git-lp-type-scale-partyreel.vercel.app`, board at `/design/lab/type-scale?key=`. The
  alias follows the branch on its own and `[preview]` is in every build commit, but the push of the
  fix produced no deployment at all (GitHub created none for it, while other branches pushed before
  and after it deployed normally), so the alias sat on the pre-fix build for twenty minutes. This
  commit is the rebuild; if an alias ever looks a round behind, check for a MISSING deployment
  before doubting the branch.
- Synced with `launch-prep` at `4b035c1` (the cut: `ca952b5` had moved by one docs commit while the
  worktree was being made, so the branch was cut fresh from the newer tip). It has not moved since.
- Gates on the synced tree, re-run after the review round's fix: typecheck ok, lint ok (0 errors, 7
  pre-existing warnings, none in this lane), test ok (1719 in 193 files; `ladders.test.ts` is 62
  cases, 21 of them round two's, three of them the new specificity guard), build ok (248 pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five files under
  `src/app/(dev)/design/sandbox/type-scale/` plus this manifest. No exceptions.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab only, as briefed: not one
  production byte changed. `page-hero.tsx`, `section-shell.tsx`, `page-heading.tsx`, `card.tsx`,
  `not-found-screen.tsx`, `globals.css`, `theme.css` and `marketing.css` were read and left alone.
- Assets requested from Will: none. A type board needs no asset, and the one ask that could have
  wanted one (a licensed display face) is answered on the board: the pairing holds.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - "The marketing ladder: today, A tuned, B rungs or C registers"
  - "The app ladder: today, A tuned, B rungs or C registers"
  - "The tracking law, which moves no size and can be taken on its own: adopt, or keep the flat
    -0.03em"
  - "The app's floor (no heading below the 14px body a card sets, so the card title stops at 16):
    adopt, or let C's 14 stand"
  - "The 404's h1, the one page title on the site in Inter: put it on the ladder, or leave it off"
  - "The face pairing: keep Inter with Urbanist, or open a face round"
- Departures, verbatim from BoardMeta (six, all on the board):
  - "The pairing is NOT departed from. Inter with Urbanist survives the loudest step once tracking
    runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not
    the face. Stage 16 is the evidence, and a face round would be its own ruling."
  - "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the
    display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em
    constant it lands on today. The paste closes it in marketing.css's own two places and leaves the
    squeeze itself running."
  - "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the
    section step, so /about's story sections and /press's sections move up a tier. That contradicts
    design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight."
  - "C's app register was rebuilt in round two. The page title at 20 survived a real dashboard (in
    an app a title is a locator, not a headline); the card title at 14 did not, because a Card sets
    text-sm on its whole subtree, so 14 is the size of the sentence under the title. C now runs
    20 / 18 / 16, and the floor under it is proposed as a law for every ladder, which is the fourth
    ask."
  - "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app
    travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible
    finding if B is adopted."
  - "Bible 5 says one heading face on one site ladder, and the 404's h1 has always been outside
    both: Inter at 600, the only page title on the site that is not the heading face. Every paste
    puts it on the ladder, which is a change no ruling has made yet, so it is the fifth ask rather
    than a silent fix."
- Bible findings for Will (not acted on): B's arithmetic would give bible 2 a number, and bible 5
  acquires the 404 either way. Bible 5 is otherwise unaffected: one face, one ladder, every h1 on
  it, which all four candidates keep.
- **For the Orchestrator, three things outside this lane:**
  1. `touchpoints.ts` still describes this board as "Eleven stages driving the production
     components ... an event page and admin". It is sixteen now, in four acts, and it applies to the
     site. One line at integration; the file is the Orchestrator's.
  2. `docs/specs/type-scale.md` carries round one's tables. C's app rows changed (page 20,
     subsection 18, card 16) and there is a new "law alone" table; every table in the Record below is
     generated from `ladders.ts`, so replacing the spec's block with it keeps the two honest.
  3. The wiring round needs three one-line HOOKS, because a class-name hook is right for a paste and
     wrong for production: `data-slot="page-heading"` on `PageHeading`, `data-scale={scale}` on
     `PageHero` and on `SectionShell`, and a named atom for the app's section tier (the only step no
     paste can reach today: production writes it as an 11px uppercase label inside an h2 on the
     dashboard and the event feed, 14px in admin, and once `sr-only`).
- What a paste reaches beyond the component it names, by design: the hero step's hook is the ramp's
  widest class, so the four heroes that hand-roll the same ramp move with it (the home's cinema
  hero, qr-hero, reel-hero, events/[slug]); the chapter step also reaches the article titles that
  stop at that step (blog, careers, a help guide); the prose step also reaches /help's stat
  numerals, which already ship at it. All four are the same step by eye, which is why the hook is a
  feature rather than a leak, and it is written in each HOOK's note.
- Look at first: **apply B, then walk the home page and /help** (the buttons are in the bar at the
  top of the board and the walk links carry your key). Apply **Today** first if you want the
  control: it is the shipped ladder resolved, and it reproduces every value on the real page at 1440
  and at 375 to within a fiftieth of a pixel, moving exactly one thing, the home hero's hand-rolled
  `leading-[1.02]`, which is fault two in one click. Then stage 10 (the tier the app does not have,
  in the three idioms it is written as today), stage 13 (C's app register with the version round two
  rejected beside it) and stage 15 (the tracking law alone, at 160 and at 16).
- Light QA (the wave's rule, measured rather than eyeballed, on `pnpm dev` from this worktree):
  every stage at both canvases under all four ladders has no vertical crop and no horizontal
  overflow (32 combinations, measured off the DOM); `document.getAnimations()` is empty, so the
  board reads identically with and without reduced motion; each new stage's computed size, leading
  and tracking matches the ladder data exactly. The paste was verified on the REAL pages at both
  widths: Today on the home page reproduces 96/48/30 and their tracking and moves only the hero's
  local leading; C on /about gives the masthead 200px at -0.05em over a prose tier folded onto the
  section step at 40px; Clear removes the block. The app surfaces (the dashboard, an event page)
  could not be walked from this worktree, because localhost is in no auth allow-list by design: they
  are the one part of the walk that needs Will signed in, and the board's stages 9 to 14 are the
  stand-in until then.
- Measuring found three real bugs that an eye pass would not have: tailwind-merge had eaten the hero
  board stage's `leading-[1.02]` (the ladder class has to come FIRST in the `cn()`, which the hero
  board's own shared.tsx warns about; this was the third time), an applied candidate reached the 404
  stage's "as it ships" half through `[data-not-found] h1` and made it a comparison with itself, and
  C's 120px hero wraps where today's 96px one does not, so the lockup stage counts lines now. One
  tooling note for the next agent: the Browser pane is shared across a wave, so a screenshot can
  come back from ANOTHER session's tab (it did here) and a hidden tab returns black frames and
  freezes a running transition mid-flight. Read the DOM; it is also the only way to catch the three
  bugs above.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). **The type scale, applied to the site.** Round one
wrote the ladder down; round two made every candidate a PASTE: one generated block of real CSS against
the real production hooks (`.mkt-name`, a ramp's widest class, `[data-slot="card-title"]`,
`[data-not-found] h1`), handed to the whole site through the shell's candidate store, so a ruling is
made on the real home page rather than on a canvas. Today is the control and it holds: applied, it
reproduces every shipped value at both widths and moves one thing, the home hero's hand-rolled
`leading-[1.02]`. The tracking law became adoptable on its own, a function of size that moves no size;
the app's missing middle is judged against the three idioms production writes it as; the hero step
against the hero board's own lockup; the 404's h1, the one page title in Inter, is in every paste.
C's app register was rebuilt: the quiet 20px title survived a real dashboard, the 14px card title did
not (a Card sets `text-sm` on its whole subtree), and the floor under it is pinned for every ladder.
Token names moved into Tailwind v4's font-size shape, so a baked step is ONE class. Lab only.

### The token table the wiring round bakes

Round two's shape: Tailwind v4 reads `--text-x--line-height` and `--text-x--letter-spacing` as that
size's defaults, so `class="text-title"` carries all three and the three four-breakpoint ramps in
`page-hero`, `section-shell` and `page-heading` collapse to one class each. One clamp per step, the
line through (375, phone) and (1440, desktop), so the ladder is continuous and there is no
breakpoint left to jump at. Leading is a rem LENGTH (a unitless line-height cannot sit inside a
clamp and a step whose leading tightens as it grows needs one); tracking stays in em, which already
rides the fluid size. `tokenTable()` in `ladders.ts` generates every table below; nothing is retyped.

**Today, resolved (the reference, not a proposal)**

```
--text-display     clamp(3.25rem, 0.873rem + 10.14vw, 10rem)   lh clamp(2.763rem, 0.743rem + 8.62vw, 8.5rem)   ls -0.03em
--text-hero        clamp(3rem, 1.944rem + 4.51vw, 6rem)        lh clamp(3rem, 1.944rem + 4.51vw, 6rem)         ls -0.03em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)   lh clamp(2.5rem, 1.796rem + 3vw, 4.5rem)        ls -0.03em
--text-chapter     clamp(2.25rem, 1.722rem + 2.25vw, 3.75rem)  lh clamp(2.5rem, 2.06rem + 1.88vw, 3.75rem)     ls -0.03em
--text-section     clamp(1.875rem, 1.479rem + 1.69vw, 3rem)    lh clamp(2.25rem, 1.986rem + 1.13vw, 3rem)      ls -0.03em
--text-prose       clamp(1.5rem, 1.368rem + 0.56vw, 1.875rem)  lh clamp(1.999rem, 1.911rem + 0.38vw, 2.25rem)  ls -0.03em
--text-page        1.5rem                                      lh 1.999rem                                     ls -0.03em
--text-subsection  (none)
--text-card        1rem                                        lh 1.375rem                                     ls -0.03em
```

**A. Tuned** (every desktop number kept; the phone end unpacked, the leading named, the tracking
inverse to size; the app deliberately untouched, which is its cost)

```
--text-display     clamp(4rem, 1.887rem + 9.01vw, 10rem)        lh clamp(3.52rem, 1.731rem + 7.63vw, 8.6rem)    ls -0.045em
--text-hero        clamp(2.75rem, 1.606rem + 4.88vw, 6rem)      lh clamp(2.75rem, 1.732rem + 4.34vw, 5.64rem)   ls -0.04em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)    lh clamp(2.362rem, 1.641rem + 3.08vw, 4.41rem)  ls -0.035em
--text-chapter     clamp(1.875rem, 1.215rem + 2.82vw, 3.75rem)  lh clamp(2.1rem, 1.466rem + 2.7vw, 3.9rem)      ls -0.032em
--text-section     clamp(1.625rem, 1.141rem + 2.07vw, 3rem)     lh clamp(1.95rem, 1.496rem + 1.94vw, 3.24rem)   ls -0.03em
--text-prose       clamp(1.313rem, 1.114rem + 0.85vw, 1.875rem) lh clamp(1.706rem, 1.515rem + 0.82vw, 2.25rem)  ls -0.024em
--text-page        1.5rem                                       lh 1.875rem                                     ls -0.02em
--text-subsection  (none)
--text-card        1rem                                         lh 1.35rem                                      ls -0.012em
```

**B. Rungs** (one rung set, 12 14 16 18 20 24 28 34 42 52 64 80 100 128 160, the ratio widening as
it climbs; every step sits on a rung at both ends and reads its leading and tracking off the rung,
never off the step. Marketing travels four rungs between 375 and 1440, the app travels one, the card
step travels none)

```
--text-display     clamp(4rem, 1.887rem + 9.01vw, 10rem)        lh clamp(3.92rem, 2.272rem + 7.03vw, 8.6rem)    ls -0.045em
--text-hero        clamp(2.625rem, 1.349rem + 5.45vw, 6.25rem)  lh clamp(2.888rem, 1.924rem + 4.11vw, 5.625rem) ls -0.042em
--text-title       clamp(2.125rem, 1.113rem + 4.32vw, 5rem)     lh clamp(2.465rem, 1.678rem + 3.36vw, 4.7rem)   ls -0.038em
--text-chapter     clamp(1.75rem, 0.958rem + 3.38vw, 4rem)      lh clamp(2.135rem, 1.506rem + 2.68vw, 3.92rem)  ls -0.035em
--text-section     clamp(1.5rem, 0.884rem + 2.63vw, 3.25rem)    lh clamp(1.89rem, 1.366rem + 2.24vw, 3.38rem)   ls -0.032em
--text-prose       clamp(1.125rem, 0.773rem + 1.5vw, 2.125rem)  lh clamp(1.53rem, 1.201rem + 1.4vw, 2.465rem)   ls -0.024em
--text-page        clamp(1.5rem, 1.412rem + 0.38vw, 1.75rem)    lh clamp(1.89rem, 1.804rem + 0.37vw, 2.135rem)  ls -0.02em
--text-subsection  clamp(1.125rem, 1.081rem + 0.19vw, 1.25rem)  lh clamp(1.53rem, 1.488rem + 0.18vw, 1.65rem)   ls -0.014em
--text-card        1rem                                         lh 1.4rem                                       ls -0.006em
```

**C. Registers** (two registers: marketing editorial and much louder at the top, the app an
instrument that carries its hierarchy on weight. `--text-prose` is `--text-section` by design, and
the app register is round two's rebuild: 20 / 18 / 16, the card step standing on the floor)

```
--text-display     clamp(5rem, 2.359rem + 11.27vw, 12.5rem)     lh clamp(4.2rem, 2.07rem + 9.09vw, 10.25rem)    ls -0.05em
--text-hero        clamp(3.25rem, 1.754rem + 6.38vw, 7.5rem)    lh clamp(3.185rem, 1.982rem + 5.13vw, 6.6rem)   ls -0.045em
--text-title       clamp(2.5rem, 1.62rem + 3.76vw, 5rem)        lh clamp(2.625rem, 1.877rem + 3.19vw, 4.75rem)  ls -0.04em
--text-chapter     clamp(2rem, 1.472rem + 2.25vw, 3.5rem)       lh clamp(2.24rem, 1.747rem + 2.1vw, 3.64rem)    ls -0.034em
--text-section     clamp(1.625rem, 1.317rem + 1.31vw, 2.5rem)   lh clamp(1.95rem, 1.668rem + 1.2vw, 2.75rem)    ls -0.03em
--text-prose       (folded into --text-section)
--text-page        1.25rem                                      lh 1.625rem                                     ls -0.014em
--text-subsection  1.125rem                                     lh 1.519rem                                     ls -0.01em
--text-card        1rem                                         lh 1.4rem                                       ls -0.006em
```

**The law alone** (today's sizes, every one of them; only the leading and the tracking move. The
third ask, and the only block on the board that changes no size. `optics()` reads the law between
B's rungs, so any size has a value and no step chooses its own)

```
--text-display     clamp(3.25rem, 0.873rem + 10.14vw, 10rem)    lh clamp(3.38rem, 1.542rem + 7.84vw, 8.6rem)    ls -0.045em
--text-hero        clamp(3rem, 1.944rem + 4.51vw, 6rem)         lh clamp(3.192rem, 2.397rem + 3.39vw, 5.448rem) ls -0.0412em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)    lh clamp(2.576rem, 1.962rem + 2.62vw, 4.32rem)  ls -0.0365em
--text-chapter     clamp(2.25rem, 1.722rem + 2.25vw, 3.75rem)   lh clamp(2.576rem, 2.163rem + 1.76vw, 3.75rem)  ls -0.034em
--text-section     clamp(1.875rem, 1.479rem + 1.69vw, 3rem)     lh clamp(2.25rem, 1.918rem + 1.42vw, 3.192rem)  ls -0.0304em
--text-prose       clamp(1.5rem, 1.368rem + 0.56vw, 1.875rem)   lh clamp(1.89rem, 1.763rem + 0.54vw, 2.25rem)   ls -0.0213em
--text-page        1.5rem                                       lh 1.89rem                                      ls -0.018em
--text-subsection  (none)
--text-card        1rem                                         lh 1.4rem                                       ls -0.006em
```

**Shared by every candidate**

```
--text-body        1rem / 1.55 / 0em        Inter, unchanged by every candidate.
--text-caption     0.75rem / 1.45 / 0.01em  the Caption atom; the uppercase Eyebrow keeps its 0.14em.
```

### What the wiring round inherits

- **The bake is one `@theme` block**, and each consumer becomes one class: `page-hero.tsx`'s
  `HERO_SCALE` takes `text-display` / `text-hero` / `text-title`, `section-shell.tsx`'s
  `HEADING_SCALE` takes `text-chapter` / `text-section`, `page-heading.tsx` takes `text-page` and
  `CardTitle` takes `text-card`. `page-hero-contract.test.ts` assertions 6, 7 and 11 (the clamp
  idiom, the three step names, `mkt-name` first) are rewritten with them: assertion 6 pins the clamp
  shape these tokens replace.
- **Three hooks come with it**, because the board's paste had to aim at class names and production
  should not: `data-slot="page-heading"` on PageHeading, `data-scale={scale}` on PageHero and
  SectionShell, and a named atom for the app's section tier. That last one is the only step no paste
  can reach: production writes it as an 11px uppercase label inside an h2 (`feed-section`, the event
  feed, the empty teaser), 14px in admin (metrics, announcements) and once `sr-only`
  (`events-section`). It becomes the `subsection` step or the `Caption` atom depending on which app
  ladder wins: today and A have no step for it, B and C do.
- **The hand-rolled twins move with the step, and should.** Four heroes retype the `xl` ramp
  (cinema-hero, qr-hero, reel-hero, events/[slug]) and the article titles stop at the chapter step;
  the wiring round replaces those class strings with the step's class rather than leaving them to
  drift again. `cinema-hero.tsx`'s local `leading-[1.02]` is deleted by the named leading, and the
  ladder class must precede any `leading-*` in the same `cn()` until it is (tailwind-merge drops a
  leading that comes first).
- **The masthead's settled tracking is a token now.** marketing.css closes `.mkt-name` to a literal
  `-0.03em` in two places (one inside the reduced-motion query, one keyed on `data-inview`); both
  become `var(--text-display--letter-spacing)`, and `--mkt-name-open` stays the light track's.
- The display step's optical corrections survive a size change untouched (`-mt-[0.12em]`,
  `py-[0.08em]` and `leadIn` are all in em), which round one proved at 160px and 200px.
- Two size overrides disappear once the ladder is named: `PageHeading className="text-3xl"` on the
  event name and on `/admin/albums/[eventId]`, and `className="text-lg"` in `admin/layout.tsx`.
- `--tracking-tight: 0em` (theme.css:23) and its 90-plus legacy `tracking-tight` no-ops are the
  tracking law's business: once tracking is a token per step, the parked pass is a deletion. The
  404's `tracking-tight` is one of those no-ops, which is why that title ships at 0em today.

## Handoff (round 3)

- Head: this commit; the board's last code change is `4722151`, over the review-fix commit
  `aa74879`, `2b63080` (the first round-3 handoff), `9814802` (the sync merge), `b44a6aa` and
  `77a1e5c`; all pushed. Board at `/design/lab/type-scale?key=`.
- **The read-only review's four should-fixes, all fixed in this pass** (2026-09-14, after the first
  round-3 handoff):
  1. **The stale ask number inside the artifact Will copies.** Round three cut six asks to four and
     the paste still called the 404 "the fifth ask". A number about a list now comes FROM the list:
     `askOrdinal()` in `ladders.ts` reads the position off `ASKS`, the paste's comment, the
     departure and stage 10's rationale all call it, and a new case in `ladders.test.ts` recomputes
     the position with its own word list and fails on any other ordinal in any of the five blocks.
     Verified in the browser on the applied block: the injected sheet parses to 13 rules and says
     "fourth ask".
  2. **The ROADMAP one-liner's two stale numbers** (below, under Deferred): the 404 is stage 10 of
     11 and ask 4 of 4, not stage 14 and ask 5.
  3. **The round's item (2), which the first handoff dropped**, is the bullet below.
  4. **The preview**, in the bullet after that: the fix push is the retry, and the forced redeploy is
     still the Orchestrator's if the ceiling eats it.
- **Item (2) of the brief: what the other boards changed here.** The wave's five specs
  (`palette`, `light`, `floating-surfaces`, `brand-voice`, `media-kit`) and every open track's
  latest Handoff were re-read. It is on the BOARD as the last Departures line, which is the standing
  rule, and not only here. Two things moved.
  1. **The lab compiles no responsive heading rung** (the brand-voice board's shell finding:
     `design.css` scans only `src/app/(dev)/design`, so a `PageHero` on a stage can render at its
     base size). It does not reach these stages, and that is now measured rather than assumed: a
     probe at 1440 and again at 375 compared all 21 `[data-tsc-step]` probes' `--tsc-size` with the
     computed font-size inside them and every one matched within 0.6px, because this board hands the
     production component its size as a custom property instead of a Tailwind rung. Worth carrying
     to the wiring round anyway: it is true of every board that stages a marketing component.
  2. **Marketing has a tier no paste reaches, and the kill-mono sweep added to it.** Sixteen
     hand-rolled headings ship `font-heading text-3xl sm:text-4xl` (30 / 36) and stop one rung short
     of `SectionShell`'s own ramp: the feature sections (album, guests, qr, sharing), `careers-story`
     (3), the marketing footer (2), the reel's guest-share section, `route-error`, and the stat
     register that kill-mono moved onto the heading face on 2026-09-14. No hook aims at them, and
     aiming the section step at them would GROW them from 36 to 48 and make Today's block move the
     real site, which is the control this board rests on, so they are the wiring round's sweep and
     not a hook. Named on the board beside the walk links, where a reviewer would otherwise read a
     section that did not budge as a broken paste.
  Two things did not move. The voice board's two candidate theses are both about thirty characters
  (`SITE_THESIS` is already "The whole event, in one album.", the shape the voice guide recommends
  keeping), so the lockup stage counts the same lines whichever it rules; and the hero-scan board
  measured the shipped h1 at 96px over 97.92px of leading, which is today's hero step (96 at 1.0)
  wearing `cinema-hero`'s hand-rolled `leading-[1.02]`, an independent confirmation of fault two.
  `palette`, `light`, `floating-surfaces` and `media-kit` propose nothing that moves a size, a
  leading or a tracking; floating-surfaces' shared wall is the `CandidateStyle` mount, already
  carried below. There was no reviewer-findings block under "Handoff (round 2)" to re-read: round
  two's review landed as the specificity fix recorded in "Handoff (round 1)", which round three
  re-verified (the cross case still holds).
- ★ **The preview alias served ROUND TWO at the first handoff; the fix push is the retry, and a
  forced redeploy is the Orchestrator's.** The project is at Vercel's ceiling of 100 deployments a
  day, so slots free one at a time at a near-exact 14.4-minute cadence (21:49:42, 22:04:10, 22:18:42,
  22:33:19, 22:48:02, 23:02:50, 23:17:14 on 2026-09-14, every one of them taken by another track's
  push). Round three's three pushes each landed between slots and produced ZERO deployments, which is
  why the alias still served round two's `2aa727b`; the honest statement is not "no push of mine can
  deploy today" (other branches did) but "a push deploys only if it coincides with a freed slot".
  Same cause the floating-surfaces track recorded at `943473b`. **Walk round three locally until an
  alias catches up**: `pnpm dev` in this worktree, then
  `http://localhost:<port>/design/lab/type-scale?key=`; the lab is in no allow-list, so localhost
  renders the tip exactly, "Apply to the site" included, which is where both QA passes below were
  measured. For the Orchestrator, and it is mandatory before Will walks anything, because this branch
  is handed off and pushes no more: force a redeploy at the tip (`POST /v13/deployments`, `gitSource
  {type: github, repoId: 1252816746, ref: lp/type-scale, sha: <tip>}`), confirm READY, and check the
  build is round three by curling for **"The four ladders at a glance"**. The ceiling behaves as a
  token bucket rather than a midnight reset: one deployment is granted 14.4 minutes after the last
  one, to whichever push arrives first. The fix pass spent three tries on it (`aa74879` at 23:37, pushed
  between tokens; `65f20ab` at 23:46:19, which lost the 23:46:21 token to `lp/rounding` by two
  seconds; `4722151` at 00:00:46, which lost the 00:00:47 token to `lp/media-kit` by one), so assume
  the alias is a build behind when you read this: curl it for the marker BEFORE
  walking, and force the redeploy if the marker is missing. An Agent cannot force one and should not:
  `POST /v13/deployments` is refused to this session by policy, and a deploy is the Orchestrator's
  under the branch protocol, which is why this is written down rather than worked around. **The `launch-prep` alias
  is further behind still: it serves round ONE of this board** (eleven stages, no Apply bar), which
  is the same ceiling, so round two was never walkable there either.
- Marker, so a reviewer can tell which round a build serves: round three renders
  **"The four ladders at a glance"** and **"The board's answer, if you want the short version"**.
  Neither string exists in round two or round one.
- Synced with `launch-prep` at `dd4aa0b` (it had moved by 30 files since the `a058ab4` cut: six track
  manifests, `docs/specs/brand-voice.md` and five other boards' sandboxes). Nothing it landed touches
  a path in this track's `reads`, and the merge was clean.
- Gates on the synced tree, re-run after the review fixes: typecheck ok, lint ok (0 errors, 6
  pre-existing warnings, none in this lane), test ok (1733 in 193 files; `ladders.test.ts` is 76
  cases, 14 of them round three's, the newest being the ask-ordinal guard), build ok.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the four files under
  `src/app/(dev)/design/sandbox/type-scale/` plus this manifest. No exceptions. (`board.css` did not
  need to change: round two's doubled `[data-tsc][data-tsc]` chain still outranks every paste, and
  `ladders.test.ts` still computes that rather than asserting it.)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab only, as briefed: not one
  production byte changed. `page-hero.tsx`, `section-shell.tsx`, `page-heading.tsx`, `card.tsx`,
  `not-found-screen.tsx`, `globals.css`, `theme.css` and `marketing.css` were read and left alone.
- Assets requested from Will: none. A type board needs no asset, and the one ask that could have
  wanted one (a licensed display face) is answered on the board: the pairing holds.
- The asks, verbatim from BoardMeta (four now, not six; the Orchestrator quotes them under Waiting on
  Will):
  - "The marketing ladder: B rungs, C registers, A tuned or today"
  - "The app ladder: B rungs, C registers, A tuned or today"
  - "The tracking law: adopt, or keep the flat -0.03em"
  - "The 404's h1: put it on the ladder, or leave it off"
- **The board answers all four itself now, with the one thing that would overrule each** (the panel
  at the top, `ASKS` in `ladders.ts`): marketing **B**, the app **B**, the law **adopt**, the 404
  **on the ladder**. Overrule the two ladder answers with **C** (the front of the site as a poster,
  or the app chrome quieter than today); overrule the law with the simplicity of one constant;
  overrule the 404 to keep it a documented exception. So a ruling can be "all four as proposed", and
  a disagreement is still a few words.
- **Two asks were CUT, and why.** The app's floor asked Will to rule on C's 14px card title, which C
  stopped proposing inside round two: the floor is a law every ladder obeys and `ladders.test.ts`
  pins it, so there was nothing left to choose. The face pairing asked him to rule on a question the
  board answers with evidence: the verdict (the pairing holds, the constant is the fault) is a
  departure now and its evidence sits under the tracking law on the last stage. An ask whose answer
  is already made is an ask he has to read past.
- **Five stages were cut, and why.** The PageHero hero (the hero step is judged on the lockup stage
  beside the ramp the site actually hand-rolls, and the paste puts it on the real home page); the
  /help masthead (the same title step as the feature page, and /help is one click away in the walk);
  the admin page (the same two app steps as the dashboard, and its label idiom is already on the
  missing-middle stage); C's app registers (round two's reconsideration settled it, and a rejected
  proposal kept on the board is a paragraph to read past); the pairing stage (folded under the
  tracking law, which is the same evidence read twice). Sixteen became eleven in four acts.
- **What round three added, and why each earns its place.** (1) The answer panel, so the board says
  what it would ship before it asks. (2) "The four ladders at a glance": all nine steps of all four
  ladders at the selected canvas, with a bar per cell and today's four faults ticked per column, all
  computed by `fixes()` from the ladder data and never declared beside it. Clicking a column selects
  that ladder, so the comparison is also the control. (3) The strongest first: `LADDERS` is now
  `[B, C, A, today]` and the board OPENS on B rather than on the control.
- **The cold walk's real findings, each fixed.** (a) Two walk links were DEAD. `/admin` mounts no
  design island and `/nothing-here` resolves to the ROOT `app/not-found.tsx`, outside both the
  marketing and the app layouts, so a candidate never reached either: clicking them read as a broken
  paste. Verified both ways on a real page, measured off the DOM: with C applied, `/nothing-here`
  carries no `style[data-tuner-candidate]` at all and its h1 stays Inter 600 at 36px, while
  `/events/not-a-real-event` (a MARKETING 404, inside the cinema layout) renders that same h1 in
  Urbanist 700 at 40px, which is C's section step. The walk links to the marketing 404 now, and the
  three surfaces a paste cannot reach are named ON the board with the reason, so a missing island is
  never read as a broken block. (b) At 1440 A. Tuned carries every size the site ships, so toggling
  to it moves nothing but the leading and the tracking, which reads as a dead control; the specimen
  now counts what a ladder moves at the canvas you are on ("moves 0 of today's 8 sizes") and the
  glance table says the column IS today's column, both computed. (c) The apply bar carried eleven
  controls in one row; the five per-block copy buttons became one line that appears once a block is
  applied. (d) At 375 every specimen row's "where it lives" caption wrapped to four lines and pushed
  that stage past 1,400px; the glance table above carries the same line for all nine steps, so the
  phone specimen drops it.
- **Cost, measured rather than claimed.** Every stage's ink was measured off the DOM under all four
  ladders at both canvases and each desktop canvas cut to it (the dashboard was 243px of ink inside
  520; the law stage 938 inside 1169). Two canvases stay deliberately roomy and say so in a comment:
  the marketing sections keep a real 930px viewport, and the app stages keep a real 760px phone one.
  The walk is **10,450px on the desktop canvas and 14,089px on the phone one**, down from 11,847 and
  17,412, measured at the same 992px lab column, with the whole ruling inside the first screen and a
  half. The board declares no keyframes and runs no animation of its own: after the toggles settle,
  `document.getAnimations()` holds two entries and both are the LAB SHELL's theme button, zero inside
  `[data-tsc]`, so the composition is identical with and without reduced motion.
- Light QA, measured rather than eyeballed, on `pnpm dev` from this worktree at 1440 and 375 under
  all four ladders (8 combinations): no vertical crop and no horizontal overflow on any of the 11
  stages, and every heading and card title renders the size its own stage declares to within 0.6px
  (a generic probe that compares each `[data-tsc-step]`'s `--tsc-size` with the computed font-size of
  the heading inside it). The cross case still holds after the cuts: with C applied to the whole site
  and the board toggled to B, every stage still reads B at both canvases, so round two's specificity
  fix survived. The paste itself is unchanged and still correct on the real site: C applied gives the
  real home page a 120px hero at a leading of 105.6px and -5.4px of tracking, which is C's 120 at
  0.88 and -0.045em, and its section h2 40px at -1.2px.
- Re-verified after the review fixes, on `pnpm dev` from this worktree at 1440 and again at 375: all
  21 step probes match their declared size within 0.6px at both canvases, the page has zero
  horizontal overflow, `document.getAnimations()` is empty (nothing on this board animates, so
  reduced motion gets the same composition), BoardMeta renders four asks and six departures, and B
  applied injects one stylesheet that parses to 13 rules and names the 404 "the fourth ask". The only
  moving parts in the fix pass were three strings, a derived ordinal and one test.
- **For the Orchestrator, four things outside this lane (the first two carry over from round two):**
  1. `docs/specs/type-scale.md` still carries ROUND ONE's tables (C's card step at 14, no law-alone
     table) and round one's six asks including the two cut here. Replace its block with the Record
     below, which `tokenTable()` generates, and its ask list with the four above.
  2. `touchpoints.ts` describes this board as "Eleven stages driving the production components ...
     the dashboard, an event page and admin". Eleven is right again by coincidence, but /help and
     admin are walk links now, not stages, and the board applies to the site. One line at
     integration; the file is the Orchestrator's.
  3. Marketing's own missing tier, found in round three: sixteen hand-rolled headings at
     `font-heading text-3xl sm:text-4xl` (30 / 36) stop one rung short of `SectionShell`'s ramp (the
     four feature families, `careers-story`, the marketing footer, the reel's guest-share section,
     `route-error` and the stat register kill-mono moved onto the heading face). The wiring round
     sweeps them onto the ruled section step; a paste must NOT, because growing them 36 to 48 would
     make Today's control block move the real site.
  4. The wiring round needs the three one-line HOOKS round two asked for (`data-slot="page-heading"`
     on PageHeading, `data-scale={scale}` on PageHero and SectionShell, and a named atom for the
     app's section tier), and round three adds a fourth, which is a SHELL question rather than a type
     one: `CandidateStyle` mounts in the lab layout, the two marketing layouts and the app layout
     only, so `/admin`, the guest routes (`/e/<token>`, the demo album) and the root 404 can never
     wear any board's candidate. The floating-surfaces track hit the same wall from the guest side.
     One `<CandidateStyle />` in `admin/layout.tsx` and in `(guest)/layout.tsx` would make every
     board's paste walkable on those surfaces; until then every board should name them, as this one
     now does.
- Look at first: **the answer panel, then the glance table at Phone 375**, which is where the ladders
  are furthest apart and where today's ladder fails. Then apply B and open the home page and /help
  from the walk. Then stage 8 (the tier the app does not have, in the three idioms production writes
  it as today) and stage 11 (the tracking law, which moves no size, with the pairing verdict under
  it).

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). **The type scale, applied to the site, then made
rulable.** Round one wrote the ladder down; round two made every candidate a PASTE (one generated
block of real CSS against the real production hooks, handed to the whole site through the shell's
candidate store) so a ruling is made on the real home page rather than on a canvas, rebuilt C's app
register against a real dashboard (the quiet 20px title held, the 14px card title did not, because a
Card sets `text-sm` on its whole subtree) and pinned the floor under every ladder. Round three walked
the board the way Will would and turned it from a menu into a verdict: it opens on the ladder it
would ship, states four rulings with its own answer and the one thing that would overrule each, and
puts all four ladders' nine steps side by side at the selected canvas with the four faults each one
fixes computed from the data. Six asks became four and sixteen stages eleven, because an ask already
answered and a stage the paste replaced are both things to read past; the walk lost 1,400 desktop
pixels and 3,300 phone ones, measured. Two dead walk links were found and fixed: `/admin` and the
root 404 mount no design island, so no candidate ever reached them, and the paste now says where its
reach stops, sixteen hand-rolled marketing headings that ship one rung short of the section ramp
included, so a heading that does not budge reads as the page rather than as a broken block. Lab
only; no production byte changed.

### The token table the wiring round bakes

**Unchanged by round three: not one size, leading or tracking moved.** The five tables are directly
above under "Record (round 2)" and they are generated, never typed: `tokenTable()` and `themeBlock()`
in `ladders.ts` emit them from the same data the stages render, and `docs/specs/type-scale.md` should
be replaced with that output rather than hand-edited. Round three changed only which ladder the board
recommends (B), the order it shows them in, and how few questions it asks about them.

### What the wiring round inherits

Round two's list above stands in full (the one `@theme` block, the three hooks, the hand-rolled
twins, the masthead's settled tracking, the two size overrides that disappear, the `--tracking-tight`
deletion). Round three adds one item that is not about type at all: no board's candidate can reach
`/admin`, the guest routes or the root 404, because `CandidateStyle` is not mounted in those layouts.
Two one-line mounts would fix it for every board in the wave.

## Handoff (round 4)

- Head: this commit, over `e33f197` (round four's first hand-off), `b71246c` (the sync merge),
  `80c0dd9`, `443ffa6` and `5244620`; all pushed. Board at `/design/lab/type-scale?key=`.
  **Vercel is capped, so nothing here was verified on a preview**: the walk below was re-taken on a
  LOCAL PRODUCTION BUILD (`pnpm build`, then `next start -p 3118`) from this worktree at
  `http://localhost:3118/design/lab/type-scale?key=`, at 1440 and at 375, and the gate was closed with
  a real `pnpm build`. The `[preview]` marker is in every commit so the alias builds when the window
  frees.
- **Where the walk was watched, said plainly, because the rule asks for a FOREGROUND tab.** Two
  contexts, and the split is a limit of this session rather than a shortcut. The page-level passes
  (the dock at both canvases, the stages, the frames' widths, the apply and clear round trip, the
  overflow counts) were taken in the app's own browser pane, which reported
  `document.hidden === false` at a true 375x812 and a true 1440x900 viewport. The per-frame type
  measurements were taken in a Chrome tab this session can drive but cannot RAISE: its window sits
  behind another Chrome window, so that tab reports `document.hidden === true` and throttles
  requestAnimationFrame. The only class of check that costs is time-based motion inside a frame, and
  no number in this hand-off rests on one: `SETTLE_CSS` sets `transition: none` and `animation: none`
  on exactly those entrances (fault two of round four), which is why the /about masthead reads the
  same settled value in both contexts. Layout and computed style do not depend on visibility, and
  every number below reproduced in both contexts.
- Marker, so a reviewer can tell which round a build serves: round four renders **"The pair, chosen
  separately"**, **"Real pages, at the pixels they ship"** and **"One token set, two registers"**.
  None of the three exists in round three.
- Synced with `launch-prep` at `6484558` (it had moved by two docs commits since the `c473707` cut:
  `docs/PROGRAM.md` and `docs/tracks/orchestrator.md`). Nothing it landed touches a path in this
  track's `reads`; the merge was clean and the gates were re-run on the merged tree.
- Gates, re-run whole after the review fix: typecheck ok, lint ok (0 errors, 6 pre-existing
  warnings, none in this lane), test ok (**1824 in 199 files**; `ladders.test.ts` is 96 cases, three
  of them the fix's), build ok (248 pages). Prettier clean on all five changed files. (The first
  hand-off said 95 cases in this file; the true count at that commit was 93, so that line was wrong
  rather than the suite.)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the four files under
  `src/app/(dev)/design/sandbox/type-scale/` plus this manifest. No exceptions. (`board.css` did not
  need to change again: round two's doubled `[data-tsc][data-tsc]` chain still outranks every paste,
  and `ladders.test.ts` still computes that rather than asserting it.)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab only, as briefed: not one
  production byte changed. `page-hero.tsx`, `section-shell.tsx`, `page-heading.tsx`, `card.tsx`,
  `not-found-screen.tsx`, `metric-card.tsx`, `globals.css`, `theme.css` and `marketing.css` were
  read and left alone.

### The review fix, after a read-only review of the first hand-off

A read-only review of `e33f197` found two should-fix omissions of record. Both are fixed here, in
this lane, with no shell change and no new dependency.

1. **The law alone got its control back, because the board never stopped advertising the
   candidate.** Round three shipped five apply buttons and one of them was "Apply the law alone";
   round four replaced the bar with one "apply the pair" and did not replace that button, while
   `BoardMeta` went on listing "The law alone" as a candidate. The dock's two switches are built
   from `LADDERS`, and `LAW_ONLY` is deliberately not in `LADDERS`, so the one block that settles
   ask three had nothing on the page that reached it: a candidate with no control, which is the
   fault round three was sent to remove read from the other side. The dock's aside is now
   **"Apply to the site: The pair | The law alone | Clear"**, both blocks generated by the same
   `candidateCss()` the frames wear. Two consequences carried with it: the copy button under the
   glance tables now copies whichever block is applied and names it, and the walk line reads
   "The law alone is applied. Walk it signed in on ..." rather than "walk the pair" when the pair is
   not the thing on the site. `ladders.test.ts` pins the reachability itself now, so a later round
   cannot drop the control and keep the candidate.
2. **The three app surfaces that stayed composed stages are declined in writing, where Will reads
   it.** The goal named nine surfaces as real pages; six marketing routes and the guest album
   became frames and the dashboard, the event page and admin did not, and the only statement of why
   was a code comment that was also half wrong ("behind a sign-in or outside every design island").
   It is in the Handoff below now, and on the BOARD, as a paragraph under act three beside the
   three stages it is about. The comment in `pages.tsx` was rewritten to the real reasons.

### Shell changes asked for (the Orchestrator lands them)

1. **The lab's Sidebar pill sits on top of a dock's first control.** `LabChrome` renders
   `.lab-sidebar-pill` as `fixed top-2 left-2 z-40` and `BoardDock` is `z-30`, so with the sidebar
   tucked away (the default) the pill covered the left half of this board's viewport switch,
   measured at 1440. The pill is also redundant on a board page, because the dock carries its own
   Sidebar control: the fix is to hide it while a dock is mounted. **Mitigated locally** by passing
   `className="sm:pl-20"` to `BoardDock` here (commented as a mitigation); that class should come
   off when the shell lands the fix. Every board with a dock has this.
2. **`BoardDock`'s `scroll-padding-top` sticks at its first measurement.** The dock writes its
   height to `scrollPaddingTop` and `--board-dock-h` from a `ResizeObserver`, and in a background
   tab the observer does not re-fire: measured 246px and then 97px on a dock whose real height is
   49px, so an anchor would land well below it. A `requestAnimationFrame` re-sync after mount (or a
   window `resize` listener alongside the observer) settles it. No anchor on this board depends on
   it, so it is cosmetic here and would not be on a board that uses anchors.
3. **Optional, and it would make 1:1 exact:** `.board-page` keeps its `px-4` at
   `html[data-lab-fit="true"]`, so a 1440 canvas never fits a 1440 window and every stage scrolls
   sideways by 32px on Will's own screen. Dropping the page's horizontal padding at 1:1 (the stages
   already carry their own border and the frames their own box) would make the desktop canvas land
   exactly.
4. **Optional, and it would make the walk one step shorter.** The candidate store
   (`tuner-store.ts`) notifies in-tab listeners only, with no `storage` listener, so a page that is
   already open keeps the block it loaded with until it reloads. A `window.addEventListener
   ("storage", ...)` beside the existing listener set would make "apply, then look at the tab you
   already had open" work the way a reviewer expects. Every board with an Apply control has this.
5. **Not an ask, a thank-you, and it changed this board:** `admin/layout.tsx` and
   `(guest)/layout.tsx` mount `AppDesignIsland` now (`fb395fe`), which is the one-line change round
   three's handoff, floating-surfaces and rounding all asked for. The walk here gained `/admin` and
   the guest album, `NO_ISLAND` is down to the root 404, and the walk list is no longer a hand-kept
   list: `ladders.test.ts` resolves every walk link to its real layout file and fails if a mount
   ever disappears.

### What round four changed, and why each was the note it answers

- **Note 1, "I can't actually judge the font sizes in usage themselves scaled down."** Nothing on
  the board scales any more. All eight stages report `data-stage-fit="true"`, and the board removed
  no scaling of its own because it never had any: the fault was the shell's zoom-fit, which round
  four's `lab-prefs` turned off by default. The one place the board added its own scale handling is
  the frames, below, and only so Fit is not a dead control.
- **Note 2a, the fixed configurator.** Every page-wide switch is in `BoardDock`: the canvas, the
  marketing ladder, the app ladder, and Apply/Clear. A control that changes one specimen stayed
  beside that specimen (the token table's "show the bake", each frame's height and reload). The
  glance tables are also switches now: clicking a column sets that register.
- **Note 2b, "more UI examples for comparison, especially if they can be live production
  components".** Four reconstructions came OFF the board (the home's two section tiers, a feature
  page, /about on paper, the hero board's lockup) and seven real ROUTES went on, each in a frame
  exactly the canvas wide with the selected pair injected into its document: the home arc top to
  bottom, `/pricing`, `/features/curation`, `/help`, a help article, `/about`, and the real guest
  album at the demo token. An admin stage came back (round three had cut it) because the app
  register is ruled on its own now and admin is where it is quietest.
  **Why a frame beats a reconstruction, and it is not convenience:** a Tailwind breakpoint prefix
  inside a stage reads the browser WINDOW and a `vw` inside one measures the window too, which is
  why this board has always resolved every clamp by hand. Inside a frame both read the frame, so at
  375 the page's real phone layout runs and the generated clamp is EVALUATED rather than described.
  Measured: at 375 every frame reports `innerWidth` 375 and zero internal horizontal overflow, and
  the home hero renders the real mobile nav and the real phone film strip.
- **And the three app surfaces that did NOT become frames, declined on purpose.** The goal named
  nine surfaces; the guest album and the six marketing routes are frames, and the dashboard, an
  event page and admin are still composed from the production components. The reason is not reach,
  and the round's own island finding says so: `/dashboard` has mounted a design island all along,
  `admin` and the guest routes mount one now, all three are in `WALK`, and an applied block reaches
  all three in a real tab. What a frame of them cannot do is hold still.
  (a) `/admin` is behind `requireAdmin()` and a second factor, so a frame of it renders a 404 or an
  MFA enrollment screen for the host account this board is reviewed on, not the portal.
  (b) The dashboard and the event page render whichever events the REVIEWER's own account holds that
  morning, so the surface being compared would change between two flips of the switch, and a type
  ruling wants the same words under both.
  (c) Sign-in does not resolve on localhost by design (the Supabase redirect allow-list), so with
  Vercel capped this round a signed-in frame could not have been verified at all before the
  hand-off, and an unverified frame is the control-that-shows-nothing this board keeps removing.
  A composed stage also carries the one thing no frame can, a tier production does not have
  (stage 11), since a frame only ever moves what a hook reaches. **If Will would rather see them
  framed, the change is small and the wiring is already written** (`PageFrame` over a `REAL_PAGES`
  row); it wants a preview he is signed into, and it should be his call rather than a silent one.
  The paragraph is on the board under act three so the decline is read where the stages are.

- **Note 3, the two registers, and the board's call on the shape.** The dock carries two switches;
  `composePair()` composes any of the sixteen pairs into ONE nine-step ladder, and the paste, the
  token table and the `@theme` bake are all generated from the pair. **The call: one token set with
  two registers, not two sets.** Two sets would name the same nine roles twice and then have to
  answer which set a `Card` wears, since `CardTitle` is one component that ships on `/pricing` and on
  the dashboard, and they would duplicate the tracking law, which is a function of size and not of
  surface. Nothing in the set is computed from anything else in it, which is exactly why the halves
  can be ruled separately without the set splitting. It is on the board under the glance tables and
  as the first departure, and `ladders.test.ts` proves the claim for all sixteen pairs: one `@theme`
  block each, no register prefix in any token name, a pair of the same ladder byte-identical to that
  ladder's own paste, and a crossed pair spending the marketing hooks from one half and the app
  hooks from the other.

### Measured, not eyeballed (the walk, on `pnpm dev`, foreground tab)

- **The paste reaches every frame and wins.** All seven frames report exactly one adopted
  stylesheet and zero `[data-inview="false"]`, and every heading in every frame matches the selected
  ladder to the pixel. Under B at 1440: the home hero 100 / 89.97 / -4.2 (rung 100, lh 0.9,
  ls -0.042), `/pricing`, the feature page and `/help` 80 / 75.2 / -3.04, the help article
  64 / 62.69 / -2.24, the /about masthead 160 / 137.58 / -7.197. Under C's marketing: the home hero
  120 / 105.58 / -5.397 and the masthead 200 / 164 / -10.
- **The control still holds on the real pages, which is the whole board's foundation.** Apply the
  pair (Today, Today) and the frames reproduce the shipped values exactly: the home hero 96 / 96 /
  -2.88, `/help` 72 / 71.94 / -2.16, the help article 60 / 60 / -1.80, the masthead 160 / 136 /
  -4.80. Every one of those is today's ladder, and the paste moves nothing else.
- **At 375, every frame is 375 wide with no internal horizontal overflow**, and the ladder reads
  its phone end: the home hero 42 / 46.21 / -1.765, the title step 34 / 39.45 / -1.292, the chapter
  step 28 / 34.16 / -0.98, the masthead 64 / 62.72 / -2.88. The tracking is the desktop end by
  design (an em already rides the fluid size), which is why -1.765 at 42px is -0.042em.
- **No crop and no overflow anywhere.** All eight stages at both canvases, under all four pairs and
  under a crossed pair (marketing C with the app on today): zero cropped stages, zero horizontally
  overflowing stages, and the board page itself has zero horizontal overflow at both canvases.
- **Reduced motion.** `document.getAnimations()` on the board is empty after every toggle settles, so
  the board composes identically with and without it; the animations inside a frame are the
  production page's own, which is what a frame is for, and the marketing entrances are settled
  (below) so no size is ever read mid-transition.

- **Re-walked on the local production build after the fix**, and every number above reproduced:
  the seven frames at 1440 report `innerWidth` 1440, one adopted sheet each and zero internal
  horizontal overflow; at 375 all seven report 375 with zero internal overflow; all eight stages
  report `data-stage-fit="true"` with zoom 1; the board page has zero horizontal overflow at both
  canvases; no stage is cropped (every stage's `scrollHeight` equals its `clientHeight`) and no
  stage's CONTENT exceeds its canvas (`scrollWidth` is exactly 1440 on all eight, never more). The
  32px each stage scrolls sideways is the canvas against `.board-page`'s own `px-4`, which is shell
  ask 3 below and not the board's. `document.getAnimations()` is empty after every toggle settles.
- **The restored control, proven end to end on a real page.** With "The law alone" applied, a fresh
  tab at `/help?key=` carries one block titled "The type scale: The law alone" and its h1 reads
  **72 / 69.12 / -2.63**: today's size, unmoved, with the law's leading and tracking. Clear it,
  reload, and the same h1 is back to the shipped **72 / 72 / -2.16**. That is ask three judged on
  the real site with no size moving underneath the answer, which is the capability the first cut of
  round four dropped.
- **The dock holds both buttons at both canvases.** At 1440 the dock is one 49px row with the aside
  reading "Apply to the site: The pair | The law alone" plus the shell's own controls, and the
  lab's fixed sidebar pill ends at x=71 while the dock's first control starts at x=83, so the
  `sm:pl-20` mitigation still clears it with the second button present. At 375 the dock is static,
  204px, five wrapped rows, and both buttons sit inside the canvas (the second ends at x=278 of
  375).
- **One shell behaviour worth knowing before the walk** (not a fault of this board): the candidate
  store is in-tab only, so applying a block reaches a tab that loads AFTER it. Apply first, then
  open a walk link; a tab already open keeps whatever it loaded with until it reloads.

### Three faults the frames found, each fixed in this round

1. **The injected block landed fifth of five sheets.** The first version appended a `<style>` to the
   frame's head and it was measured there, NOT last: the page's own client chunks insert stylesheets
   after hydration, so the block was one Tailwind layer change away from silently losing a tie. It
   is a constructed sheet in `adoptedStyleSheets` now, which the cascade orders after every sheet in
   the document, so it is at least as late as production's own `CandidateStyle` element and a
   candidate that wins in a frame wins in a tab.
2. **A frame read its masthead mid-entrance, and then held a stale number.** marketing.css
   transitions `.mkt-name` over 760ms from an open squeeze, and measured before the page's own
   observer had flipped `data-inview` the /about masthead reported **+3.52px** of tracking; after a
   ladder change it then held **-7.197px** on a 200px masthead, which is a 160px ladder's value and
   a number no candidate proposes. The board settles a frame the way `board.css` settles a stage
   (`data-inview` flipped on, re-applied through a `MutationObserver` because the page's islands set
   it back as they hydrate, plus the cut and blur registers). ★ The settle rule had to MATCH
   marketing.css's own `[data-mkt] .mkt-name` shape at (0,2,0): a bare `.mkt-name` at (0,1,0) lost
   whatever the source order, which is the same specificity lesson this board learned in round two
   from the other direction.
3. **The dock's first control was half-covered** by the shell's fixed Sidebar pill (shell ask 1).

### Findings for the wiring round, and one for the Orchestrator

- **A THIRD hand-rolled heading, found because the guest album became a frame.** Nothing on that
  page moves under any pair: the entry title is written inline as `font-heading text-[28px]`, so it
  keeps the flat -0.03em under every ladder. It is the surface most people who ever see Partyreel
  see, and the ruling stops short of it. It joins the two already recorded (the app's section
  heading, which production writes as a label inside an h2, and the sixteen marketing headings at
  30 / 36 that stop one rung short of SectionShell's ramp) as the wiring round's SWEEP, not a hook:
  aiming a step at any of the three would move the real site under the Today pair, which is the
  control the board rests on. All three are named on the board beside the walk.
- **Not this board's, but seen in the frame and worth one line:** at 375 the home hero's rotating
  lockup breaks as "The whole / <word> / , in one album.", with the comma opening its own line. It
  does that under all four ladders including today's, so it is the lockup's composition and not a
  consequence of any candidate; the home-hero family owns it.
- **The other boards, re-read in round four** (every manifest in `docs/tracks/` and every spec in
  `docs/specs/`): one thing moved, and it is the shell's (the island mounts, above). The hero tracks
  independently corroborate this board's fault two: hero-river, hero-scan and hero-reel all record
  the hand-rolled `leading-[1.02]` and the tailwind-merge ordering trap around it. Nothing in
  palette, light, floating-surfaces, media-kit or brand-voice moves a size, a leading or a tracking.
  brand-voice's "the lab never compiles the heading ladder" is answered rather than carried now: a
  frame runs the page's own stylesheet at the canvas's own width.

### The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will)

- "The marketing ladder: B rungs, C registers, A tuned or today"
- "The app ladder: B rungs, C registers, A tuned or today"
- "The tracking law: adopt, or keep the flat -0.03em"
- "The 404's h1: put it on the ladder, or leave it off"

Four, unchanged, and still one word each. The board answers all four itself (marketing **B**, the
app **B**, the law **adopt**, the 404 **on the ladder**) with the one thing that would overrule each,
so a ruling can be "all four as proposed". The shape question Will handed to the board is NOT a
fifth ask: it is answered (one set, two registers) and stated as the first departure, because an ask
whose answer is already made is an ask he has to read past.

### Assets requested from Will

None. A type board needs no asset, and the one ask that could have wanted one (a licensed display
face) is answered on the board: the pairing holds.

### Look at first

1. **The dock, and the two ladder switches.** Flip Marketing to C and leave App on B: the home
   frame's hero goes 100 to 120 and the /about masthead 160 to 200 where they stand, with no scroll
   back to the top. That flip is the whole of round four.
2. **The home arc frame at Phone 375.** It is the real mobile page, not a stage: the hamburger nav,
   the phone film strip, the hero at the ladder's own phone end. Today's phone end is still the
   board's strongest argument and this is the first round where it can be seen on the real page.
3. **Apply the pair (Today, Today) and watch the frames not move.** That is the paste's own proof.
4. **The guest album frame**, for the opposite reason: nothing moves, and the board says why.
5. **"Apply to the site: the law alone", then open a walk link.** Today's sizes, unmoved, with the
   law's leading and tracking on the real page. That is the third ask on its own, and it is the one
   block on this board that changes no size at all.
6. Then the app half of the glance table, stage 11 (the tier the app does not have, in the three
   idioms production writes it as) and stage 15 (the tracking law, which moves no size), and the
   paragraph under act three that says why the three app surfaces are stages rather than frames.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). **The type scale, on the pages themselves, and the
two registers ruled apart.** Will could not judge a size on a stage scaled to 0.7, so round four
stopped showing stages of marketing at all: four hand-composed reconstructions came off and seven
real ROUTES went on, each in a frame exactly the canvas wide with the candidate injected into its
own document. A frame gets what no stage on this board could: the canvas's own breakpoints, so the
phone end is the page's real phone end, and an EVALUATED clamp rather than one resolved here by
hand, so the board shows the token the wiring round bakes instead of arithmetic about it. The two
registers became two switches in the dock, with the board's call on the shape argued rather than
assumed (one token set, two registers, because two sets would name every role twice and then have to
answer which set a Card wears, and would duplicate a tracking law that is a function of size and not
of surface); any of the sixteen pairs composes into one nine-step set, one `@theme` block and one
paste, which is the claim the tests now prove for all sixteen. Measuring the frames found three
faults and fixed them: the injected block was landing fifth of five sheets and is an adopted
stylesheet now, a masthead was being read mid-entrance and reported a tracking no candidate
proposes, and the shell's sidebar pill was covering the dock's first control. And the frames found a
third hand-rolled heading outside both registers, on the guest album, the surface most people who
ever see Partyreel see. A review of the hand-off put two things back that the round had dropped
quietly: the law alone kept its own apply button, so the tracking ask can still be ruled on the real
site with no size moving, and the three app surfaces that stayed composed stages are declined in
writing on the board rather than in a comment. Lab only; no production byte changed.

### The token table the wiring round bakes

**Unchanged by round four: not one size, leading or tracking moved.** The five tables are above under
"Record (round 2)" and they are generated, never typed: `tokenTable()` and `themeBlock()` in
`ladders.ts` emit them from the same data the stages render and the paste spends, and
`docs/specs/type-scale.md` should be replaced with that output rather than hand-edited. What round
four added is that the table is now generated for a PAIR: the marketing rows come from one ladder
and the app rows from the other, the names are the same nine either way, and each row says which
register it came from.

### What the wiring round inherits

Round two's list stands in full (the one `@theme` block, the three hooks, the hand-rolled twins, the
masthead's settled tracking, the two size overrides that disappear, the `--tracking-tight` deletion).
Round three's one addition is CLOSED: `CandidateStyle` reaches `/admin` and the guest routes now, so
only the root 404 is outside every island. Round four adds two.

1. **The sweep is three headings, not two.** The app's section heading (a label inside an h2, no
   class worth aiming at), sixteen hand-rolled marketing headings at 30 / 36 that stop one rung
   short of SectionShell's ramp, and the guest entry title, written inline as
   `font-heading text-[28px]`, found when the album became a frame. None of the three can be a
   HOOK, because aiming a step at any of them would move the real site under the Today control; all
   three are the wiring round's sweep onto the ruled step.
2. **The bake is one `@theme` block whatever the pair is.** A ruling of "marketing B, app C" is not
   two token sets and not a compromise: it is the same nine names with each half standing on its own
   rungs, which is what lets Will rule the two registers in two words without the system splitting.

## Handoff (round 5)

- **Head: this commit**, the last sync merge, over `126e7b35` and `e2274b71` (this section),
  `cbc054af`, `2af59444` and `cfddcfc7` (the earlier sync merges), `a095c8d7`, `44fd7c21` and
  `d3db6278`; all pushed. Board at `/design/lab/type-scale`.
  **No preview**: Vercel is over its monthly deployment storage for the wave, so no commit here
  carries the marker and this push builds nothing. Everything below was verified on this worktree's
  dev server at `http://localhost:3414`, and the gate was closed with a real `pnpm build`.
- **Synced with `launch-prep` four times** as the rest of the wave landed under it, every one a
  merge and every one gated whole: `a61fd366` (19 commits, the album-hero round-two merge and the
  glow/home-hero/river-visual migrations), `9ab89cdd` (6 more, the new build gate and the
  floating-surfaces migration), `d414ca7d` (8 more, the brand-voice migration and the storage
  round's docs) and `5959b433` (11 more, the palette migration and the kit's paste clamp fix).
  Five conflicts across the four, every one an adjacent registration line of the wave and every one
  resolved by keeping both sides: `registry.ts` twice (TYPE_SCALE joins after LIGHT and before
  BRAND_VOICE, which is the order touchpoints.ts holds them in; nothing else in the list moved),
  `kit-discipline.test.ts` twice (each time both sides deleted a different id from LEGACY, which is
  now down to `media-kit` alone) and `boards.ts` (both sides dropped a different `legacy` flag).
  If the branch is integrated after the wave moves again, expect exactly this shape and nothing else.
- **Gates on the synced tree, each on its own exit code:** typecheck 0, lint 0 (0 errors, 6
  pre-existing warnings, none in this lane), test 0 (**2141 in 218 files**), build 0.
  `pnpm lab:smoke --base http://localhost:3414` **322 checks, 0 failing**. `pnpm format` clean on
  every changed file; no dynamic className was touched by it. The board was walked again after each
  merge: eight sections, eight fitted stages, two pastes, and the measured pairing count still
  reporting.
- **Lane check**, `git diff --name-only origin/launch-prep...HEAD`:
  `docs/specs/type-scale.md`, `src/app/(dev)/design/sandbox/type-scale/{spec.ts,board.tsx,ladders.ts,ladders.test.ts,pages.tsx}`
  (owned), this manifest, plus **the three declared registration lines and nothing else**:
  `sandbox/registry.ts` (the import and one entry in `BOARDS`), `(shell)/lab/boards.ts` (`legacy`
  dropped from the `type-scale` entry), `components/lab/kit-discipline.test.ts` (`"type-scale"`
  deleted from `LEGACY`). `board.css` did not need to change: round two's doubled
  `[data-tsc][data-tsc]` chain still outranks every paste and `ladders.test.ts` still computes that
  rather than asserting it.
- **Shared-file changes asked of the Orchestrator: none.** Everything outside the lane was read and
  left alone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes: none.** Lab only, as briefed: not
  one production byte changed.
- **Assets requested from Will: none**, and that is a real answer rather than an omission. The board
  judges type on the production components and the production routes; the only specimen it sets is
  the brand word, whose nine letters carry an ascender, a descender, three rounds and three
  straights, which is what a tracking change is judged on. `spec.assets` is empty and the meta panel
  prints "none".
- **Nothing was re-argued.** Every ladder, number, candidate, departure and recommendation is round
  four's to the byte; `ladders.test.ts` now pins that the spec's candidate list, its recommendation
  and its two control defaults all equal the ladder data, so the two files cannot drift.

### Three judgement calls a reviewer should see, since each departs from round four's shape

1. **The two Apply buttons left the dock and sit beside the candidates they apply.** Round four put
   them in the dock on Will's note (a). The kit states the opposite rule in its own file
   (`apply.tsx` and `dock.tsx`: "Applying a block is a per-candidate decision and its button stays
   beside the candidate; seeing that one is live, and turning it off, is page-wide"), and the dock
   carries `AppliedBadge`, which says which block stands and clears it. So the pair's apply is under
   the token table and the law's is under the tracking evidence, which is the ask it settles, and
   the page-wide half of the control is still in the dock. If Will wants both buttons back in the
   dock the change is four lines, but it would be the board disagreeing with the kit's contract.
2. **The per-frame "one / two / three screens tall" button is gone.** The kit's `Frame` takes a
   fixed viewport, and a frame three screens tall is not a taller view of the same page: it is a
   2790px viewport, so a `100svh` hero inside it grows to 2790px and the board would show a hero no
   visitor ever sees. Scrolling inside the frame walks the page instead, and one "Reload frames"
   pill in the dock replaces seven per-frame reloads.
3. **The glance tables are transposed.** A ladder is a row read left to right (its six or three
   sizes, then the faults it fixes) rather than a column held in the head, because the kit's
   `SelectTable` makes the row itself the control and a row a keyboard can reach is a button rather
   than a click handler on a cell. Same numbers, same computed fix marks, same click-to-choose.

### What the kit bought back, measured

- **Every hand-computed stage height is gone.** Round three measured each stage's ink off the DOM
  and wrote the answer down as three height functions round four then had to keep in step with four
  ladders. `FitStage` measures what it is handed: on the merged tree the eight stages report 246,
  400, 501, 517, 942, 1042 and so on, each fitted, none cropped, none floating in dead ground. That
  also bought back a fact the crop had cost: each step's `where` line prints at 375 again, where
  round four had to drop it.
- **The law stage's line count is measured rather than estimated, and printed.** It used to be
  `ceil(px * 0.45 * chars / column)`, an internal guess nobody could see. `useLineCount` reads it
  off the rendered text after the webfont lands: measured live, the pairing line reads **1 line at
  1440 and 2 at 375**, and it follows the dock. A DOM measurement of the same paragraph
  (`height / line-height` = 84 / 42) agrees.
- **★ A stage may not remount if something is measuring inside it.** The first cut keyed every
  `FitStage` on the pair with `swapKey`, and a remount hands `useLineCount` a NEW node while its
  ResizeObserver keeps watching the detached one: the count printed nothing at all at 375. Dropping
  the key (this board animates nothing, so it never needed one) leaves both observers on live nodes.
  Worth carrying to any board that measures inside a stage.

### The settle, and how it was proved

`PageFrame`'s MutationObserver is gone. marketing.css keys its entrances off `data-inview` and
`.mkt-name` transitions its tracking over 760ms from an open squeeze, so round four rewrote every
`data-inview="false"` back to true, per frame, re-arming as the page's islands hydrated. The kit's
`Frame` writes a stylesheet and hands back no document, so the settle is CSS now: `SETTLED` freezes
the three reveal registers attribute-free at (0,2,0), and `CLOSED` spends **the candidate's own
`--text-display--letter-spacing`** on `.mkt-name` at (0,3,0), which is not optional, because both
marketing.css and the paste close that squeeze through a `[data-inview="true"]` selector that can
never match in a settled frame. Without it every ladder would show one open tracking and the
loudness section would compare four identical claims.

Measured end to end, inside the real frames on the dev server, with `data-inview` still `"false"`:

| | masthead size | masthead tracking | `--text-display--letter-spacing` |
| --- | --- | --- | --- |
| Marketing B | 159.936px | -7.197px | -0.045em |
| Marketing C | 200px | -10px | -0.05em |

`[data-mkt-reveal]` reads opacity 1 and transform none in the `/` frame; the guest album frame
reports its entry title at **28px under every pair**, which is the inline `font-heading text-[28px]`
the spec's note records. Flipping the dock re-skins a frame live, with no reload.

### Verified

- The board on the dev server at **1440 and 375, light and dark**: the answer block is the first
  screen, the four ask pills link under the dock, all eight sections are anchored
  (`type-scale-glance` … `type-scale-law`) and in the dock's Sections menu, arguments and pastes are
  collapsed. At 375 the dock wraps to five rows and the document does not scroll sideways
  (`scrollWidth === innerWidth`); the two glance tables scroll inside their own scroller, which is
  the kit's, and the stages inside theirs.
- **Reduced motion:** the board declares no keyframes at all (board.css says so, and
  `keyframe-uniqueness.test.ts` reads it), the production entrances it renders are settled by
  board.css on the stages and by `SETTLED` in the frames, and the kit's walk scrolls with
  `behavior: "auto"` under the preference. The board reads identically with and without it.
- **The walk** sets the dock and lands on its section: step three puts the board at
  `canvas=phone, marketing=today` and scrolls to the pair, which is what its note describes.
- **A copied link reopens the same canvas, candidate and section:**
  `?canvas=phone&marketing=c&app=today#type-scale-loudness` reopens with `data-canvas="phone"`,
  `data-marketing="c"`, `data-app="today"` and a 375 stage.
- **The review panel's message parses.** The panel composed
  `review type-scale r5: marketing=c; tracking=keep`, and
  `node scripts/lab-review.mjs --root <scratch> '<line>'` recorded both answers into a SCRATCH copy
  of `docs/reviews/`. No ledger is committed here.
- **`/design/lab` queues the board's four open asks** with their recommended options, in board
  order, beside light's and rounding's.

### One test-tooling note, so the next session does not chase it

A Chrome tab this session can drive but cannot RAISE reports `document.hidden === true`, and a
hidden tab throttles `IntersectionObserver` and `requestAnimationFrame` to a standstill: the frames
never mounted there, because the kit's `onApproach` is an IntersectionObserver. Nothing is wrong
with the board. The same page in the app's own browser pane (`document.hidden === false`) mounts
and skins every frame, and that is where the frame measurements above were taken. The pane has the
mirror-image limit, deferring some nested iframe navigations, so the two were used together.

## Record (round 5; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The type-scale board moved onto the lab kit's
template and is two files now: a `spec.ts` that is pure data (the question, the verdict, the four
one-word calls, the five candidates, the departures, three declared controls, eight sections and an
executable walk) and a `board.tsx` that is the evidence per section as a function of that state.
Four board-local mechanisms retired into the kit: the hand-built answer block became the template's
Answer, the two glance tables became `SelectTable` turned on their side so a ladder is a row that is
also the control, the four acts became declared sections the dock's menu and the walk drive, and the
page frames became the kit's `Frame`, whose settle is CSS spending the candidate's own display
token rather than a MutationObserver rewriting `data-inview` per frame. `FitStage` retired every
hand-computed stage height, which also restored each step's "where it lives" line at 375, and the
law stage's estimated line count is measured with `useLineCount` and printed (1 line at 1440, 2 at
375). The asks, the walk list and the register call left `ladders.ts` for the spec, which is the one
list the template, the desk and the review ledger read, and a new test pins the spec's candidates,
recommendation and control defaults to the ladder data. No ladder, number, candidate or
recommendation changed; lab only, and not one production byte moved.
