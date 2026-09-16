---
track: docs-systems-strip
status: handed-off
cut: "aea90fd3"          # Round 2 of the revamp, after the ADR fold merged (2026-09-16)
board: none
owns:
  - docs/systems/
  - docs/design/guidance.md
reads:
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - docs/design/README.md
  - docs/PROGRAM.md
---

# lp/docs-systems-strip

**Goal.** Strip the narrative out of the four heavy system docs so each is the system and its
invariants and nothing else (Will, 2026-09-16: docs handle "anything active"; history is "highly
limited to very recent work"; "if we design something weird badly in the same form we've done before,
we can address and refine in track"). The four: `design-system.md` (about 990 lines, 45 dated
passages, 28 ★), `marketing-content.md` (about 640 lines, 31 dated), `testing-verification.md` (about
350 lines, 23 dated), `host-app.md` (about 445 lines, 14 dated). A date survives only as the
attribution of a ruling that is still the rule; provenance clauses, milestone and round names, and
every sentence narrating how a fact arrived go; a fact stays as one dateless line in the doc's voice.
**Every ★ is audited against Will's rule**: a ★ marks a silent breakage if reverted, never a design
decision. A true landmine stays byte-identical but for its provenance clause; a design preference
wearing a ★ is demoted to a plain line or deleted (design-system.md is the likeliest place for lore).
The craft-guidance section leaves `design-system.md` for `docs/design/guidance.md` (the Library
renders both; guidance is not a rule). Add one landmine the `lab-sweep` track found, under
`testing-verification.md`'s CSS section: ★ a bare `overflow-x: clip` is dropped by Lightning CSS for
the configured targets and survives only inside `@supports (overflow: clip)`; the `@supports` in
`design.css` is load-bearing; read the compiled chunk, not the source, before believing a lone modern
value. The other system docs get the same treatment only where a sentence is pure narrative; do not
rewrite them.

**Binds.** CLAUDE.md "Keeping the docs healthy". ★ The headings `touchpoints.ts` anchors and
`docs.test.ts` checks are FROZEN: `#the-identity-achromatic-media-is-the-color`, `#the-shipped-light`,
`#light-spill-beam-and-the-lamp-set`, `#type-the-heading-face-the-tiered-scale`,
`#rounding-sharp-surfaces-round-actions`, `#the-floating-layer-contract`,
`#elevation-contract-one-depth-technique-per-mode`,
`#the-arrival-choreography-phase-45-ratified-calm-700ms` (this one may be renamed only together with
its `lives` line in `touchpoints.ts`, which is the Orchestrator's: ask in Handoff). `docs.test.ts`
pins three landmine fixtures by text (run it after every ★ edit; it names the one it lost). A ★ opens
a bullet; a ★ mid-sentence is prose. No em-dashes in any line you write.

**Verify on.** `pnpm test` green; the Handoff's before-and-after counts per doc (lines, dated
passages, ★) with every demotion listed as "was: <line> / now: <line or deleted> / why"; the two
doctrine pages rendered on a dev server with their anchors intact.

**Discipline on this machine.** Four agents at once is the ceiling: one process at a time; a dev
server only for the render check, on a port of your own, killed by PORT; never `[preview]` or `[ci]`;
stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.

**Questions.**

1. **`## The arrival choreography (Phase 4.5, ratified "Calm + 700ms")` is the one frozen heading
   that is itself narrative,** and renaming it means moving its `lives` line in `touchpoints.ts`
   (touchpoint 11, line 208), which is the Orchestrator's file. I left it byte-identical.
   **Recommended:** rename to `## The arrival choreography ("Calm + 700ms")` and update the anchor to
   `#the-arrival-choreography-calm-700ms` in the same commit; the ruling's NAME is the fact and
   "Phase 4.5" is when it arrived. `guest-flow.md` already points at the section by doc, not anchor,
   so the only other edit is the one `lives` string.
2. **`docs/design/rulings.md` carries two anchors into `design-system.md` that were already broken
   before this lane** (`#chapters` and `#the-identity`, lines 237 and 262; the real ids are
   `#chapters-the-attention-arc` and `#the-identity-achromatic-media-is-the-color`). Agents never
   edit `rulings.md`. **Recommended:** fix both strings at the merge; they are one-word edits and the
   headings they want are frozen, so they cannot rot again.
3. **Seven landmines in `marketing-content.md` were mid-sentence,** which `landminesOf` reads as
   prose, so `/design/library/policies` listed 31 of the repo's landmines and never showed those
   seven. I lifted each to the start of its line (the rendered prose is unchanged, markdown joins the
   soft break) and the page now lists 38. **Recommended:** keep; if the Orchestrator would rather the
   inventory stayed as it was, reverting is seven newlines.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `design-system.md` — the whole doc, stripped and ★-audited (counts + demotions in Handoff).
- `marketing-content.md` — the whole doc, stripped and ★-audited.
- `testing-verification.md` — the whole doc, stripped and ★-audited, plus the new
  `overflow-x: clip` / Lightning-CSS landmine under "Dev-server CSS".
- `host-app.md` — the whole doc, stripped and ★-audited.
- `guest-flow.md`, `uploads-and-r2.md`, `architecture.md`, `auth-accounts.md`,
  `admin-observability.md`, `lifecycle-recovery.md`, `notifications-analytics-growth.md` — the light
  pass only: phase and round LABELS (Phase 1-5, P1, P3, P8, R3, "the exec round") and the dates on
  facts that are not rulings. No invariant moved; no doc rewritten.
- `guest-flow.md` + `design-system.md` + `host-app.md` — the six `docs/decisions/design-record.md`
  links removed per the Orchestrator's mid-round note; three now point at `docs/design/rulings.md`,
  three dropped the link and kept the fact.
- `docs/design/guidance.md` (owned) — its own craft-stack section lost the Phase-2/4/6 narrative, and
  `## Skills` got the blank line it was missing above it.

## Deferred (ROADMAP one-liners, bucket named)

- Docs bucket: the landmine inventory at `/design/library/policies` reads only `design-system.md` and
  `marketing-content.md`; `testing-verification.md` (11) and `host-app.md` (8) carry landmines nobody
  can browse.

## Handoff (replaces the chat report)

- Head `53e94ac0` (+ this manifest), pushed; synced with `origin/launch-prep` at `b886d223` (it had
  moved 14 commits, including the `design-record.md` deletion; the merge was clean and no landed file
  touched `docs/systems/` or `docs/design/guidance.md`).
- Gates on the synced tree: typecheck ok, lint ok, test ok (225 files / 2215 tests), build ok
  (256 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/guidance.md` +
  eleven files under `docs/systems/`. Every line is inside `owns`; no exceptions.
- Render check: `pnpm dev -p 3104` (after `rm -rf .next/dev`), killed by port. All four library pages
  200: `doctrine/design-system`, `doctrine/marketing-content`, `guidance`, `policies`. All eight
  frozen anchors present in the rendered ids, `#the-floating-layer-contract` still absent (its
  `PENDING_ANCHORS` assertion holds), and `#the-craft-guidance-stack` + `#gotchas-dont-revert` intact.
  Heading counts match source (design-system 1/17/3, marketing-content 1/6/0), tables and lists render.

**Per doc** (lines · dated passages · landmine blocks, before → after):

| doc | lines | dated | landmines |
| --- | --- | --- | --- |
| `design-system.md` | 987 → 948 | 47 → 11 | 24 → 25 |
| `marketing-content.md` | 657 → 657 | 31 → 11 | 7 → 13 |
| `testing-verification.md` | 354 → 362 | 24 → 0 | 8 → 11 |
| `host-app.md` | 483 → 486 | 16 → 3 | 3 → 8 |

Every surviving date is `(Will, <date>)` on a ruling that is still the rule. `marketing-content.md`
holds its line count because seven landmines gained a line break and the craft prose it lost was
dense; `testing-verification.md` and `host-app.md` grew slightly for the same reason (a lifted ★ and,
in testing, the new landmine). Landmine BLOCKS rose where mid-sentence ★ were lifted; the total ★
glyph count fell (design-system 27 → 27, marketing 15 → 13, host-app 15 → 8).

**The demotions** (was / now / why):

- was: `★ **Do NOT build it from the paper side.** The /about round first shipped it as a (spotlight)
  group …` (`marketing-content.md`) / now: the same rule as a plain bold line with the pointer /
  why: a second copy of `design-system.md`'s "A hand-assembled dark set is for a LEAF" landmine,
  measurement and all. One fact, one home; the landmine keeps its home.
- was: `★ NOT React's <ViewTransition> - that flag swaps the whole app's React runtime to a canary`
  (`marketing-content.md`, careers) / now: a plain sentence pointing at the blog's full statement /
  why: a dependency decision whose failure mode is loud (it needs `experimental.viewTransition`), and
  the same fact was already written out twice.
- was: `★ Plate by LEGIBILITY, not variety: white behind ink-drawn artwork … and the two grounds are
  LITERAL colours` (`marketing-content.md`, /press) / now: split, "plate by legibility" is a plain
  line and `★ The two plate grounds are LITERAL colours …` keeps the glyph / why: the first half is a
  design preference, the second is the silent one (a theme flip hides the artwork on its own plate).
- was: `★ **Add-to-reel and DELETE are deliberately NOT tile chips** (they were, until R3.1)`
  (`host-app.md`) / now: the same rule, no glyph, "do not re-add either without re-opening the
  ruling" kept / why: a product ruling about the action row, not a breakage.
- was: `★ **The three curation doors** (R3.1)` (`host-app.md`) / now: a plain bold line / why: an
  inventory of doors, a design decision.
- was: `★ **Reorder is STUDIO-ONLY**` (`host-app.md`) / now: a plain bold line / why: a composition
  ruling; the retired components are simply gone, nothing breaks silently.
- was: `**★ THE FEED / STUDIO SPLIT (R3.1, the composition rule).**` (`host-app.md`) / now:
  `**THE FEED / STUDIO SPLIT (the composition rule, Will).**` / why: Will's composition ruling.
- was: `★ **Add routes through the SILENT addMany([id]), never toggle**` (`host-app.md`) / now: plain
  bold / why: reverting it toasts on every add, which is loud and obvious on sight.
- was: `★ **Offered at ONE approved item** (6bc779d)` (`host-app.md`) / now: plain bold, SHA dropped /
  why: a product decision about `QUICK_ADD_MIN`, not a trap.
- was: `★ **ACCEPTED pre-launch caveat (do NOT build detection)**` (`host-app.md`) / now: plain bold /
  why: an accepted risk Will ruled on, and the ★ made it read as a thing that breaks.
- was: two ★ blocks for one fact, `★ **Base and band always ship together**` (Light) and `★ **A
  swept-mask layer needs a STATIC base**` (Motion) in `design-system.md` / now: one enriched landmine
  under Light with the mechanism and the worked example, and Motion's arrival-default contract points
  at it / why: the same invariant written twice, so two places to keep in sync.

**The promotions** (three, all ★ that were mid-sentence prose and are real traps):

- `★ A DERIVED radius token is not a runtime variable` (`design-system.md`, Rounding) now opens its
  own block; an empty `var()` inside a `calc()` invalidates the declaration silently.
- `★ A Tailwind breakpoint prefix inside a board's Stage reads the REAL browser viewport`
  (`design-system.md`, Gotchas) gained its glyph. The bullet below it already said "the ★ above on
  breakpoints" and there was no ★ above; the reference works now.
- `★ sweepExpiredEvents must also delete reelOutputKey per purged event` (`host-app.md`) was written
  as "Cleanup landmine fixed:", which reads as history; it is the invariant that keeps the reel mp4
  from leaking forever on deletion.

**Added, from `lab-sweep`:** ★ a bare `overflow-x: clip` is dropped by Lightning CSS for the
configured targets and survives only inside `@supports (overflow: clip)`, so `design.css`'s
`@supports` is load-bearing; grep the compiled chunk, never the source, before believing a lone
modern value shipped. It sits under `testing-verification.md` "Dev-server CSS", beside the other
read-the-chunk traps.

- Look at first: the three Questions above (the one frozen narrative heading, the two already-broken
  `rulings.md` anchors, and whether the lifted marketing landmines should stay lifted). Then the
  `design-record.md` link removals, since three sentences were rewritten around the missing pointer.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-16). The four heavy system docs were stripped to the
system and its invariants: 118 dated passages fell to 25, and every survivor is `(Will, <date>)` on a
ruling that is still the rule. The phase names, round names, commit SHAs quoted as provenance, "found
building X", "an earlier version of this doc" and the shipped-then-changed bookkeeping all left; what
shipped now simply reads as what the surface is. Every ★ was audited against Will's rule: forty-two
landmines stayed byte-identical but for their provenance, eleven were demoted to plain lines (product
and composition rulings, a duplicate, and one design preference), three mid-sentence traps were
promoted, and one duplicate pair folded into a single enriched landmine. Seven landmines in
`marketing-content.md` had been invisible to `/design/library/policies` because they sat
mid-sentence; the inventory went from 31 to 38. The craft stack's home is `docs/design/guidance.md`,
`testing-verification.md` gained the `overflow-x: clip` landmine from `lab-sweep`, and the six
`docs/decisions/design-record.md` links left with that file.
