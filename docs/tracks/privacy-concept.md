---
track: privacy-concept
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "666ee8bc"            # the launch-prep SHA the branch was cut from
board: privacy-hero     # round three: a NEW concept; round two's trail-on-spirals is deleted here
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/privacy-hero/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/reviews/privacy-hero.json
  - src/app/(marketing)/(cinema)/features/privacy/page.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/sections/home/hero-stream.ts
---

# lp/privacy-concept

**Goal.** Round three of `privacy-hero`, a NEW concept. Round two (the image trail fed by two spirals) came back
with a `?` on its pace: "Question is clear, but I don't really like this arrival animation as part of the
spiral/orbit." Asked what next, Will: "Let's go with a totally different concept... I think we can say the image
trail was a takeaway win from this. The actual privacy hero can take a different path, maybe more fitting for
its theme." So: two or three visuals for the privacy page's hero that FIT ITS THEME (what privacy means to a
host and a guest: who can open the album, what stays private, what a host controls), none of them the trail
(it lives on the 404 now, `src/components/shared/trail/`) and none of them the spirals, drawn on the real
`PageHero` at 1440 and 375, question-first, a recommendation each, every number measured. The page today ships
`PageHero` with no backdrop on purpose ("deliberately no stage and no lamp"): a concept must earn its place
against that quiet.

**What to do with round two.** Delete it: `paths.ts`, `paths.test.ts`, `field.ts`, `field-layer.tsx`,
`field.css` and whatever else only the trail-on-a-path needed (the album lane promoted what the album's stream
needed into `src/components/shared/album-stream/`; check nothing else imports what you delete). The spec's round
goes to 3 with his sentences quoted as `changed`; decision ids are new (the questions are new), so no ledger
join is expected. Mobbin (the MCP) is encouraged, never required: privacy and trust pages of real products.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
  `pnpm lab:demo --board privacy-hero` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 1440 and 375 on the real lockup, reduced motion, scripting off, the frame cost, nothing
  focusable; a capture of every option beside its words, the picture checked against the words.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- One ask, not several: round three ships a single "which concept" decision (three options) rather than a
  staged follow-up (a phone question, a presence/loudness dial). Recommended: ship the one ask now, his bar
  is a minute and there is nothing else to decide until a concept is picked; the natural round four is
  refining whichever one wins, the way `image-trail` and `river-card` each got their own dedicated round
  once a direction existed. Carried on with this.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- None. This round is self-contained (a concept pick, no page, no production byte); whichever option wins
  becomes the wiring round's brief the way `album-page`/`river-card` did, and nothing here needs a
  standing ROADMAP line in the meantime.

## Handoff (replaces the chat report)

- Head `7c1fce996dba7a2415da5c4a25495d53017da8e0`, pushed; synced with `origin/launch-prep` at
  `89548cbb` (the trail-wiring and app-vocabulary merge): two content conflicts (`board.tsx`, `hero.tsx`,
  both-modified: kept round three's `concepts-layer` imports, dropped the incoming one-line repoint of the
  now-deleted `../image-trail/trail-layer` import) and one modify/delete (`paths.ts`: kept the deletion).
  `registry.ts` and `boards.ts` auto-merged clean; the privacy-hero lines in both were untouched by either
  side. Full detail in the merge commit's own message.
- Gates on the synced tree: typecheck ok · lint ok (8 known warnings, 0 errors) · test ok (2,492 passed, 0
  failed) · build ok (0 errors) · `pnpm design:rules` and the specimen collector both ran clean with no
  diff (trail-wiring's own regeneration already covered the shared artifacts; my `touchpoints.ts` prose
  edit doesn't feed either generator) · `pnpm lab:smoke --base http://localhost:3133` ok (261 checks, 0
  failing; `privacy-hero` reads at 216 of the 1,200-word budget) · `pnpm lab:demo --base
  http://localhost:3133 --board privacy-hero` ok (1 step, 0 failing: `privacy-hero.concept` draws 2.6
  screens at 182 words, 3 options, the stage moves by up to 28.31 percent between them; no CLIPPED,
  UNLABELLED or NO DOCK). `pnpm format`'s changed-file detection saw nothing (it diffs against
  uncommitted work, and everything was already committed by the time it ran); `prettier --check` on the
  same file set caught real drift on five files and `--write` fixed it directly, gate re-verified after.
- Lane check (`git diff --name-only origin/launch-prep...HEAD`): every line is under `owns` except
  `touchpoints.ts` (the one permitted registration file, `ruled`/`why` only, exactly as scoped) —
  `sandbox/privacy-hero/{board.tsx, concepts-layer.tsx, concepts.css, concepts.test.ts, concepts.ts,
  hero.tsx, spec.ts}` changed or added, `{paths.ts, paths.test.ts}` deleted, `touchpoints.ts` changed.
  `registry.ts` and `boards.ts` carry no diff against the synced tip (my board's lines there were already
  correct and untouched).
- The items, one line each: `concept: three new options drawn (aperture, access, seal), recommended
  access, open — his pick becomes the wiring round's brief, no Library entry yet.`
- Cross-lane note (resolved before this handoff, not a question): `docs/tracks/trail-wiring.md` briefly
  listed `sandbox/privacy-hero/paths.ts` under its own `reads` while both lanes were open; its manifest's
  own Goal text already said "this lane touches nothing under sandbox/privacy-hero/", and the line went
  with its manifest at the trail-wiring merge, so nothing needed edits on either side. Flagged to the
  Orchestrator mid-round for visibility; no action item remains.
- Assets requested from Will: none (every photograph is the existing stand-in pool via `marketingImage`;
  the Higgsfield month replaces it later, unrelated to this round).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/privacy-hero` (`key` from `.env.local`'s `DESIGN_PREVIEW_KEY`), the one
  `concept` step; the three options in order are the aperture (calmest, one breathing photograph), the
  access grid (recommended: eight tiles, one clearing at a time), the sealed cards (fewest moving parts,
  a physical reveal). Each option's Frame carries both 1440 and 375 already, so nothing else to flip.
  Mobbin was not consulted this round: the three mechanisms followed directly from the theme itself
  (who can see a thing right now, not how fast it travels) rather than from a reference screen.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>`. Round three of `privacy-hero` replaced round two's spiral field
(deleted `paths.ts`/`paths.test.ts`) with three new still-or-nearly-still concepts built on the page's own
theme rather than on flying media: a breathing aperture, a grid where tiles take turns clearing (the
recommendation), and sealed photo cards that lift one at a time. `field.ts`/`field-layer.tsx`/`field.css`
were kept, unchanged, because `album-page` still reads them. One decision, three options, every number in
the copy checked against the constants driving the picture (`concepts.test.ts`); every static element's
position checked clear of the real lockup's measured ink at both breakpoints. Synced past the trail-wiring
and app-vocabulary merge with two import conflicts and one modify/delete, all resolved in round three's
favour.
