---
track: crumbs-9
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3c96b1fb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/mutations/article-feedback.ts
  - src/lib/db/queries/article-feedback.ts
  - src/lib/db/queries/jobs.ts
  - src/components/marketing/help/
  - src/app/(marketing)/(cinema)/help/
  - content/help/report-a-problem-as-a-guest.mdx
  - src/components/marketing/sections/home/hero-stream
  - src/components/marketing/sections/home/cinema-hero
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/lab/scene.tsx
  - src/app/(dev)/design/(shell)/library/compositions/
  - src/lib/db/mutations/media.ts
  - src/app/(app)/dashboard/[eventId]/actions.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/host-app.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-9

**Goal.** Clear eight small ROADMAP items that no running lane holds: the untyped seams the regenerated types retire, the help's phone chip and its last screenless article, the hero's headline fold at 470 to 767, two stale notes, the portal's missing Library specimens, and a restore that loses its custom link in silence.

## The brief

Eight small items, each a ROADMAP line under Now (quote its words in your commit and your Handoff, so the Orchestrator retires each at your record):

1. **Code hygiene:** `types.ts` now carries `article_feedback` and `article_feedback_summary` (regenerated 2026-09-29). Drop the three untyped seams help-wiring left: `db/mutations/article-feedback.ts`, `db/queries/article-feedback.ts`, and the one count in `db/queries/jobs.ts`.
2. **Help:** the hero field's `⌘K` chip shows on a phone, which has no ⌘K. Hide it on a coarse pointer.
3. **Help:** `report-a-problem-as-a-guest`'s three steps take screens now that triage-wiring's article has merged: the report sheet opening, its reason box, and its sent line. Its name leaves `STEPS_WITHOUT_SCREENS`. Use help-wiring's `step-screens/` pieces, drawn from production's own components.
4. **Marketing:** the home hero's base geometry sets its headline in three lines from about 470 to 767 wide: 405 px, where `GEO.base.blockH` is solved with 361, measured. So a short window at those widths runs the actions past the fold. A base `blockH` taken at 767, or a step in `h1Max`, ends it. Measure before and after at 470, 600 and 767 by 700 tall.
5. **Marketing:** `chrome/mega-panel.tsx`'s note still calls `DemoFrame` "the object every demo door now shares". It is the Features pane's alone since the link card took the hero.
6. **Code hygiene:** `components/lab/scene.tsx`'s header still lists `host-storage` among the boards drawing a Scene, and the Library's `composition-demos.tsx` calls its fixture "the host-storage board's videographer". Name what exists.
7. **Library:** `DestructiveSheet`'s `note` (optional and required) and the admin report cards have no specimen on the compositions page, the one automated eye on the portal. Add them, drawn from the real components.
8. **Host:** a restore that came back without its custom link (`restore_event`'s `custom_slug_released`) could say so in its toast. `restoreEvent` in `db/mutations/media.ts` drops the flag today. Carry it to the toast: a short line saying the link went to another event while this one sat in Deleted, so it came back on its own address.

**Paths:** `crumbs-8`, `emails-wiring` and `demo-framing` run beside you. None of their paths are yours; `demo-framing` reads `hero-stream.ts`, so keep item 4 to the base geometry. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for each code change.
- The hero at 470, 600, 767 and 1440 by 700 and 900.
- The help's article at 375 and 1440.
- The compositions page's new specimens.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
