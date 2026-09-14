---
track: type-scale
status: open
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-type-scale-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
