---
track: kill-mono
status: integrated
cut: "6c19d8437438ce718c9b3bb2901a03c31cc560cf"
merged: "659097f"      # the branch head merged into launch-prep
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
  - src/app/(dev)/design/(shell)/library/foundations/
  - src/app/(dev)/design/gallery/
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/(shell)/library/marketing/
  - src/app/(dev)/design/(shell)/library/patterns/
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

- `docs/systems/design-system.md`, the type chapter: the "mono ruling (R6)" paragraph is replaced in
  place by **TWO FACES, AND ONLY TWO** (the ruling, what left the pipeline, and the three things that
  now carry mono's work: data on the body face with tabular figures, a subject number in the display
  face, a value that must look like a value on a muted plate with `select-all`). Same slot, same
  length; nothing appended.
- `docs/systems/design-system.md`, the Phase-2 synthesis line: "two typefaces (Geist Mono = a
  documented utility exception for code/counts)" becomes "two typefaces (mono left the product in the
  2026-09-14 sweep)".
- `docs/systems/design-system.md`, Gotchas / don't-revert: ONE new ★ bullet, the preflight trap (a bare
  `<code>`, `<pre>`, `<kbd>` or `<samp>` renders in a mono stack with no class on it, so no `font-mono`
  grep can see it; `font-sans` on the element, `prose-code:font-sans` on a prose container).
- `docs/systems/marketing-content.md`, seven lines refined in place: the legal status line (:125), the
  /about "no mono anywhere" clause (:160, deleted, since it is now global truth rather than a page
  fact), the contact sheet's frame numbers (:218 and :260), the careers letterhead caption (:312), the
  R6 paragraph in the help-centre chapter (:373, now the two-face statement) and the blog byline's
  justification (:466).

## Deferred (ROADMAP one-liners, bucket named)

- Admin-portal bucket: the MFA enrolment secret (`src/components/admin/mfa-enroll.tsx:122`) is a bare
  `<code>`, so preflight still sets it in a mono stack; outside this lane. One class (`font-sans`), or
  the plate idiom this sweep gave the other admin codes.
- Launch-checkpoint bucket: the two operator emails (`src/lib/email/templates.ts:169,196`) send
  `<code>media</code>`, which every mail client renders in ITS mono face; outside this lane. An inline
  style on those two tags, or drop the tag.
- Lab bucket: `src/app/theme.css:18-20` still carries the handover comment ("Tailwind's default mono
  stack carries the surviving font-mono classes until kill-mono removes them"). The handover is done;
  the standing sentence is the last one, "Never re-add". The Orchestrator owns that file.

## Handoff (replaces the chat report)

- Head: the branch tip (the sweep's five commits, then the merge at `bc9ef45`, then this file), pushed;
  preview `partyreel-git-lp-kill-mono-partyreel.vercel.app`.
- Synced with launch-prep at `b34993e` (it had moved from the `6c19d84` in `cut`; `git merge`, no
  conflicts, and the merge brought in no new mono).
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors; 6 warnings,
  all pre-existing and none in this lane), test ok (1,647 in 190 files), build ok (247 static pages).
- Closing grep: `grep -rn "font-mono\|MonoCaption\|mono-caption" src` returns five lines, all of them
  comments, plus the one live class in `src/components/dev/motion-tuner.tsx:158` (the Orchestrator's,
  stripped in the rounding round). `rules.generated.json` is excluded from that grep by the manifest.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 88 files, every one under an owned
  prefix, plus this manifest and the two system docs listed above. The one exception is the ruled one:
  `src/app/(dev)/design/rules/rules.generated.json`, regenerated with `pnpm design:rules` after the atom
  was deleted (87 components, 83 indexed; no `@contract-for` test was added).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The sweep asked for no new artwork.
- The asks: none. This track had no board, so `BoardMeta` has nothing to quote. The one judgement worth
  a ruling is in "Look at first".
- **The walk, and the one thing it could not reach.** Walked on the branch preview at 1440 and at 375
  (375 through a same-origin 375x812 iframe: the Chrome MCP tab reports `innerWidth` 1440 whatever the
  window is resized to, which is a tooling limit, not a product one): `/`, `/how-it-works`, `/reel`,
  `/features/album`, `/help`, `/help/send-the-event-link`, `/privacy`, `/press`, `/careers`, a 404,
  `/design/library`, `/design/library/marketing`, `/design/library/patterns`. **`/admin` could not be walked signed in**
  and I am not downgrading that quietly: an `lp/*` alias is in no auth allow-list by design, and
  `/admin/*` answers 404 to anyone who is not an admin (confirmed on the preview), so there is no way to
  reach those four pages from this branch. What I did instead: injected the four admin class strings
  into a page that loads the SAME stylesheet (`/privacy`) and read the computed styles, which is what my
  change actually is. All four render as intended (Inter, the muted plate, tabular figures,
  `user-select: all` on the three copyable ones and `auto` on the type-to-confirm token). The four
  surfaces still want an eye on the integration walk, where the launch-prep alias can sign in:
  `/admin/forensics` (both id columns), `/admin/jobs` (the plate only shows when the heartbeat is
  unreadable), `/admin/accounts/<id>` (the user-id plate) and its delete dialog.
- Look at first:
  - **The stat register.** `StatBand` and the help filmstrip moved to the display face (Urbanist 700 with
    tabular figures), which is the register `/pricing` ratified for money on 2026-08-27. It is the
    loudest change in the sweep: `/features/album` and `/help` show it. If a count should stay quieter
    than a price, that is Will's call and it is one class.
  - **The ghost folio** on `/help` went from 5% mono to 6% Urbanist. It is a watermark folio now, more
    present than it was, which is what a print index wants; if it reads loud, `/[0.04]` is the dial.
  - **Inline code in the help centre and the blog.** `prose-code:font-sans` on the two article wrappers
    killed the face in ~260 code spans that no `font-mono` grep could see. The typography plugin still
    wraps them in backticks at weight 600, which is now the whole "this is a literal" signal. It reads
    fine; a plate would read better, and that is a round of its own.
  - **The side chip** (`/how-it-works`) is the one component whose look changed rather than its face: it
    is the eyebrow idiom now (Inter 500, uppercase, tracked) beside the step numeral.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Mono left the product. The `Geist_Mono` loader and
its `--font-mono` variable went out of `layout.tsx`, so the site downloads two faces; `MonoCaption` was
deleted and its sixteen call sites moved to `Caption`, now the one caption atom for labels and data
alike; every remaining `font-mono` in marketing, admin, shared and the lab went with them, and the
figures that had leaned on mono for alignment kept it with `tabular-nums`. The places where mono did
semantic work were redesigned rather than swapped: the stat register (`StatBand`, the help filmstrip)
took the display face with tabular figures, the register the pricing cards ratified; `/help`'s ghost
folio became a watermark in the brand face; admin codes and keys became a quiet key in a table or a
muted plate with `select-all`, and the type-to-confirm identifier took the plate without it, since
typing it is the guard; the error digest and the privacy policy's storage key took the same plate. The
sweep also closed the hole no grep sees: preflight sets a bare `<code>` in a mono stack, so the two
`<code>` elements in the lane took `font-sans` and both long-form wrappers took `prose-code:font-sans`,
which covers ~260 inline code spans across the help centre and the blog. Bible 7 leaves the bible.
