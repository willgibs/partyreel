---
track: light
status: open
cut: "02c409b4"        # the stepped review round (2026-09-16): the light board reshaped for it
board: light
owns:
  - src/app/(dev)/design/sandbox/light/
  - docs/specs/light.md
reads:
  - src/components/lab/
  - src/app/(dev)/design/sandbox/palette/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - scripts/lab-smoke.mjs
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/light.json
  - docs/reviews/_window.json
  - docs/design/README.md
  - docs/design/rulings.md
  - docs/tracks/lab-flow.md
---

# lp/light

**Goal.** Reshape the light catalog (round six, twelve treatments as cards) into a stepped review Will can
walk in minutes, in half a day, with NO new exploration and no new treatment: round seven. He stopped his
sitting on this board. His words, verbatim: "in the light/shadows/lamp track 12 selections: are each of
these individually proposed treatments? How will each be applied platform wide? Some I can't even tell
what the 'treatment' is from the comparison." And on the shape he wants: "12 light/spill placements under
review could be gallery cards as radio buttons to select to pass, or handled 1 at a time for more details
(where it'll be used, a couple demo usages, etc). 1 at a time may be more helpful here"; "Once those 12
light placements are handled, move that context out and bring in new context to frame the shadow specific
questions. Then new context again for the lamp breathe speed question." So: `catalog.mode: "keep-any"`,
`walk: "one-at-a-time"`, and every card carries what a stranger needs to rule on it alone: `before`
(the same specimen as today | with it, so the treatment is the ONLY variable), `lands` (what keeping it
lands as platform-wide, from `kit.ts`'s own `where` and `ships`: the token, the selector, the component,
in words), and up to two demo usages (real surfaces wearing it, small). Three specimens for three jobs,
your grouping from `kit.ts` (the depth cues on one pair of overlapping event cards on app-dark; the lamps
on one real chapter; the marks on one reel frame): across the cards of one job the same object, crop,
ground and canvas; a hairline that cannot be read at card size gets a `Loupe` or a larger delta on the
same specimen, never a different specimen. Order the cards in the order he named: the light placements,
then the shadow-specific ones, then the marks. Then the asks become tile steps: every option carries a
`state` drawn on the step's ONE specimen (cadence: one chapter at 8s and at 11s, side by side; paper: one
paper chapter three times; publish: three tiles with a Replay; infusion stays means-only, it is an order,
not a picture), each ask carries `lands`, and a dock control that serves one decision only becomes that
decision's option states and leaves the dock (`strip` names the one or two controls a step still wants
beside its stage, such as Canvas). The aurora's landing becomes a staged question (`after: { item:
"aurora", verdict: "keep" }`, mirroring the `landing` control), so it is asked only once the aurora is
kept. The answers Will already gave stand (`docs/reviews/light.json` round 5: the kit lands, phase 1
first, Accent as the register; his two "not clear" asks are the lift and float cards and the landing
question now); do not re-ask them. Delete context that only restates what the tiles show, gloss or drop
every nickname, fold or delete the argument, and re-measure the reading budget (the board declares 2,950
today; a stepped board should need far less, and the walk shows one step at a time anyway).

**The kit you build against.** `src/components/lab/board-spec.ts` at the `cut` above carries the fields
(`Ask.lands / after / strip`, `AskOption.state`, `Candidate.lands`, `CatalogSpec.mode / walk / stage`)
and `registry.test.ts` their rules; the step surface that renders them is being built beside you on
`lp/lab-flow` (read `docs/tracks/lab-flow.md` for exactly what each field draws). Until it merges, your
board page still renders on the old card: write the spec and the specimens against the fields, keep
`pnpm test` green, and when the Orchestrator tells you the flow has landed, merge `origin/launch-prep`
and verify the walk on it before handing off. `Catalog` will take `before` and `usages` render props;
until then render them through your own `board.tsx` in the catalog section (a `BeforeAfter` pair per
card), so the pictures exist either way. ★ `shared.tsx` exports may be read across lanes: keep them.

**Binds.** The bible, the contracts of every component under a path you own, and the policies
(`docs/design/README.md#what-binds-you`); Will's rulings in `docs/design/rulings.md` (2026-09-15 and
2026-09-16: a question carries its context; an exploration is a catalog; the wind-down: a kept idea lands
in the Library as a working version and the board retires); no em-dashes in any copy; no mono face; the
lab ships no production byte this round.

**Verify on.** A local `pnpm dev -p 3122` (`rm -rf .next/dev` first) at 1440 and 375 with reduced motion
honoured; once the flow is in: the walk from the desk end to end, every step's context alone on the
screen, every option visible at once on one specimen, every card with its before/after and its `lands`, a
composed line accepted by `pnpm lab:review --dry`; `pnpm lab:smoke --base http://localhost:3122` green
for this board with its reading words; `registry.test.ts` green; the four gates.

**Discipline on this machine.** The dev server on :3000 is not yours: never touch it. Your server on
:3122 only, killed by port; one process at a time, stopped before a build, a test run and the handoff;
never `[preview]` or `[ci]`; stage files explicitly; the `Co-Authored-By: Claude Opus 5
<noreply@anthropic.com>` trailer on every commit. Three other agents run beside you (`lab-flow`,
`palette`, `home-hero`); merge `origin/launch-prep` before your handoff if it moved, never rebase.

**Questions.** Answered with the recommendation and carried on with; each is one line of what changed
and why, for Will or the Orchestrator to overrule.

1. **The order ask was renamed `infusion` to `second`.** The ledger holds `infusion=phase-1` from round
   five, which answered "which phase first"; round six reused the id for a different question ("what
   lands second") and round seven would have been the third meaning of one key. Recommended and done:
   a new id, so Will's answer stands untouched and this is a new line in the ledger. The round guard in
   `queue.ts` already re-opens every ask on a new round, so nothing depended on the collision.
2. **`Ground` and `Register` left the dock entirely** (unlike Landing, Cadence, Hues and Beat, which
   stay declared as their step's option states). Each job's specimen now fixes its own ground, so a
   Ground switch could only break the "same object, crop, ground and canvas" rule the round is for; and
   Accent is ruled, so Register is not a question. Recommended: leave them out. The one thing lost is
   the round-five note that Identity stays reachable, which is in the rulings and in `composer.tsx`.
3. **`Catalog` does not print `candidate.lands`, so the browse-mode card does not show it.** The field
   is declared and the walk's card step prints it. The alternative was a duplicate of the sentence in
   `facts`, which would drift, or rendering it inside the card's preview, where it would be prose hidden
   from the reading budget. Recommended: leave browse mode without it; if `Catalog`'s tiles mode grows a
   `lands` row, this board gets it for free.
4. **The throw is judged at chapter scale although it lands on a plate.** The fill job's specimen is one
   chapter, so the card shows the SHAPE of the light (anchored low, cast upward, no band) and its usage
   shows the real call site, the QR plate. Recommended: keep. The same split carries the halo's own
   argument, which is now a usage ("a white primary: no headroom for it") rather than the specimen.
5. **The reading declaration is the OLD template's number and is meant to be replaced.** Measured 2,439
   against round six's 2,889 with the same template; about 1,070 of what is left is the review panel,
   the index, the "Rule on" rows and the unfolded meta panel, all of which the stepped review removes or
   folds. Recommended: declare the measured number now, re-measure at the merge, and drop the
   declaration entirely if the page lands under 1,200.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/specs/light.md`, three paragraphs under "What is open", refined in place: the twelve are ruled
  ONE AT A TIME in Will's order and each card is one specimen drawn twice with its `lands` and its
  usages; the four calls are four steps with their own context and specimen; where the aurora lands is
  no longer "a switch rather than a question" but a fifth question staged behind keeping the aurora.

## Deferred (ROADMAP one-liners, bucket named)

- Design system: the lab's meta panel prints all twelve card summaries and every departure unfolded,
  which is about 490 of this board's 2,439 measured words and is the template's voice, not the board's.
- Design system: `sandbox/media-kit/shoot.ts` (about line 582) names `sandbox/light/depth.tsx` as what
  its overlap pair replaces; that file went at round six and the asset row now names the board's cards.

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha>
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` green for this board, its reading words
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file
- The steps, in walk order after the cards:
  - `landing`: decides the placement grammar SectionLight ships with; four tiles on one real chapter; after `item:aurora=keep`
  - `cadence`: decides the one token every lamp and the field's clock multiply from; two tiles on one real chapter, plus the knob that writes the clock on the site
  - `paper`: decides the five hues re-declared on the paper surface; three tiles on one real paper chapter, swatches under each
  - `publish`: decides the publish beat's keyframe and a ratified violet moved five degrees; three tiles on one reel frame, each with a Replay
  - `second`: decides which surfaces the wiring round touches after the shadows; means-only, three rows (an order, not a picture)
- The cards, in Will's order (the light placements, the shadow-specific ones, the marks). Every one has
  before/after on its job's one specimen: the lamps on the closer chapter (cinema), the depth cues on one
  pair of overlapping event tiles in a panel (app dark), the marks on one reel frame (app dark).
  - `seam`: lands as a band at any boundary, already on the footer, the strip and the feature screens; usages 1
  - `throw`: lands as a wrapper at the call site, the QR plate and a card over open dark; usages 1
  - `aurora`: lands as a new SectionLight, one chapter a page; usages 2 (a cinema chapter, a paper chapter)
  - `step`: lands as nothing moving, every card, panel and well today; usages 1; lens
  - `ring`: lands as nothing moving, 77 hairlines named as the fourth technique; usages 1; lens
  - `lift`: lands as a shadow token, dark gaining the alpha it never had; usages 1
  - `float`: lands as a second token, every floating primitive in both modes; usages 1
  - `face`: lands as an attribute on three named surfaces and nowhere else; usages 2; lens
  - `sweep`: lands as the engine's edge ring turned on beside the comet; usages 1; Replay
  - `bloom`: lands as a resting base under the one-shot; usages 1; Replay
  - `halo`: lands as a wrapper on one secondary action a page, argued each time; usages 2 (the white primary is one)
  - `beam`: lands as nothing moving, one wrapper, one subject per view; usages 1
- Assets requested from Will: none new. The two standing ones are unchanged and already logged: the grain
  tile (ASSETS row 15) and the worst-case overlap pair (row 16).
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
