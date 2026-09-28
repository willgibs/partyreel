---
track: storage-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: host-storage
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-storage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-storage.json
  - docs/systems/billing-caps.md
  - docs/systems/design-system.md
---

# lp/storage-r2

**Goal.** Draw `host-storage` round 2: `prices` alone, a wider and better set of options, each drawn on the plan sheet as it ships today with Will's three round-1 picks built into the ground, so he sees how a host arrives at the prices now.

## The brief

**His round 1 answers** (`docs/reviews/host-storage.json`):
- `order=flat`: one ranked list, largest first across every event. His note: a filter to show All or one event, rather than choosing between every event mixed and grouped by event; hosts will differ, so offering both is "a great mini feature".
- `goal=live`: a sticky strip counts down as items are selected for Remove, and at zero its own button finishes the switch.
- `refusal=inline`: the tapped size flips to the refusal in place. His note: stacked vertically, so each card's lines don't break as they do in the tight three-column layout.
- `prices=?`: "I don't believe these are the best ideas we can come up with here. Would also like to bake in previous selection so I have a more current idea how this gets entered at this point."

**The question:** how a Pro host's six prices (three sizes, monthly or yearly: `src/lib/constants/tiers.ts`) sit in the plan sheet, including a size that would not fit. Round 1 drew rows, cards and a matrix; he wants better. Draw the widest good set, each on the plan sheet as it ships: popups' `plans=wide` (a wide dialog with the plans stacked, never a two-column row; its own screen on a phone: `PopupContent kind`, `src/components/ui/popup-kinds.ts`; the sheet is `src/components/app/pricing/pricing-sheet.tsx`). Production's six prices are the honest plain rows in `pro-price-list.tsx`, behind the storage guard (`src/lib/billing/storage-guard.ts`).

**Build his round 1 into every frame**, since "how this gets entered" is part of what he is judging: the host arrives where they really would (the storage meter and plan card; or the flat size list with its All / per-event filter and the live goal strip whose button finishes the switch), and a size that does not fit flips inline, stacked full width. Round 1's other asks leave `asks` (the ledger keeps them) and become the ground. `storage-wiring` builds them in production after you (not cut yet); this lane ships no production byte.

The board moves to `round.n: 2` with round 1 in `history` and his notes as the direction. Its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` are yours for this round (named exceptions).

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
