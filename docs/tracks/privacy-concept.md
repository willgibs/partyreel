---
track: privacy-concept
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
