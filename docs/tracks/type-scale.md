---
track: type-scale
status: handed-off
cut: "a058ab4"
merged_round_2: "c97d799"
merged_round_1: "5186fb8"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/type-scale/
reads:
  - src/app/globals.css
  - src/app/theme.css
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/page-hero-contract.test.ts
  - src/components/shared/page-heading.tsx
  - src/components/ui/card.tsx
  - src/lib/constants/marketing-voice.ts
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/sandbox/variant-frame.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/shared/not-found-screen.tsx
  - src/app/(marketing)/marketing.css
  - src/components/dev/candidate-style.tsx
  - src/components/dev/tuner-store.ts
---

# lp/type-scale

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
**Verify on.** `/design/c/type-scale?key=` on your preview at 1440 and 375, reduced motion honoured; the gate green.

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

### The rules of this wave (every track)

- **Rising tides (bible 22).** Judge the system from the ground up: what would the perfect version
  be if none existed? If today's tokens point there, the candidates are tunings; if the perfect
  version deviates, a candidate replaces the system and says so as a departure in `BoardMeta`. The
  three candidates on a board span that range; they are never three shades of one answer. A
  candidate may question a bible rule: that is a finding, written in this manifest, ruled by Will.
- **The board shell.** `src/components/dev/board/` is the shell: `Stage` (a real viewport on a
  real ground, `cinema | paper | ink | app-dark | app-light`, zoom-fitted, `data-paused` on a hidden
  tab), `Toggle`, and `BoardMeta` (the question, the candidates, the asks, the departures, the
  assets). The stub in your directory shows the pattern; replace it whole. The asks are the exact
  choices Will makes, worded so a ruling is a few words; the Orchestrator quotes them.
- **Light QA (Will, 2026-09-14).** A lab-only round verifies its board on its preview at 1440 and
  375 with reduced motion honoured and the gate green on the synced tree, then hands off; the deep
  red-team is the wiring round's. Iterate rather than perfect. Push early and often: `preview: true`
  builds `partyreel-git-lp-<track>-partyreel.vercel.app` on every push and Will reviews there in
  parallel.
- **Unlimited design resources.** Ask for exactly the asset the design needs, in Handoff, one
  bullet per asset in the shape `what · spec (size, grade, count, format) · replaces <stand-in id>`;
  ship the manifest's stand-in meanwhile. Never edit `docs/ASSETS.md`.
- **Never touch:** `touchpoints.ts` (your board is registered; the placeholder variant names are
  renamed at integration), `rules/bible.ts` (a bible change is Will's ruling, folded by the
  Orchestrator), CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `src/lib/env.ts`, anything
  outside `owns`.
- **No mono.** Bible 7 is retiring and a sweep is removing the face in parallel: no `font-mono`, no
  `MonoCaption`; `Caption` (`system/caption.tsx`) is the label face and `tabular-nums` on the body
  face carries data.
- **Sheets.** Keyframes live in your `board.css` under your prefix only (`keyframe-uniqueness.test.ts`
  reads every sheet under the lab); a board sheet never imports tailwindcss (`css-source-policy`);
  `glow-contract.test.ts` pins exactly three `<BorderBeam` sites, one `id="glw-warp"` and one
  `<GlowFilter />` across all of `src`, so compose `<Glow>` only. No em-dashes anywhere (the AST
  guard scans lab TSX).
- **Sync** `origin/launch-prep` only per PROGRAM.md: before handoff if it moved; mid-round only when
  `docs/tracks/orchestrator.md` announces a landed change to one of your `reads`. The Orchestrator's
  rounding round retunes radius VALUES mid-window (never a token name) and announces there.
- **Handoff:** fill Handoff and Record below, `status: handed-off`, push; the chat report is one
  line, "handed off at <sha>".

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
  `/design/c/type-scale?key=8838d0dd22f626a603fcf551`. The alias was READY at the first commit
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
  `partyreel-git-lp-type-scale-partyreel.vercel.app`, board at `/design/c/type-scale?key=`. The
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

- Head: `aa74879`, the review-fix commit, sitting on `2b63080` (the first round-3 handoff) over
  `9814802` (the sync merge), `b44a6aa` and `77a1e5c`; all pushed. Board at
  `/design/c/type-scale?key=`.
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
  `http://localhost:<port>/design/c/type-scale?key=`; the lab is in no allow-list, so localhost
  renders the tip exactly, "Apply to the site" included, which is where both QA passes below were
  measured. For the Orchestrator, and it is mandatory before Will walks anything, because this branch
  is handed off and pushes no more: force a redeploy at the tip (`POST /v13/deployments`, `gitSource
  {type: github, repoId: 1252816746, ref: lp/type-scale, sha: <tip>}`), confirm READY, and check the
  build is round three by curling for **"The four ladders at a glance"**. The fix push (`aa74879`,
  23:37) produced no deployment either: the 23:31:57 slot had just gone to `lp/media-kit`. An Agent
  cannot force one, and should not: `POST /v13/deployments` is refused to this session by policy, and
  a deploy is the Orchestrator's under the branch protocol, which is exactly why this is written down
  rather than worked around. **The `launch-prep` alias
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
