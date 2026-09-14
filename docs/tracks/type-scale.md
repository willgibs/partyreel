---
track: type-scale
status: handed-off
cut: "6c19d84"
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
---

# lp/type-scale

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
  page title is Urbanist; the wiring round should sweep it with the ladder.

## Handoff (replaces the chat report)

- Head: this handoff commit, sitting on the gated tree `a9a3c79`; both pushed. Preview
  `partyreel-git-lp-type-scale-partyreel.vercel.app`, and the board is at
  `/design/c/type-scale?key=8838d0dd22f626a603fcf551`. The alias was READY at the first commit
  `90baaf5` when this was written, with the later pushes queued behind the wave's other tracks on
  the one-at-a-time plan; it moves to the head on its own.
- Synced with `launch-prep` at `b34993e` (round three's hero tracks and the round-two ruling). No
  conflicts: nothing it landed touches this track's `reads`.
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 6 pre-existing warnings, none in this
  lane), test ok (1688 in 191 files), build ok (247 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five files under
  `src/app/(dev)/design/sandbox/type-scale/` plus this manifest. No exceptions.
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

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

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
