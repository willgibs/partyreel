---
track: rounding
status: open
cut: "ca952b5"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/rounding/
reads:
  - src/components/dev/motion-tuner-config.ts
  - src/components/dev/tuner-store.ts
  - src/components/dev/board/stage.tsx
  - src/app/globals.css
  - src/app/theme.css
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/app/(dev)/design/rules/bible.ts
  - docs/systems/design-system.md
  - docs/specs/palette.md
  - docs/specs/light.md
  - docs/specs/floating-surfaces.md
---

# lp/rounding

**Goal.** Round two of the rounding board (round one was the Orchestrator's: the tuner's store,
descriptions and action knobs, the board at `/design/c/rounding` with one kit in four columns, the
tokens made reachable in paper chapters and the lab; see the CHANGELOG's review-wave entry). Bible 8
(sharp surfaces, round actions; tokens, never literals) inherits the values Will rules on this board.

**Round 2 (the goal).** The rounding board is the Orchestrator's kit in four columns; take it the rest
of the way to a sitting surface. (1) **Real compositions in each column**, built from production
components: a marketing chapter's card row and its CTA, the dashboard's event card, the guest
gallery's tight-gap tile grid, a dialog and a menu (static, with the primitives' own classes), so the
radius is judged on the site's real shapes and not a kit alone. (2) **The nested-corner rule** (bible
9) as a specimen: a card with an inner media plate and a ring at offset, a beam around an action,
under each candidate, with the arithmetic printed (inner = outer minus gap). (3) **The derived-scale
consequences** made visible: every step (`rounded-sm` to `rounded-4xl`) on the real components that
use it, under each candidate, so the 2xl trap (28.8 px at a 16 px base) is seen, not described; and
a candidate that retunes the multipliers if the base goes rounder. (4) **"Try B on the site"**: each
fixed candidate's six values written to the tuner with `setTunerValue` (the controls are
`ROUNDING_TUNER_CONTROLS`), so Will walks the real pages and the app at that column. (5) The action
ladder at every height including the marketing CTAs as they ship (find where `rounded-action` and
`-lg` are actually used, or say they are not). (6) Every column on the phone canvas. (7) The asks
reduced to one-word answers. You own `sandbox/rounding/` only; the tuner and the shell are the
Orchestrator's (propose in Handoff).

**Rulings in force.** Bible 8 (under exploration, this board), 9 (radius plus offset), 15 (the
floating layer's one radius), 22 (rising tides). Never rename a radius token; the values are the
tuner's and the ruling's.

**Verify on.** `/design/c/rounding?key=` on your preview at 1440 and 375; the gate green.

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

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (round 2)

- Head <sha>, pushed; preview partyreel-git-lp-rounding-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta: ...
- Look at first: ...

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
