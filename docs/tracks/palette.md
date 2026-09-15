---
track: palette
status: handed-off
cut: "1b647d76"
merged_round_4: "5cd20bdc"
cut_round_4: "c473707"
merged_round_3: "0d5bb64"
merged_round_2: "499a1ad"
merged_round_1: "bf1a6ef"
preview: false           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/palette/
  - docs/specs/palette.md
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

# lp/palette

## Round 5 (the Library x Lab migration wave, 2026-09-15)

**Goal.** The palette board onto the kit, with Will's round-four ruling as the spec's shape: dark and light are
chosen separately (dark for marketing and the app's dark mode, light for paper and the app's light mode),
so two asks with the six darks and the three lights as their options, the theming model as a third; the
registers are the `candidates`; `PairFrame` and `TrueViewport` retire to the kit's `Frame` and
`Compare` (two states of one production route side by side is what the back-and-forth needs);
`ScopedTokens` stays local (one consumer); the spec doc loses its asks block.

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

**Verify on.** `/design/lab/palette` on your dev server at 1440 and 375, light and dark, reduced motion;
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

**Will's notes on this board, verbatim where it matters.** "Again, needs a fixed GUI for comparison anywhere
on page." "I know I've asked before, but what's the difference between cinema and ink? Is cinema pure black
and ink near black? Should this be reworked to avoid complexity or is it best?" "I'd love to see more UI
examples for comparison, especially if they can be live production components using the demo palettes."
"Might as well add a couple additional palettes to increase our selection size. Side note: we can choose
dark and light separately, don't have to be a package deal. Dark will apply to marketing and app, light
applies to paper in marketing and light mode in app." "Your call on keeping dark/light/cinema/ink as
separate variants (plus the 5th using the surface color from the current /contact card, which doesn't have
a themed section of its own yet) or reworking our palette system to simply dark/light with variants of each
(such as dark having cinema for pure black, ink for lighter black, light having paper for pure white, XYZ
for light grey (needs name)). I've just seen so much dark, light, cinema, ink, etc., and didn't know if we
were incorrectly elevating a bad color system we were stuck in or if this is actually the best way to do
it." "Main ideas are: improving the comparison UI, choosing the light and dark palettes separately, adding
more palettes to options, adding more UI to preview with, and solidifying how we handle theming in general
within all of this."

**Round 4 (the goal).** (1) **The theming model is the first ask, answered by you.** Judge it from the
ground up: if no palette system existed, what would the perfect one be for a product with a dark marketing
site, a light marketing body, a footer slab, an app with two modes and a guest surface that is the host's?
Today's facts: cinema is `oklch(0.11 0 0)` (the dark marketing ground, set by the `(cinema)` group's skin),
the app's dark is 0.14, ink is 0.155 (the footer's leaf token set, `.surface-ink`), paper is 0.99, and the
/contact card's `bg-muted/40` panel is the fifth ground with no name. Propose the model as a named
structure: two modes (dark, light), each with named registers (for dark: a deep room and a lighter slab;
for light: paper and the grey panel, which you name), or three darks kept and why; say which registers
the marketing site, the app and the guest surface each use, and what a page or section chooses. Write it
on the board as the first block, in plain words, with the cinema-versus-ink answer in one sentence, and make
it the first ask. (2) **Light and dark chosen separately.** The dock carries two candidate switches, one
for the dark side (marketing cinema and ink, the app's dark mode) and one for the light side (paper and the
app's light mode), so any dark ramp pairs with any light ramp, and "Apply to the site" hands the site the
pair. (3) **More palettes.** Add at least two dark candidates and two light candidates beyond today's, each
a real different answer (a warmer black, a colder one, a lifted near-black, a warm paper, a cool paper, a
grey that is not a tint of the text), each a paste. (4) **More real UI.** The comparison surfaces are live
production components and whole real sections on each candidate pair: the home arc's chapters, a pricing
card, the dashboard's event cards, the event page, the guest album, the footer slab, a dialog and a menu
(the floating board's primitives), every state hue; the walk links stay. (5) **The dock**: every page-wide
switch in `BoardDock`, so a candidate can be flipped beside any row. (6) Keep what round three earned: the
paste per candidate, today beside the candidate in one canvas, the measured counts, the temperature switch
if it still earns its place under the new model.

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

**Round 2 (the goal).** The board proved the ramp is wrong in ways a ruler shows; now make it a
surface Will can rule from a walk. (1) **Apply to the site**: each candidate's full token block
(`tokenBlock()` already generates it) behind an "Apply A / B / C to the site" button, with the pages
to walk listed, so the ramp is judged on the real home arc, `/pricing`, `/help`, `/contact`, the
dashboard and the demo guest page, in both modes, rather than on stages alone. (2) **Widen the
judged surfaces on the board** to the ones that broke in round 1 and the ones the site is made of: a
real dark app composition (the dashboard's cards and an event page's stat band, from production
components), the guest page's tile grid on the canvas, the footer leaf hosting a card and a menu
(`.surface-ink` completed), a state row under every ramp in both modes, real copy at every text step
including `--faint`. (3) **Depth with the ramp**: the light spec (`docs/specs/light.md`) proposes one
shadow family with an alpha ramp per ground and names the ring lift; render each candidate with those
cues on the stacked and floating specimens, so the ramp and the depth cue are judged together (they
fail together). (4) **The five-grounds finding** as an explicit row with both answers rendered (one
`--gallery` doing two jobs against a split canvas and slab). (5) **The accent by job**, each of the
three jobs on its real call sites (the logo mark, the wizard step, the notification badge, the frames
family) at every candidate hue, the state row beside, in both modes. (6) Every stage on the phone
canvas. (7) The asks reduced to one-word answers. Keep the oklab ruler; it is the board's best idea.

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

**Goal.** The palette exploration of the review wave (Will's rule-by-rule review of the bible, 2026-09-14). Bible 1 is under exploration: the achromatic ramp between black and white in both modes (Will: the greys feel off; achromatic, not grayscale, is the intent), the accent's role (state, and UI colour where there is no media), and the muted panel as a real register. The board proposes three token blocks Will can rule between; the ruling lands in `globals.css` and `theme.css` through the Orchestrator. Lab only: no production byte changes on this track.
**Rulings in force.** The bible on `/design/library/rules` (second edition), rule 1 as rewritten: achromatic UI with one accent, the media is the color, and where there is no media the accent carries state and UI color and marketing may carry color of its own. Rule 3 stands (the five lamp hues are light, never UI). Rule 2 as rewritten: marketing may be louder in most things; only the tokens are shared by law.
**Verify on.** `/design/lab/palette?key=` on your preview at 1440 and 375, reduced motion honoured; the gate green.

## The brief

### The question

What would the perfect neutral ramp be if none of today's greys existed, in light and in dark; what is the accent for, and which hue; and is the set-apart panel a token or an alpha trick?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **The light ramp** (`src/app/globals.css:97-114`, `:root, .surface-paper`): `0.13` (fg, primary) · `0.3`
  (ring) · `0.45` (muted-fg) · `0.905` (border, input) · `0.96` (secondary, accent) · `0.965` (muted) ·
  `0.99` (bg) · `0.997` (card, popover); charts at 0.269 to 0.87. Every value chroma 0. **A 0.455 hole
  between 0.45 and 0.905**, which is why the panel is an alpha fraction (`bg-muted/40`) and not a step.
- **The dark ramp** (`:236-253`, `.dark`): bg `0.14` · card `oklch(0.21 0 0 / 0.62)` (the one translucent
  surface) · popover `0.23` · muted `0.245` · secondary and accent `0.25` · muted-fg `0.71` · ring `0.85`
  · fg `0.96`; `--border: oklch(1 0 0 / 12%)`, `--input: oklch(1 0 0 / 15%)` (alphas of white). **Four
  semantic surfaces crushed into 0.14 to 0.25**; muted, accent and secondary are indistinguishable.
- **Three darks ship:** the cinema skin deepens only `--background` to `0.11`
  (`src/app/(marketing)/marketing.css:1635-1648`; `--card`, `--popover`, `--muted` keep the app's values,
  so on cinema the card-to-ground gap grows while the surface steps stay crushed); the app's dark is
  `0.14`; `--gallery` is `0.155` (`globals.css:193-197`, identical in both themes, never overridden in
  `.dark`) and `.surface-ink` (`:299-312`) builds on it (no `--card`, `--popover`, `--secondary`,
  `--accent`, `--input`: ink cannot host a Card or a menu today).
- **No accent hue exists.** `--brand` aliases `--primary` (ink) in all three sets (`globals.css:171-172`,
  `:263-264`, `:307-308`); `theme.css:33-36` keeps it a token "so any future accent decision is a two-line
  change, never a sweep"; `docs/systems/design-system.md` "The identity" left the door open for a lab
  round. The state colours are `globals.css:174-186` (light) and `:266-274` (dark): success 150, warning
  80/82, like 15, destructive 27/22; `--save` (blue 252) and `--reel` (violet 300) are the two existing
  NON-state action hues, icon-only. `BRAND_HEX` for OG/satori is ink `#101010` (`src/lib/constants/site.ts`).
- **The ~24 real `--brand` call sites** are the "no media but still beautiful" surfaces: the logo mark
  (`src/components/shared/logo.tsx:35`, "the single splash of --brand accent allowed"), the notification
  badge and dots (`src/components/app/notification-bell.tsx:60,85`; `admin/operator-alerts.tsx:64`),
  the wizard's active step (`app/create-event-wizard.tsx:141,282`), the welcome carousel dot
  (`welcome-flow.tsx:98`), the QR preset pick (`qr-preset-picker.tsx:53,64`), the 404 eyebrow
  (`shared/not-found-screen.tsx:53`), the MDX callout (`mdx/spec-shared.tsx:285-286`), and the whole
  `src/components/marketing/frames/*` family (`phone-frame.tsx:56-79`, `gallery-frame.tsx:29-39`,
  `album-frame.tsx:36`, `qr-frame.tsx:34`): wireframe abstractions standing in for media.
- **The muted panel** ships at three alphas across seventeen sites: `/40` (`(paper)/contact/page.tsx:166`,
  `careers/[slug]/page.tsx:196`, `help/page.tsx:189`, `legal-blocks.tsx:120`, `zip-modal-demo.tsx:118`,
  `help-facts-band.tsx:65`, ...), `/30` (`help/page.tsx:218`, `help/[slug]/page.tsx:354`), `/50`
  (`contact-form.tsx:54`, `role-listings.tsx:98`). On paper `/40` over `0.99` is about `0.980`: a 1% step.
  Bible 16 (rewritten) names it the fourth ground.
- **Rings are a parallel elevation system nobody wrote down:** `ring-1 ring-foreground/5` (37 uses),
  `ring-white/70` (28), `ring-1 ring-foreground/10` (12). The `light` board owns depth; know it exists.
- **Achromatic vs monochromatic** is already in code: the ACCENT BLOCK at `marketing.css:1611-1625`
  ("ACHROMATIC base, not monochromatic: occasional tasteful color accents for status feedback and life,
  never a brand hue"). The `light` board owns the lamps and the aurora; this board owns the ramp, the
  accent and the panel.

### The board

Today's ramp beside three candidate ramps, rendered on real sections (a marketing chapter with cards,
the app's dashboard cards, a menu over a card, the footer) on cinema, paper and ink, at 1440 and 375,
in both modes. The candidates span the range: one that fills the light middle and gives the dark
ladder real steps; one that settles the three darks into one or names why there are three; one that
questions the zero-chroma premise (a 0.002 to 0.004 warm tint was declined once and left for a lab
round; show it, flagged). The accent: shown as a hue on the brand call sites above beside the ink
alias (the existing blue 252, and a new hue if the perfect version wants one), with the state colours
beside it so the two never collide. The panel: one token at one value on the sites above. Each
candidate is a token block (`:root`, `.dark`, `.surface-ink`, the cinema `--background`) Will can rule
between and the Orchestrator can paste into `globals.css`; the board's meta panel ends in the asks:
the ramp (A, B, C or today's), the accent (yes or no, and which hue), the panel (one value), one dark
ground or three.
### The deliverable

The board, plus the three token blocks written in the Record so the ruling is a paste, not a rewrite. Read `globals.css`, `theme.css`, `marketing.css`; change none of them (the ruling lands through the Orchestrator).

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

- none (lab only; the findings above are the Orchestrator's to fold at the ruling)

## Deferred (ROADMAP one-liners, bucket named)

- The lab bucket: a board's own chrome must key off the browser, not the stage's viewport toggle; a
  Stage's canvas is not a breakpoint context in either direction.
- The lab bucket: the Chrome tooling returns a flat black screenshot of any lab page scrolled past
  the fold, so a board is read by moving the content under a scroll position of zero (a negative body
  margin) or by measuring the DOM; a board that looks blank in a screenshot is not broken.
- The lab bucket (round 2): the lab shell's nav is a Suspense boundary that does not resolve while
  `document.hidden`, so a board read in a driven background tab lays out inside the 232px sidebar
  cell and every measurement off it is wrong; read a lab page in a foreground tab or by the DOM.
- The lab bucket (round 2): `src/app/(guest)/layout.tsx` mounts no design island, so a board's
  "Apply to the site" block cannot reach `/e/[qr_token]`; one `<AppDesignIsland />` fixes it.
- The design-system bucket (round 2): the lightbox backdrop is a literal `bg-black/90`
  (`media-lightbox.tsx:617`), not the canvas token, so the deepest surface in the product moves with
  nothing; fold it into whatever the grounds ruling says.

## Handoff (round 1)

- Head: the tip of `lp/palette`, pushed. The last commit touching the board is `703a227`; the commits
  after it are the unused-import sweep and this manifest. Preview
  `partyreel-git-lp-palette-partyreel.vercel.app`, board at `/design/lab/palette?key=`
- Synced with `launch-prep` at `7d389d4` (twice: `8b06f89` first, then `7d389d4` when media-kit
  folded; the earlier tip `ff2de13` carried a YAML break in `docs/tracks/orchestrator.md`'s
  frontmatter that failed `track-manifests.test.ts`, fixed on the branch before this sync)
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all pre-existing and none in
  this lane), test ok (1697 in 193 files), build ok (247 static pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` and the
  five files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `board.css`, `ramps.ts`,
  `sections.tsx`, `call-sites.tsx`). No exceptions. No production byte changed: `globals.css`,
  `theme.css` and `marketing.css` were read and not touched.
- Light QA on the preview, measured rather than eyeballed: at 1440 the ladder and the rooms strip lay
  out four across (239 px and 236 px), at 375 they stack (343 px and 164 px), no horizontal scroll at
  either width, all nine stages hold their canvas with zero overflow, no element on the page renders
  in a mono stack, and no animation runs on the board (the one colour fade on the token wrapper lives
  inside `prefers-reduced-motion: no-preference`, so a reduced-motion reader gets the jump cut and
  the same composition).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. The ruling's own paste needs one
  line per candidate in `theme.css`'s `@theme inline` block (`--color-faint: var(--faint);`) before a
  `text-faint` utility exists; the board reaches the token with an arbitrary value.
- Assets requested from Will:
  - **Four hard cases inside the kit the `media-kit` track already asked for** (its 36 masters
    replace all twelve stand-ins by id, so this is a line on that shot list, not a second delivery)
    · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp),
    one candle-warm, one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade
    · replaces the four this board renders (`wedding-golden`, `party-balloons`, `concert-confetti`,
    `reception-table`)
  - Why a palette board needs them: a ramp is only ever wrong against media that fights it, and all
    four stand-ins here are mid-key and warm, so the light end of every candidate is going untested.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  1. The ramp: A, B or C, or today's, in both modes.
  2. The accent: which hue (ink today, blue 252, violet 300, flare 330), and which of its three jobs
     it takes (identity, attention, the stand-in for media).
  3. The panel: one token at full strength, retiring the six alphas it ships at, and hover fills
     moving to --secondary.
  4. The dark grounds: three steps of one ladder (A and C) or one room for cinema, the app, ink and
     the canvas (B).
  5. The missing step: --faint enters the token set (all three candidates add it) or the 37
     alpha-dimmed text sites stay as they are.
- The departures, verbatim from BoardMeta:
  1. C re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and
     saturating the neutrals was consciously declined. C is that decision re-argued at 0.003 to 0.008
     chroma, on the board rather than in a comment.
  2. A and C make the dark card opaque, retiring the system's one translucent surface. Only B keeps a
     veil, and only in B does a card over a photograph read as glass.
  3. B deletes the cinema override in marketing.css, the skin block's only surface value. The
     cinema-to-footer seam then belongs entirely to light, which is the light board's lane.
  4. A finding against bible 16, which names four grounds. There are five: the media canvas is a
     ground of its own and it is doing a job ink cannot, since a lightbox wants the deepest surface in
     the product and a footer leaf wants a slab that reads on paper. Today one token, --gallery, is
     both. A and C separate them (canvas 0.09, ink 0.185); B answers the other way and makes every
     dark surface one room. Either way rule 16 is counting wrong, and that is Will's to rule, not a
     value to tune.
  5. All three candidates complete .surface-ink (no --card, --popover, --secondary, --accent or
     --input ships today), so an ink leaf can finally host a card and a menu.
  6. Each candidate adds one custom property, --faint, which needs one line in theme.css's
     @theme inline block before a text-faint utility exists. The board reaches it with an arbitrary
     value.
- Look at first: row 01, the four rulers, with the ladder tables under them. Today's light column
  reads 0.997, 0.997, 0.990, 0.965, 0.960, 0.905, none, 0.450, 0.130: five surfaces inside 0.037,
  then a 0.455 fall to the first text step, with nothing in between. Today's dark column reads 0.140,
  0.245, 0.210, 0.230, 0.250: the panel is LIGHTER than the card and the menu, which is the ladder
  upside down. Then row 06 with the ramp toggle: the same five surfaces under Today and under A, one
  flip apart. Then row 07, where a Card on the ink leaf is near white because `.surface-ink` has no
  `--card`. Row 09's accent toggle is the other half of the ruling, and the hues are meant to be
  judged against the state row under the wall, not on their own.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The palette exploration of the review wave put
bible 1 on a board: today's twenty-one hand-picked values beside three complete candidate token sets,
each a paste for `:root`, `.dark`, the gallery canvas, `.surface-ink` and the cinema ground. A (one
ladder) keeps the philosophy and fixes the spacing, B (one room) derives every surface from one
ground per mode and collapses the three darks into one, C (film stock) is A's spacing at 0.003 to
0.008 warm chroma, which re-opens a decision `globals.css` records as closed. They are judged on real
sections built from production components, at 1440 and 375, against a ruler that interpolates in
oklab so a tick's position is its lightness. The findings: the light middle is empty and the 20
`text-muted-foreground/70` sites composite to exactly the missing step; the dark panel ships lighter
than the card it sits in; `.surface-ink` has no `--card`, so a card in the footer is near white; and
`--gallery` is doing two jobs, which makes bible 16's four grounds five. The accent is argued by the
job it does rather than by taste. Lab only: no production byte changed.

## The token blocks, round one (A and B are candidates; C is history)

The ruling is a candidate letter; these are what lands. Each block is generated by the board itself
(`tokenBlock()` in `ramps.ts`), so what is written here is what the board's last row renders.
`--faint` is new in both candidates and needs one line in `theme.css`'s `@theme inline` block
(`--color-faint: var(--faint);`) before a `text-faint` utility exists.

★ **Round three cut candidate C and kept every value it held: C is no longer a letter Will can rule,
and section C below is kept only as the reference the temperature switch is pinned to.** C was A's
ladder at a temperature, so it became `warm()` in `ramps.ts`, which any ramp can wear;
`temperature.test.ts` pins `warm(A)` to C's published block token for token. Read "The paste, round
three" below for what a ruling actually lands now, C's one correction included.

### A. One ladder

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.977 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.998 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(0.998 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.145 0 0);
  --primary-foreground: oklch(0.998 0 0);
  --secondary: oklch(0.925 0 0);
  --secondary-foreground: oklch(0.145 0 0);
  --muted: oklch(0.948 0 0);
  --muted-foreground: oklch(0.46 0 0);
  --faint: oklch(0.62 0 0);
  --accent: oklch(0.925 0 0);
  --accent-foreground: oklch(0.145 0 0);
  --border: oklch(0.89 0 0);
  --input: oklch(0.89 0 0);
  --ring: oklch(0.3 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.955 0 0);
  --card: oklch(0.235 0 0);
  --card-foreground: oklch(0.955 0 0);
  --popover: oklch(0.285 0 0);
  --popover-foreground: oklch(0.955 0 0);
  --primary: oklch(0.955 0 0);
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.325 0 0);
  --secondary-foreground: oklch(0.955 0 0);
  --muted: oklch(0.195 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --faint: oklch(0.55 0 0);
  --accent: oklch(0.325 0 0);
  --accent-foreground: oklch(0.955 0 0);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.85 0 0);
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.09 0 0);
  --gallery-foreground: oklch(0.965 0 0);
  --gallery-muted: oklch(0.62 0 0);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.185 0 0);
  --foreground: oklch(0.965 0 0);
  --card: oklch(0.235 0 0);
  --card-foreground: oklch(0.965 0 0);
  --popover: oklch(0.285 0 0);
  --popover-foreground: oklch(0.965 0 0);
  --secondary: oklch(0.325 0 0);
  --secondary-foreground: oklch(0.965 0 0);
  --accent: oklch(0.325 0 0);
  --accent-foreground: oklch(0.965 0 0);
  --muted: oklch(0.235 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --faint: oklch(0.55 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(0.965 0 0);
  --primary: oklch(0.965 0 0);
  --primary-foreground: oklch(0.185 0 0);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.105 0 0);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.105 0 0);
}
```

### B. One room

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.14 0 0);
  --card: oklch(0.99 0 0);
  --card-foreground: oklch(0.14 0 0);
  --popover: oklch(0.998 0 0);
  --popover-foreground: oklch(0.14 0 0);
  --primary: oklch(0.14 0 0);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: color-mix(in oklab, var(--foreground) 9%, var(--background));
  --secondary-foreground: oklch(0.14 0 0);
  --muted: color-mix(in oklab, var(--foreground) 5%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 62%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 45%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 9%, var(--background));
  --accent-foreground: oklch(0.14 0 0);
  --border: color-mix(in oklab, var(--foreground) 13%, var(--background));
  --input: color-mix(in oklab, var(--foreground) 17%, var(--background));
  --ring: color-mix(in oklab, var(--foreground) 80%, var(--background));
}

.dark {
  --background: oklch(0.125 0 0);
  --foreground: oklch(0.96 0 0);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0 0);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0 0);
  --primary: oklch(0.96 0 0);
  --primary-foreground: oklch(0.125 0 0);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0 0);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0 0);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.125 0 0);
  --gallery-foreground: oklch(0.96 0 0);
  --gallery-muted: oklch(0.62 0 0);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.125 0 0);
  --foreground: oklch(0.96 0 0);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0 0);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0 0);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0 0);
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0 0);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
  --primary: oklch(0.96 0 0);
  --primary-foreground: oklch(0.125 0 0);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.125 0 0);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.125 0 0);
}
```

### C. Film stock

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.977 0.004 85);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.998 0.003 85);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(0.998 0.003 85);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.145 0 0);
  --primary-foreground: oklch(0.998 0.003 85);
  --secondary: oklch(0.925 0.006 85);
  --secondary-foreground: oklch(0.145 0 0);
  --muted: oklch(0.948 0.005 85);
  --muted-foreground: oklch(0.46 0 0);
  --faint: oklch(0.62 0 0);
  --accent: oklch(0.925 0.006 85);
  --accent-foreground: oklch(0.145 0 0);
  --border: oklch(0.89 0.007 85);
  --input: oklch(0.89 0.007 85);
  --ring: oklch(0.3 0 0);
}

.dark {
  --background: oklch(0.145 0.005 60);
  --foreground: oklch(0.955 0.002 85);
  --card: oklch(0.235 0.006 60);
  --card-foreground: oklch(0.955 0.002 85);
  --popover: oklch(0.285 0.007 60);
  --popover-foreground: oklch(0.955 0.002 85);
  --primary: oklch(0.955 0.002 85);
  --primary-foreground: oklch(0.145 0.005 60);
  --secondary: oklch(0.325 0.008 60);
  --secondary-foreground: oklch(0.955 0.002 85);
  --muted: oklch(0.195 0.006 60);
  --muted-foreground: oklch(0.7 0.004 70);
  --faint: oklch(0.55 0.004 70);
  --accent: oklch(0.325 0.008 60);
  --accent-foreground: oklch(0.955 0.002 85);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.85 0 0);
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.09 0.004 60);
  --gallery-foreground: oklch(0.965 0.002 85);
  --gallery-muted: oklch(0.62 0.004 70);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.185 0.006 60);
  --foreground: oklch(0.965 0.002 85);
  --card: oklch(0.235 0.006 60);
  --card-foreground: oklch(0.965 0.002 85);
  --popover: oklch(0.285 0.007 60);
  --popover-foreground: oklch(0.965 0.002 85);
  --secondary: oklch(0.325 0.008 60);
  --secondary-foreground: oklch(0.965 0.002 85);
  --accent: oklch(0.325 0.008 60);
  --accent-foreground: oklch(0.965 0.002 85);
  --muted: oklch(0.235 0.006 60);
  --muted-foreground: oklch(0.7 0.004 70);
  --faint: oklch(0.55 0.004 70);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(0.965 0.002 85);
  --primary: oklch(0.965 0.002 85);
  --primary-foreground: oklch(0.185 0.006 60);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.105 0.004 60);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.105 0.004 60);
}
```

## Handoff (round 2)

- Head: the tip of `lp/palette`, pushed, and the preview alias serves THE HEAD'S BOARD. The alias
  `partyreel-git-lp-palette-partyreel.vercel.app` serves `b4be6a2` (deployment
  `partyreel-ka5icno5j`, READY, alias assigned), proved on the served HTML rather than on the
  deploy's existence: it carries "Today it has no --card of its own" and `break-inside-avoid` and
  no longer carries "Near white until a candidate completes the set". The tip adds only this
  manifest, so no board byte differs between `b4be6a2` and the tip. Board at
  `/design/lab/palette?key=`. The round-two board is the one whose control bar carries the class
  `pal-walk-bar` (and thirteen rows with ids `#pal-01` to `#pal-13`); round one's had neither. The
  last commit touching the board is the album fix; the `4b035c1` sync merge sits between it and the
  first round-two commit.
- Synced with `launch-prep` at `4b035c1` (it had moved from the `ca952b5` cut by one docs commit,
  `docs/systems/design-system.md`; merged clean, no conflict, nothing in this lane touched).
- Gates, re-run at this head on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all
  pre-existing and none in this lane, none in a file this track owns), test ok (1698 in 193 files),
  build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` and the six
  files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `board.css`, `ramps.ts`,
  `sections.tsx`, `call-sites.tsx`, and the new `specimens.tsx`). No exceptions. No production byte
  changed: `globals.css`, `theme.css` and `marketing.css` were read and not touched.
- Light QA, measured rather than eyeballed, and split by where each measurement was actually taken.
  ON THE REBUILT PREVIEW, through the DOM: thirteen rows `#pal-01` to `#pal-13`, the walk bar 126
  tall, the album's twenty four tiles every one `break-inside: avoid` with an IN-FLOW image whose
  box coincides with its tile (so the fragment bug cannot come back unseen), the ink slab's computed
  background equal to the value its own caption prints under every ramp (Today 0.155, A 0.185, B
  0.125, C 0.185 at 0.006 chroma) with the card on the leaf following it, the Apply walk landing one
  `<style>` with the real selectors (`:root, .surface-paper`, `.dark`, `.surface-ink` and the accent
  block) and the badge then reading "This page wears it too", Clear removing it and leaving nothing
  in `localStorage`, zero page-level horizontal scroll under BOTH stage toggles (Desktop 1440 and
  Phone 375), zero running animations, no element in a mono stack, no em-dash in any text node.
  ON A LOCAL PRODUCTION BUILD OF THE SAME COMMIT, at the two browser widths the test browser cannot
  give (its window width is pinned at a 1120 viewport, so a 1440 and a 375 BROWSER have to be
  measured locally): the content column is 1024 wide, every row's `scroll-mt-32` clears the bar, and
  all nineteen stages hold their canvas with zero overflow at 1440 AND at 375 under all four ramps.
  The one colour fade on the token wrapper lives inside `prefers-reduced-motion: no-preference`, so
  a reduced-motion reader gets the jump cut and the same composition.
  ★ The board reads as a 232px column in a HIDDEN tab: the lab shell's nav is a Suspense boundary
  that does not resolve while `document.hidden`, so the content lands in the sidebar's grid cell.
  It is a test-tool artifact, not a defect, and it hits every board in the lab: verify a lab page in
  a FOREGROUND tab or by the DOM.
- ★ **A rate-limited push leaves the alias STALE with nothing on the branch to say so: prove the
  review surface by a marker string from the newest commit, never by the push.** The project sits
  on a 100-deployments-per-day cap (`api-deployments-free-per-day`), which the first wave of tracks
  exhausted, so the three pushes after `e440961` got "Deployment rate limited, retry in 24 hours"
  as a GitHub commit status and produced NO deployment at all. The alias went on serving `e440961`,
  which is how a read-only review came to walk a board without the three fixes below and report
  them as live defects. Recovery, for the next agent to hit this: the cap is a ROLLING window, so
  slots free a few at a time. Poll `POST api.vercel.com/v13/deployments` with
  `{"gitSource":{"type":"github","repoId":1252816746,"ref":"lp/<track>","sha":"<sha>"}}` until it
  stops answering `payment_required` (two attempts 45 seconds apart was enough here, at 22:18); the
  deployment it creates takes the branch alias on its own. Then fetch the board and grep for a
  string only the newest commit has.
- What the fix pass after the first read-only review changed: NO board byte. All three defects that
  review reported were already fixed in the tree at `b4be6a2`; what was broken was the review
  SURFACE, an alias three commits behind the branch because the quota refused every push. The pass
  rebuilt the alias at `b4be6a2`, re-ran the four gates at this head, re-measured all three fixes on
  the SERVED build instead of a local one (see Light QA above), and corrected this Handoff, which
  had claimed its QA "on the preview" when half of it was measured locally.
- Three defects caught while verifying, all fixed, all worth knowing: the guest album fragmented and
  then painted black (a CSS column will split an aspect-ratio box, and an ABSOLUTELY positioned
  child of a column item is placed against the first column fragment in Chrome, so every tile past
  column two drew its photograph on top of column one; `break-inside-avoid` plus an IN-FLOW image is
  the fix, which is what production's masonry already does); the grounds row's ink slab wore the
  SHIPPED `.surface-ink` while its caption named the candidate's value; and the accent never reached
  `.surface-ink` at all (see departure 4).
- ★ Two lab-tooling traps, for the next agent: a board read in a DRIVEN BACKGROUND tab lays out in
  the 232px sidebar cell (the lab nav is a Suspense boundary that does not resolve while
  `document.hidden`), and shifting a lab page with a negative body margin to dodge the black-
  screenshot bug perturbs the Stage's own ResizeObserver, so every stage collapses to a thumbnail
  and the screenshot lies twice. Read a lab page in a FOREGROUND tab at a normal scroll position,
  or measure the DOM.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Shell change proposed (the Orchestrator's, not this lane's): the demo guest page cannot wear a
  candidate.** `src/app/(guest)/layout.tsx` mounts no design island, so `setCandidateCss` never
  reaches `/e/[qr_token]`. One line adds it, the same `<AppDesignIsland />` the host app's layout
  mounts (it is a client island that reads `?key=` itself, so a layout that cannot await
  `searchParams` is not a problem). Until then the walk covers `/`, `/pricing`, `/help`, `/contact`,
  `/dashboard` and an event page, and the guest album is judged on the board (row 04).
- Assets requested from Will:
  - **Four hard cases inside the kit the `media-kit` track already asked for** (its 36 masters
    replace all twelve stand-ins by id, so this is a line on that shot list, not a second delivery)
    · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp),
    one candle-warm, one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade
    · replaces the four this board leans on (`wedding-golden`, `party-balloons`, `concert-confetti`,
    `reception-table`)
  - **A portrait pair for the guest masonry** · two of the same 36 at 1600 px long edge, PORTRAIT,
    same grade · replaces the hand-set tile ratios in `specimens.tsx` (eleven of the twelve stand-ins
    are landscape, so the column flow the guest album actually ships is being faked)
  - Why a palette board needs them: a ramp is only ever wrong against media that fights it, and the
    stand-ins are mid-key and warm, so the light end of every candidate is going untested.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; every one
  takes a one-word answer):
  1. The ramp: today, A, B or C.
  2. The accent: ink, blue, violet or flare.
  3. The accent's reach: all three jobs, attention only, or identity only.
  4. The panel: one token, or the alphas.
  5. The dark grounds: a ladder, or one room.
  6. The canvas and the ink slab: split, or one.
  7. The missing step: faint in, or out.
  8. The dark card: opaque, or the veil.
- The departures, verbatim from BoardMeta:
  1. Round one's departure list said only candidate B kept the system's one translucent surface. That
     was wrong: B's card is a color-mix off the room, which is fully opaque, so all three candidates
     retire the veil and none of them said so. Row 08 renders both answers over a photograph and ask
     8 makes it a ruling rather than a side effect.
  2. A finding against bible 16, sharpened and changed. Counted by the job it does, the deepest dark
     surface in the product is not a token at all: the lightbox paints its backdrop with a literal
     `bg-black/90` (`media-lightbox.tsx:617`). What `--gallery` actually does is the media WELL (a
     tile before its image decodes, a coverless event card, the reel frame) and, through
     `.surface-ink`, the footer SLAB, and those two want opposite things. Rule 16 counts four
     grounds; there are at least six surfaces and one of them is a literal. Row 02.
  3. C re-opens a decision `globals.css` records as closed: zero-chroma purity IS the brand point,
     and saturating the neutrals was consciously declined. C is that decision re-argued at 0.003 to
     0.008 chroma, on the board rather than in a comment.
  4. The accent has to be written into `.surface-ink` or it never reaches the footer. Today the leaf
     declares `--brand: var(--gallery-foreground)`, and a class rule outranks a value inherited from
     the page around it, so a hue ruled for the whole site would reach every surface in the product
     except the mark that sits at the bottom of every page. The accent paste therefore carries a
     third block, and every candidate's ink map keeps a `--brand` line of its own so a ruling of ink
     alone cannot leave the leaf inheriting the PAPER ink onto a dark slab. Row 06.
  5. B deletes the cinema override in `marketing.css`, the skin block's only surface value. The
     cinema-to-footer seam then belongs entirely to light, which is the light board's lane.
  6. All three candidates complete `.surface-ink` (no `--card`, `--popover`, `--secondary`,
     `--accent` or `--input` ships today), so an ink leaf can finally host a card and a menu.
  7. Each candidate adds one custom property, `--faint`, which needs one line in `theme.css`'s
     `@theme inline` block (`--color-faint: var(--faint);`) before a `text-faint` utility exists.
     The board reaches it with an arbitrary value.
  8. Row 07 borrows the light exploration's proposed shadow family and its named ring
     (`docs/specs/light.md`) so the ramp and the depth cue are judged in one look. Those values are
     NOT in this board's paste: depth is that track's lane and its ruling lands there.
  9. The demo guest page cannot wear a candidate today (the shell change above).
- **What round two took from the other boards:** the light spec's shadow family (one geometry, two
  sizes, one alpha ramp per ground) and its named ring lift, rendered on every candidate's grounds in
  row 07; the shell's `setCandidateCss` for the walk. The media-kit track's shot list carries both
  asset asks rather than a second delivery.
- Look at first: **row 01**, the four rulers with the ladder tables and the state row under each.
  Then **row 02** (the grounds counted by job: the literal, the well, the slab, with Today's
  near-white card on the slab and a candidate's completed set one toggle away), then **row 03** (the
  event page and the dashboard in both modes, the densest chrome in the product). Then press
  **Apply A to the site** and walk `/`, `/pricing`, `/help`, `/contact`: the panel switch and the
  faint switch ride along, so four of the eight asks are answerable on real pages. **Row 12** is the
  accent, all four hues on every job at once with the state hues at the foot.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two turned the palette board from a proof
into a ruling surface. Every candidate now leaves the board: the full token block plus the selected
accent, the panel at one token and `--faint` on the 37 alpha-dimmed sites, handed to the whole site
through the shell's `setCandidateCss`, so four of the eight asks are answered on `/`, `/pricing`,
`/help` and `/contact` rather than on a stage. The judged surfaces widened to what the product is
made of: the event page's stat band, command strip and review queue, the dashboard with the real
filter chips, the guest album on the canvas, the ink leaf hosting a card and a menu, the text steps
in real copy, the six state hues under every ramp in both modes. Depth is judged with the ramp (the
light spec's lift and float and the named ring), and three findings sharpened: the deepest surface in
the product is a literal `bg-black/90`, not the canvas token, so `--gallery` is the media well and
the ink slab; round one was wrong that B kept the translucent card, so the card became a three-way
toggle that folds into the paste; and the accent never reaches `.surface-ink` unless the paste says
so. The asks now take one-word answers. Lab only: no production byte changed.

## The paste, round two (what changed in it)

The ruling is a candidate letter plus an accent word; the blocks are generated by the board itself
(`tokenBlock()` and `accentBlock()` in `ramps.ts`), so row 13 renders exactly what lands and nothing
here needs retyping. Round one's three blocks are above, unchanged in every value; round two adds
two lines to each candidate's `.surface-ink` (`--brand: var(--primary)` and its foreground, without
which a pasted ink block inherits the PAPER ink onto a dark slab), and the accent's own paste is:

```css
/* globals.css, the accent (nothing prints for a ruling of "ink": it is the alias that ships) */
:root,
.surface-paper {
  --brand: <the hue's light value>;
  --brand-foreground: <its light foreground>;
}

.dark {
  --brand: <the hue's dark value>;
  --brand-foreground: <its dark foreground>;
}

/* the footer leaf neutralises --brand today; the accent has to reach it */
.surface-ink {
  --brand: <the hue's dark value>;
  --brand-foreground: <its dark foreground>;
}
```

The four hues, as they sit in `ramps.ts`: blue `oklch(0.55 0.17 252)` light and `oklch(0.72 0.15 252)`
dark; violet `oklch(0.58 0.2 300)` and `oklch(0.72 0.18 300)`; flare `oklch(0.58 0.22 330)` and
`oklch(0.7 0.2 330)`. Ink is today's alias and changes no line.

## The paste, round three (every combination a ruling can be)

The ruling is a letter plus a temperature plus an accent word plus two one-word answers about the
dark card and the missing step. The letter and the temperature are the two that rewrite whole
blocks, so their six combinations are written out in full below; the card and the faint answers each
move ONE line, and what that line becomes is printed here rather than left for the reader to derive.
The board generates all of it from the same `resolveRamp()` + `tokenBlock()` the paste uses, so
nothing here is retyped and nothing can disagree with what row 02 renders.

| The ruling | What lands |
| --- | --- |
| today, neutral | nothing. It ships. |
| today, warm | the block below, "Today, warm". |
| A, neutral | section A above, unchanged. |
| A, warm | section C above, token for token, with the one correction below. |
| B, neutral | section B above, unchanged. |
| B, warm | the block below, "B, warm". |

The accent's own block (`accentBlock()`, three selectors) is in "The paste, round two" above and is
unchanged; a ruling of "ink" prints nothing there.

**Ask 7, the dark card, is the third dimension, and it IS in the paste.** `resolveRamp()` runs the
card answer before the temperature, so it reaches `tokenBlock()` rather than the walk: it rewrites
`--card` in `.dark` and in `.surface-ink`, and nothing else in any block moves. The control offers
the same three positions the ask does. What each lands, per letter, neutral (pinned by
`temperature.test.ts`, "the dark card ruling, per letter"):

| The letter | declared | opaque | the veil |
| --- | --- | --- | --- |
| today | `oklch(0.21 0 0 / 0.62)` | `oklch(0.21 0 0)` | as declared |
| A | `oklch(0.235 0 0)` | as declared | `oklch(0.235 0 0 / 0.62)` |
| B | `color-mix(in oklab, var(--foreground) 12%, var(--background))` | as declared | the same mix at 62 percent: `color-mix(in oklab, <that value> 62%, transparent)` |

Three things that table says out loud. Today is the only letter where "opaque" moves a value, because
today is the only letter that still declares the translucent card; on both candidates the moving
answer is "the veil", which ADDS translucency back. Today's `.surface-ink` declares no `--card` at
all (the gap row 06 is about), so on today the ruling lands one line rather than two, while on A and
B it lands the same value in both blocks. And on a WARM ruling the opaque form takes the room's hue
like any other surface (`oklch(0.21 0.006 60)` for today) while the veiled form stays at chroma 0 on
purpose: `warm()` leaves every veil alone because a veil borrows the surface under it, which in a
warm room is already warm.

**Ask 6, the missing step, moves one line in each of the three blocks.** "In" is what every block
below prints. "Out" is a ruling that the custom property is never declared, so it DELETES the
`--faint` line from `:root/.surface-paper`, from `.dark` and from `.surface-ink`, leaves the
37 call sites compositing an alpha of the second step by hand exactly as they do today, and
drops the `theme.css` prerequisite with it (with no `--faint` there is no `--color-faint` line and no
`text-faint` utility to grow). The board does this to the ramp itself rather than to one renderer,
so "out" also empties the rung at row 01 and sends row 10's third step back to the fallback; row 13
prints whichever answer is set.

**The panel switch is the one answer that is NOT in the paste**, and cannot be: it deletes an alpha
at 35 call sites (six distinct ones) rather than moving a token value, so it rides the walk instead,
as a stylesheet the lab hands the real pages. Scaffolding, not shippable CSS.

**A, warm, and C's one correction.** `warm(A)` reproduces section C's five blocks token for token
with two differences, both deliberate: the two `--brand` lines round two added to every candidate's
`.surface-ink` (above, "The paste, round two"), and the dark `--ring`, which C published cold at
`oklch(0.85 0 0)` while writing the ink ring warm at the same job on the same ground. `warm(A)`
writes `--ring: oklch(0.85 0.004 70)`, and `temperature.test.ts` pins that.

**B, warm, moves five values and the rest follows.** B derives every surface from the room by
`color-mix`, so warming it is five literals (the room `0.125`, the paper ground and card `0.99`, the
menu `0.998`, the near-whites `0.96`, the canvas muted `0.62`) and every mix under them inherits
without being written. That is the clearest thing the temperature switch says about B, and the old
three-candidate board could not ask it at all.

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.99 0.003 85);
  --foreground: oklch(0.14 0 0);
  --card: oklch(0.99 0.003 85);
  --card-foreground: oklch(0.14 0 0);
  --popover: oklch(0.998 0.003 85);
  --popover-foreground: oklch(0.14 0 0);
  --primary: oklch(0.14 0 0);
  --primary-foreground: oklch(0.99 0.003 85);
  --secondary: color-mix(in oklab, var(--foreground) 9%, var(--background));
  --secondary-foreground: oklch(0.14 0 0);
  --muted: color-mix(in oklab, var(--foreground) 5%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 62%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 45%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 9%, var(--background));
  --accent-foreground: oklch(0.14 0 0);
  --border: color-mix(in oklab, var(--foreground) 13%, var(--background));
  --input: color-mix(in oklab, var(--foreground) 17%, var(--background));
  --ring: color-mix(in oklab, var(--foreground) 80%, var(--background));
}

.dark {
  --background: oklch(0.125 0.005 60);
  --foreground: oklch(0.96 0.002 85);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0.002 85);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0.002 85);
  --primary: oklch(0.96 0.002 85);
  --primary-foreground: oklch(0.125 0.005 60);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0.002 85);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0.002 85);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.125 0.005 60);
  --gallery-foreground: oklch(0.96 0.002 85);
  --gallery-muted: oklch(0.62 0.004 70);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.125 0.005 60);
  --foreground: oklch(0.96 0.002 85);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0.002 85);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0.002 85);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0.002 85);
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0.002 85);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
  --primary: oklch(0.96 0.002 85);
  --primary-foreground: oklch(0.125 0.005 60);
  --brand: var(--primary);
  --brand-foreground: var(--primary-foreground);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.125 0.005 60);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.125 0.005 60);
}
```

**Today, warm**, for completeness: the ramp ask offers today, so the temperature ask can land on it.

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.99 0.003 85);
  --foreground: oklch(0.13 0 0);
  --card: oklch(0.997 0.003 85);
  --card-foreground: oklch(0.13 0 0);
  --popover: oklch(0.997 0.003 85);
  --popover-foreground: oklch(0.13 0 0);
  --primary: oklch(0.13 0 0);
  --primary-foreground: oklch(0.99 0.003 85);
  --secondary: oklch(0.96 0.004 85);
  --secondary-foreground: oklch(0.13 0 0);
  --muted: oklch(0.965 0.004 85);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.96 0.004 85);
  --accent-foreground: oklch(0.13 0 0);
  --border: oklch(0.905 0.006 85);
  --input: oklch(0.905 0.006 85);
  --ring: oklch(0.3 0 0);
}

.dark {
  --background: oklch(0.14 0.005 60);
  --foreground: oklch(0.96 0.002 85);
  --card: oklch(0.21 0 0 / 0.62);
  --card-foreground: oklch(0.96 0.002 85);
  --popover: oklch(0.23 0.006 60);
  --popover-foreground: oklch(0.96 0.002 85);
  --primary: oklch(0.96 0.002 85);
  --primary-foreground: oklch(0.15 0.005 60);
  --secondary: oklch(0.25 0.006 60);
  --secondary-foreground: oklch(0.96 0.002 85);
  --muted: oklch(0.245 0.006 60);
  --muted-foreground: oklch(0.71 0.004 70);
  --accent: oklch(0.25 0.006 60);
  --accent-foreground: oklch(0.96 0.002 85);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.85 0.004 70);
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.155 0.005 60);
  --gallery-foreground: oklch(0.97 0.002 85);
  --gallery-muted: oklch(0.62 0.004 70);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: var(--gallery);
  --foreground: var(--gallery-foreground);
  --card-foreground: var(--gallery-foreground);
  --brand: var(--gallery-foreground);
  --brand-foreground: var(--gallery);
  --border: var(--gallery-border);
  --muted: color-mix(in oklab, var(--gallery) 85%, var(--gallery-foreground));
  --muted-foreground: var(--gallery-muted);
  --ring: var(--gallery-foreground);
  --primary: var(--gallery-foreground);
  --primary-foreground: var(--gallery);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.11 0.005 60);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.11 0.005 60);
}
```

## Handoff (round 3)

- Head: the tip of `lp/palette`, pushed. Every board byte is at **`d773ad6`** (the SECOND fix pass,
  after the read-only re-review); the commits after it are this manifest's own, so no board byte
  differs between `d773ad6` and the tip. Board at `/design/lab/palette?key=`.
  **The round-three board is the one whose candidate card is followed by a panel headed "What the
  letter already decides", and whose control bar reads "Put it on the real pages"; round two's had
  neither, and round two's ramp toggle had a fourth button, C. The FIX PASS on top of it is the one
  whose meta panel is preceded by a panel headed "From the other boards", whose Departures list has
  six lines rather than ten, and whose walk at row 13 is seven links rather than six. The SECOND fix
  pass is the one whose bar reads "The missing step" and "Declared Opaque Veil 62%": press Out and
  row 01's faint rung goes hatched on all three ramps, row 10's third caption reads
  `text-muted-foreground/70`, and the paste at row 13 loses its three `--faint` lines.**
- **What the SECOND fix pass changed (the read-only re-review's two should-fix items, plus the
  cause the fix found underneath the first of them).**
  1. **The missing step moves the board, because it is a ramp edit now rather than a renderer
     flag.** The review was right that "The faint step: In / Out" changed no pixel: `faintOnDimmed`
     reached `applyCss`/`applyLabel` and nothing else. Answering it in one renderer would have been
     the wrong repair, because a ruling of "out" means the custom property is never declared, not
     that one specimen draws differently. So `resolveRamp()` takes the answer and `withoutFaint()`
     deletes `--faint` from the light, dark and ink blocks, and every reader of the ramp follows at
     once: row 01's ladder draws the hatched "none" rung it already draws for today, row 10's third
     step falls back to the alpha the 37 sites composite by hand (its label reads
     `text-muted-foreground/70`, and the caption under the frames says which of the two is on
     screen), the frame labels read "faint in" / "faint out", and row 13 prints a paste with no
     `--faint` line and drops the `theme.css` prerequisite that goes with it.
  2. **The cause underneath it: two rows resolved their own ramp.** Rows 01 and 03 called
     `resolveRamp()` themselves and had never been given the new answer, which is exactly how a
     switch goes decorative. Every ramp on the board goes through ONE local resolver now
     (`resolved()` in `PaletteBoard`), with the reason written at it, so a row cannot answer a
     different question from the bar again. Verified by DOM: with Out pressed, all six ladder rungs
     (three ramps x two modes) read "none"; with In pressed, today's two read "none" and the
     candidates' four read their value.
  3. **The paste section covers the card dimension, and ask 7 reads its control.** "The paste,
     round three" now prints what each card answer lands per letter in both blocks it touches, with
     the three things that table says out loud (today is the only letter where "opaque" moves a
     value; today's `.surface-ink` declares no `--card` at all, so it lands one line rather than
     two; a warm ruling warms the opaque form and leaves the veiled one to the room showing
     through). Ask 7 offers the control's three answers rather than two of them, and the control's
     first position is "Declared" rather than "As declared" so both read as one word. The same
     section now also states what the faint answer does to the paste, and that the panel answer is
     the one switch that cannot be in it. Every cell of that table was read back off the board's own
     `<pre>` rather than derived: A declared/opaque `oklch(0.235 0 0)` and veil
     `oklch(0.235 0 0 / 0.62)` in `.dark` and `.surface-ink` both; today two lines, not three; B's
     veil the mix inside a mix. `temperature.test.ts` pins all of it (15 tests, up from 8).
- **What the FIRST fix pass changed, one line each (the read-only review's four should-fix items,
  plus two the fix walk found itself).**
  1. **Row 02 can no longer pair a set with itself.** `today` is one of the three answers ask 1
     offers, and pressing it made the candidate the same object as the left half: the row printed
     "Today" beside "Today", five identical lightnesses under each half, and two children on one
     React key. `PairFrame` renders ONCE when both sides resolve to one set, in the unpaired
     composition, with a line under it saying which press brings the second half back, and the
     frame's label and height follow (`today, with no candidate beside it`, one half's height on the
     phone). Measured at both canvases under all three ramps: no clipping, no duplicate key, no
     warning in the console.
  2. **The departures are six, and every one is a ruling.** Four of round two's ten were notes for
     the next agent rather than decisions for Will: theme.css's one `--color-faint` line (now
     printed at row 13, beside the paste it belongs to), the light board's borrowed shadow values
     (row 07's caption already says they are not in this paste), "both candidates complete
     `.surface-ink`" (row 06's reading says it), and the guest layout's missing island, which
     launch-prep has since landed. The board's own comment says why the list was cut.
  3. **The paste covers every combination a ruling can be.** "The paste, round three" above is new:
     the six rulings as a table, the two blocks nobody had written down (today warm, B warm) in
     full, and A warm as section C plus its one correction. The round-one section is re-headed so C
     reads as history rather than as a fourth button, and row 13's reading no longer claims the
     Record carries three candidates.
  4. **What this board took from the other boards is stated, on the board and below.** See the
     cross-board bullet further down; the board carries it as a panel above the meta panel.
  5. The accent wall's toast clipped 8px past the phone stage (a grid item's min-width is auto, so
     the truncating label could not shrink). Found by re-measuring every stage rather than by
     reading; the previous round's "zero overflow" claim missed it because a scroll container's
     contents were counted the same way.
  6. Nothing counts the walk's pages in prose any more: the three sentences that said "six" read the
     list instead, which is round three's own lesson about a number quoted in two places.
- ★ **The preview alias is STALE and cannot be refreshed today: the project is at Vercel's
  100-deployments-a-day ceiling.** `partyreel-git-lp-palette-partyreel.vercel.app` still serves
  round two's `b4be6a2` (22:18), and it still carries "C. Film stock", which round three cut. After
  the second fix pass it is three heads behind, and the marker to check on the rebuilt alias is the
  bar reading "The missing step" with a "Declared" position on the card control. Three
  pushes after it produced no deployment at all, and a forced redeploy of the head answers
  `payment_required`, `api-deployments-free-per-day`, `remaining: 0`, `reset` tomorrow. Other
  branches deployed inside the same window before the last slots went, so this is the whole project's
  ceiling rather than anything about this branch or the ignore-build gate (the manifest says
  `preview: true`, which the gate honours). **The Orchestrator has to force a redeploy at the head
  once a slot frees and confirm READY before Will walks this alias**, or the walk will be round two's
  board wearing round three's label. The call that does it, from round two's handoff and re-verified
  here: `POST api.vercel.com/v13/deployments?forceNew=1` with
  `{"name":"partyreel","project":"prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB","gitSource":{"type":"github","repoId":1252816746,"ref":"lp/palette","sha":"<head>"}}`
  and no `target` field (a `target` of "preview" is rejected as invalid).
- ★ **Correction to round two's recovery advice, with the cadence that replaces it.** Round two
  recorded "two attempts 45 seconds apart was enough"; that was luck, and seven attempts over seven
  minutes here freed nothing. Two things are worth knowing instead. First, the `limit.reset` the
  refusal returns is uninformative: it came back as EXACTLY the attempt's own timestamp plus 24 hours
  every time (23:11:27, 23:12:13, 23:13:23 ... 23:18:02), so it is "24 hours from now" rather than a
  clock to wait out, and a refused attempt may well be counted against the window. Second, the
  deployment list shows what actually happens at the ceiling: the window is ROLLING and releases one
  slot roughly every 14.4 minutes (100 a day), and the list bears that out to the minute over six
  deployments (22:04:10, 22:18:42, 22:33:19, 22:48:02, 23:02:50, 23:17:14), each taken by whichever
  branch asked first. A push whose deployment is refused is not queued, so it never gets a later
  slot on its own, and the slots are CONTESTED. Four consecutive slots, from the deployment list,
  landed at 23:02:50, 23:17:14, 23:31:57 and 23:46:21: an interval of 14m24s to within seconds, and
  a different branch took each one (`hero-scan`, `hero-burst`, `media-kit`, `rounding`). A call
  placed at 23:46:11 was refused because it was TEN SECONDS EARLY, and the slot was gone by the time
  it retried. **So: read the newest READY timestamp out of the list, add 14m24s, and place the call
  a few seconds AFTER that, holding with short retries for a minute rather than firing early.**
  Nothing this round won one: sixteen calls across four boundaries, including twelve placed across
  the 00:00:50 boundary exactly as above, were all refused. That is why this handoff is written
  against a local server, and why the alias is the Orchestrator's to refresh before Will walks it.
- **So this round's QA, and both fix passes', were taken on a local server in the worktree**
  (round three and the first fix pass on `pnpm dev`, port 3021; the SECOND fix pass on a local
  PRODUCTION build, `pnpm build` then `next start -p 3031`, which is the closest thing to the alias
  available today), the lab key on every URL. Neither fix pass called the Vercel API at all, by
  instruction: the project is still at the ceiling and the alias is the Orchestrator's to refresh.
  Every number below was measured there through the DOM rather than eyeballed. Two things to know if
  you do the same. Running `pnpm build` in a worktree that has `pnpm dev` up will eventually kill the
  dev server, because they share `.next`; restart it on another port rather than doubting the page.
  And the browser window here caps at an inner width of 1424, so "1440" is the board's own stage
  toggle (which sets the canvas width) rather than the window: the stage is what the rows render at,
  and the document's own horizontal overflow was 0 at both settings.
- Synced with `launch-prep` FOUR times as the wave integrated around this round, every one clean
  and none of them touching this lane: `dd4aa0b` (13 commits, floating-surfaces' own lane),
  `1c2d0ea` (13 more, hero-scan's round three), `8d8d0af` (13 more, light's round three) and
  **`fb395fe`** at the fix pass (41 more: type-scale, media-kit and hero-burst integrating, plus the
  shell change this track had asked for twice). The fourth sync is the one that changed the board:
  `fb395fe` mounts the key-gated `AppDesignIsland` in `(guest)/layout.tsx`, so the guest page joined
  the walk. The gate below is the run on the fourth synced tree.
- Gates on the synced tree, re-run at the second fix pass's head: typecheck ok, lint ok (0 errors, 6
  warnings, all pre-existing and none in a file this track owns), test ok (1776 in 198 files, 15 of
  them this round's `temperature.test.ts`, up from 8 with the card and faint rulings pinned), build
  ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` plus six
  files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `ramps.ts`, `sections.tsx`,
  `specimens.tsx`, `call-sites.tsx` and the new `temperature.test.ts`; the fix pass added
  `call-sites.tsx` for the accent wall's clipped toast). No exceptions. No production byte changed:
  `globals.css`, `theme.css` and `marketing.css` were read and not touched.
- **What round three changed, in one list.**
  1. **Candidate C is cut, and every value it held is still reachable.** C was A's ladder at a
     temperature, and round two wrote the reason in C's own move list: "The spacing is A's exactly,
     so a ruling between A and C is a ruling on temperature alone and nothing else moves." A column
     that moves no step is a switch wearing a letter. `warm()` in `ramps.ts` is that switch, read off
     C rather than invented (a surface carries the temperature and ink does not; paper takes hue 85
     above L 0.8, the rooms take 60, the near-whites 0.002 at 85, a veil is left alone), and
     `temperature.test.ts` pins `warm(A)` to C's five published blocks token for token. The board is
     three columns wide instead of four, the ramp ask is three options instead of four, and **warm B**
     (which the old board could not ask at all) is one click: B derives every surface from the room
     by color-mix, so a warmed room carries its whole ladder, which is the clearest thing the split
     says about B.
  2. **Two asks were consequences, not rulings.** "The dark grounds: a ladder or one room" and "the
     canvas and the ink slab: split or one" are both answered by the letter. They are a panel under
     the candidate now, headed "What the letter already decides", so an answer cannot contradict the
     paste the letter generates. Asks: seven, down from eight, each still one word.
  3. **The board's strongest evidence leads the walk, and it stopped being a memory test.** Round two
     taught this to the accent row ("four hues cannot be ruled on from memory") and left every
     SURFACE row on a toggle, which is the harder memory test of the two. Row 02 is now the same
     frame with today on the left and the candidate on the right, inside one canvas, on BOTH grounds:
     dark (0.140 / 0.245 / 0.210 / 0.230 / 0.250 beside A's 0.145 / 0.195 / 0.235 / 0.285 / 0.325)
     and paper (0.990 / 0.965 / 0.997 / 0.997 / 0.960 beside A's 0.977 / 0.948 / 0.998 / 0.998 /
     0.925), each half printing its own five steps. It was row 05, behind 4400px of app stages.
  4. **The counts are re-measured and two were wrong.** The panel ships at **35** sites, not 45
     (plus 8 hover fills wearing the same utility, which the switch leaves alone); the undocumented
     ring is at **37**, not 77. The faint step is 37 sites at five alphas, 19 of them at exactly the
     70 percent `--faint` is. A hue ruling reaches 34 utilities in 16 files. Every count now lives in
     `ramps.ts` beside the grep that produced it, so the next agent re-runs rather than re-remembers.
     Worth knowing how the last one was caught: the 77 was fixed in the row's caption and in the
     specimen's own doc comment, and the walk found it still RENDERING under the depth row from a
     third copy of the number. A count that appears in prose in more than one file is a count that
     will go stale in one of them; every one of them now reads the constant.
  5. **The stumbles a stranger hits, fixed.** Four unlabelled segmented controls in a row (two of
     them unreadable without the file open) all have visible names; the grounds strip printed four
     near-black bars and now prints each room's lightness, which is the only way 0.110 against 0.140
     is a reading; the ink leaf said "today this is near white" under a candidate that had just fixed
     it, and both captions follow the ramp now; the menu specimen sat ON the panel's own explanation
     at 1440 and hid three lines of it at 375, and now hangs off the card's top corner on desktop and
     sits over the action row on the phone, where a 224px menu cannot clear a 335px card at all
     (checked by intersecting the menu's box with every text node at both canvases, which is how the
     first attempt at this fix was caught still covering the title); nine
     stages were clipping or running up to 515px empty at one width or the other and were resized
     against measured content; the board opened by asking the same question three times over (the
     touchpoint blurb, the shell's exploration line, its own paragraph) and the paragraph now says
     how to rule from here.
  6. **The walk is six links.** The pages were printed as prose, so walking a candidate meant
     retyping six paths and remembering the lab key on each. They are links now, carrying THIS page's
     own key (read at runtime, never written into the file), each opening in its own tab, and the
     event page's row goes to the dashboard rather than to a path with a placeholder in it.
- **Cost, measured on the head rather than asserted** (the round's honesty item): 3871 DOM nodes, 81
  images, **zero running animations** at rest, a forced layout of 0.2ms, DOMContentLoaded 320ms and
  load 822ms on a dev server, page height 15593px. Nothing on this board loops, so `data-paused` has
  nothing to pause; the one colour fade on the token wrapper lives inside
  `prefers-reduced-motion: no-preference`, so a reduced-motion reader gets the jump cut and the same
  settled composition. No element renders in a mono stack and no text node carries an em-dash.
- Light QA at the FIX-PASS head, measured through the DOM at a real 1440 browser and a real 375 one
  (a viewport-emulating pane, which round three's first pass could not reach): twenty stages, and
  under every one of the twelve combinations of ramp (today, A, B), temperature (neutral, warm) and
  stage canvas (Desktop 1440, Phone 375), ZERO elements paint outside their stage and the document
  has zero horizontal scroll. The audit counts a real clip rather than a scroll: it walks every
  descendant's rect against the stage's and ignores anything inside an `overflow-x` scroller, which
  is what the dashboard's filter chips are, and that is how the accent wall's 8px clip was found
  after a round that had claimed zero overflow. Row 02 at `today` renders one half per stage, 439px
  tall on desktop and 543px on the phone with its content fitting both, no duplicate-key warning in
  the console, and the note under it naming the press that brings the pair back. The walk's guest row
  resolves to `/e/<demo token>?key=` and is dropped when the env has no demo event. The same three
  readings were re-taken on a LOCAL PRODUCTION BUILD of the same commit (`pnpm build` then
  `next start`, port 3022): seven links, four halves at A and one per stage at today with the note
  under it, zero clipped elements at the phone canvas, zero horizontal scroll.
- Light QA at the first round-three head, kept as the record of what it measured: through the DOM,
  at a real 375-wide browser (a viewport-emulating pane) and at the widest the test browser gives
  (1456; its window clamps below 1440 plus chrome, so
  a true 1440 browser is not reachable here, as round two also found): thirteen rows `#pal-01` to
  `#pal-13` in the new order with the index matching; zero page-level horizontal scroll at either
  width under both stage toggles; all twenty stages hold their canvas with zero overflow at both
  widths (the guest album had been laying out 952 into 760 and cutting its last row mid-tile, and
  now fits); the paired frames render two token blocks in one canvas with the right ground on each
  side (dark 0.14 beside 0.145, paper 0.99 beside 0.977); the warm switch produces C's exact light,
  dark and canvas values in the paste, and warm B moves five literals (the room `oklch(0.125 0.005
  60)`, the paper ground and card, the menu, the near-whites and the canvas muted) while every
  color-mix under them follows without being written, which is the combination the old board could
  not show. Round three's first handoff said warm B "warms only the room", which was the headline
  rather than the reading: the mixes are untouched, the five literals they read are not; Apply lands one `<style>` with the real selectors and `/pricing` wears it (background 0.145,
  muted 0.195, faint 0.55, the mark in flare); Clear removes it and leaves nothing in
  `localStorage`.
- **The walk is SEVEN pages now, and the new one is the one this track had been unable to walk for
  two rounds.** `fb395fe` on launch-prep mounts the design island in the guest layout, so
  `/e/<demo token>?key=` wears a candidate: measured on the fix-pass head with warm A applied, the
  demo album's root carries `--background: oklch(0.145 0.005 60)`, `--gallery: oklch(0.09 0.004 60)`
  (A's media well, the token that surface exists for), `--faint: oklch(0.55 0.004 70)` and
  `--brand: oklch(0.7 0.2 330)`, from exactly one injected `<style>`. Clear removes it and leaves
  `localStorage` empty. The row is dropped when no demo event is configured, so the board never
  links to `/e/` with nothing after it.
- **The walk itself was taken, on five of the seven pages, and it proved two things the board could
  only assert.** With A applied (flare, panel at one token, faint in): `/help` puts all six of its
  real `bg-muted/40` panels on A's `--muted` at full strength (`oklch(0.948 0 0)`) while the five
  cards that merely HOVER to the same utility stay on `--card` and the thirteen hover-only elements
  stay transparent, so the rule's "a variant is not a panel" claim is now a reading rather than a
  comment; all 59 dimmed text sites paint `--faint` (`oklch(0.62 0 0)`). `/contact` puts both its
  panels on the same value. `/` is the one that matters most: the footer leaf comes back with
  `--card: oklch(0.235 0 0)`, which `.surface-ink` has never had, and `--brand: oklch(0.7 0.2 330)`,
  which is round two's departure 4 (a hue that does not reach the leaf reaches every surface in the
  product except the mark at the bottom of every page) proven on the real page rather than on a
  stage. `/pricing` was walked the same way earlier, and the demo guest page is the bullet
  above. `/dashboard` and the host event page need the signed-in host, which localhost cannot do by
  design, so those two stay for the alias.
- The reduced-motion claim, read off the SERVED stylesheet rather than the source: the only
  `data-pal-*` motion rule in the whole document is the 220ms colour transition on the token wrapper,
  and it sits inside `(prefers-reduced-motion: no-preference)`; there are zero `pal-` keyframes. A
  reduced-motion reader gets the jump cut and the identical settled composition.
- ★ **Two tooling notes earned this round, for whoever verifies next.** A driven tab is
  `document.hidden`, which FREEZES the transition clock at `currentTime: 0`: a colour read straight
  after a toggle is the value the element had BEFORE the toggle, and 32 transitions sit in
  `playState: "running"` forever without consuming a frame. Read a custom property
  (`getComputedStyle(el).getPropertyValue("--background")`) instead, which is never transitioned, or
  reload with the state you want. And the flat-black screenshot of a lab page scrolled past the fold
  is intermittent rather than reliable: the same scroll position screenshots correctly on a retry a
  few seconds later, so a black frame is worth one retry before it is worth a workaround.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Two one-line changes that are NOT this lane's, for the Orchestrator** (round three's third one,
  the guest layout's design island, landed on launch-prep at `fb395fe` and is no longer outstanding).
  1. `src/app/(dev)/design/touchpoints.ts:488` still says "three complete candidate token sets"; it
     is two plus a temperature switch now. One line, at integration.
  2. The ruling's own paste needs one line in `theme.css`'s `@theme inline` block
     (`--color-faint: var(--faint);`) before a `text-faint` utility exists. The board reaches the
     token with an arbitrary value, and row 13 now prints this line under the paste so the ruling
     and its prerequisite are read together.
- **A third, for whoever lands the two pastes: the light ruling and this one touch the same line.**
  Every candidate's `.surface-ink` block carries the shipped `--shadow-float: 0 0 0 0 oklch(0 0 0 /
  0)`, without which an ink leaf inside a paper page wears the PAPER float on a dark slab. The light
  board's round-three handoff flags that token as one its own ruling moves. They agree today (light
  keeps the zero on `.surface-ink` and on the dark root), so the order does not matter yet; if that
  ruling changes the value, drop the line from the palette paste rather than pasting both.
- Assets requested from Will (unchanged from round two, both still lines on the media-kit track's
  existing shot list rather than a second delivery):
  - **Four hard cases inside the kit the `media-kit` track already asked for** · one high key (a
    white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm,
    one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade · replaces the four
    this board leans on (`wedding-golden`, `party-balloons`, `concert-confetti`, `reception-table`)
  - **A portrait pair for the guest masonry** · two of the same 36 at 1600 px long edge, PORTRAIT,
    same grade · replaces the hand-set tile ratios in `specimens.tsx` (every stand-in in the kit but
    one is landscape, so the column flow the guest album actually ships is being faked)
  - Why a palette board needs them: a ramp is only ever wrong against media that fights it, and the
    stand-ins are mid-key and warm, so the light end of every candidate is going untested.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; each takes
  one word):
  1. The ramp: today, A or B.
  2. The temperature: neutral, or warm.
  3. The accent: ink, blue, violet or flare.
  4. The accent's reach: all three jobs, attention only, or identity only.
  5. The panel: one token, or the alphas.
  6. The missing step: faint in, or out.
  7. The dark card: opaque, or the veil.
- The departures, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; there
  are SIX, down from ten, because a departure is a thing Will rules on and four of round two's were
  notes for the next agent, now each sitting where it is read):
  1. Round three cut candidate C, and no value it held is lost. C was A's ladder at a temperature,
     and its own move list said so: the spacing was A's exactly, so a ruling between A and C was a
     ruling on temperature alone. A column that moves no step is a switch wearing a letter, so it is
     a switch now, and the one question it could never answer (does B want warming too) is one click.
     warm(A) still produces C's five published blocks token for token, pinned by
     temperature.test.ts, with one correction recorded there: C left the dark ring cold while writing
     the ink ring warm, at the same job on the same ground.
  2. Round one's departure list said only candidate B kept the system's one translucent surface. That
     was wrong: B's card is a color-mix off the room, which is fully opaque, so every candidate
     retires the veil and none of them said so. Row 08 renders both answers over a photograph and the
     card ask makes it a ruling rather than a side effect.
  3. A finding against bible 16, sharpened and changed. Counted by the job it does, the deepest dark
     surface in the product is not a token at all: the lightbox paints its backdrop with a literal
     bg-black/90 (media-lightbox.tsx:617). What --gallery actually does is the media WELL (a tile
     before its image decodes, a coverless event card, the reel frame) and, through .surface-ink, the
     footer SLAB, and those two want opposite things. Rule 16 counts four grounds; there are at least
     six surfaces and one of them is a literal. Row 03.
  4. Warm re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point,
     and saturating the neutrals was consciously declined. The switch is that decision re-argued at
     0.002 to 0.008 chroma, on the board rather than in a comment, and now on whichever ramp is
     selected rather than on one of them.
  5. The accent has to be written into .surface-ink or it never reaches the footer. Today the leaf
     declares --brand: var(--gallery-foreground), and a class rule outranks a value inherited from
     the page around it, so a hue ruled for the whole site would reach every surface in the product
     except the mark that sits at the bottom of every page. The accent paste therefore carries a
     third block, and every candidate's ink map keeps a --brand line of its own so a ruling of ink
     alone cannot leave the leaf inheriting the PAPER ink onto a dark slab. Row 06 shows the mark on
     the leaf.
  6. B deletes the cinema override in marketing.css, the skin block's only surface value. The
     cinema-to-footer seam then belongs entirely to light, which is the light board's lane.
- **What round three took from the other boards** (the round's item 2, and the wave rule that a board
  says what it took). The five wave specs in `docs/specs/` and every open track's latest Handoff in
  `docs/tracks/` were re-read at the fix pass. It is on the BOARD as a panel above the meta panel,
  "From the other boards", not only here. Three things moved.
  1. **The guest page joined the walk.** The `light` board's round-three handoff carries the same
     finding this track carried ("no board's Apply candidate can reach a guest page"), and
     launch-prep acted on it at `fb395fe`. The walk is seven pages instead of six, the demo album is
     judged wearing a candidate rather than only as a stage, and this track's own Orchestrator note
     about the guest layout is retired.
  2. **Two pastes touch one line.** That board's note (2) is that every candidate here re-declares
     `--shadow-float` on `.surface-ink`, a token its own ruling moves. Verified: all three sets carry
     the shipped zero, and it has to stay (an ink leaf inside a paper page would otherwise wear the
     paper float). They agree today, so the order does not matter yet; the board says so and so does
     the Orchestrator bullet above.
  3. **The light spec's depth cues stay borrowed, and stay out of the paste.** `docs/specs/light.md`
     still owns the shadow family and the named ring rendered on row 07; that is round two's
     borrowing, re-checked rather than re-taken, and row 07's caption says the values are not in this
     board's paste.
  Nothing else changed the answer, and each was read rather than assumed: `type-scale` states that
  `palette` proposes nothing that moves a size, leading or tracking, and the reverse is true (its
  block moves no colour token); `media-kit`'s shot list already carries both of this board's asset
  asks; `floating-surfaces` proposes radii and one contract carve-out for state toasts, which is a
  `!important` colour in globals.css this board neither reads nor writes; `brand-voice`, `rounding`,
  `hero-scan`, `hero-burst` and `design-gallery` propose nothing that moves a colour token.
  `docs/specs/palette.md` is this track's own round-one proposal and is unchanged.
- Look at first: **row 02**, the same frame twice, dark then paper. It is the whole ramp argument in
  two looks and it needs no toggle. Then **row 01** for the ladder tables and the state hues, and the
  panel beside the candidate card ("What the letter already decides") so the two cut asks stay cut.
  Press **Today** there once: the frame renders alone, which is what ruling today lands. Then press
  **Warm** and look at row 02 again, then at **row 11** on cinema, which is where a temperature
  either reads as film or as a mistake. Then **A** on "Put it on the real pages" and the seven links
  under row 13, the last of which is the demo guest page (new this pass). **Row 12** is the accent,
  all four hues on every job at once.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Rounds two and three turned the palette board
from a proof that the ramp is wrong into a surface a ruling reads off. Round two made every
candidate leave the board as the paste its ruling lands, handed to the whole site through the shell,
and widened the judged surfaces to the event page, the dashboard, the guest album and the ink leaf
hosting a card and a menu. Round three walked it cold and cut, not added: candidate C was A's ladder
at a temperature by its own admission, so it became a switch any ramp can wear, pinned by a test to
C's blocks, and warm B became askable; two asks were consequences of the letter and print as such;
and today sits beside the candidate, because a 0.02 step is not a memory test. Every switch in the
bar repaints the board from one resolver, so none can label an answer the page does not show. Two
counts were wrong and are measured (the panel at 35 sites, not 45; the ring at 37), and the walk is
seven pages, the last the guest album, which no board could reach until the shell mounted its
island. Lab only, no production byte.

## Handoff (round 4)

- Head **`f61313f7`** (this manifest's own commit sits on top; no board byte differs), pushed. Board at `/design/lab/palette?key=`. **The round-four board is the one
  whose FIRST block is headed "The model: two modes, two grounds each, and one well that belongs to
  neither"**; round three's opened on a candidate card instead. Its dock carries two candidate
  switches (Dark: Today, Ladder, One room, Ember, Slate, Lift · Light: Today, Paper, Bright, Warm,
  Cool) where round three's bar had one ramp toggle and a temperature switch, and the paste at row 15
  prints a `.surface-mat` block that has never existed before.
- **What changed after the read-only review** (two passes, four should-fix items, all closed; no
  candidate, no paste, no ask and no measurement of the palette itself moved). Row 07's caption no
  longer claims "the real reveal grammar" that the same round's stage deliberately pins, and says
  what the row does show and why. The dock's two long switches take the shell's new `wrap` option,
  and its three rows sit in one column. Shell ask 2 is struck because it landed on `launch-prep`
  while this round was finishing, and every dock number below was re-measured against the landed
  dock. Shell ask 1, the touchpoints line, is still out of lane and still asked for, now with the
  exact line to paste.
- **The second pass caught the first pass's own blind spot, and it is worth reading before the next
  board frames a marketing section.** marketing.css has TWO entrance shapes and only one of them is
  an attribute: `TextsReveal` keys on a CLASS (`.mkt-lines.is-shown`) off the same in-view observer,
  and `[data-mkt] .mkt-line` rests at opacity 0. SETTLED named only `[data-mkt-reveal]` and
  `[data-mkt-cut]`, so row 07's FIRST chapter, TrustStrip, was an empty bordered band at the top of
  both stages, and the audit that said "zero marked elements under full opacity" could not see it
  because a `.mkt-line` carries no mark. SETTLED carries the class too now (`!important`, because
  `[data-mkt] .mkt-line` outranks a bare class), the audit below counts BOTH grammars, and the
  comment on SETTLED names the other hide-at-rest classes (`.mkt-text-swap`, `.mkt-skel-content`,
  `.mkt-check`) so the next section added to a frame is not the same bug. The caption names both
  grammars instead of one.
- **Vercel is capped, so nothing here was verified on a preview** and the alias will still be serving
  round three when Will opens it. Everything below was measured on a **local PRODUCTION build** of
  this head in this worktree (`pnpm build`, then `next start` on port **3060**, and the last pass's
  re-walk on a fresh build on **3061**; a server holding its port with an older build is the sort of
  thing that reads as a fix not working, so the port moves rather than the reading being trusted), at
  a 1440 viewport, at
  the board's 375 canvas, and at a 500 window, which is the narrowest a macOS Chrome window goes.
  Readings are through the DOM and every box is read with `getBoundingClientRect`, which forces the
  layout rather than trusting a cached one; screenshots at 1440 and at 500 eyeball what the DOM
  cannot say. **Said plainly rather than quietly downgraded: the tab could not be brought to the
  front.** This round's parallel tracks share one browser window and its front tab belongs to another of
  them, so
  this tab stays `document.hidden`, which freezes the transition clock and pauses rAF. Every colour
  is therefore read off a custom property (never transitioned) rather than off a transitioned one,
  and the one number a hidden tab genuinely gets wrong is the dock's own `--board-dock-h`, which a
  fresh hidden tab records as 550px against a measured 129px until the first resize wakes it. That
  is the exact lag the shell's new `requestAnimationFrame` and resize listener close for a real
  reader, and it is why the dock heights below are rects rather than the custom property.
- Synced with `launch-prep` at **`07ad3b21`** (3 commits: PROGRAM, the orchestrator's own rows, and
  the shell's own round-four landing, which is the one that matters here; see shell ask 2). Nothing
  in this lane. The gate below is the re-run on the synced tree after the fixes.
- Gates on the synced tree, re-run at this head (the last fix pass's): typecheck ok, lint ok (0
  errors, 6 warnings, all pre-existing and none in a file this track owns), test ok (**1822** in 199
  files, 31 of them this round's `registers.test.ts`, up from 15), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` plus ten
  paths under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `call-sites.tsx`, `sections.tsx`,
  `specimens.tsx`, the new `registers.ts`, `model.tsx`, `real-ui.tsx` and `registers.test.ts`, and the
  deletions of `ramps.ts` and `temperature.test.ts`). Eleven paths, no exceptions; the `launch-prep`
  merge carries the shell's own commit but this branch authors no byte of it. No production byte
  changed: `globals.css`, `theme.css` and `marketing.css` were read and not touched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

### What round four changed, and the answer to the question that opened it

1. **The model is the first block and the first ask, and it answers cinema versus ink in one
   sentence.** They are one mode's two grounds, not two darks: cinema is the ROOM a dark chapter sits
   in (the deepest thing on its own page) and ink is the SLAB a dark leaf makes on a light one (the
   only dark thing on a page of paper), which is why the slab has to sit LIGHTER than the room rather
   than deeper. Once that is said, light has the same two: the PAPER a page is, and the MAT a section
   sets itself apart on, which today is `bg-muted/40` at six alphas and is the fifth ground nobody
   named (the /contact card). And the media WELL turns out to belong to neither mode, because a
   photograph is always laid on something near black. So: **two modes, two registers each, plus one
   well** (four registers and a bed, where today there are five unnamed grounds and a literal). The
   block names each register with its selector, what takes it, and what it is today, and prints the
   selected pair's own grounds with their lightnesses beside it. `.surface-mat` is the one new class
   the model costs; the rest is naming, not a sixth value.
2. **The dark and the light are ruled separately, which is what Will asked for and what paid for
   itself immediately.** Six dark sets and five light ones, thirty pairs, two switches in the dock,
   one paste generated from whichever pair is up. Three darks are new (**Ember**, a warm 0.120 room
   with a tighter ladder and an almost-neutral well; **Slate**, a cool 0.145 room at the same rhythm
   as Ladder so the ruling between them is the cast alone; **Lift**, a 0.195 room with no true black,
   whose argument is that dark needs ONE register because a room that high no longer reads as a hole
   in paper) and two lights (**Warm**, uncoated stock at 0.985 with neutral ink; **Cool**, a daylight
   page whose mat is a hand-written DEAD NEUTRAL grey, which is Will's "a grey that is not a tint of
   the text", rendered).
3. **The temperature stopped being a switch and became candidates.** Round three was right that
   candidate C moved no step, but a switch over the WHOLE system could only ask "warm or not" about
   both modes at once, and that is the wrong question: the case for a warm room (skin against a dark
   ground) and the case for a warm page (a white dress on paper) are not the same case. Four sets
   carry a cast now and each moves its own lightnesses too. The transform that generates them is
   still C's published table at gain 1, and `registers.test.ts` pins all five of C's blocks token for
   token, so nothing Will was shown became unavailable.
4. **This board's recommendation is a pair no earlier round could have named: Ember on the dark side,
   Paper (neutral) on the light one.** Warm the room, leave the page a true grey, and let the well
   stay the least tinted surface in the product. It is on the board under the two candidate cards,
   with the note that Ladder is Ember's rhythm at chroma 0 for anyone who wants globals.css's
   zero-chroma decision kept exactly as written.
5. **The comparison surfaces are live production sections.** The real `MarketingFooter` on a real
   paper page, the real `PlanPair` on the paper and then on the mat, four real home-arc chapters
   (`TrustStrip`, `NoApp`, `FullQuality`, `Privacy`) on the room and on the paper, and the real
   `Dialog`, `DropdownMenu` and `Popover`. Rows 06 to 09.
6. **Every page-wide switch is in `BoardDock`** (three rows at 1440, 129px: the two candidate sets,
   then the accent, its reach and the mat, then the faint step, the card and the canvas), and
   Apply/Clear sit in its aside. The three rows are one COLUMN rather than three siblings, because
   the dock's control cell sizes to its content and three wrapping siblings ask for the sum of all
   three. The two long sets take the shell's `wrap` option, which is what keeps the six-option dark
   set inside the cell on a phone. The accent wall's own ground toggle stayed beside the wall,
   because it changes one specimen.
7. **The accent's reach finally moves a pixel.** It had been an ask for two rounds with no control
   anywhere on the page, which is exactly the failure round three found in the faint switch and
   fixed. A job outside the ruled reach renders on INK on the accent wall, which is what the ruling
   lands; measured, the identity column falls from `oklch(0.7 0.2 330)` to `oklch(0.955 0 0)` on
   "Attention" and four "outside the ruled reach" labels appear.

### The four defects the walk found, each fixed at its cause

1. **A token that referenced itself took the page down.** The derived set's new mat was written
   `--background: color-mix(in oklab, var(--foreground) 5%, var(--background))`. In real CSS that is
   a cycle and the declaration is invalid at computed-value time; in this board's own reader it
   recursed until the stack gave out and the route 500'd on the server, with neither failure naming
   the token. The mat derives from `--card` instead, `lOf()` parses a mix's real operands with a
   depth guard rather than assuming `--foreground` over `--background`, and a test walks every block
   (including each mat as it actually cascades, layered on its own paper) for a direct or transitive
   self-reference. The wider operand parsing fixed a second, silent miss: the shipped slab's
   `var(--gallery)` mix had been reading as no value at all on the ruler.
2. **★ A BREAKPOINT INSIDE A STAGE READS THE WINDOW, NOT THE CANVAS**, which the shell's own note on
   `Stage` says and which a hand-built specimen hides by branching on `mode`. A production section
   cannot: the real pricing pair laid its two cards out side by side inside the 375 stage and ran
   52px past it. `TrueViewport` (real-ui.tsx) renders every live section in an **unscaled iframe the
   width of the canvas**, with the page's stylesheets and the `next/font` class on `<html>` mirrored
   in and kept mirrored by a MutationObserver, so `sm:` fires at 640 of the CANVAS. Measured at 375
   after: the pair stacks, zero right overflow, zero clipped elements. These frames pin `fit="true"`,
   so a production section whose size is being judged is never scaled, whatever the dock's Fit
   control says. This is the answer to Will's note (b): an iframe is only wrong when it is SCALED.
3. **★ THE ENTRANCE GRAMMAR NEVER TRIPS INSIDE AN IFRAME, and an invisible element still has a box.**
   `Reveal` flips `data-inview` from an IntersectionObserver whose implicit root, inside an iframe,
   is that iframe's viewport CLIPPED BY THE PARENT, so a section below the visible strip never
   trips: 20 of row 07's marked elements sat at **opacity 0** and two whole chapters rendered blank
   while the clip audit still reported zero, because it measures boxes. The stage injects the
   settled state marketing.css already ships for a reduced-motion reader, unconditionally and inside
   the stage only. It is the honest state for a board that judges a ground rather than an entrance,
   and it means the reduced-motion reader and everyone else are shown the same page. **It takes TWO
   rules, because the grammar has two shapes**: `[data-mkt-reveal]`/`[data-mkt-cut]` carry an
   attribute, and `TextsReveal` (the strip at the top of row 07) carries a CLASS, `.mkt-lines
   .is-shown` over a `.mkt-line` that rests at opacity 0. The first pass settled only the attribute
   and left the strip an empty bordered band, which is the same defect wearing the other shape.
   **Worth knowing before the next board puts a marketing section in an iframe.**
4. **The footer row claimed a paper page and painted the slab across the whole canvas**, which made
   the seam, the thing the row exists for, invisible: a dark leaf on a dark page is not a leaf. And
   `justify-end` pushed a 1414px footer 513px off the top of a 900px stage, so the row showed the
   bottom two thirds of a footer. The root wears the paper block, the footer wears `.surface-ink`
   through a block scoped to that one stage id (a class rule beats an inherited custom property, so
   the real footer would otherwise serve the SHIPPED slab under a caption naming the candidate), the
   accent is folded into that scoped block (the leaf declares `--brand` itself and outranks an
   ancestor), and the stage is sized to the measured whole. A real section inside a flex column also
   silently COMPRESSED when the stage was a pixel short; they are blocks now, so a short stage clips
   instead, which is at least a reading.

### Light QA, measured on the local production build

- **Zero clipped elements and zero horizontal page scroll at both canvases**, re-measured on this
  head. 24 stages (19 ordinary plus 5 iframes); the audit walks every descendant's rect against its
  stage's, ignores anything inside an `overflow-x` scroller (the dashboard's filter chips are one on
  purpose) and ignores the production footer glow's deliberate `inset: -40px` bleed, which the stage
  clips exactly as the page's own box does. Inside the five iframes at the 375 canvas: zero right and
  zero bottom overflow, and zero of the **55** elements the entrance governs sits under full opacity,
  at 1440 and at 375 (47 attribute-marked plus the trust strip's 8 `.mkt-line`s, four per row-07
  stage; the count the first pass reported was 47, which is the miss that pass had). Read off the
  CASCADE inside the frame rather than off the result, because a hidden tab will not re-resolve a
  disabled sheet: `[data-mkt] .mkt-line` resolves to 0 there, the paper stage's group never takes
  `is-shown`, and the line still computes to 1, so the 1 is the injected rule and nothing else. Both
  stages paint the four claims in the screenshots at both canvases.
- **Every switch repaints the board from one resolver**, so none can label an answer the page does
  not show. Read off custom properties at row 04 and row 06's iframe: Ember room `oklch(0.12 0.008
  60)` / card `0.205 0.01 60` / well `0.085 0.006 60` / slab `0.165 0.008 60`; Slate `0.145 0.007
  258` / `0.235 0.01 258` / `0.1 0.005 258` / `0.19 0.01 258`; Lift `0.195 0 0` with its slab at the
  same `0.195 0 0`, which is its claim. Veil gives `oklch(0.265 0 0 / 0.62)`; "faint out" leaves
  `--faint` empty everywhere and drops it from the paste; the light switch moves Paper `0.977 0 0` to
  Cool `0.99 0.002 250` and back.
- **The walk was taken on the real pages.** Apply lands ONE `<style>` carrying the paper register,
  the mat register, the room, the slab, the well, the accent's three blocks and both emulated
  rulings. On `/contact`, which is the page the fifth ground lives on: the three real `bg-muted/40`
  panels take the ruled mat's own ground (`oklch(0.948 0 0)`) while the hover-only variant stays
  transparent, the dimmed text takes `oklch(0.62 0 0)` inside the paper sections, the footer wears
  Ember's slab and the mark at the bottom carries Flare. Clear removes the block and leaves
  `localStorage` empty. `/dashboard` and the host event page need the signed-in host, which localhost
  cannot do by design, so those two stay for the alias.
- **The real floating layer works and wears the pair.** The production `Dialog` opens on
  `oklch(0.25 0.01 60)`, which is Ember's menu step; it portals to the body, so the buttons apply the
  pair to the page first, and the row says so.
- **Reduced motion and the two-faces rule**, read off the SERVED production sheets and re-read on
  this head: zero `pal-` keyframes; exactly one `data-pal-*` motion rule in the whole document and it
  sits inside `(prefers-reduced-motion: no-preference)`; nothing on this board loops. Zero elements
  render in a mono stack and zero text nodes carry an em-dash, the rewritten caption included.
- **The dock, re-measured against the landed shell** (the review's point: the earlier numbers were
  taken against the superseded one). At 1440 it is **129px**, three rows, with the shell's own aside
  on the first row beside the two candidate sets, and zero page overflow. At 500, the narrowest a
  macOS Chrome window goes, it is 289px with each knob on its own row and still zero page overflow.
  A 375 window cannot be opened, so the phone case was measured where it actually bites, by holding
  the dock's control cell at the **343px** of content width a 375 viewport leaves it: the dark set
  wraps to two rows and ends exactly on the cell's edge (0px past, dock 397px), and with the wrap
  taken away the same set runs **36px past the cell** and squeezes "One room" from 80px to 54px. That
  is the case the shell's new `wrap` option exists for, and both long sets now pass it.
- **Cost, measured on the head rather than asserted:** 4779 DOM nodes, 80 images, page height
  31074px, DOMContentLoaded 224ms on the production server, dock 129px. The page is long because the
  five live sections are real; the dock is what keeps it walkable.
- Seven walk links, the sixth resolving to `/e/<demo token>?key=` and dropped when the env has no
  demo event.

- **Shell changes asked for (the Orchestrator lands them).**
  1. **Still open, and the only one.** `src/app/(dev)/design/touchpoints.ts` still describes round
     three for this board ("Today beside the candidate in one canvas: two ramps and a warm
     temperature switch any ramp can wear", ending "the panel as one token"), and that is the first
     paragraph Will reads above the board, rendered by the touchpoint page. It is two independent
     sets now, six darks and five lights, with the mat as a register and no temperature switch at
     all, so the header contradicts the dock under it. The exact line, so it is a paste rather than a
     rewrite:
     - `note`: "Two independent sets in one canvas, six darks beside five lights, thirty pairs and
       one paste from whichever pair is up, judged on the real footer, the real pricing pair, four
       real home chapters and the real floating layer; the accent as four hues against every job it
       does; the /contact panel named as the fifth ground"
     - `variants`: "The model", "The dark set", "The light set", "The accent by job", "The mat as a
       register"
  2. **Struck: it landed already, and it is merged in here.** The shell's own round-four commit
     (`07ad3b21`, pushed to `launch-prep` two minutes before this round's head) gives `BoardDock` a
     `requestAnimationFrame` before the first sync plus a window resize listener, which closes the
     height-lag note this handoff used to carry, and gives `Toggle` the `wrap` option the six-option
     dark set needed at 375. Both are in use on this head and every dock number above was measured
     against them. Nothing to land.
  3. Nothing else. `Stage`, `Toggle`, `BoardMeta`, `lab-prefs` and the candidate-style island all did
     exactly what this round needed; the 1:1 default is the single biggest improvement to this board
     since it was cut.
- Assets requested from Will (unchanged in shape from round three, both still lines on the
  `media-kit` track's existing shot list rather than a second delivery, but the reason is sharper now
  that four of the eleven sets carry a cast):
  - **Four hard cases inside the kit the `media-kit` track already asked for** · one high key (a
    white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm,
    one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade · replaces the four
    this board renders most (`wedding-golden`, `party-balloons`, `concert-confetti`,
    `reception-table`)
  - **A portrait pair for the guest masonry** · two of the same 36 at 1600 px long edge, PORTRAIT,
    same grade · replaces the hand-set tile ratios in `specimens.tsx` (every stand-in in the kit but
    one is landscape, so the column flow the guest album actually ships is being faked)
  - Why a palette board needs them, and more so this round: a cast is only ever wrong against media
    that fights it. Every stand-in here is mid-key and warm, so the high-key end of Warm and the
    candle-lit end of Slate are both going untested.
- **One cross-track note for the Orchestrator.** The `floating-surfaces` board renders "the palette's
  ramps A and B verbatim" under its panels, reading `docs/specs/palette.md`, which is this track's
  round-ONE proposal. If the register model is ruled in, that board's toggle labels and its borrowed
  values go stale: A is now the dark half of "Ladder" plus the light half of "Paper", and B splits
  into "One room" and "Bright". The values themselves are unchanged, so it is a renaming rather than
  a re-measurement.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; each takes
  one word). Eight, where round three had seven: the model arrives as the first ask, the ramp splits
  into a dark half and a light half, and the temperature leaves because it is four candidates now.
  1. The model: registers, or today's five grounds.
  2. The dark: today, ladder, one room, ember, slate or lift.
  3. The light: today, paper, bright, warm or cool.
  4. The accent: ink, blue, violet or flare.
  5. The accent's reach: all three, attention only, or identity only.
  6. The mat: a register, or the alphas.
  7. The missing step: faint in, or out.
  8. The dark card: declared, opaque, or the veil.
- The departures, verbatim from BoardMeta (SIX, as in round three, but three are rewritten because
  the model changed what they say):
  1. The model itself is the departure, and it is the first ask. Bible 16 counts four grounds.
     Counted by the job they do there are five plus a literal (cinema 0.110, the app 0.140, the leaf
     0.155, paper 0.990, the contact card's panel, and media-lightbox.tsx:617's bg-black/90), and the
     model says there should be four registers and one well: cinema is the room, ink is the slab, the
     panel becomes the mat, and the well is the only surface that belongs to no mode. Ruling it in
     means a new class (.surface-mat) and a renamed idea, not a new palette.
  2. Four of the eleven sets carry a cast, which re-opens a decision globals.css records as closed:
     zero-chroma purity IS the brand point, and saturating the neutrals was consciously declined.
     Round three argued it as one switch over both modes. The split is what makes it answerable: the
     case for a warm room and the case for a warm page are not the same case, and this board's
     recommendation takes one and refuses the other.
  3. Round three cut candidate C on the grounds that it moved no step. Round four does not bring it
     back as a letter: the cast is a property four sets carry, each moving its own lightnesses too,
     and the transform at gain 1 still reproduces C's five published blocks token for token
     (registers.test.ts). Nothing Will was shown became unavailable, and warm on a derived set is one
     press rather than a fourth column.
  4. Lift argues that dark needs ONE register, not two. Every other set lifts the slab above the room
     because a 0.14 room dropped into paper reads as a hole; Lift starts the room at 0.195, where
     that stops being true, and declares the slab equal to it. It is the only candidate that
     contradicts the model's dark half, which is why it is on the board rather than in a comment.
  5. The accent has to be written into the slab or it never reaches the footer. Today the leaf
     declares --brand: var(--gallery-foreground), and a class rule outranks a value inherited from
     the page around it, so a hue ruled for the whole site would reach every surface in the product
     except the mark at the bottom of every page. The accent paste carries a third block, and every
     set's slab keeps a --brand line of its own. Row 06 shows the real footer with the mark on it.
  6. Round one's departure list said only the derived set kept the system's one translucent surface.
     That was wrong: a color-mix off the room is fully opaque, so every candidate retires the veil and
     none of them said so. Row 11 renders both answers over a photograph and the card ask makes it a
     ruling rather than a side effect.
- **Look at first: the model block**, before any candidate. It is the only ask whose answer changes
  what the other seven mean, and the cinema-versus-ink sentence is its first line. Then the two
  candidate cards under it and the recommendation beside them. Then **row 02**, today beside the
  pair, on the room and then on the paper. Then press **Slate**, then **Lift**, and watch row 02 and
  row 03 follow; then **Cool** on the light side and look at the mat strip at row 03, which is the
  only dead-neutral one. Then **rows 06 to 09**, which are the live ones: the real footer's seam on a
  real paper page, four real chapters on the room, the real pricing cards on the paper and then on
  the mat, and the real dialog. Then **Apply the pair** in the dock and walk `/contact`, where the
  fifth ground gets its register on the real page.

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Round four stopped adding candidates and named the
system instead. Cinema and ink turned out to be one mode's two grounds rather than two darks: the
room a dark chapter sits in, and the slab a dark leaf makes on a light page. Light has the same pair
(the paper, and the mat, which is the /contact panel nobody had named), and the media well belongs to
neither mode because it is always dark. Four registers and a bed, where the product had five unnamed
grounds and a literal. The board's first block states it and it is the first ask. The ruling then
split in two, as Will asked: six dark sets beside five light ones, thirty pairs, one paste from
whichever pair is up, and three new darks (a warm room, a cool one, and one lifted off black that
argues dark needs a single register) beside two new papers. The split immediately produced an answer
no earlier round could have reached, because warming had only ever been askable about both modes at
once: warm the room, leave the page a true grey. Every page-wide switch moved into the dock, and the
comparison surfaces became live production sections, rendered in unscaled iframes at the canvas width
so a real breakpoint measures the canvas. Lab only, no production byte.

## Handoff (round 5)

- Head `<sha>`, pushed; preview `partyreel-git-lp-palette-partyreel.vercel.app` (built by this handoff).
- Synced with `launch-prep` at `a61fd366` (it had moved 14 commits: the home-hero, river-visual,
  album-hero and glow-specs migrations). Three conflicts, all in the three registration lines every
  migrating board touches, resolved by keeping BOTH sides: `registry.ts` gains `PALETTE` in the
  touchpoints order (after the glow pair, before `LIGHT`), `boards.ts` keeps everyone's dropped
  `legacy` flag, and `kit-discipline.test.ts`'s LEGACY list loses `palette` and keeps `river-visual`
  gone. Nothing of another track's was overwritten; the lists are strictly the union.
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors, 6 pre-existing
  warnings, none in this lane), test ok (2140 in 218 files), build ok (257 static pages),
  `pnpm lab:smoke --base http://localhost:3416` ok (306 checks, 0 failing).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:

  ```
  docs/specs/palette.md
  docs/tracks/palette.md
  src/app/(dev)/design/(shell)/lab/boards.ts          <- registration line (exception)
  src/app/(dev)/design/sandbox/palette/board.css
  src/app/(dev)/design/sandbox/palette/board.tsx
  src/app/(dev)/design/sandbox/palette/call-sites.tsx
  src/app/(dev)/design/sandbox/palette/ladders.tsx
  src/app/(dev)/design/sandbox/palette/live.tsx
  src/app/(dev)/design/sandbox/palette/model.tsx
  src/app/(dev)/design/sandbox/palette/real-ui.tsx
  src/app/(dev)/design/sandbox/palette/registers.ts
  src/app/(dev)/design/sandbox/palette/sections.tsx
  src/app/(dev)/design/sandbox/palette/spec.ts
  src/app/(dev)/design/sandbox/palette/specimens.tsx
  src/app/(dev)/design/sandbox/registry.ts            <- registration line (exception)
  src/components/lab/kit-discipline.test.ts           <- registration line (exception)
  ```

  The three exceptions are the registration lines the round's contract allows, for this board's id
  only: the spec imported and added to `BOARDS`, `legacy` dropped from the `palette` entry, and
  `palette` deleted from `LEGACY`. No system-doc edits.
- **Shared-file change asked of the Orchestrator (one line, and it is a bug, not a preference).**
  `src/components/lab/paste.tsx` sets `data-lab-paste` and `--lab-paste-lines` on its `<pre>` and its
  own comment says `design.css` reads them. It does not: nothing in the repo matches
  `[data-lab-paste]`, so every migrated board's collapsed paste is the whole block (measured here:
  2054px for a 113 line paste) and its "Read all N lines" button toggles nothing. The light and
  rounding boards have it too. The patch, at the end of `src/app/(dev)/design/design.css`:

  ```css
  /* The kit's Paste, collapsed: the <pre> carries --lab-paste-lines and the
     attribute, and this is the rule paste.tsx says lives here. The arithmetic is
     the <pre>'s own, 11px type at leading-relaxed plus its p-4, so the box is
     exactly the requested number of lines. */
  pre[data-lab-paste] {
    max-height: calc(var(--lab-paste-lines, 6) * 1.625em + 2rem);
  }
  ```

  Until it lands, `sandbox/palette/board.css` carries a copy scoped to
  `[data-board="palette"]`, with a comment saying to delete it when the shell has the rule. Nothing
  else is asked for; no migrations, Workers, Vercel, Stripe or env changes.
- **Two deviations from the round's brief, both declared rather than quiet.** (1) The brief says "the
  six darks and the three lights"; there are FIVE lights (`today`, `paper`, `bright`, `warm`, `cool`,
  `LIGHTS` in registers.ts, and round four's own record says "six dark sets beside five light ones").
  All five are the `light` ask's options, because the contract's stronger rule is that a migration
  changes no candidate. (2) `ScopedTokens` did NOT stay local, it went: its only consumer was
  `RealFooter`, and a real route in a frame declares `.surface-ink` from the paste itself, with the
  real selector and no stage id to scope to. Verified in the browser rather than assumed: in the
  candidate frame `.surface-ink` computes `--background: oklch(0.165 0.008 60)`, `--card:
  oklch(0.205 0.01 60)`, `--popover: oklch(0.25 0.01 60)` and `--brand: oklch(0.7 0.2 330)`, against
  today's frame where the card is still the 62 percent veil and `--brand` is near white. That is the
  accent-in-the-slab departure demonstrated on the real footer, which is what the scoped sheet
  existed to fake.
- Assets requested from Will: unchanged, and both are lines on the media-kit track's existing shot
  list rather than a second delivery. They now live in `spec.ts` in the ASSETS.md shape, so the
  Orchestrator folds them from there:
  `Four hard cases inside the media kit's shot list · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm, one stage-cool: four of the 36 masters at 1600px long edge, landscape, one grade · replaces the four stand-ins this board renders most (wedding-golden, party-balloons, concert-confetti, reception-table)`
  `A portrait pair for the guest masonry · two of the same 36 at 1600px long edge, PORTRAIT, the same grade · replaces the hand-set tile ratios in specimens.tsx`
- **Look at first:** section 05, "The real site, today beside the pair", on Home. It is the round's
  whole argument in one row: the site as it ships on the left, the ruling's own paste on the right,
  scrolled together, and the seam where the paper ends and the footer slab begins is the only place
  the model's dark half is a fact rather than a claim. Then section 03 with the wipe handle dragged
  across the card, which is where a 0.02 step is actually decidable.

### Verified (round 5)

Walked on the dev server at 3416, at 1440 and at 375, light and dark, on the synced tree.

- The template's order holds: the dock, the answer with the eight ask pills, the thirteen-section
  index, the sections, the review panel, the meta, the collapsed history. No prose before section 01.
- Every section anchored and in the dock's Sections menu; all thirteen render evidence (measured:
  none empty, 2 frames and 19 stages across the board).
- The walk runs: "Look first" opens step 1 of 7 on the model, and step 2 both scrolls to the stack
  AND sets `dark=today&light=today`, which is what the step's note describes.
- A copied link reopens the same canvas, candidate and section:
  `?canvas=phone&dark=lift&light=cool&accent=violet&card=veil#palette-stack` comes back with the dock
  on all five and the caption reading Lift's own lightnesses.
- The review panel composes `review palette r5: model=registers; dark=lift; card=veil`, and that line
  parses against a SCRATCH tree (`--root`, a copy of `docs/reviews/` plus the spec; the repo's ledger
  is untouched, `git status docs/` clean). Red-teamed: `dark=amber` is refused naming the six real
  options, and `r4` is refused as "palette is in round 5".
- `/design/lab` queues all eight asks under "Waiting on you" and the board's card shows the verdict
  instead of the legacy note.
- Reduced motion: the board's only motion is the swap transition, declared inside
  `@media (prefers-reduced-motion: no-preference)` in board.css, so a reduced-motion reader gets the
  jump cut with no rule to undo. Unchanged from round four.
- Three things the walk found and fixed, each a control that was lying: the wipe compared nothing
  (the specimen sat in the half `Compare` clips away), the paste's "Read all 113 lines" toggled
  nothing, and two eagerly-loaded marketing pages timed the renderer out.

## Record (round 5; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). The palette board moved onto the lab kit, and the
migration was mostly a promotion. Its question, model, eight one-word calls, five registers, six
departures and two asset asks left `board.tsx` for a `spec.ts` that the board, the desk's "Waiting on
you", the review panel's message and `pnpm lab:review`'s validator now all read, so the asks have one
home and `docs/specs/palette.md` gave up its copy of them. Three pieces of evidence got better rather
than moved. The live sections became live PAGES: the four production sections the board used to
portal into an iframe of its own making retired to the kit's `Frame` loading the real routes, today
on the left and the pair on the right, scrolled together and wearing the exact block the Apply button
hands the site, which is how the footer slab's missing `--card` and the accent that never reaches the
mark are now shown on the real footer instead of argued about. Today-beside-the-candidate became a
wipe with the seam on a slider, so a 0.02 step is judged across four pixels; the two set cards became
two tables where the row is the dock control. `TrueViewport`, its entrance-settling sheet and
`ScopedTokens` went with them. No set, number or recommendation changed. Lab only, no production byte.
