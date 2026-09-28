---
track: hero-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: hero-card
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/hero-card/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/hero-card.json
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/hero-r2

**Goal.** Draw `hero-card` round 2: a few more ideas branching from Will's `link` pick for the home hero's object, each drawn at 1440, 900 and 375, with the hero's tablet geometry (loose-ends' `hero-tablet`) folded in here as its one home.

## The brief

**His round 1 answer** (`docs/reviews/hero-card.json`): `card=link`, "the link, the album rising out of it" (the code beside the custom address on a white card, four prints standing up out of its top edge, the guests' faces at its end: `cards.tsx`'s `LinkObject`). His note: everything else felt too tall to be a visually scannable item and took too much of the centre stage; this one works much better with everything around it, while carrying lots of the product inside it (the QR, the custom link, guests, photos). "Would love to see a few more ideas branching from this."

**The question:** which version of the link card stands at the centre of the hero. `link` as round 1 drew it is the reference every option is graded against (production still ships the framed photograph, `DemoFrame` in `src/components/marketing/system/demo-ticket.tsx`, mounted by `DemoQr` in `sections/home/cinema-hero.tsx`; the wiring after this pick replaces it). Draw a few genuinely different branches, each keeping what he liked (compact and low, scannable at a glance, the one-link idea with the QR as one face of it, guests and photos inside it) and each pushing one idea further. Candidates to weigh, not a list to copy: how the prints rise (a fan, a stack, a strip, one of them a video); what the link reads as (a link as it lands in a group chat or an email, a custom address being typed, a live count of who is in); how the guests show; whether a photograph leaves the card into the band (round 1's carried `still`); whether it stands in a light of its own (round 1's carried `light`). The best ideas win; two options that land on one answer are a finding.

**The tablet width is asked here now.** `loose-ends`' `hero-tablet` asked the hero's geometry at 900px, sized around an object that is changing, so it leaves that board (`marketing-refresh` removes it; its drawing and question are at `git show e199f43f:"src/app/(dev)/design/sandbox/loose-ends/hero-tablet.tsx"` and that board's `spec.ts`). Draw every option at 1440, 900 and 375 (the Screen knob), and if the 900 geometry is a decision of its own once the card is chosen, it is a second question here, staged behind the first with `after`.

**The ground** is the real first screen as production has it: the header, demo-doors' "Try our demo event" eyebrow over the H1, the headline and CTAs, and the band streaming out of the object on `hero-stream.ts`'s own tables. Round 1's carried calls (`place`, `address`, `still`, `light`, `eyebrow`) carry unless an option explores one.

The board moves to `round.n: 2` with round 1 in `history` and his note as the direction (`registry.test.ts` checks that a board past round 1 carries it). Its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` are yours for this round (named exceptions; nothing else in those files). Media from the registry's stand-ins; name any asset a pick would need (`docs/ASSETS.md` rows 33 and 34 are parked on this board).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
