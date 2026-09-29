---
track: crumbs-9
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
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

- **Work commit, pushed:** `30698af6` (`lp/crumbs-9`). No sync commit: `origin/launch-prep` moved to `3c37607e`
  (emails-wiring and demo-framing merged, `pass_renewal_pref` applied) since my cut, but
  `git diff --name-only bf3bbdac 3c37607e` touches none of my owned paths and none of my three `reads`
  (marketing-content.md, host-app.md, admin-observability.md), so nothing to catch up to and no conflict risk.
- **Gates, on `30698af6` (unsynced, per above):** `pnpm typecheck` clean; `pnpm lint` 0 errors (4 pre-existing
  warnings, none in a file I touched); `pnpm test` 548 files / 6219 tests green; `pnpm build` clean; `pnpm lab:smoke
  --base http://localhost:3134` 196 checks, 0 failing (the one 500, `/design/lab/tools/boom`, is a permanent,
  intentional boundary probe, unrelated to this lane).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is exactly my owned paths, plus two exceptions:
  - `src/components/app/restore-event-button.tsx` (item 8): not owned, but its toast is the one place
    `customSlugReleased` reaches a reader; a one-line addition to its success toast's `description`, no other line
    touched. No other lane claims it (checked `crumbs-8`, `emails-wiring`, `demo-framing`'s manifests).
  - `src/app/(dev)/design/gallery/specimens.generated.json` (item 7): the committed specimen-source artifact
    `collect-specimens.mjs` derives from every family's `gallery-demos.tsx`; `specimens.test.ts` fails until it
    matches, so it's regenerated (`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`) rather than edited,
    same as `next typegen`'s route types.
- **The items** (ROADMAP's own words in the work commit's body; quoted here too so a `git log -1` isn't required):
  1. Code hygiene, the three untyped seams (`article-feedback.ts` x2, `jobs.ts`): dropped the untyped-client casts.
  2. Help, the hero's ⌘K chip on a phone: `pointer-coarse:hidden` on the hero `Kbd`.
  3. Help, `report-a-problem-as-a-guest`'s three screenless steps: three new phone screens (`report-open`,
     `report-reason`, `report-sent`) in `step-screens/door-screens.tsx`, quoted from `report-dialog.tsx` (its open
     state and toast aren't reachable through a prop, so the shell is redrawn, not mounted, same as the door's own
     `WelcomeScreen`); `STEPS_WITHOUT_SCREENS` is `{}` again.
  4. Marketing, the hero's headline fold at 470-767: **a call, his to overrule** — the manifest offered "a base
     `blockH` taken at 767" or "a step in `h1Max`"; I measured live (`hero-stream.test.ts`'s own numbers) that
     taking `blockH` to 405 pushes `BUILT.base.minH` to 670, three px past the 667 "shortest phone verified"
     ceiling `hero-stream.test.ts` holds it to, so I took the `h1Max` step instead: `cinema-hero.css` widens the
     plain `--hhs-h1-max` (never the component's own suffixed `--hhs-h1-max-base`) to 480px from 470px wide, which
     `hero-stream.ts`'s solved numbers never read, so `GEO.base`, `BUILT.base` and every existing test are
     untouched. Measured live at 470/600/767 by 700/900 and 1440 by 700/900 (all fit; the 767-by-700 case that
     used to overshoot by 20px now clears the fold by 42px).
  5. Marketing, `mega-panel.tsx`'s stale `DemoFrame` note: corrected to name the link card.
  6. Code hygiene, `scene.tsx` and `composition-demos.tsx`'s dead `host-storage` references: `scene.tsx`'s
     historical list now says where `host-storage` retired to (`/pricing`'s size configurator, confirmed against
     git log: `pricing-wiring` retired it directly); the Library fixture's comment drops the dead pointer and
     describes the account plainly.
  7. Library, `DestructiveSheet`'s note and the report cards: a new `compositions` entry, `admin-report-cards`
     (id chosen after `pnpm test` caught a collision — `components`' own `destructive-sheet` entry already
     demonstrates the panel's severities alone, unrelated to `note`; mine is a distinct id, same `file`/`test`).
     `AdminReportCardDemo` redraws `report-review.tsx`'s `OpenReportCard` from its own exported pieces
     (`ReasonLine`, `NoteField`, `AddNoteLink`, `ClosedLog`, `ClosedLine`, `useVerdictNote`) over an inert
     `onConfirm` (Review and Storage's own convention), never the real component (it hard-wires the real Server
     Actions). Verified live: both confirms open correctly (Remove…'s note optional, Hold for forensics' required
     and pre-filled), no console error beyond the page's own pre-existing favicon 404.
  8. Host, the restore toast's silent `custom_slug_released`: threaded through `restoreEvent` (`media.ts`) ->
     `restoreEventAction` (`actions.ts`) -> `RestoreEventButton`'s toast `description`. Not live-verified (needs a
     signed-in host, two events and a stolen custom slug — sign-in is allow-list-gated and doesn't work on
     localhost, and the manifest's own Verify list doesn't ask for this one live): typecheck plus the full test
     suite are what stand behind it. Flagged below for a live pass on the alias.
- **Assets requested from Will:** none.
- **Board ideas:** none beyond this lane's scope.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - Item 4's fix (above): `h1Max` step over a `blockH` bump, specifically because the latter would have broken
    `hero-stream.test.ts`'s "fits the shortest window it is verified on" (667px) by 3px. If he'd rather the
    headline simply take a third line at these widths (and the 667 floor move to accommodate it), that's the
    other branch the manifest named.
  - Item 6: "name what exists" for `host-storage` — I annotated the historical entry in place rather than
    deleting it (it's still true history) or leaving it bare (a dead pointer). If the intent was closer to "prune
    it", that's a smaller edit from here.
- **Look at first:** item 8's toast (`RestoreEventButton`, described above) on the live alias — soft-delete an
  event with a custom slug, let another event claim that slug, then restore the first and confirm the toast's
  description reads correctly; everything else on this branch is covered by the gate and the live checks above.
