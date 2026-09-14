---
track: kill-mono
status: open
cut: "6c19d8437438ce718c9b3bb2901a03c31cc560cf"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/layout.tsx
  - src/components/marketing/system/
  - src/components/marketing/sections/
  - src/components/marketing/chrome/
  - src/components/marketing/help/
  - src/components/marketing/legal/
  - src/components/marketing/press/
  - src/components/marketing/marketing-not-found.tsx
  - src/app/(marketing)/(cinema)/
  - src/app/admin/
  - src/components/app/copy-share-link.tsx
  - src/components/shared/route-error.tsx
  - src/lib/constants/legal-privacy.tsx
  - src/app/(dev)/design/page.tsx
  - src/app/(dev)/design/foundations/
  - src/app/(dev)/design/gallery/
  - src/app/(dev)/design/library/
  - src/app/(dev)/design/marketing/
  - src/app/(dev)/design/patterns/
  - src/app/(dev)/design/reference/
  - src/app/(dev)/design/rules/component-notes.ts
  - src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx
  - src/app/(dev)/design/sandbox/glow-moments-variants.tsx
  - src/app/(dev)/design/sandbox/glow-lab-shared.tsx
  - src/app/(dev)/design/sandbox/marketing-decomposition-variants.tsx
  - src/app/(dev)/design/sandbox/marketing-hero-substrate-variants.tsx
  - src/app/(dev)/design/sandbox/variant-frame.tsx
reads:
  - src/app/theme.css
  - src/app/globals.css
  - src/app/(dev)/design/rules/bible.ts
  - scripts/design-rules/collect.mjs
  - src/app/(dev)/design/rules/rules-registry.test.ts
  - src/app/(dev)/design/rules/component-index.test.ts
  - src/lib/content/help-ui-labels.test.ts
  - docs/systems/design-system.md
  - docs/systems/marketing-content.md
---

# lp/kill-mono

**Goal.** The kill-mono sweep of the review wave (Will, 2026-09-14: "kill mono entirely"). Every `font-mono` and every `MonoCaption` across marketing, admin, shared and the lab's family pages goes; data displays move to the body face with tabular figures; labels move to the `Caption` atom; the mono face leaves the pipeline (the `Geist_Mono` loader and its variable in `src/app/layout.tsx`; `theme.css` already dropped `--font-mono`); the places where mono did semantic work are designed from the ground up rather than swapped. A production sweep, so it keeps the full gate plus a walk of every hard case on its preview. Bible 7 ("mono is leaving") leaves the bible when this lands.
**Rulings in force.** The bible's second edition: rule 7 (retiring, naming this track: no new mono anywhere; data on the body face with tabular figures; every label, hint and descriptor is the Caption atom), rule 22 (rising tides: judge each hard case from the ground up), rule 13 (nothing gates an h1; `marketing-h1-policy.test.ts` scans marketing: never touch an h1's attributes), rule 8 (never rename a radius token).
**Verify on.** The full gate on the synced tree; `grep -rn "font-mono\|MonoCaption\|mono-caption" src` returns only `src/components/dev/motion-tuner.tsx` (the Orchestrator's, stripped in the rounding round) and comments; a walk of every hard case on `partyreel-git-lp-kill-mono-partyreel.vercel.app` at 1440 and 375 (the marketing pages that carried mono, `/admin` routes as the admin, the help centre, the legal pages, the lab's family pages and `/design/library`).

## The brief

### The question

If mono had never existed here, how would each place that used it show its data, its codes and its labels?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **The inventory at the cut:** 116 `font-mono` hits across 61 files (marketing 35 in 26 files, app 6
  in 5, the lab 70 in 27, other 5 in 4) plus 18 `MonoCaption` importers (16 marketing, 2 lab) and the
  atom itself (`src/components/marketing/system/mono-caption.tsx`, one class string). Since then the
  Orchestrator stripped its own thirteen (the dispatcher, the record, reel-parity, the rules page, the
  MDX step badge, the hero shell) and deleted `--font-mono` from `theme.css`: Tailwind's default mono
  stack carries the survivors until you land. Recount at boot: `grep -rln "font-mono\|MonoCaption" src`.
- **The pipeline:** the `Geist_Mono` import and loader in `src/app/layout.tsx:2,20-23`, its `variable`
  on `<html>` at `:77`. Both are yours to delete (the file is in your lane). `--font-mono` is already
  gone from `theme.css:18` (a comment marks the spot; never re-add).
- **Already mono-free:** `src/app/(app)` and `src/components/ui`. The house idiom for data is
  `tabular-nums` on the body face (97 hits).
- **False friends, untouched:** the lab's `.mono` class in `src/app/(dev)/design/design.css:50-140` is
  the sandbox's monochrome TOKEN SET (no font-family; pinned as a don't-revert, design-system.md);
  `ENGINE_STYLES.mono` is a reel style id.
- **Zero tests block the kill.** What moves when the atom goes: `rules.generated.json` (regenerate with
  `pnpm design:rules`; the ruled exception below), `component-index.test.ts` (drop the
  `mono-caption.tsx` key at `rules/component-notes.ts:133` and fix `caption.tsx`'s for-line at `:110`),
  `gallery.test.ts` (drop the `mono-caption` entry at `marketing/gallery-demos.tsx:389-399` and the
  panel at `gallery/playgrounds.tsx:343-348` plus both imports; `caption` stays),
  `marketing-library.test.ts` (green once the import goes).
- **The hard cases, where mono did semantic work** (design each from the ground up; the question is
  what the perfect version is with no mono in the world, not what class replaces the old one): the stat
  register (`system/stat-band.tsx:61`, `help/help-facts-band.tsx:44`: likely a heading-face numeral with
  `tabular-nums` and a `Caption` label), codes and keys in admin (`src/app/admin/forensics/page.tsx:152,234`,
  `admin/jobs/page.tsx:161`, the delete-account confirm `delete-account-control.tsx:111`: the body face
  with tabular figures inside a muted plate, or a copy control where the value is meant to be copied),
  the error digest (`shared/route-error.tsx:74`), the legal `<code>` (`lib/constants/legal-privacy.tsx:407`),
  the help page's decorative ghost numeral (`(cinema)/help/page.tsx:287`).
- **The docs that state the old ruling**, listed under System-doc edits and read by eye at the merge:
  `docs/systems/design-system.md:492-499`, `docs/systems/marketing-content.md:125,160,256,308,369,463`.
- **The hero wiring waits for you:** `sections/home/cinema-hero.tsx` carries three hits and the
  `MonoCaption` import.

### The board

No board. The sweep itself, plus the walk: every page that carried mono, at 1440 and 375, on your
preview, with the hard cases photographed before and after in the Record's "Look at first". The six
boards of this wave were told not to use mono, so your lane is the production trees, the lab's
family pages and the six older sandbox files listed in `owns`; the seven `sandbox/<board>/` directories,
`rules/`, `record/`, `c/`, `motion/` and `components/dev/` are outside it.
### The deliverable

The sweep: every `font-mono` in your lane gone; `MonoCaption` callers moved to `Caption` (labels) or the body face with `tabular-nums` (data); the atom deleted with its library entries; the loader and its variable out of `layout.tsx`; the hard cases redesigned; the Record naming every redesigned case. **Ruled exception, listed in Handoff:** you regenerate `src/app/(dev)/design/rules/rules.generated.json` (`pnpm design:rules`) after deleting the atom, though the Orchestrator owns it; add no `@contract-for` test.

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

- Head <sha>, pushed; preview partyreel-git-lp-kill-mono-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
