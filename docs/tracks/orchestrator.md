---
track: orchestrator
status: open
cut: "5cdebfe0"          # this window opened at Round 1 of the revamp (2026-09-16)
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/(shell)/page.tsx
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/legacy-routes.ts
  - src/app/(dev)/design/_data/legacy-routes.test.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/motion-tuner-config.ts
  - src/components/dev/marketing-motion-tuner.tsx
  - src/components/dev/tuner-store.ts
  - src/components/dev/candidate-style.tsx
  - src/components/dev/app-design-island.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/dev/lamp-set.ts
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
reads:
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/components/marketing/system/section-shell.tsx
announces:
  - "Round 1 of the revamp (2026-09-16, 5cdebfe0): the lab guards itself against a stale stylesheet (src/components/lab/lab-chrome.tsx reads --lab-css-generation off .lab-shell; bump lab-css-generation.ts and design.css together when a shell rule changes; a stale copy after one reload means the SERVER: stop it, rm -rf .next/dev, start it); every pick toggles (review-store.ts writers toggleAnswer / setAnswerNote / setBoardNote / toggleItemVerdict / setItemNote, an `items` map keyed by itemHoldId); a wide page at 1:1 runs edge to edge (data-lab-bleed on Stage and FrameRow; a bleed inside a bleed keeps its box); board-spec.ts carries ITEM_VERDICTS, LIBRARY_VERDICTS, BuilderVerdict, Candidate.one/verdict/facts, Control.clearable, BoardSpec.catalog and LIMITS.readingWords; .lab-catalog is the unlayered grid in design.css. Two lanes cut: lab-catalog (the review's item scope, the catalog kit, the toolbox, the reading budget, the palette as proof; owns scripts/lab-smoke.mjs this round) and lab-sweep (walk every lab page and fix the shell; owns design.css and _data/glossary.ts this round). docs/reviews/README.md stays here: a grammar change is written into Handoff verbatim and landed at the merge."
  - "The stepped review round (2026-09-16, 02c409b4): board-spec.ts carries Ask.lands / after / strip, AskOption.state, Candidate.lands, CatalogSpec.mode / winner / walk / stage and LIMITS.askLands / candidateLands; registry.test.ts rules on them (a staged ask waits on an earlier ask or a card of its own catalog; a pick-one catalog names a winner ask that mirrors the pick control and offers none; look is optional once every option is drawn; an ask mirroring a clearable control may offer its cleared default as none)."
  - "The protocol (2026-09-16): docs/PROGRAM.md is the loop (the round, the question route, integration, the record's depth), docs/tracks/README.md the one-round manifest template and the spawn paragraph; a manifest is deleted in its merge commit from here on."
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, what every
open track is doing, and what waits on Will. Agents sync `origin/launch-prep` mid-round only when a
line under `announces` touches one of their `reads`; otherwise once, before handoff, if it moved.

**This window: the revamp (opened 2026-09-16).** Will's first per-item sitting is under way on his
dev server; his batches transcribe as they arrive (`docs/reviews/`), and the wind-down rules from here:
a board ends in promotion into the Library, never in another exploration unless he asks for one by name
(he asked for two: the palette's cool greys and the hero's stream). Will found the lab broken on localhost and the
explorations turning into papers; the plan he approved runs four rounds: the lab (Round 1, in flight),
the docs diet and the track protocol (Round 2, the Orchestrator's, the protocol part landed), the
Library as the complete inventory and a review surface (Round 3), the six paper boards rebuilt as
catalogs (Round 4, closed on the tree the same day). The alias still serves Phase 1 of the
Library x Lab round until Vercel's cap frees (2026-09-17 00:13 UTC); every review meanwhile is a local
`pnpm dev` after a hard reload. The stepped review round opened 2026-09-16 on his sitting's verdict (the
review "favors you and makes me spend tons of time per track figuring what I'm even being asked"):
`lab-flow` rebuilds the review as an onboarding form, every board is reshaped into steps four at a time
with no new exploration, and his sitting resumes on the first two that land; the last lab-infrastructure
round of the window.

## In flight

| track | board | waits on |
| --- | --- | --- |
| `media-kit` | `/design/lab/media-kit` (round seven: keep-any as a gallery, a kept card is a purchase) | its handoff |

## Waiting on Will

The desk derives it (`/design/lab?key=`: every open ask and every unruled item of every board, from
the specs minus the ledgers in `docs/reviews/`). Assets: [`../ASSETS.md`](../ASSETS.md). Next from
him: nothing until the first reshaped boards integrate; then the stepped sitting, board by board (the
palette and light first), pasted in batches with Copy so far.

## Landed this window

- `5cdebfe0` the foundation (the guard, the toggle rule, the bleed, the shared types); `28d1aa95` the
  two manifests and the catalog grid; `0c0269ee` to `e8ce341e` the protocol and the record diet;
  `88dafe50` lab-sweep integrated (the shell walked and fixed; its manifest deleted at the merge;
  design.css generation 4); `52241e4f` the dev indicator bottom-right; `ce21ac31` the lab functions'
  file trace cut to 718 files (docs.ts's dynamic root marked turbopackIgnore); `d4ec4cff` docs-adr-fold
  integrated (the 25 ADRs folded, `docs/adr/` gone with the decisions tombstones, the reel spec and the
  perf baseline); `aea90fd3` the citation sweep (247 code comments name the system docs); `57b93286`
  lab-catalog integrated (the item scope, the catalog kit, the toolbox, the reading budget, the palette as
  the proof; the review grammar's item and library lines landed in docs/reviews/README.md); the Library's
  record pages and docs/decisions/design-record.md deleted (`kind: "record"` is gone from links.ts; a
  ruling's home is docs/design/rulings.md and the board's answer block; /design/record 307s to the rulings).
- `0a48db70` docs-systems-strip integrated (the four heavy docs stripped, 118 dated passages to 25, the ★
  audit; the arrival heading renamed with its `lives` anchor; the rulings' two dangling anchors fixed).
- `5868325e` brand-voice integrated (Round 4's first catalog: six voices, twenty-four spots, 2,642 words
  against a declared 2,700; two questions for Will).
- `257df8fe` type-scale integrated (five ladders as type specimens; 1,155 words under the budget; the
  dashboard as a lab screen route).
- `767e6182` floating-surfaces integrated (seven directions as cards; 2,317 words against a declared 2,400;
  asset row 14; the dropdown-menu submenu bug named for the wiring round).
- `2326a924` light integrated (twelve treatments as cards on the real surfaces; 2,889 words against a
  declared 2,950; asset rows 15 and 16; the template's meta panel named for a fold).
- `128aca34` rounding integrated (six families as cards; 2,564 words against a declared 2,800; the
  proposal doc written); the kit takes its three findings (the dock wraps four options, the clip
  comment, the post-hydration trap).
- `8587d3ed` media-kit integrated (thirteen sources as cards; 2,686 words against a declared 2,750).
  Round 4 is closed on the tree: every standing paper board is a catalog under its declared budget.
- `5a538c0a` palette round seven integrated during the sitting (nine cool palettes, three controls, the
  accent as a config; 2,924 words against a declared 2,950).
- `02c409b4` the stepped review's spec fields; `551ecab5` the round's three lanes cut (lab-flow, light,
  palette); `56ea9185` home-hero integrated (round six: four compositions of the stream, mirror, phrase,
  settle and ribbon, on one engine; 1,189 words under the budget with no declaration; the board
  recommends the settle; its pick-one switch is three spec lines once the flow lands).
- `c18570c4` lab-flow integrated (the review as a stepped onboarding form: `step.tsx` with tiles on one
  specimen, show versus choose, the winner ask with none as the third exit, one card at a time with
  `BeforeAfter`, staging through `Ask.after`, the desk's rows as steps with held badges, Copy so far
  omitting what the ledger holds; the ask pills, the index, the "Rule on:" rows and the review panel
  deleted, which halved the catalog boards' reading); `6907ce68` the three live manifests stop reading
  the merged one.
- `c334de13` the hero's catalog asked as pick-one (the winner ask on the four cards); `ec7367e7` type-scale
  integrated (round seven: a three-step walk, the winner from five or none, one real page under the pressed
  card with a second copy on a fade; 486 words; a kit finding: tiles draw inside a zoomed FitStage, so a
  1:1 tile is owed by the kit and `true-scale.tsx` retires into it).
- `7ed0d2a2` light integrated (round seven: the twelve walked one at a time in Will's order on three
  specimens, each drawn as today and with it, with what it lands as and its usages; the four calls as
  tile steps; the aurora's landing staged behind keeping the aurora; 920 words, the declaration deleted;
  the order ask renamed `second` so round five's `infusion=phase-1` stands). The agent force-pushed its
  own branch once after amending a pushed manifest commit: no damage, a rule broken, noted.
- `49ed0fbf` palette integrated (round eight: one pick over the twelve with "None of these", the real
  product as the stage on one Screen control, the accent, card, faint and reach questions as tile steps,
  the reach staged behind accent=own; 1,191 words, no declaration; the guest masonry and its portrait-pair
  ask withdrawn; two kit findings: `Candidate.lands` never draws on a pick-one gallery, and the spine
  miscounts a blocked step opened by URL).
- `ef5e737d` the kit draws Lands as on the picked card of any grid; `514aee2d` floating-surfaces integrated
  (round seven: one pick over the seven with "None of these", the real product as the stage, the four
  calls as tile steps each on one menu, the submenu bug named in its step's context; 922 words, no
  declaration); the meta panel's Ideas rows made visible again (a native details folds by itself).
- `7d90465c` rounding integrated (round seven: one pick over the six families with "None of these", one
  real page re-skinned in place as the stage, the button, ladder, dead-rung and gap questions as tiles at
  true pixels; 684 words, no declaration; `TrueScale` copied into the board pending its move into the kit).
- `0c1cfa60` brand-voice integrated (round seven: one pick over the six voices with "None of these", the
  tiles three lines in each voice at phone size, the real home page as the stage, the noun, unfurl and
  counts questions as tiles and the scope question means-only behind the pick; the spot list stays as
  the whole board's own section off the walk; its true-size box is the one of three copies whose reads
  settle).

Older windows are in the CHANGELOG (two rounds deep) and in git.
