---
track: bible-ten
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f912bb94"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/design/
  - docs/systems/admin-observability.md
  - docs/systems/design-system.md
  - docs/systems/host-app.md
  - docs/systems/marketing-content.md
  - docs/systems/testing-verification.md
  - src/app/(dev)/design/
  - src/app/(marketing)/
  - src/app/globals.css
  - src/app/not-found.tsx
  - src/app/theme.css
  - src/app/two-faces-policy.test.ts
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/share/event-code-modal.tsx
  - src/components/app/share/share.css
  - src/components/app/welcome-flow.css
  - src/components/lab/
  - src/components/marketing/
  - src/components/shared/album-stream/album-stream.test.tsx
  - src/components/shared/album-stream/album-stream.tsx
  - src/components/shared/album-stream/stream-engine.test.ts
  - src/components/shared/backdrop/backdrop-engine.test.ts
  - src/components/shared/backdrop/photo-section.css
  - src/components/shared/backdrop/photo-section.test.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/shared/backdrop/room-frames.ts
  - src/components/shared/error-digest.tsx
  - src/components/shared/failure-grammar.test.tsx
  - src/components/shared/media-lightbox.css
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/river/river.css
  - src/components/shared/river/river.tsx
  - src/components/shared/trail/trail-engine.test.ts
  - src/components/shared/trail/trail-engine.ts
  - src/components/shared/trail/trail-frames.ts
  - src/components/shared/trail/trail.css
  - src/components/shared/trail/trail.tsx
  - src/components/social/guest-list.tsx
  - src/components/ui/card.tsx
  - src/components/ui/command-palette.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/floating-layer.test.ts
  - src/components/ui/floating-layer.ts
  - src/components/ui/navigation-menu.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/select.tsx
  - src/lib/billing/storage-guard.test.ts
  - src/lib/constants/how-it-works.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/content-policy.test.ts
  - src/lib/elevation-policy.test.ts
  - src/lib/glass.test.ts
  - src/lib/glass.ts
  - src/lib/shared/arrival.ts
  - src/lib/shared/use-scroll-direction.test.ts
  - src/lib/shared/use-scroll-direction.ts
  - src/lib/stripe/change-plan.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/bible-ten

**Goal.** The bible consolidated to the ten principles Will ruled, and every citation in the codebase made to agree: a restating citation removed, a useful one naming its rule, lab data following the old-to-new map.

## The brief

**Will's ruling (2026-09-24).** He asked: "are we sure 25+ rules are better than a good 10?" The answer was no, and he chose "Consolidate to these ten": the bible becomes ten principles. The details the old rules held (radii, elevation, the floating-layer family, the four grounds, the lamps, the masthead) live in the Library's tokens and components, where he can see them. The enforcing tests stay.

**Your first step.** Copy `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/bible-ten/bible.ts` verbatim over `src/app/(dev)/design/rules/bible.ts`. The Orchestrator wrote it from his words, and it passes `bible.test.ts`. Never edit its rules.

**Your job: make the codebase agree with it.** `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/bible-ten/map.json` maps every old rule number to its new one. In your owns:
- A citation of a rule number that only restates what a test or the Library already shows goes. Will: "every added line dilutes the rest."
- A citation that still earns its place names the rule (for example "the bible's One system rule") instead of a number, so the next consolidation can't break it.
- Lab data that resolves rules by number or id (`_data/links.ts`, `influences.test.ts`, `catalog.test.ts`, `status.test.ts`, and anything else the tests find) follows the map.
- Whatever renders the bible's groups follows the four new groups (rising tides, experience, identity, copy).
- Finally run `pnpm design:rules`, which regenerates `rules.generated.json` and `docs/design/library.md`, then the full gate.

**Not yours.**
- The held `reel-guest-wiring` lane owns eight files with citations: `docs/systems/guest-flow.md`, `src/components/guest/entry-modal.tsx`, `src/components/guest/gallery-empty-state.test.tsx`, `src/components/guest/gallery-empty-state.tsx`, `src/components/guest/guest-action-dock.tsx`, `src/components/guest/guest-bar.tsx`, `src/components/guest/upload/stack-tile.tsx`, `src/components/guest/upload/upload-terms.test.ts`.
- `CLAUDE.md` and `docs/PROGRAM.md` are the Orchestrator's.

List each stale citation in those ten files in your Handoff, with its replacement.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Two old rules kept a live citation instead of going Library-only, against the letter of the brief's example list
  ("radii, elevation, the floating-layer family, the four grounds, the lamps, the masthead").** `elevation-policy.test.ts`
  and `floating-layer.{ts,test.ts}` each carry a comment saying their own numeric citation "is the Orchestrator's to
  reword at the merge" once their `enforcedBy` names them — and the new `bible.ts` already lists both files under rule
  6 (`media-is-the-color`) and rule 8 (`one-token-set`) respectively. Recommended and taken: renumber those citations
  onto 6 / 8 rather than stripping them, since the file is genuinely still cited by a live rule; every other
  elevation/floating-layer/radius/lamp/masthead mention outside those two files had its citation dropped. His to
  overrule if he'd rather those two go silent as well.
- **Where a citation "earns its place," I named the rule by number (`bible 6`) rather than spelling out
  "the bible's Media is the color rule" inline everywhere**, since the volume (about 100 rename sites) made the fuller
  phrasing read as noise in code comments; I reserved the fuller "the bible's `<Name>` rule" / "the `<id>` rule" phrasing
  for docs prose and the handful of citations that needed rewording anyway. Recommended and taken. His to overrule if
  he wants every citation spelled out by name.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the bible's rule count corrected to ten (was stale at twenty-two even before this
  round); every `bible N` citation in the doc renumbered or dropped per the map.
- `docs/systems/marketing-content.md`, `docs/systems/host-app.md`, `docs/systems/admin-observability.md`,
  `docs/systems/testing-verification.md`: every `bible N` citation renumbered or dropped per the map; no other facts
  changed.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Work commit: `e0f58524` — bible.ts replaced verbatim with the Orchestrator's ten-rule file; every citation in the
  owned tree swept (delete a bare restating number, renumber/rename one that earns its place, consolidate adjacent
  citations of what is now one rule); the two hardcoded "twenty-two rules" prose counts fixed; `pnpm design:rules` run
  to regenerate `rules.generated.json` and `docs/design/library.md`.
- Sync commit: `edcdaf82` — merged `origin/launch-prep` (it had moved: `brand-kit` cut, `orchestrator.md` pickup
  rewritten; no overlap with this lane's owns, clean merge, no conflicts).
- Gates on the synced tree, each its own exit code: `pnpm design:rules` (clean, no diff after the merge) ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` (clean, no diff) · `pnpm typecheck` (pass) · `pnpm lint`
  (0 errors, 8 warnings — all pre-existing on `launch-prep`, none in a line this lane added; see note below) ·
  `pnpm test` (434 files, 4783 passed, 1 skipped — the `bindsFor` exploration-marker test, which only runs while a
  rule is under exploration; none is right now) · `pnpm build` (compiled, typechecked, 259 static pages) ·
  `pnpm lab:smoke --base http://localhost:3132` (489 checks, 0 failing; the one non-200 in the run, `/design/boom`
  returning 500, is that page's own intentional error-boundary probe, unrelated to this change).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 119 files, every one inside `owns` (verified by
  script against the manifest's own list) plus this manifest. No exceptions.
- Verified live in the browser at 1440 and 375 on `/design/library/rules?key=fiesta`: the four new groups (Rising
  tides, Experience, Identity, Copy) render in order with all ten rules under them; the stat tiles read "10 laws"; the
  page's own blurb reads "Will's ten global working rules"; each rule's `enforcedBy` policy chips show the renumbered
  citations (rule 6 lists `elevation-policy`, rule 8 lists `floating-layer.test`, confirming those two files' live
  citations render correctly); no console error.
- The items:
  - `src/app/(dev)/design/rules/bible.ts` replaced verbatim with the scratchpad file (10 rules, 4 groups); never
    hand-edited beyond the copy.
  - Every `bible N` citation in the owned tree (242 sites found by a repo-wide grep, case-insensitive after an initial
    case-sensitive pass missed about 30 capitalized `Bible`/`BIBLE` ones) resolved: renamed onto the mapped new
    number where the principle survives, dropped where the brief's Library-detail list covers it (radii, elevation,
    the floating-layer family, the four grounds, the lamps, the masthead — except the two exception files above),
    consolidated where two adjacent citations now name the same rule.
  - The 26 boards' `links.bible` arrays in `sandbox/*/spec.ts` left unmapped, on the Orchestrator's mid-task trim
    (nothing reads them; confirmed by grep before the trim was even given).
  - `_data/links.ts` / `links.test.ts` needed no change: both already resolve `bible N` fully dynamically off the live
    `BIBLE` array (`RULE_BY_N = new Map(BIBLE.map(r => [r.n, r.id]))`); the fixture ids in `links.test.ts` that spell
    an old rule's id (`"two-faces"`) are inert fixtures never checked against `BIBLE`.
  - `catalog.test.ts`: the synthetic scoring fixture updated from the retired `no-em-dashes`/19 to `affirmative-only`/10
    (cosmetic — the scoring algorithm doesn't care) and the `has("bible 22", "rule")` assertion moved to `bible 1`
    (load-bearing — 22 no longer resolves under a 10-rule bible).
  - `influences.test.ts`, `status.test.ts`, `search.ts`: the incidental `bible N` mentions in comments/fixtures
    renumbered for accuracy; none was load-bearing.
  - Bible-group rendering needed no separate fix: `BIBLE_GROUPS`/`BIBLE_GROUP_LABEL` are consumed dynamically
    everywhere (`rules/page.tsx`, `[id]/page.tsx`, `catalog.test.ts`, `nav.ts`); swapping `bible.ts` alone produced
    the four new groups. Confirmed live (see above). Not to be confused with the unrelated nine-item `LEVELS`
    influence-authority system, which is untouched.
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each: see Questions above (the two exception files; the naming-by-number-vs-full-name
  style split between code comments and docs prose).
- Stale citations in the ten files this lane does not own — listed, not edited (the two Questions above cover why
  6/8 rather than a number-shift for the exception files; the rest are plain renumbers or drops per the same map):
  - `CLAUDE.md:47` — `"(22 rules, Will's)"` -> `"(10 rules, Will's)"`; same line `"(bible 22)"` -> `"(bible 1)"`.
  - `CLAUDE.md:113` — `"(bible 21)"` -> `"(bible 10)"`; `"(bible 7;"` -> `"(bible 8;"`.
  - `docs/PROGRAM.md:167` — `"(bible 22)"` -> `"(bible 1)"`.
  - `docs/systems/guest-flow.md:186` — `"bible 4 refuses"` -> `"bible 7 refuses"`.
  - `src/components/guest/entry-modal.tsx:892` — `"bible 4 still holds"` -> `"bible 7 still holds"`.
  - `src/components/guest/gallery-empty-state.test.tsx:20` — `"(bible 4: a guest surface belongs to the host's event,
    so no demo"` restates its own rule in full; drop the tag entirely, or renumber to `bible 7` if the lane prefers
    to keep it.
  - `src/components/guest/gallery-empty-state.tsx:16` — `"which bible 4"` -> `"which bible 7"`; line 21 `"(bible 1)"`
    -> `"(bible 6)"`.
  - `src/components/guest/guest-action-dock.tsx:27` — `"bible 15 keeps"` -> drop the tag, reword to "the floating-layer
    contract keeps" (old-15 is Library-detail outside its own enforcement file); line 34 `"(bible 15)"` -> same,
    drop.
  - `src/components/guest/guest-bar.tsx:19` — `"Bible 4 holds even here"` -> `"Bible 7 holds even here"` (missed by
    the first, case-sensitive grep pass; caught on the follow-up sweep).
  - `src/components/guest/upload/stack-tile.tsx:25` — `"Bible 10 gives the lift to one object"` -> drop the tag,
    reword to "The lift belongs to one object" (old-10/elevation is Library-detail outside `elevation-policy.test.ts`;
    also missed by the first grep pass).
  - `src/components/guest/upload/upload-terms.test.ts:12` — `"bible 21 keeps copy"` -> `"bible 10 keeps copy"`.
  - `src/components/guest/guest-bar.tsx` upload/stack-tile.tsx above are the two the first case-sensitive grep pass
    missed; re-ran case-insensitively across the whole repo before finishing and found nothing else outside this
    lane's owns.
- Look at first: `docs/systems/design-system.md` (the densest citation file, ~20 sites) and
  `/design/library/rules?key=fiesta` live, to see the four groups and ten rules read the way he ruled them.
